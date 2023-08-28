const express = require('express')
const router = express.Router()
const { nano } = require('../functions')
const documents = nano.use('documents')
const dictionary = nano.use('dictionary')

router.get('/:id?', async (req, res) => {
    try {
      const {rows} = await documents.list({include_docs: true})
      const keys = rows.filter(({id}) => req.params.id ? req.params.id == id : true)
        .reduce((cur, { doc }) => 
        [...cur, ...doc.dictionary.map((key) => ({key, id: doc._id, title: doc.title}))], [])
      const {key, id, title} = keys[Math.floor(Math.random()*keys.length)]
      const {docs} = await dictionary.find({
        selector: { origin: key },
      })
      const {rows: fakeRows} = await dictionary.view('test', 'random',{
        startkey: Math.random(),
        endKey: Math.random(),
        include_docs: true,
        limit: 10
      })
      const shuffled = fakeRows.filter(({doc}) => doc && doc.origin != key)
        .sort(() => 0.5 - Math.random()).slice(0, 4);
      const doc = docs[Math.floor(Math.random()*docs.length)] || {}
      const values = [...shuffled, {doc}].sort(() => 0.5 - Math.random())
          .map(({doc}) => doc)
    
      res.status(200).json({key, id, title, docs, values, total: keys.length })
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