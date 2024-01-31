const { view } = require('../db')

module.exports = async ({ params, query, user_id }, res) => {
  try {
    const { key } = params
    const { limit, mark } = query
    const props = { startkey: [user_id, mark], endkey: [user_id, {}], limit }
    const { values } = await view('documents/results/excludes', props)
    res.status(200).json(key ? values[key] : { values })
  } catch(err) {
    console.log(err)
    res.status(500).json({err})
  }
}