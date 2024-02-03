const express = require('express')
const router = express.Router()
const { translate, get, view, insert, getInfo } = require('./functions')


router.get('/', async ({user_id}, res) => {
  try {
    const { values } = await view('documents/list/user_id', { key: user_id })
    const docs = values.map(({ _id: id, title, results }) => {
      const info = getInfo(Object.values(results))
      return { id, title, info }
    })
    res.status(200).json(docs)
  } catch(e) {
    console.log(e);
    res.status(500).json(e)
  }
})
router.get('/:id', require('./document.js'), async ({body}, res) => {
  try {
    res.status(200).json(body.document)
  } catch(e) {
    console.log(e);
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

  router.post('/', async ({ body, user_id }, res) => {
    try {
      const { title, results } = body
      const { id } = await insert('documents', { title, results, user_id })
      res.status(200).json({ ok: !!id })      
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
    const { pdfFile: doc, results: obj } = body
    const reduce = (cur, key) => ({...cur, [key]: obj[key] || ''})
    const results = doc.keys.reduce(reduce, {})
    const info = getInfo(Object.values(results))
    res.status(200).json({...doc, user_id, results, info })
  } catch(e) {
    res.status(500).json(e)
  }
})

module.exports = router

