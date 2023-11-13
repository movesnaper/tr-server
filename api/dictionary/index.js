const express = require('express')
const router = express.Router()
const { nano, view, bulk } = require('../db')
const documents = nano.use('documents')
const dictionary = nano.use('dictionary')



router.get('/:id?', async (req, res) => {
    try {
      const { bookmark, limit } = req.query
      const {keys} = await documents.get(req.params.id, {include_docs: true})
      const data = await dictionary.find({
        selector: { _id: { $in: keys.map(({key}) => key) } },
        limit: +limit,
        bookmark,
      })
      res.status(200).json({...data, total: keys.length, limit: +limit })
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

router.post('/translate', require('./translate.js'), ({ body }, res) => {
  try {
    // bulk('dictionary', body.values)
    res.status(200).json(body.values)
  } catch(e) {
    console.error(e);
    res.status(500).json(e)    
  }
})

module.exports = router