const express = require('express')
const router = express.Router()
const { remove, view, insert, getInfo, getUid } = require('./functions')
const translate = require('./translate')
const { unic, unic2 } = require('../filters.js')
const tmp = {}

router.get('/', async ({user_id}, res) => {
  try {
    const { values } = await view('documents/list/user_id', { key: user_id })
    const docs = [...values, tmp[user_id]].filter((v) => !!v)
      .map(({ _id: id, title }) => ({ id, title }))
    res.status(200).json(docs)
  } catch(e) {
    console.log(e);
    res.status(500).json(e)
  }
})

router.get('/info/:docId', async ({ user_cash, params }, res) => {
  try {
    const {title, values } =  await user_cash(params)
    res.status(200).json({...getInfo(values), title})
  } catch(e) {
    console.error(e);
    res.status(500).json({err: e })
  }
})

router.get('/card/:docId', async ({ user_cash, params }, res) => {
  try {
    const {getCard, getRandom} = await user_cash(params)
    res.status(200).json({card: getCard(), random: getRandom(5) })
  } catch(err) {
    console.log(err)
    res.status(500).json({err})
  }
}) 

router.get('/dictionary/:docId', async ({ query, user_cash, params }, res) => {
  try {
    const { limit, skip = 0 } = query
    const { values = []} =  await user_cash(params)
    const predicate = ({_id: a}, {_id: b}) => (a > b) - (a < b)
    const sorted = [...values].sort(predicate).splice(skip, limit)
    res.status(200).json({ values: sorted, skip: (+skip) + (+limit) })
  } catch(err) {
    console.log(err)
    res.status(500).json({err})
  }
})
 

router.post('/results/:docId', async ({ body, user_cash, params }, res) => {
  try {
    const { setValue} =  await user_cash(params)
    res.status(200).json({ rerult: await setValue(body) })
  } catch(err) {
    console.log(err);
    res.status(500).json({ err: true})
  }
})

router.get('/translate/:service/:method/:key', async ({params, user_cash}, res) => {
  try {
    const { service, method, key } = params
    const { dictionary} =  await user_cash(params)
    const result = [
      ...(method === 'id' ? dictionary.filter(({_id}) => _id === key) : []),
      ...await translate[service][method](key) || []
    ].filter(unic2(({dst}) => dst))
    res.status(200).json(result)
  } catch(e) {
    console.log(e);
    res.status(500).json(e)
  }
})

router.get('/text/:docId', async ({ query, user_cash, params }, res) => {
  try {
    const { limit, skip = 0 } = query
    const {keys, getObj} = await user_cash(params)
    const values = [...keys].splice(skip, limit)
    // .filter(({str}, index, arr) => {
    //   return !(/[0-9\n]/.test(str) && /[a-z]/.test(arr[index + 1]?.str[0])) 
    // })

    const obj = getObj(values.map(({key}) => key))
    res.status(200).json({ values, obj, skip: (+skip) + (+limit), total: keys.length  })
  } catch(e) {
    console.log(e);
    res.status(500).json({err: true})
  }
})

router.post('/text/:docId', async ({ body, user_cash, params }, res) => {
  try {
    const { ref: key, key: value, values } = body
    const {addValue} = await user_cash(params)
    addValue(key, value, await getUid(values))
    res.status(200).json({ ok: true })
  } catch(err) {
    console.log(err);
    res.status(500).json({ err: true})
  }
})
router.delete('/', async ({ body, user_id }, res) => {
  try {
    const { values } = await view('documents/list/user_id', { key: user_id })
    const docs = values.filter(({_id}) => body.docs.includes(_id))
    await remove('documents', {docs})
    res.status(200).json({ ok: true })
  } catch(err) {
    console.log(err);
    res.status(500).json({ err: true})
  }
   
})

  router.post('/', async ({ user_id, body }, res) => {
    try {
      const { title } = body
      const { keys } = tmp[user_id]
      // user_cash.getDictionary(keys.map(({key}) => key).filter(unic))
      await insert('documents', { title, user_id, keys })
      
      tmp[user_id] = undefined
      res.status(200).json({ ok: true })
    } catch(err) {
      console.log(err);
      res.status(500).json({err})
    }
  })

router.post('/upload', require('./pdfFile.js'), async ({body, user_id}, res) => {
  try {
    const { title, keys } = body?.pdfFile || {}
    tmp[user_id] = { title, keys }
    const keyLength = keys.filter(({key}) => key)
    res.status(200).json({ title, keys: keyLength })
  } catch(e) {
    console.log(e);
    res.status(500).json({err: true})
  }
})

module.exports = router

