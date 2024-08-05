const express = require('express')
const router = express.Router()
const { sign, verify } = require('./functions')
const { unic, unic2 } = require('./filters')
const { get, update, view, getUid } = require('./db')
const { key } = require('./documents/translate/lingvo.js')

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
  const { dictionary = [], refs = {} } = cash[user_id] = cash[user_id] || await get('users', user_id)
  
  const getDocument = async (docId) => {
    return cash[user_id][docId] = await get('documents', docId)
  }
  
  const getValues = async (docId) => {
    const {keys} = cash[user_id][docId] || await getDocument(docId)
    return cash[user_id][docId].values = keys.map(({key}) => refs[key]).filter(unic)
      .reduce((cur, key) => {
      const items = dictionary.map((value, index) => ({index, value}))
      return [...cur, ...items.filter(({value}) => value._id === key )]
    }, [])
  }

  const updateDictionary = async ({index, value}) => {
    const result = value && {...value, uid: value.uid || await getUid()}
    return update('users', user_id, () => {
      dictionary.splice(index, 1, result)
      return { dictionary: dictionary.filter(({_id}) => !!_id) }
    })
  }

    req.user_cash = (docId) => {
      const values = cash[user_id][docId]?.values
      return {
        dictionary,
        getDocument: async () => cash[user_id][docId] || await getDocument(docId),
        getValues: async () => values || await getValues(docId),
        add: async (key, value, values) => {
          cash[user_id] = false
          return update('users', user_id, () => ({ 
            dictionary: [...dictionary.filter(({ _id }) => _id !== value), ...values],
            refs: {...refs, [key]: value}
          }))

        },
        setValues: async (value, index) => {
          const result = {...values[index], value }
          values.splice(index, 1, result)
          cash[user_id][docId].values = values.filter(({value}) => !!value)
          return updateDictionary(result)
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
        }, 
        sorted: (predicate) => {
          return [...values].sort(predicate)
        }
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

      // getCash: async (id) => {
      //   cash[user_id].keys = cash[user_id].keys || (await get('documents', id)).keys
      //   return cash[user_id].values = cash[user_id].keys.map(({key}) => refs[key])
      //     .filter(unic).reduce((cur, key) => {
      //       const items = dictionary.map((value, index) => ({index, value}))
      //       return [...cur, ...items.filter(({value}) => value._id === key )]
      //     }, [])

        // return {
          // keys,
          // values: document.values || getValues(),
          // unic: (map) => {
          //   const unicCash = (unic) => (cash[id] = {...cash[id], unic }).unic
          //   cash[id].unic = cash[id].unic || unicCash(keys.map(map).filter(unic))
          //   return cash[id].unic
          // },
          // sorted: () => {
          //   const sort = ( a, b ) => (a > b) - (a < b)
          //   const sortedCash = (sorted) => (cash[id] = {...cash[id], sorted }).sorted
          //   return cash[id].sorted || sortedCash(cash[id].unic.sort(sort))
          // },
          // getObj: (keys) => {
          //   return keys.filter(unic).reduce((cur, key) => {
          //     const ref = refs[key]
          //     return ref ? {...cur, [key]: dictionary.filter(({_id}) => _id === ref)} : cur
          //   }, {})
          // },
          // getValues: (keys) => {
          //   const values = keys.map((key) => refs[key]).filter(unic).reduce((cur, key) => {
          //     const items = dictionary.map((value, index) => ({index, value}))
          //     return [...cur, ...items.filter(({value}) => value._id === key )]
          //   }, [])
          //   return values
          // }
        // }
      // },
      // getKeys: async (id) => {
      //   const {keys} = await get('documents', id)
      //   return cash[user_id] = keys.map(({key}) => key).filter(unic)
      // },
      // getValues: (keys) => {
      //   return keys.map((key) => refs[key]).filter(unic).reduce((cur, key) => {
      //     const items = dictionary.map((value, index) => ({index, value}))
      //     return [...cur, ...items.filter(({value}) => value._id === key )]
      //   }, [])
      // },

      // map: async (props) => {
      //   const {values} = await view(`users/dictionary/keys`, props)
      //   const reduce = (cur, { key, value }) => ({...cur, [key]: value})
      //   return values.reduce(reduce, {})
      // },
      // getDictionary: async (keys) => {
      //   const { dictionary, refs } = await get('users', 'admin')
      //   const entries = Object.entries(refs).filter(([key]) => keys.includes(key))
      //   const values = entries.map(([key, value])=> value)
      //   return cash[user_id] = await update('users', user_id, (doc) => {
      //     const map = ({ _id, pos, dst, trc, exm, snd }) => ({  _id, pos, dst, trc, exm, snd  })
      //     const items = dictionary.filter(({_id}) => values.includes(_id)).map(map)
      //     return {
      //       dictionary: [...doc.dictionary, ...items].filter(unic2(({ _id, dst }) => _id + dst)),
      //       refs: entries.reduce((cur, [key, value]) => {
      //         return cur[key] ? cur : {...cur, [key]: value }
      //       }, {...doc.refs })
      //     }
      //   })   
      // }
      // add: async (key, value) => { 
      //   cash[user_id] = await update('users', user_id, ({ dictionary = [], refs = {} }) => {
      //     return {
      //       refs: {...refs, [key]: value._id},
      //       dictionary: [...dictionary, value]
      //         .filter(unic2(({ _id, dst }) => _id + dst))
      //     }
      //   })
      // },
      // get: async (props) => {
      //   const entries = Object.entries(refs).reduce((cur, [key, keys]) => {
      //     const {length} = keys.filter((key) => props.keys.includes(key))
      //     return [...cur, length && key].filter((v) => v)
      //   }, [])
      //   const keys = entries.sort(( a, b ) => (a > b) - (a < b))
      //   const {values} = await view(`users/dictionary/values`, {...props, keys})
      //   return values
      // },
  // const getKeys = async (docId) => {
  //   const {keys} = cash[user_id][docId] = await getKeys(docId)
  //   return cash[user_id][docId].unic = keys.map(({key}) => refs[key]).filter(unic)
  // }