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
  cash[user_id] = cash[user_id] || await get('users', user_id)

  const getValues = () => {
    const {keys = [], dictionary = []} = cash[user_id]
    const unicKeys = keys.map(({key}) => (cash[user_id].refs || {})[key])
    const predicate = ({_id}) => unicKeys.includes(_id)
    return cash[user_id].values = dictionary.filter(predicate)
  } 

  const updateCash = (value) => {
    const {refs, dictionary} = Object.assign(cash[user_id], value)
    update('users', user_id, () => ({refs, dictionary}))
    getValues()
  }

  const getCard = (mark, cardId) => {
    const { values} = cash[user_id]
    const cards = values.filter(({ _id, result = 0}) => result <= mark && _id !== cardId )
    return  !!cards.length ? cards[Math.floor(Math.random()*cards.length)] : mark <= 10 && getCard(mark + 1)
  }
 
    req.user_cash = async({docId}) => {
      const updateValues = async () => {
          Object.assign(cash[user_id], await get('documents', docId))
          return getValues()
      }
      if ( docId && cash[user_id]._id !== docId) await updateValues()
      return {
        ...cash[user_id],
        values: cash[user_id].values || getValues(),
        merge: async (user_refs, values) => {
          const getStr = ({_id, dst}) => _id + dst
          return update('users', user_id, ({refs, dictionary = [] }) => {
            return {
              refs: Object.assign(user_refs, refs), 
              dictionary: [...dictionary, ...values].filter(unic2(getStr))
            }
          })
          .then((value) => cash[user_id] = value)
        },
        updateValues, 
        getObj: (keys, {refs = {}, dictionary = []} = cash[user_id]) => {
          const predicate = (key) => ({_id}) => _id === refs[key]
          return keys.filter(unic).reduce((cur, key) => refs[key] ? 
            {...cur, [key]: dictionary.filter(predicate(key))} : cur, {})
        },
        addValue: (key, value, values) => {
          const {refs = {}, dictionary = []} = cash[user_id]
          const predicate = ({_id}) => _id !== value
          return updateCash({
            refs: {...refs, [key]: value},
            dictionary: [...dictionary.filter(predicate), ...values],
          })
        },
        setValue: ({value}) => {
          const { dictionary = []} = cash[user_id]
          const index = dictionary.findIndex(({uid}) => uid === value.uid)
          value._id ? dictionary.splice(index, 1, value) : dictionary.splice(index, 1)
          return updateCash({dictionary, card: value})
        },
        getCard: () => {
          const {_id, result = 0} = cash[user_id].card || {}
          return getCard(result, _id)
        },
        getRandom: (number) => {
          const { dictionary = []} = cash[user_id]
          return [...Array(number).keys()].map(() => Math.floor(Math.random()*dictionary.length))
            .filter(unic).map((index) => dictionary[index]).filter(({_id}) => !!_id)
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
