
const axios = require('axios')
const { toLowerCase } = require('../functions')

const getValues = ({items}, map) => {
  const values = [({source}) => ['Premium', 'Social'].includes(source),
    ({lingvoDictionaryName: name}) => ['LingvoUniversal (En-Ru)', 'Social'].includes(name),
    ({heading}) => /^[a-z_|A-Z_]+$/.test(heading)]
    .reduce((cur, v) => cur.filter(v), items)
  return map(values)
}

const translate = async (key) => {
  const params = { prefix: key, srcLang: 1033, dstLang: 1049, pageSize: 10 }
  const {data} = await axios.get(process.env.TRANSLATE_URL, { params })
  return getValues(data, ([{ heading, lingvoTranslations: dst}]) => 
  ({ _id: toLowerCase(heading), dst }))
}



module.exports = async ({body}, res, next) => {
    try {
      body.values = await Promise.all(body.keys.map((key) => translate(key)))
      next()
    } catch(e) {
      console.log(e)
      res.status(500).json(e)
    }
  }