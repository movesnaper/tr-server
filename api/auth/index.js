const express = require('express')
const router = express.Router()

router.get('/', async (req, res) => {
    // try {
    //     const {rows} = await db.list({include_docs: true})
    //     res.status(200).json(rows.map(populate))
    //   } catch(e) {
    //     console.error(e);
    //     res.status(500).json(e)
    //   }
})

router.post('/:id', async ({params, body}, res) => {
    // try {
    //   res.status(200).json(await db.insert(body, params.id))
    // } catch(e) {
    //   res.status(500).json(e)
    // }
  })

module.exports = router