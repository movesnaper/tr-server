const { get } = require('../db')

module.exports = async ({ params, body }, res, next) => {
  try {
    body.document = await get('documents', params.id)
    next()
  } catch(e) {
    res.status(500).json(e)
  }
}