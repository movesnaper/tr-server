const { view } = require('../db')

module.exports = async ({ body, user_id }, res, next) => {
  try {
    const props = { startkey: [user_id], endkey: [user_id, {}]}
    const { values } = await view('documents/results/excludes', props)
    body.excludes = values
    next()
  } catch(e) {
    res.status(500).json(e)
  }
}