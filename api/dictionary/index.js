const express = require('express')
const router = express.Router()
const { nano } = require('../functions')
const documents = nano.use('documents')
const dictionary = nano.use('dictionary')

router.get('/:id?', async (req, res) => {
    try {
      const { bookmark, limit } = req.query
      const {rows} = await documents.list({include_docs: true})
      const keys = rows.filter(({id}) => req.params.id ? req.params.id == id : true)
        .reduce((cur, { doc }) => [...cur, ...doc.items], [])
      const data = await dictionary.find({
        selector: { key: { $in: keys } },
        limit: +limit,
        // sort: ['key'],
        bookmark,
      })
      res.status(200).json({...data, total: keys.length, limit: +limit })
      } catch(e) {
        console.error(e);
        res.status(500).json(e)
      }
})

router.post('/:id', async ({params, body}, res) => {
    // try {
    //   res.status(200).json(await db.insert(body, params.id))
    // } catch(e) {
    //   res.status(500).json(e)
    // }
  })

module.exports = router