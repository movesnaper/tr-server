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

    req.user_cash = {
      ...cash,
      dictionary,
      update: async (index, value) => {
        cash[user_id] = await update('users', user_id, ({dictionary = []}) => {
          dictionary.splice(index, 1, value)
          return {dictionary : dictionary.filter((v) => v)}
        })
      },
      add: async (key, value) => { 
        cash[user_id] = await update('users', user_id, ({ dictionary = [], refs = {} }) => {
          return {
            refs: {...refs, [key]: value._id},
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
      getKeys: async (id) => {
        const props = { startkey: [ id ], endkey: [id, {}]}
        const { values } = await view(`documents/dictionary/keys`, props)
        return cash[id] = values
      },
      getValues: (keys) => {
        const values = keys.map((key) => refs[key]).filter(unic).reduce((cur, key) => {
          const items = dictionary.map((value, index) => ({index, value}))
          return [...cur, ...items.filter(({value}) => value._id === key )]
        }, [])
        cash[user_id].values = values
        return values
      },
      getObj: (keys) => {
        return keys.filter(unic).reduce((cur, key) => {
          const ref = refs[key]
          return ref ? {...cur, [key]: dictionary.filter(({_id}) => _id === ref)} : cur
        }, {})
      },
      map: async (props) => {
        const {values} = await view(`users/dictionary/keys`, props)
        const reduce = (cur, { key, value }) => ({...cur, [key]: value})
        return values.reduce(reduce, {})
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
    next()

}

router.use('/auth', require('./auth/index.js'))
router.use('/documents', auth, userCash, require('./documents/index.js'))
router.use('/dictionary', auth, userCash, require('./dictionary/index.js'))
router.use('/praxis', auth, userCash, require('./praxis/index.js'))
// router.use('/translate', auth, require('./translate/index.js'))


module.exports = router