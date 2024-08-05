const { getUid, get, view, insert, update, remove } = require('../db')

const getInfo = (values) => {
  const keys = values.length
  const results = (cur, {result = 0} = {}) => cur += result
  const total = keys && (values.reduce(results, 0) / keys * 10).toFixed(2)
  const color = total < 75 ? 'info' : 'success'
  return { keys, color, total: total || 0 }
}

module.exports = {
  getUid,
  get,
  view, 
  insert,
  getInfo,
  update,
  remove
}