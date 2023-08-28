const express = require('express')
const router = express.Router()

const auth = async (req, res, next) => {
    // const token = req.get("jwt")
    // if (!token) res.status(401).json('auth_user_requred')
    // try {
    //   const { name } = await verify(token)
    //   res.set('jwt', sign({ name }))
    //   next()
    // } catch(err){
    //   res.status(401).json({ err })
    // }
    next()
  }

router.use('/auth', require('./auth/index.js'))
router.use('/', auth, require('./documents/index.js'))
router.use('/dictionary', auth, require('./dictionary/index.js'))
router.use('/praxis', auth, require('./praxis/index.js'))
router.use('/translate', auth, require('./translate/index.js'))


module.exports = router