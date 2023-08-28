const express = require('express')
const router = express.Router()
const { nano } = require('../functions')
const documents = nano.use('documents')
const dictionary = nano.use('dictionary')
const axios = require('axios')

const translate = async (prefix) => {
  const {data} = await axios.get(process.env.TRANSLATE_URL, {
    params: { ...process.env.TRANSLATE_PARAMS, prefix }
  })
  return data
}

const addToDictionary = async ({prefix, items}) => {
  const values = items
  .filter(({heading}) => /^[a-z_]+$/.test(heading))
    // .filter(({heading}) => excludes(heading))
    .filter(({source}) => source !== 'Social')
    .filter(({heading}) => minLength(heading))
      .map(({heading, lingvoSoundFileName, lingvoTranslations}) => ({
        prefix,
        origin: heading,
        file: lingvoSoundFileName,
        translate: lingvoTranslations
      }))
  return Promise.all(values.map(async (v) => {
    const {docs} = await dictionary.find({ selector: { origin: v.origin}})
    !docs.length && dictionary.insert(v)
  }))
}

router.get('/:id', async (req, res) => {
    try {
      const { items } = req.query
      const {rows} = await documents.list({include_docs: true})
      const keys = rows.filter(({id}) => req.params.id ? req.params.id == id : true)
        .reduce((cur, { doc }) => [...cur, ...doc.dictionary], [])
      const data = await dictionary.find({
        selector: { origin: { $in: keys } },
        limit: +limit,
        sort: ['origin'],
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