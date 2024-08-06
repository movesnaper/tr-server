const express = require('express')
const router = express.Router()
const { sign, verify } = require('./functions')
const { unic } = require('./filters')
const { get, update, getUid } = require('./db')

const cash = {}

const auth = async (req, res, next) => {
    const token = req.get("user_jwt")
    if (!token) return res.status(401).json('auth_user_requred')

    try {
      const { email } = await verify(token)
      req.user_id = email
      res.set('user_jwt', sign({ email }))
      res.set('Access-Control-Expose-Headers', 'user_jwt')
      next()
    } catch(err){
      console.log(err);
      res.status(401).json({ err })
    }
}
const userCash = async (req, res, next) => {
  const { user_id } = req
  const { dictionary = [], refs = {} } = cash[user_id] = cash[user_id]
    || await get('users', user_id)
  
  const getDocument = async (docId) => {
    return cash[user_id][docId] = await get('documents', docId)
  }
  
  const getValues = async (docId) => {
    const {keys} = cash[user_id][docId] || await getDocument(docId)
    const unicKeys = keys.map(({key}) => refs[key])
    const predicate = ({_id}) => unicKeys.includes(_id)
    return cash[user_id][docId].values = dictionary.filter(predicate)
  }

  const updateCash = async (docId, values) => {
    cash[user_id][docId].values = values
    const ids = values.map(({uid}) => uid)
    const predicate = (({uid}) => !ids.includes(uid))
    return update('users', user_id, ({dictionary}) => ({
      refs: cash[user_id].refs,
      dictionary: [...dictionary.filter(predicate), ...values]
    }))
  }

    req.user_cash = (docId) => {
      return {
        dictionary,
        getDocument: async () => cash[user_id][docId] || await getDocument(docId),
        getValues: async () => cash[user_id][docId]?.values || await getValues(docId),
        add: async (key, value, values) => {
          const ids = await getUid(values.length)
          const uidValues = values.map((v, index) => ({...v, uid: [ids[index]]}))
          const predicate = ({_id}) => _id !== value
          cash[user_id].refs = {...refs, [key]: value}
          return updateCash(docId, [...cash[user_id][docId].values.filter(predicate), ...uidValues])
        },
        setValues: async (value) => {
          const predicate = ({uid}) => uid === value.uid
          const {values} = cash[user_id][docId]
          const index = values.findIndex(predicate)
          values.splice(index, 1, value)
          updateCash(docId, values)
        }, 
        getRandom: (number) => {
          const {length} = dictionary
          return [...Array(number).keys()].map(() => Math.floor(Math.random()*length))
            .filter(unic).map((index) => dictionary[index]).filter(({_id}) => !!_id)
        },
        getObj: (keys) => {
          return keys.filter(unic).reduce((cur, key) => {
            const ref = refs[key]
            return ref ? {...cur, [key]: dictionary.filter(({_id}) => _id === ref)} : cur
          }, {})
        }
      }
    }
    next()

}

router.use('/auth', require('./auth/index.js'))
router.use('/documents', auth, userCash, require('./documents/index.js'))
router.use('/dictionary', auth, userCash, require('./dictionary/index.js'))
router.use('/praxis', auth, userCash, require('./praxis/index.js'))

module.exports = router
