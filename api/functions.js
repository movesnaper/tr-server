const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { SECRET_OR_KEY } = process.env

const  verify = async (token) =>  {
  const value = jwt.verify(token, SECRET_OR_KEY)
  if (!value) throw 'bad_token'
  return value
}  

const sign = (v, populate = (v) => v) =>
  jwt.sign(populate(v), SECRET_OR_KEY, { expiresIn: '100m' })

const toLowerCase = (v) => v && v.toLowerCase().trim()






module.exports = {
  verify,
  sign,
  bcrypt,
  toLowerCase
}
