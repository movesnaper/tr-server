const pdfParse = require('pdf-parse')
const { keyIsValid } = require('../filters')

// const key = str.replaceAll('[^\\x00-\\xFF]', '')
const getKeys = (text) => {
  return text.replace(/[\n]/gm, '\n ').split(' ')
  .filter((v) => !!v)
  .map((str) => {
    const key = str.replace(/[.,!?:;'"()-]/g, '').trim().toLowerCase()
    return keyIsValid(key) ? { str, key } : str
  })
}

module.exports = async ({files, body}, res, next) => {
  try {
    const { pdfFile: file } = files || {}
    if (!file) return res.status(404)
    const {text} = await pdfParse(file)
    body.pdfFile = { title: file.name, keys: getKeys(text) }
    next()
  } catch(e) {
    console.log(e);
    res.status(500).json({ err: true })
  }
}