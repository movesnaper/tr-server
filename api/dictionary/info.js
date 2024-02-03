const { view } = require('../db')
const { getInfo } = require('../documents/functions')

module.exports = async ({ params, user_id, body }, res) => {
  try {
    const { title } = body.document || {}
    const { id = user_id } = params
    const doc_id = params.id && 'doc_id'
    const url = `documents/results/${doc_id || 'user_id'}`
    const { values } = await view(url, { startkey: [id], endkey: [id, {}] })
    const info = getInfo(values.map(({value}) => value))
    res.status(200).json({...info, title })
  } catch(err) {
    console.log(err)
    res.status(500).json({err})
  }
}