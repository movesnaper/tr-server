const express = require('express')
const router = express.Router()
const { sign, verify } = require('./functions')
const { unic, unic2 } = require('./filters')
const { get, update, view } = require('./db.js')


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
  cash[user_id] = cash[user_id] || await get('users', user_id)
  const { dictionary = [], refs = {} } = cash[user_id]
  const obj = (cur, item) => item && {...cur, [item._id]: [...cur[item._id] || [],  item]}
  const reduceRefs = (cur, {key, _id}) => {
    return {...cur, [key]: _id}
  }
    req.user_cash = {
      dictionary,
      refs: dictionary.reduce(reduceRefs, {}),
      // obj: dictionary.reduce(obj, {}),
      add: async (key, value) => { 
        cash[user_id] = await update('users', user_id, ({ dictionary = [], refs = {} }) => {
          return {
            refs: {...refs, [value._id]: [...refs[value._id] || [], key].filter(unic)},
            dictionary: [...dictionary, value]
              .filter(unic2(({ _id, dst }) => _id + dst))
          }
        })
      },
      get: async (props) => {
        const entries = Object.entries(refs).reduce((cur, [key, keys]) => {
          const {length} = keys.filter((key) => props.keys.includes(key))
          return [...cur, length && key].filter((v) => v)
        }, [])
        const keys = entries.sort(( a, b ) => (a > b) - (a < b))
        const {values} = await view(`users/dictionary/values`, {...props, keys})
        return values
      },
      map: async (props) => {
        const {values} = await view(`users/dictionary/keys`, props)
        const reduce = (cur, { key, value }) => ({...cur, [key]: value})
        return values.reduce(reduce, {})
      }

    }

    next()

}

router.use('/auth', require('./auth/index.js'))
router.use('/documents', auth, userCash, require('./documents/index.js'))
router.use('/dictionary', auth, userCash, require('./dictionary/index.js'))
router.use('/praxis', auth, userCash, require('./praxis/index.js'))
// router.use('/translate', auth, require('./translate/index.js'))


module.exports = router