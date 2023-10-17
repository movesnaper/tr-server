const express = require('express')
const router = express.Router()
const { nano, unic, minLength, latinChars } = require('../functions')
const documents = nano.use('documents')
const pdfParse = require('pdf-parse')



router.get('/', async (req, res) => {
  try {
    const {rows} = await documents.list({include_docs: true})
    res.status(200).json(rows.map(({doc}) => doc))
  } catch(e) {
    res.status(500).json(e)
  }
})

router.get('/:id', async ({params}, res) => {
  try {
  const doc = await documents.get(params.id)
    res.status(200).json(doc)
  } catch(e) {
    res.status(500).json(e)
  }
})


router.post('/', async ({files}, res) => {
  try {
    if (!files && !files.pdfFile) {
      res.status(404)
    }
    const file = files.pdfFile
    pdfParse(file).then(async (result) => {
      const items  = result.text.replace(/^[a-z_]+$/, " ").trim().split(" ")
      .map((v) => v.toLowerCase())
        .filter(minLength)
          .filter(latinChars)
            .filter(unic)
      const doc = { title: file.name, items}
            // const items = await Promise.all(dictionary.map(translate))
      const {id} = await documents.insert(doc)
      // Promise.all(items.map(addToDictionary))
      res.status(200).json({...doc, _id: id})
    })
  } catch(e) {

    res.status(500).json(e)
  }
})

module.exports = router

