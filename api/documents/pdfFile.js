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
    const {text} = await pdfParse(file)
  const keys =   getKeys(text).map((item) => {
    const { str = item, key } = item
    return { str: str + ' ', key }
  })
  // .filter(({str}, index, arr) => {
  //   const exp = /[0-9\n]/
  //   return // /^[a-zA-Z0-9 .,:;'"!?\n-]+$/.test(str) 
  //     // && !(exp.test(str) && exp.test(arr[index + 1]?.str))
  //     //  && !(exp.test(str) && /[a-z]/.test(arr[index + 1]?.str[0])) 
  //       // && !(/\d\n/.test(str))
  // })
    body.pdfFile = { title: file.name, keys, text }
    next()
  } catch(e) {
    console.log(e);
    res.status(500).json({ err: true })
  }
}