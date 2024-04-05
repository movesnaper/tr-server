const express = require('express')
const router = express.Router()
const { translate, remove, view, insert, getInfo } = require('./functions')
const { unic } = require('../filters.js')
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

router.get('/info/:id', async ({ params, user_cash }, res) => {

  try {
    const { id } = params
    const { unic, getValues} = await user_cash.document(id)
    const values = getValues(unic(({key}) => key)).map(({value}) => value)
    res.status(200).json(getInfo(values))
  } catch(e) {
    console.error(e);
    res.status(500).json({err: true })
  }
})

router.get('/card/:id', async ({ params, user_cash }, res) => {
  try {
    const { id } = params
    const { unic, getValues} = await user_cash.document(id)
    const values = getValues(unic(({key}) => key)).sort(({value: a}, {value: b}) => 
    (a.result || 0) - (b.result || 0))
    // const values = [...user_cash.getValues(user_cash[id] || await user_cash.getKeys(id))]
    const card = values[Math.floor(Math.random()*100)]
    const random = [...user_cash.dictionary].sort(() => 0.5 - Math.random())
    res.status(200).json({card, random: random.splice(0, 5)})
  } catch(err) {
    console.log(err)
    res.status(500).json({err})
  }
})

router.get('/dictionary/:id', async ({ params, query, user_cash }, res) => {
  try {
    const { id } = params
    const { limit, skip = 0 } = query
    const {sorted, getValues } = await user_cash.document(id)
    const values = getValues(sorted(({key}) => key)).splice(skip, limit)
    res.status(200).json({ values, skip: (+skip) + (+limit) })
  } catch(err) {
    console.log(err)
    res.status(500).json({err})
  }
})

router.post('/results', async ({ body, user_cash }, res) => {
  try {
    const { index, value } = body
    await user_cash.update(index, value)
    res.status(200).json({ ok: true })
  } catch(err) {
    console.log(err);
    res.status(500).json({ err: true})
  }
})

router.get('/translate/:key/:value', async ({params}, res) => {
  try {
    const { key, value } = params
    res.status(200).json(await translate[key](value))
  } catch(e) {
    console.log(e);
    res.status(500).json(e)
  }
})


router.get('/text/:id', async ({ params, query, user_cash }, res) => {
  try {
    const { id } = params
    const { limit, skip = 0 } = query
    const {keys, getObj } = await user_cash.document(id)
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

router.post('/text', async ({ body, user_cash }, res) => {
  try {
    const { key, value } = body
    await user_cash.add(key, value)
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

