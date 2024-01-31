const express = require('express')
const router = express.Router()
const { view, insert } = require('../db')

router.get('/excludes/:key?', require('./excludes.js'))
router.get('/info/:id?',require('./document.js'), require('./info.js'))


router.get('/:id?', async ({query, params, user_id}, res) => {
    try {
      const { id = user_id } = params
      const {limit, mark } = query
      const doc_id = params.id && 'doc_id'
      const url = `documents/results/${doc_id || 'user_id'}`
      const { values } = await view(url, { startkey: [ id, mark], endkey: [id, {}], limit })
      res.status(200).json({ values })
      } catch(err) {
        console.error(err);
        res.status(500).json({ err })
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