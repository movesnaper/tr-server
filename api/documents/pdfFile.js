const pdfParse = require('pdf-parse')

const getKeys = (text) => {
  return text.replace(/[\n]/gm, '\n ').split(' ')
  .filter((v) => !!v)
  .map((str) => ({ str, key: str.replace(/[,.?!:'"]/gm, '')
  .trim().toLowerCase() }))
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