const express = require('express')
const router = express.Router()
const { nano, sign, bcrypt } = require('../functions')
const users = nano.use('users')
const auth = {
  login: async ({email, password}) => {
    if (!password) throw 'incorect_password'
    try {
      const { _id, hash} = await users.get(email)
      const match = await bcrypt.compare(password, hash)
      if (!match) throw { error: 'incorect_password'}
      return { email: _id }
    } catch(e) {
      console.log(e);
      throw e.error
    }
  },
  register: async ({email, password, confirm}) => {
    if (!password) throw 'incorect_password'
    if (!confirm) throw 'incorect_password'
    if (password !== confirm) throw 'not_match'
    try {
      const hash = await bcrypt.hash(password, 10)
      await users.insert({hash}, email)
      return { email }
    } catch({error}) {
      throw error
    }
  }
}

router.post('/:action', async ({params, body}, res) => {
  try {
    const user = await auth[params.action](body)
    res.status(200).json(sign(user))
  } catch(e) {
    res.status(500).json(e)
  }
})

module.exports = router