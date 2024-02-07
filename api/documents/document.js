const { get } = require('../db')

module.exports = async ({ params, body }, res, next) => {
  try {
    const { id } = params
    body.document = await get('documents', id)
    next()
  } catch(e) {
    console.log(e);
    res.status(500).json({err: true})
  }
}