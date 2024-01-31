const { view } = require('../db')



// async ({params}, res) => {
//   try {
//     const { id } = params
//     const props = {startkey: [id], endkey: [id, {}]}
//     const { values } = await view('documents/results/values', props)
//     res.status(200).json(values[Math.floor(Math.random()*values.length)])
//   } catch(e) {
//     console.log(e);
//     res.status(500).json(e)
//   }
// }

module.exports = async ({ params, user_id }, res) => {
  try {
    const { id = user_id } = params
    const doc_id = params.id && 'doc_id'
    const url = `documents/results/${doc_id || 'user_id'}`
    const { values } = await view(url, { startkey: [id], endkey: [id, {}] })
    const random = Math.floor(Math.random()*values.length)
    res.status(200).json(values[random])
  } catch(err) {
    console.log(err)
    res.status(500).json({err})
  }
}