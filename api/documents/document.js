const { nano } = require('../db')
const documents = nano.use('documents')

module.exports = async ({ params, body }, res, next) => {
  try {
    body.document = await documents.get(params.id)
    next()
  } catch(e) {
    res.status(500).json(e)
  }
}