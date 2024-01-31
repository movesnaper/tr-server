
const includes = (key, ...arr) => (v) => arr.includes(v[key])
const testExp = (key, exp) => (v) => exp.test(v[key])
const unic =  (v, index, array) => array.indexOf(v) === index
const minLength = (length) => (v) => v.length >= length
const latinChars = (v) => /^[a-zA-Z_]+$/.test(v)
const excludes = (keys) => (key) => !keys.includes(key)

module.exports = {
  includes,
  testExp,
  unic,
  minLength,
  latinChars,
  excludes
}