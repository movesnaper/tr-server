const nano = require('nano')(process.env.COUCHDB)
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { SECRET_OR_KEY } = process.env

const  verify = async (token) =>  {
  const value = jwt.verify(token, SECRET_OR_KEY)
  if (!value) throw 'bad_token'
  return value
}

const sign = (v, populate = (v) => v) => jwt.sign(populate(v), SECRET_OR_KEY, { expiresIn: '100m' })
const unic = (v, index, array) => array.indexOf(v) == index
const minLength = (v) => v.length >= 3
const latinChars = (v) => /^[a-zA-Z_]+$/.test(v)

module.exports = { nano, verify, sign, bcrypt, unic, minLength, latinChars }
