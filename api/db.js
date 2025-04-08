const nano = require('nano')(process.env.COUCHDB)
const axios = require('axios')

const getUid = async (values) => {
  const { uuids } = await nano.uuids(values && values.length)
  return values.map((v, index) => v.uid ? v : ({...v, uid: uuids[index]}))
}

const bulk = async (dbName, {docs}) => {
  const db = nano.use(dbName)
  return db.bulk({ docs})
}

const remove = (dbName, docs) => {
  return bulk(dbName, { docs: docs.map(({id: _id, value}) => {
    return { _id, _rev: value.rev, _deleted: true}
  })})
}

const insert = async (dbName, doc, id) => {
  const db = nano.use(dbName)
  return db.insert(doc, id)
}

const get = async (dbName, id) => {
  const db = nano.use(dbName)
  return id ? db.get(id) : db.list()
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
    const db = id ? await get(dbName, id) : {}
    const doc = Object.assign(db, await fields(db))
    const {id: _id, rev: _rev} = await insert(dbName, doc, id)
    return {...db, _id, _rev}
  } catch (err) {
    console.log(err);
  }
}


module.exports = {
  nano,
  bulk,
  insert,
  view,
  axios,
  get,
  update,
  remove,
  getUid
}