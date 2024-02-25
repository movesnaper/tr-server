const { view } = require('../db')

module.exports = async ({user_id, body}, res, next) => {
  try {
    const reduce= (cur, { key, value }) => {
      return {...cur, [key]: value}
    }

    // const props = { startkey: [user_id], endkey: [user_id, {}]}
    const { values } = await view('documents/results/values', {})
    body.results = values.reduce(reduce, {})
    next()
  } catch(e) {
    console.log(e);
    res.status(500).json(e)
  }
}