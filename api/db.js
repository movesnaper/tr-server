const nano = require('nano')(process.env.COUCHDB)
const axios = require('axios')


const bulk = async (dbName, {docs}) => {
  const db = nano.use(dbName)
  return db.bulk({ docs})
}

const insert = async (dbName, doc, id) => {
  const db = nano.use(dbName)
  return db.insert(doc, id)
}

const get = async (dbName, id) => {
  const db = nano.use(dbName)
  return db.get(id)
}

const view = async (path, props) => {
  const [dbName, designname , viewname] = path.split("/")
  const db = nano.use(dbName)
  const {rows, offset, total_rows} = await db.view(designname, viewname, props)
  const values = rows.map(({value}) => value)
  return { offset, values, total: total_rows }
}



module.exports = {
  nano,
  bulk,
  insert,
  view,
  axios,
  get
}