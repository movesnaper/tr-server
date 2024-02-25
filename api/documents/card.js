const { view } = require('../db')
// const tmp = {}

const getValues = async (url, id, startkey) => {
  const props = { startkey: [id, startkey], endkey: [id, 10], limit: 10}
  const { values } = await view(url, props)
  // const items = values.filter(({value}) => !value.exclude)

  return values
}

const getRandom = async (url, filter) => {
  const {values} = await view(url, {})
  return values.filter(filter)
  .sort(() => 0.5 - Math.random())
    .slice(0, 5).map(({value}) => value)
}

module.exports = async ({ params }, res) => {

  try {
    const { id } = params
    const url = `documents/dictionary/results`
    const startkey = Math.floor(Math.random()*10)
    const props = { startkey: [id, startkey], endkey: [id, 10], limit: 5}
    const { values } = await view(url, props)
    res.status(200).json(values.sort(() => 0.5 - Math.random()))
  } catch(err) {
    console.log(err)
    res.status(500).json({err})
  }
}