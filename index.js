const express = require('express')
const axios = require('axios')
const fileUpload = require('express-fileupload')
const pdfParse = require('pdf-parse')
const cors = require("cors")
const nano = require('nano')('http://admin:Stalker018120@localhost:5984')
const dictionary = nano.db.use('dictionary')

const documents = nano.db.use('documents')

const app = express()

app.use(cors({ origin: "http://localhost:3000" }))

app.use(fileUpload({
  defCharset: 'utf8',
  defParamCharset: 'utf8'
}))

const translate = async (prefix) => {
  const {data} = await axios.get('https://api.lingvolive.com/Translation/WordListPart', {
    params: {
      prefix,
      srcLang: 1033,
      dstLang: 1049,
      pageSize: 10,
      startIndex: 0
    }
  })
  return data
}

const excludes = (v) => !['and', 'are', 'with', 'ata'].includes(v.toLowerCase())
const unic = (v, index, array) => array.indexOf(v) == index
const minLength = (v) => v.length >= 3

const addToDictionary = async ({prefix, items}) => {
  
  const values = items
  .filter(({heading}) => /^[a-z_]+$/.test(heading))
    .filter(({heading}) => excludes(heading))
    .filter(({source}) => source !== 'Social')
    .filter(({heading}) => minLength(heading))
      .map(({heading, lingvoSoundFileName, lingvoTranslations}) => ({
        prefix,
        origin: heading,
        file: lingvoSoundFileName,
        translate: lingvoTranslations
      }))
  return Promise.all(values.map(async (v) => {
    const {docs} = await dictionary.find({ selector: { origin: v.origin}})
    !docs.length && dictionary.insert(v)
  }))
}

app.get('/', async (req,res) => {
  
  const { rows } = await documents.list({include_docs: true})
  res.status(200).json(rows.map(({doc}) => doc))
})

app.get('/dictionary/:id?', async (req, res) => {
  const { bookmark, limit } = req.query
  const {rows} = await documents.list({include_docs: true})
  const keys = rows.filter(({id}) => req.params.id ? req.params.id == id : true)
    .reduce((cur, { doc }) => [...cur, ...doc.dictionary], [])
  const data = await dictionary.find({
    selector: { origin: { $in: keys } },
    limit: +limit,
    sort: ['origin'],
    bookmark,
  })
  res.status(200).json({...data, total: keys.length, limit: +limit })
})

app.get('/praxis/:id?', async (req, res) => {
  const {rows} = await documents.list({include_docs: true})
  const keys = rows.filter(({id}) => req.params.id ? req.params.id == id : true)
    .reduce((cur, { doc }) => [...cur, ...doc.dictionary], [])
  const key = keys[Math.floor(Math.random()*keys.length)]
  const {docs} = await dictionary.find({
    selector: { origin: key },
  })
  const {rows: fakeRows} = await dictionary.view('test', 'random',{
    startkey: Math.random(),
    endKey: Math.random(),
    include_docs: true,
    limit: 10
  })
  const shuffled = fakeRows.filter(({doc}) => doc && doc.origin != key)
    .sort(() => 0.5 - Math.random()).slice(0, 4);
  const doc = docs[Math.floor(Math.random()*docs.length)] || {}
  const values = [...shuffled, {doc}]
    .sort(() => 0.5 - Math.random())
      .map(({doc}) => doc)

  res.status(200).json({key, docs, values, total: keys.length })
})

app.post('/', ({files}, res) => {
  if (!files && !files.pdfFile) {
    res.status(404)
  }
  const file = files.pdfFile
  pdfParse(file).then(async (result) => {
    const dictionary  = result.text.replace(/^[a-z_]+$/, " ").trim().split(" ")
    .filter(unic)
    .filter(excludes)
    .filter(minLength)
    .filter((v) => /^[a-zA-Z_]+$/.test(v))
    .map((v) => v.toLowerCase())
    const items = await Promise.all(dictionary.map(translate))
    await documents.insert({...result, title: file.name, dictionary})
    Promise.all(items.map(addToDictionary))
    res.status(200).json('ok')
  })
})
app.listen(5000, () => {
  console.log('server start on port 5000');
})
