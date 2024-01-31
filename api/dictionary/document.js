const { get } = require('../db')

module.exports = async ({ params, body }, res, next) => {
  try {
    const { id } = params
    body.document = id && await get('documents', id)
    next()
  } catch(err) {
    console.log(err);
    res.status(500).json({err})
  }
}