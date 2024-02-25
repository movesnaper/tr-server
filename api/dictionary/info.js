const { view } = require('../documents/functions')

const getInfo = (values) => {
  const results = (cur, {result = 0} = {}) => cur += result
  const excludes = ({exclude}) => !exclude
  const keys = values.filter(excludes)
  const total = keys.length ? (keys.reduce(results, 0) / keys.length * 10).toFixed(2) : 0
  return { keys: keys.length, excludes: values.length - keys.length, total }
}

module.exports = async ({ body }, res) => {
  try {
    const { _id, title } = body.document || {}
    const url = `documents/dictionary/results`
    const { values } = await view(url, { startkey: [ _id ], endkey: [_id, {}]})
    res.status(200).json({...getInfo(values.map(({value}) => value)), title })
  } catch(err) {
    console.log(err)
    res.status(500).json({err})
  }
}