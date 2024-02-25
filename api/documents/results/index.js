const { get, insert } = require('../functions')

const getInfo = (values) => {
  const results = (cur, {result = 0} = {}) => cur += result
  const excludes = ({exclude}) => !exclude
  const keys = values.filter(excludes)
  const total = keys.length ? (keys.reduce(results, 0) / keys.length * 10).toFixed(2) : 0
  return { keys: keys.length, excludes: values.length - keys.length, total }
}

module.exports = async ({ body, params }, res) => {
  try {
    const { items } = body
    const document = await get('documents', params.id)
    const { title, results } = document
    const reduce = (cur, { key, value }) => ({...cur, [key]: value })
    if (items) 
      insert('documents', {...document, results: items.reduce(reduce, results)})
    res.status(200).json({...getInfo(Object.values(results)), title })
  } catch(err) {
    console.log(err);
    res.status(500).json({ err: true})
  }
}

// await Promise.all(Object.entries(body).map( async ([id, values]) => {
//   const document = await get('documents', id)
//   const results = values.reduce((cur, { key, value }) => {
//     return {...cur, [key]: value }
//   }, document.results)
//   await insert('documents', {...document, results})
// }))
// res.status(200).json({ ok: true })