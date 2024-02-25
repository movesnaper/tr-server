const express = require('express')
const router = express.Router()
const { update, translate, view, insert, getInfo } = require('./functions')
const { unic } = require('../filters')

const tmp = {}
const cash = {}

const getCash = (values = []) => {
  const reduce = (cur, { keys, doc_id, index, value }) => 
  keys.reduce((cur, key) => {
    return {...cur, [key]: {value, doc_id, index}}
  }, cur)
  return values.reduce(reduce, {})
}


const updateCash = async (key) => {
  const props = {startkey: [key], endkey: [key, {}]}
  const {values} = await view('documents/dictionary/values', props)
  return cash[key] = values
}

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
    const props = { startkey: [ id ], endkey: [id, {}]}
    const { values: keys } = await view(`documents/dictionary/keys`, props)
    const values = await user_cash.get({keys})
    res.status(200).json(getInfo(values.map(({value}) => value)))
  } catch(e) {
    console.error(e);
    res.status(500).json({err: true })
  }
})

router.get('/card/:id', async ({ params, user_cash }, res) => {

  try {
    const { id } = params
    const props = { startkey: [ id ], endkey: [id, {}]}
    const { values: keys } = await view(`documents/dictionary/keys`, props)
    const values = (await user_cash.get({ keys })).sort(({value: a}, {value: b}) => {
      return (a.result || 0) - (b.result || 0)
    })
    console.log(Math.floor(Math.random()*100));
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
    const props = { startkey: [ id ], endkey: [id, {}]}
    const { values: keys } = await view(`documents/dictionary/keys`, props)
    const values = await user_cash.get({ keys, skip, limit })
    res.status(200).json({ values, skip: (+skip) + (+limit) })
  } catch(err) {
    console.log(err)
    res.status(500).json({err})
  }
})

router.post('/results', async ({ body, user_id }, res) => {
  try {
    const { index, value } = body
    await update('users', user_id, ({dictionary = []}) => {
      dictionary.splice(index, 1, value)
      return {dictionary : dictionary.filter((v) => v)}
    })
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
    const { limit, mark } = query
    const props = { startkey: [ id, + mark ], endkey: [id, {}], limit }
    const { values } = await view(`documents/dictionary/index`, props)
    const obj = await user_cash.map({keys: values.map(({key}) => key)})
    const items = (item) => ({...item, value: obj[item.key]})
    res.status(200).json({ values: values.map(items) })
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


  router.post('/', async ({ user_id, body }, res) => {

    try {
      const { title } = body
      await insert('documents', {...tmp[user_id], title, user_id })
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

