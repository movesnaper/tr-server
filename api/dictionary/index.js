const express = require('express')
const router = express.Router()
const { view, insert } = require('../db')

router.get('/excludes/:key?', require('./excludes.js'))
router.get('/info/:id?',require('./document.js'), require('./info.js'))


router.get('/:id', async ({ query, params }, res) => {
    try {
      const { id } = params
      const {limit, mark } = query
      const url = `documents/dictionary/mark`
      const { values } = await view(url, { startkey: [ id, mark], endkey: [id, {}], limit })
      const [{mark: bookmark} = {}] = values.splice(limit - 1, 1)
      res.status(200).json({ values, bookmark })
      } catch(err) {
        console.error(err);
        res.status(500).json({ err })
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