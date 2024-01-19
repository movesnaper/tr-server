const pdfParse = require('pdf-parse')
const { toLowerCase } = require('../functions')
// const { view } = require('../db')
const { minLength, unic, latinChars } = require('../filters')

const getKeys = (text, ...filters) => {
  const keys =  text.replace(/^[a-z_]+$/, ' ')
    .replace(/[\n\r"']/g,'').replace(/("|')/g,' ').split(/(?:,| )+/)
  return filters.reduce((cur, f) => cur.filter(f), keys).map(toLowerCase)
}


const parse = async (file) => {
  const { text } = await pdfParse(file)
  const keys = getKeys(text, minLength(3), latinChars, unic)
  const results = keys.reduce((cur, key) => {
    return {...cur, [key]: ''}
  }, {})
  return { title: file.name, results }
}


module.exports = async ({files, body}, res, next) => {
  try {
    if (!files && !files.pdfFile) return res.status(404)
    body.document = await parse(files.pdfFile)
    next()
  } catch(e) {
    console.log(e);
    res.status(500).json(e)
  }
}