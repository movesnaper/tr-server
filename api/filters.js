
const includes = (key, ...arr) => (v) => arr.includes(v[key])
const testExp = (key, exp) => (v) => exp.test(v[key])
const unic =  (v, index, array) => v && array.indexOf(v) === index
const unic2 =  (value) => (item, index, array) => 
  array.map(value).indexOf(value(item)) === index
const minLength = (length) => (v) => v.length >= length
const latinChars = (v) => /^[a-zA-Z_]+$/.test(v)
const excludes = (keys) => (key) => !keys.includes(key)
const keyIsValid = (key) => key && key.length >= 3 && latinChars(key)
&& !['the'].includes(key)
const getFilter = (filter, search) => {
  const testfilter = ({uid, exclude}) => {
    switch (filter) {
      case 'hasValue' : return uid && !exclude
      case 'hasNoValue' : return !uid
      case 'isExclude' : return !!exclude
      default : return true
    }
  }
  return (v) => testfilter(v) && search(v)

}

module.exports = {
  getFilter,
  includes,
  testExp,
  unic,
  unic2,
  minLength,
  latinChars,
  excludes,
  keyIsValid
}