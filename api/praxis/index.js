const express = require('express')
const router = express.Router()
const { nano } = require('../functions')
const dictionary = nano.use('dictionary')

router.get('/:key', async ({params, body}, res) => {
  const rmInt = Math.floor(Math.random() * (4 + 1))
  try {
  const {rows} = await dictionary
    .view('dictionary', 'src', {keys: [params.key], include_docs: true})
  const {doc} = rows[Math.floor(Math.random()*rows.length)]
  const {rows: random} = await dictionary.view('dictionary', 'random',{
    startkey: Math.random(),
    // endKey: Math.random(),
    include_docs: true,
    limit: 10
  })
  const docs = random.map(({doc}) => doc).filter(({ key}) => key !== params.key).slice(0, 4)
  const items = [...docs, doc].sort(() => 0.5 - Math.random())
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