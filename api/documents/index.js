const express = require('express')
const router = express.Router()
const { translate, get, view, insert, getInfo } = require('./functions')
const { minLength, latinChars, unic } = require('../filters')

const tmp = {}

router.get('/', async ({user_id}, res) => {
  try {
    const { values } = await view('documents/list/user_id', { key: user_id })
    const docs = [...values, tmp[user_id]].filter((v) => !!v)
        .map(({ _id: id, title, results }) => {
          const info = getInfo(Object.values(results))
          return { id, title, info }
        })
    res.status(200).json(docs)
  } catch(e) {
    console.log(e);
    res.status(500).json(e)
  }
})

router.get('/random/:numbers', async ({params}, res) => {
  try {
    const random = () => 0.5 - Math.random()

    const { values } = await view('documents/results/values', {})
    const results = values.filter(({value}) => value && value !== 'exclude')
      .sort(random).slice(0, params.numbers)
    res.status(200).json(results.map(({value}) => value))
  } catch(e) {
    console.error(e);
    res.status(500).json(e)
  }
})

router.get('/card/:id?', require('./card.js'))
router.get('/translate/:key/:value', async ({params}, res) => {
  try {
    const { key, value } = params
    res.status(200).json(await translate[key](value))
  } catch(e) {
    console.log(e);
    res.status(500).json(e)
  }
})

router.get('/:id/text', async ({ params, query }, res) => {
  try {
    const { id } = params
    const {limit, mark } = query
    const url = `documents/results/keys`
    const { values } = await view(url, { startkey: [ id, +mark ], endkey: [id, {}], limit })
    res.status(200).json({values})
  } catch(e) {
    console.log(e);
    res.status(500).json({err: true})
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

  router.post('/results', async ({ body }, res) => {
  try {
    await Promise.all(Object.entries(body).map( async ([id, values]) => {
      const document = await get('documents', id)
      const results = values.reduce((cur, { key, value }) => {
        return {...cur, [key]: value }
      }, document.results)
      await insert('documents', {...document, results})
    }))
  res.status(200).json({ ok: true })
  } catch(err) {
    console.log(err);
    res.status(500).json({})
  }
})


router.post('/upload', require('./excludes.js'), require('./pdfFile.js'), require('./results.js'),   async ({body, user_id}, res) => {
  try {
    const { pdfFile, results: obj, excludes } = body
    const { title, keys } = pdfFile || {}
    const reduce = (cur, key) => ({...cur, [key]: obj[key] || ''})
    const notExclude = ((key) => !excludes.includes(key))
    const filter = ((...props) => [minLength(3), unic, latinChars, notExclude]
      .every((filter) => filter(...props)))
    const results = keys.map(({key}) => key).filter(filter).reduce(reduce, {})
    tmp[user_id] = { title, keys, results }
    res.status(200).json({ title, info: getInfo(Object.values(results)) })
  } catch(e) {
    res.status(500).json(e)
  }
})

module.exports = router

