const { axios, get, view, insert } = require('../db')

const getTotal = (cur, {result = 0}) => cur += result

const getInfo = async ({ _id: id, title, results = {} }) => {
  const keys = Object.keys(results).filter((key) => results[key] !== 'exclude')
  const values = keys.filter((key) => !!results[key]).map((key) => results[key])
  const total = (values.reduce(getTotal, 0) / values.length * 10).toFixed(2)
  return { id, title, keys: keys.length, results: values.length, total }
}



const translateByKey = async (key) => {
  const items = ({ heading, lingvoTranslations: dst }) => 
  ({ _id: heading.toLowerCase().trim(), dst })
  const params = { prefix: key, srcLang: 1033, dstLang: 1049, pageSize: 10 }
  const {data} = await axios.get(process.env.TRANSLATE_URL, { params })
  return data.items.map(items)
}

const translateById = async (id) => {
  const url = 'https://api.lingvolive.com/Translation/tutor-cards'
  const itemsMap = ({ 
    heading, 
    partOfSpeech: pos, 
    translations: dst, 
    transcription: trc,
    soundFileName: snd, 
    examples: exm }) => 
  ({ _id: heading.toLowerCase().trim(), pos, dst, trc, exm, snd })
  const params = { text: id, srcLang: 1033, dstLang: 1049 }
  const {data} = await axios.get(url, { params })
  return data && data.map(itemsMap)
}



const getCard = async (value) => {
  // const dictionary = await get('dictionary', value._id) || await translateById(value)
  return {...dictionary, ...value }
  // const { values } = await view('documents/results/values', { keys: [key] })
  // console.log(values);
  // return values.find((v) => v.key === key )
}

module.exports = {
  get,
  view, 
  insert,
  translate: {
    id: translateById,
    key: translateByKey
  },
  getInfo,
  getCard
}