const express = require('express')
const router = express.Router()
const { translate, get, view, insert, getInfo, getCard } = require('./functions')


router.get('/', async ({user_id}, res) => {
  try {
    const { values } = await view('documents/list/user_id', { key: user_id })
    res.status(200).json(values)
  } catch(e) {
    console.log(e);
    res.status(500).json(e)
  }
})


router.get('/:id/dictionary', async ({params}, res) => {
  try {
    res.status(200).json(await get('documents', params.id))
  } catch(e) {
    res.status(500).json(e)
  }
})




router.get('/:id', async ({params}, res) => {
  try {
    const { id } = params
    const document = await get('documents', id)
    res.status(200).json(await getInfo(document))
  } catch(e) {
    console.log(e);
    res.status(500).json(e)
  }
})



router.get('/:id/card', async ({params}, res) => {
  try {
    const { results = {} } = await get('documents', params.id)
    const keys = Object.keys(results).filter((key) => key !== 'exclude')
    const key = keys[Math.floor(Math.random()*keys.length)]
    res.status(200).json({ key, value: results[key] })
  } catch(e) {
    console.log(e);
    res.status(500).json(e)
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


router.get('/random/:numbers', async ({params}, res) => {
  try {
    const random = () => 0.5 - Math.random()
    const { values } = await view('documents/results/values', {})
    const results = values.filter(({value}) => value && value !== 'exclude')
      .slice(0, params.numbers).sort(random)
    res.status(200).json(results.map(({value}) => value))
  } catch(e) {
    console.error(e);
    res.status(500).json(e)
  }
})


router.post('/:id/result/:key', async ({body, params}, res) => {
  try {
    const { _id, dst, result, pos, trc, snd, exm } = body.value
    const document = await get('documents', params.id)
    const results = {...document.results, [params.key]: {_id, dst, result, pos, trc, snd, exm} }
    res.status(200).json(await insert('documents', {...document, results}))
  } catch(e) {
    console.log(e);
    res.status(500).json(e)
  }
})

router.post('/upload', require('./pdfFile.js'), async ({body, user_id}, res) => {
  try {
    res.status(200).json(await insert('documents', {...body.document, user_id}))
  } catch(e) {
    res.status(500).json(e)
  }
})

module.exports = router

