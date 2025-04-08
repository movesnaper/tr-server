const pdfParse = require('pdf-parse')
const { keyIsValid } = require('../filters')

const getKeys = (text) => {
  return text
  .replace(/[\n]/gm, ' \n')
  .replace(/[\t-]/gm, ' ')
  .split(' ')

  // .filter((value, index, arr) => {
  //   return !!value && !(value === "\n" && arr[index + 1] && arr[index + 1] === "\n")
  // })

  .map((str) => {
    const key = str.replace(/[.,!?:;'"()-]/g, '')
    .trim().toLowerCase()
    return keyIsValid(key) ? { str, key } : str
  })
}

module.exports = async ({files, body}, res, next) => {
  try {
    const { pdfFile: file } = files || {}
    if (!file) return res.status(404)
      const {data, name: title} = file
    const ext = title.split('.').pop()
    const {text} = ext === 'pdf' ? await pdfParse(file) : {text: data.toString()}

    const keys =   getKeys(text).map((item) => {
      const { str = item, key } = item
      return { str: str + ' ', key }
    })

    body.pdfFile = { title, keys }
    next()
  } catch(e) {
    console.log(e);
    res.status(500).json({ err: true })
  }
}