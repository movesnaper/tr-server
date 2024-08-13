const express = require('express')
const router = express.Router()
const { sign, verify } = require('./functions')
const { unic } = require('./filters')
const { get, update } = require('./db')

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
  
  const setCash = async (docId) => {
    const {keys} = cash[user_id][docId] || await getDocument(docId)
    const unicKeys = keys.map(({key}) => (cash[user_id].refs || {})[key])
    const predicate = ({_id}) => unicKeys.includes(_id)
    return cash[user_id][docId].values = (cash[user_id].dictionary || []).filter(predicate)
  } 

  const updateCash = async (docId, obj) => {
    cash[user_id] = Object.assign(cash[user_id], obj)
    update('users', user_id, () => obj)
    return setCash(docId)
  }
    req.user_cash = (docId) => {
      const getValues = async () => cash[user_id][docId]?.values || await setCash(docId)
      return {
        dictionary, 
        getValues,
        getDocument: async () => cash[user_id][docId] || await getDocument(docId),
        add: async (key, value, values) => {
          const predicate = ({_id}) => _id !== value
          return updateCash(docId, {
            refs: {...refs, [key]: value},
            dictionary: [...dictionary.filter(predicate), ...values],
          })
        },
        setValues: async (value) => {
          const index = dictionary.findIndex(({uid}) => uid === value.uid)
          value._id ? dictionary.splice(index, 1, value) : dictionary.splice(index, 1)
          return updateCash(docId, {dictionary})
        }, 
        getRandom: (number) => {
          const {length} = dictionary
          return [...Array(number).keys()].map(() => Math.floor(Math.random()*length))
            .filter(unic).map((index) => dictionary[index]).filter(({_id}) => !!_id)
        },
        getObj: (keys) => {
          const {refs = {}} = cash[user_id]
          const predicate = (key) => ({_id}) => _id === refs[key]
          return keys.filter(unic).reduce((cur, key) => refs[key] ? 
            {...cur, [key]: dictionary.filter(predicate(key))} : cur, {})
        },
        getDictionary: async (keys) => {
          const { dictionary, refs } = await get('users', 'admin')
          const entries = Object.entries(refs).filter(([key]) => keys.includes(key))
          const values = entries.map(([key, value])=> value)
          return cash[user_id] = await update('users', user_id, (doc) => {
            const map = ({ _id, pos, dst, trc, exm, snd }) => ({  _id, pos, dst, trc, exm, snd  })
            const items = dictionary.filter(({_id}) => values.includes(_id)).map(map)
            return {
              dictionary: [...doc.dictionary, ...items].filter(unic2(({ _id, dst }) => _id + dst)),
              refs: entries.reduce((cur, [key, value]) => {
                return cur[key] ? cur : {...cur, [key]: value }
              }, {...doc.refs })
            }
          })   
        }
      }
    }
    next()

}
router.get('/', (req, res) => res.send('Hello World!'))
router.use('/auth', require('./auth/index.js'))
router.use('/documents', auth, userCash, require('./documents/index.js'))
router.use('/dictionary', auth, userCash, require('./dictionary/index.js'))
router.use('/praxis', auth, userCash, require('./praxis/index.js'))

module.exports = router
