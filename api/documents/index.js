const express = require('express')
const router = express.Router()
const { nano, view, insert } = require('../db')
const documents = nano.use('documents')

const translate = async ({keys}) => {
  const reduce = ({obj}) => keys.reduce((cur, key) =>
    [...cur, {...obj[key], key }], [])
  return view('dictionary/list/values', { keys }).then(reduce)
}

router.get('/', async ({user_id}, res) => {
  try {
    const { values } = await view('documents/list/user_id', { key: user_id })
    res.status(200).json(values)
  } catch(e) {
    console.log(e);
    res.status(500).json(e)
  }
})

router.get('/:id', require('./document.js'), async ({body}, res) => {
  try {
    const keys = await translate(body.document)
    res.status(200).json({...body.document, keys })
  } catch(e) {
    res.status(500).json(e)
  }
})

router.post('/:id/:field', require('./document.js'), async ({body}, res) => {
  try {
    const { field } = params
    const document = {...body.document, [field]: body[field] }
    const { id } = await documents.insert(document)
    res.status(200).json({...document, _id: id })
  } catch(e) {
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

