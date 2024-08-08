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

router.get('/info/:docId', async ({ params, user_cash }, res) => {
  try {
    const {getValues} = user_cash(params.docId)
    const values =  await getValues()
    res.status(200).json(getInfo(values))
  } catch(e) {
    console.error(e);
    res.status(500).json({err: true })
  }
})


router.get('/card/:docId', async ({ params, user_cash }, res) => {
  try {
    const {getValues, getRandom} = user_cash(params.docId)
    const values = await getValues()
    const index = Math.floor(Math.random()*values.length)
    const card = {...values[index], index}
    const random = getRandom(5).filter(({_id}) => _id !== card._id)
    res.status(200).json({ card, random })
  } catch(err) {
    console.log(err)
    res.status(500).json({err})
  }
})

router.get('/dictionary/:docId', async ({ query, user_cash, params }, res) => {
  try {
    const { docId } = params
    const { limit, skip = 0 } = query
    const { getValues } = user_cash(docId)
    const predicate = ({_id: a}, {_id: b}) => (a > b) - (a < b)
    const values = await getValues()
    const sorted = [...values].sort(predicate).splice(skip, limit)
    res.status(200).json({ values: sorted, skip: (+skip) + (+limit) })
  } catch(err) {
    console.log(err)
    res.status(500).json({err})
  }
})


router.post('/results/:docId', async ({ body, user_cash, params }, res) => {
  try {
    const { docId } = params
    const { value } = body
    const { setValues } = user_cash(docId)
    setValues(value)
    res.status(200).json({ ok: true })
  } catch(err) {
    console.log(err);
    res.status(500).json({ err: true})
  }
})

router.get('/translate/:service/:method/:key', async ({params, user_cash}, res) => {
  try {
    const { service, method, key } = params
    const { dictionary } = user_cash()
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

router.get('/text/:docId', async ({ params, query, user_cash }, res) => {
  try {
    const { limit, skip = 0 } = query
    const {getDocument, getObj} = user_cash(params.docId)
    const {keys} = await getDocument()
    const values = [...keys].splice(skip, limit)
      .map((item) => {
        const { str = item, key } = item
        return { str: str + ' ', key }
      })
    const obj = getObj(values.map(({key}) => key))
    res.status(200).json({ values, obj, skip: (+skip) + (+limit)  })
  } catch(e) {
    console.log(e);
    res.status(500).json({err: true})
  }
})

router.post('/text/:docId', async ({ params, body, user_cash }, res) => {
  try {
    const { ref: key, key: value, values } = body
    const { add } = user_cash(params.docId)
    await add(key, value, await getUid(values))
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

  router.post('/', async ({ user_id, body, user_cash }, res) => {
    try {
      const { title } = body
      const { keys } = tmp[user_id]
      user_cash.getDictionary(keys.map(({key}) => key).filter(unic))
      await insert('documents', { keys, title, user_id })
      
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

