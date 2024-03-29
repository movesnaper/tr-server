const { axios, get, view, insert, update, remove } = require('../db')

const translateByKey = async (key) => {
  const items = ({ heading, lingvoTranslations: dst }) => 
  ({ _id: heading.toLowerCase().trim(), dst })
  const params = { prefix: key, srcLang: 1033, dstLang: 1049, pageSize: 10 }
  const {data} = await axios.get(process.env.TRANSLATE_URL, { params })
  return data.items.map(items)
}


const POS = {
  'Adjective': 'adjective',
  'Adverb': 'adjective-verb',
  'Pronoun': 'pronoun',
  'Verb': 'verb',
  'Preposition': 'preposition',
  'Conjunction': 'conjunction',
  'Noun': 'noun',
  'NounNeuter': 'noun-neuter'
}

const getSound = (fileName) => {
  return fileName && `https://api.lingvolive.com/sounds?uri=LingvoUniversal%20(En-Ru)%2F${fileName}`
}

const translateById = async (id) => {
  const url = 'https://api.lingvolive.com/Translation/tutor-cards'
  const itemsMap = ({ 
    heading, 
    partOfSpeech, 
    translations: dst, 
    transcription: trc,
    soundFileName, 
    examples: exm }) => 
  ({ _id: heading.toLowerCase().trim(), pos: POS[partOfSpeech] || partOfSpeech, dst, trc, exm, snd: getSound(soundFileName) })
  const params = { text: id, srcLang: 1033, dstLang: 1049 }
  const {data} = await axios.get(url, { params })
  return data && data.map(itemsMap)
}
const getInfo = (values) => {
  const keys = values.length
  const results = (cur, {result = 0} = {}) => cur += result
  const total = keys && (values.reduce(results, 0) / keys * 10).toFixed(2)
  return { keys, total: total || 0 }
}

module.exports = {
  get,
  view, 
  insert,
  getInfo,
  translate: {
    id: translateById,
    key: translateByKey
  },
  update,
  remove
}