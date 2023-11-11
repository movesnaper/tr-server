const nano = require('nano')(process.env.COUCHDB)


const bulk = async (dbName, docs) => {
  const db = nano.use(dbName)
  return db.bulk({ docs})
}

const insert = async (dbName, doc, id) => {
  const db = nano.use(dbName)
  const { id: _id } = await db.insert(doc, id)
  return {...doc, _id}
}

const view = async (path, props) => {
  const [dbName, designname , viewname] = path.split("/")
  const db = nano.use(dbName)
  const {rows} = await db.view(designname, viewname, props)
  const reduce = (cur, {key, value}) => ({...cur, [key]: value})
  const values = rows.map(({value}) => value)
  return { rows, values, obj: rows.reduce(reduce, {}) }
}

module.exports = {
  nano,
  bulk,
  insert,
  view
}