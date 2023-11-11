const express = require('express')
const router = express.Router()
const { nano } = require('../db')
const dictionary = nano.use('dictionary')

router.get('/:key', async ({params}, res) => {
  try {
  const {rows} = await dictionary
    .view('dictionary', 'src', {keys: [params.key], include_docs: true})
  const {doc, key, value} = rows[Math.floor(Math.random()*rows.length)] || {}
  const {rows: src} = await dictionary.view('dictionary', 'src')
  const docs = src.sort(() => 0.5 - Math.random())
    .filter(({ key}) => key !== params.key).slice(0, 4)
  const items = [...docs, {key, value}].sort(() => 0.5 - Math.random())
  .map((doc) => {
    const [value] = doc.value.split(/,|;/).sort(() => 0.5 - Math.random())
    return {...doc, value: value.trim()}
  })
  res.status(200).json({...doc, items})
  } catch(e) {
    console.log(e);
    res.status(500).json(e)
  }
})

router.post('/:id', async ({params, body}, res) => {
    // try {
    //   res.status(200).json(await db.insert(body, params.id))
    // } catch(e) {
    //   res.status(500).json(e)
    // }
  })

module.exports = router