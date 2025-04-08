const express = require('express')
const router = express.Router()
const { sign, verify } = require('./functions')
const { unic, unic2 } = require('./filters')
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
  cash.admin =  cash['admin'] || await get('users', 'admin')

  const getCard = (values, mark) => {
    const cards = values.filter(({ result = 0}) => result <= mark)
    return  !!cards.length ? cards[Math.floor(Math.random()*cards.length)] 
    : mark <= 10 && getCard(values, mark + 1)
  }
 
  const getValues = (keys, {refs, dictionary, results}) => {
    const objValues = Object.values(dictionary)
    return keys.map((key) => refs[key] || key).filter(unic).reduce((cur, key) => {
      const values = objValues.filter((v) => key === v?._id)
      if (!values.length) values.push({ key, _id: key })
      return [...cur, ...values.map((v) => ({...v, result: results[v.uid]})) ]
    }, [])
  }

  const getCash = async(func) => {
    const getUser = ({refs, dictionary, results = {} }) => ({refs, dictionary, results})
    return func(cash[user_id] || getUser(await get('users', user_id)))
  }

  const updateCash = async({refs, results, dictionary}, func) => {
    
    cash[user_id] = func(await getCash((cash) => {
      return { ...cash,
        refs: {...cash.refs, ...refs || {}},
        results: {...cash.results, ...results || {}},
        dictionary: {...cash.dictionary, ...dictionary || {}}
      }
    }))
  }

  

    req.user_cash = async(doc) => {

      if (doc && !(cash[user_id] || {})[doc._id]) {
        const keys = doc.keys.map(({key, _id}) => key || _id).filter(unic)
        const { refs, dictionary } = cash['admin']
        cash[user_id] = await getCash((cash) => {
          const obj = { 
            results: cash.results || {},
            refs: {...refs, ...cash.refs},
            dictionary: {...dictionary, ...cash.dictionary}
          }
          return {...obj, [doc._id]: getValues(keys, obj)}
        }) 

      }
      return {
        ...doc, 
        ...cash[user_id],
        getInfo: (keys = []) => {
          const results = (cur, {result = 0} = {}) => cur += result
          const total = keys && (keys.reduce(results, 0) / keys.length * 10).toFixed(2)
          const color = total < 75 ? 'info' : 'success'
          return {keys: keys.length, color, total: total || 0 }
        },
        
        getObj: (keys) => {
          const { [doc._id]: values} = cash[user_id]
          const predicate = (key) => ({_id}) => _id === key
          return keys.reduce((cur, key) => {
            return {...cur, [key]: values.filter(predicate(key))}
          }, {}) 
        },
        addValue: (key, value, items) => {
          
          const toResult = (cur, {uid, result, active}) => {
            return active === false ? {...cur, [uid] : undefined} : {...cur, [uid]: result}
          }
          const toDictionary = (cur, {_id, dst, exm, pos, snd, trc, uid, active, exclude}) => {
            return active === false ? {...cur, [uid] : undefined}
            : {...cur, [uid]: {_id, dst, exm, pos, snd, trc, uid, exclude} }
          }
          const dictionary = items.reduce(toDictionary, {})
          const results = items.reduce(toResult, {})
          update('users', user_id, (user) => {
            return {
              refs: {...user.refs, [key]: value },
              dictionary: {...user.dictionary, ...dictionary},
              results: {...user.results, ...results}
            } 
          })
          return updateCash({refs: {[key]: value}, dictionary, results}, (cash) => {
            const values = cash[doc._id].filter(({_id}) => ![key, value].includes(_id))
            return {...cash, [doc._id]: [...values, ...getValues([key], cash)] }
          }) 

        },
        getCard,
        getRandom: (docValues, number) => {
          return [...Array(number).keys()].map(() => Math.floor(Math.random()*docValues.length))
            .filter(unic).map((index) => docValues[index]).filter(({_id}) => !!_id)
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
