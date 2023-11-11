const express = require('express')
const router = express.Router()
const { nano } = require('../functions')
const documents = nano.use('documents')
const dictionary = nano.use('dictionary')
const axios = require('axios')

const addToDictionary = async ({ heading: id, prefix: key, lingvoTranslations: dst }) => {
  const doc = await dictionary.get(id) || { key, dst }
  !doc._id && await dictionary.insert(doc, id) 
  return { ...doc, id }
}

const translateDictionary = async (key) => {
  const [{ id } = {}] = (await dictionary.view('dictionary', 'key', { key})).rows
  return { id, key }
}

const translateLingvo = async ({ id, key }) => {
  if (id) return { id, key }
  const {data} = await axios.get(process.env.TRANSLATE_URL, {
    params: { prefix: key, srcLang: 1033, dstLang: 1049, pageSize: 10 }
  })

  const [item = {}] = data.items.filter(({source}) => ['Premium'].includes(source))
      .filter(({lingvoDictionaryName}) => ['LingvoUniversal (En-Ru)'].includes(lingvoDictionaryName))
          .filter(({heading}) => /^[a-z_]+$/.test(heading))
  return addToDictionary(item)
}


router.post('/', async ({body}, res) => {
  try {
    const dictItems = await Promise.all(body.map(translateDictionary))
    const items = await Promise.all(dictItems.map(translateLingvo))
    res.status(200).json(items)
  } catch(e) {
      console.error(e);
      res.status(500).json(e)
  }
})



module.exports = router