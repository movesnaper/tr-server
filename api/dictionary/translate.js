
const { axios, view } = require('../db')


const items = ({ heading, lingvoTranslations: dst }) => 
  ({ _id: heading.toLowerCase().trim(), dst })

const translate = async (key) => {
  const params = { prefix: key, srcLang: 1033, dstLang: 1049, pageSize: 10 }
  const {data} = await axios.get(process.env.TRANSLATE_URL, { params })
  return data.items.map(items)
}

module.exports = async ({params}, res) => {
    try {
      const { key } = params
      const { obj } = await view('documents/results/values', { keys: [key] })
      res.status(200).json(obj[key] || { items: await translate(key)})
    } catch(e) {
      console.log(e)
      res.status(500).json(e)
    }
  }