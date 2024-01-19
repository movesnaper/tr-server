const express = require('express')
const router = express.Router()
const { nano, view, insert } = require('../db')
const documents = nano.use('documents')
const dictionary = nano.use('dictionary')



router.get('/:key?', async ({query, params}, res) => {
    try {
      const { key } = params
      const { limit, skip } = query
      const {values, offset, total} = await view('documents/results/values', { key, limit, skip })
      res.status(200).json({values, offset, total})
      } catch(e) {
        console.error(e);
        res.status(500).json(e)
      }
})

router.get('/random/:numbers', async ({params}, res) => {
  try {
    const random = () => 0.5 - Math.random()
    const {values} = await view('dictionary/list/values', 'src')
    res.status(200).json(values.sort(random).slice(0, params.numbers))
  } catch(e) {
    console.error(e);
    res.status(500).json(e)
  }
})

router.get('/translate/:key', require('./translate.js'))

router.post('/update/:id?', async({ body, params }, res) => {
  try {
    res.status(200).json(await insert('dictionary', body, params.id))
  } catch(e) {
    console.error(e);
    res.status(500).json(e)    
  }
})

module.exports = router