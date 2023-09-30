const express = require('express')
const router = express.Router()
const { nano } = require('../functions')
const documents = nano.use('documents')
const dictionary = nano.use('dictionary')
const axios = require('axios')

const addToDictionary = async ({ prefix, heading, lingvoTranslations, lingvoSoundFileName }) => {
  const doc = {key: prefix, src: heading, dst: lingvoTranslations, file: lingvoSoundFileName}
  const {rows} = await dictionary.view('dictionary', 'dst', { key: lingvoTranslations})
  const {id } = !rows.length ? await dictionary.insert(doc) : { ...rows[0]}
  return {...doc, id}
}

const translate = async (prefix) => {
  const {data} = await axios.get(process.env.TRANSLATE_URL, {
    params: { prefix, srcLang: 1033, dstLang: 1049, pageSize: 10 }
  })

  const [item = {}] = data.items
    .filter(({source}) => ['Premium'].includes(source))
      .filter(({lingvoDictionaryName}) => ['LingvoUniversal (En-Ru)']
        .includes(lingvoDictionaryName))
          .filter(({heading}) => /^[a-z_]+$/.test(heading))
  return addToDictionary( {...item, prefix})
}

router.get('/:id', async (req, res) => {
  try {
    const {items} = await documents.get( req.params.id)
    const translates = (await Promise.all(items.map(translate)))
      .filter(({lingvoTranslations}) => !!lingvoTranslations)
    res.status(200).json(await Promise.all(translates.map(translate)))
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