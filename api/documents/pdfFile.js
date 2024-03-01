const pdfParse = require('pdf-parse')
const { keyIsValid } = require('../filters')

const getKeys = (text) => {
  return text.replace(/[\n]/gm, '\n ').split(' ')
  .filter((value, index, arr) => {
    const next = value === "\n" && arr[index + 1] && arr[index + 1] === "\n"
    return !!value && !(value === "\n" && arr[index + 1] && arr[index + 1] === "\n")
  })

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