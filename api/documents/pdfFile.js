const pdfParse = require('pdf-parse')
const { toLowerCase } = require('../functions')
const { view } = require('../db')
const { minLength, unic, latinChars, excludes } = require('../filters')

const getKeys = (text) => 
  text.replace(/^[a-z_]+$/, ' ')
    .replace(/[\n\r"']/g,' ')
      .replace(/("|')/g,' ')
        .split(/(?:,| )+/)


module.exports = async ({files, body}, res, next) => {
  try {
    const { pdfFile: file } = files || {}
    if (!file) return res.status(404)
    const excludesKeys = body.excludes.map(({key}) => key)
    const {text} = await pdfParse(file)
    const filters = [minLength(3), latinChars, unic, excludes(excludesKeys)]
    const reduce = (cur, filter) => cur.filter(filter)
    const keys = filters.reduce(reduce, getKeys(text).map(toLowerCase))
    body.pdfFile = { title: file.name, text, keys }
    next()
  } catch(e) {
    console.log(e);
    res.status(500).json(e)
  }
}