const nano = require('nano')(process.env.COUCHDB)
const axios = require('axios')


const bulk = async (dbName, {docs}) => {
  const db = nano.use(dbName)
  return db.bulk({ docs})
}

const remove = (dbName, {docs}) => {
  return bulk(dbName, { docs: docs.map((doc) => ({...doc, _deleted: true}))})
}

const insert = async (dbName, doc, id) => {
  const db = nano.use(dbName)
  return db.insert(doc, id)
}

const get = async (dbName, id) => {
  const db = nano.use(dbName)
  return db.get(id)
}

const view = async (path, props, reduce) => {
  const [dbName, designname , viewname] = path.split("/")
  const db = nano.use(dbName)
  const {rows, offset, total_rows} = await db.view(designname, viewname, props)
  const values = rows.map(({value}) => value)
  return reduce ? values.reduce(reduce, {}) : { offset, values, total: total_rows }
}

const update = async (dbName, id, fields) => {
  try {
    const db = await get(dbName, id)
    const doc = Object.entries(fields(db))
      .reduce((cur, [key, value]) => ({...cur, [key]: value}), db)
    await insert(dbName, doc, id)
    return doc
  } catch (err) {
    console.log(err);
  }
  // return insert(dbName, id, doc)
  // const reduce = (cur, [key, value]) => ({...cur, [key]: value})
  // const doc = Object.entries(fields).reduce(reduce, await get(dbName, id) || {})
}


module.exports = {
  nano,
  bulk,
  insert,
  view,
  axios,
  get,
  update,
  remove
}