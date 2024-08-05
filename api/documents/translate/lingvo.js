const { axios } = require('../../db')


const translateByKey = async (key) => {
  const items = ({ heading, lingvoTranslations: dst }) => 
  ({ _id: heading.toLowerCase().trim(), dst })
  const params = { prefix: key, srcLang: 1033, dstLang: 1049, pageSize: 10 }
  const {data} = await axios.get(process.env.TRANSLATE_URL, { params })
  return data.items.map(items).filter(({_id}) => !!_id)
}

const POS = {
  'Adjective': 'adjective',
  'Adverb': 'adjective-verb',
  'Pronoun': 'pronoun',
  'Verb': 'verb',
  'Preposition': 'preposition',
  'Conjunction': 'conjunction',
  'Noun': 'noun',
  'NounNeuter': 'noun-neuter',
  'Numeral': 'numeral'
}

const getSound = (fileName) => {
  return fileName && `https://api.lingvolive.com/sounds?uri=LingvoUniversal%20(En-Ru)%2F${fileName}`
}

const translateById = async (id) => {
  const url = 'https://api.lingvolive.com/Translation/tutor-cards'
  const itemsMap = ({ 
    partOfSpeech, 
    translations: dst, 
    transcription: trc,
    soundFileName, 
    examples: exm }) => 
  ({ pos: POS[partOfSpeech] || partOfSpeech, dst, trc, exm, snd: getSound(soundFileName) })
  const params = { text: id, srcLang: 1033, dstLang: 1049 }
  const {data} = await axios.get(url, { params })
  return data && data.map(itemsMap)
  // .filter(({ dst, pos }) => !!dst && !!pos)
}

module.exports = {
  id: translateById,
  key: translateByKey
}