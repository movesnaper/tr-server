const express = require('express')
const router = express.Router()
const { sign, verify } = require('./functions')
const auth = async (req, res, next) => {
    const token = req.get("user_jwt")
    if (!token) return res.status(401).json('auth_user_requred')

    try {
      const { email } = await verify(token)
      req.user_id = email
      res.set('user_jwt', sign({ email }))
      next()
    } catch(err){
      console.log(err);
      res.status(401).json({ err })
    }
  }

router.use('/auth', require('./auth/index.js'))
router.use('/documents', auth, require('./documents/index.js'))
router.use('/dictionary', auth, require('./dictionary/index.js'))
router.use('/praxis', auth, require('./praxis/index.js'))
// router.use('/translate', auth, require('./translate/index.js'))


module.exports = router