const express = require('express')
const router = express.Router()
const { nano } = require('../functions')
const users = nano.use('users')

router.post('/', async ({body}, res) => {
  try {
    const doc = await users.get(body.email)
    res.status(200).json(doc)
  } catch(e) {
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