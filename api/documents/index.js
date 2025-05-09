const express = require('express')
const router = express.Router()
const { list, get, remove, update, getUid } = require('./functions')
const translate = require('./translate')
const { unic2, unic, getFilter } = require('../filters.js')
const uidValues = ({uid, exclude}) => uid && !exclude

const tmp = {}

const getDocument = (user) => ({user_id, id, _id, title, desc, [user]: info}) => 
  ({user_id, id: id || _id, title, desc, info})

router.get('/', async ({user_id}, res) => {
  try {
      const {rows} = await get('documents')
      res.status(200).json({values: rows.map(({id}) => {
        // const {title, desc, user_id} = doc
        return getDocument(user_id)(tmp[id] || {id})
      })})
  } catch(e) {
    console.error(e);
    res.status(500).json(e)
  }
}) 
router.get('/:docId', async ({params, user_id}, res) => {
  try {
    const { docId } = params
    const doc = tmp[docId] || await get('documents', docId)
    res.status(200).json(getDocument(user_id)(tmp[docId] = doc))
  } catch(e) {
    console.log(e);
    res.status(500).json(e)
  }
})

router.get('/info/:docId', async ({ user_cash, params, user_id }, res) => {
  try {
    const { docId } = params
    const doc = tmp[docId] || await get('documents', docId)
    const { title, user_id, [docId]: values, getInfo, keys } =  await user_cash(doc)
    const info = getInfo(values.filter(uidValues))
    tmp[docId] = {...doc, [user_id]: info}
    res.status(200).json({...info, id: docId, user_id, title, totalKeys: keys.length })
  } catch(e) {
    console.error(e);
    res.status(404).json({err: e })
  }
})


router.get('/card/:docId/:result', async ({ user_cash, params }, res) => {
  try {
    const {docId, result = 0} = params
    const {[docId]: values = [] , getCard, getRandom} = await user_cash(tmp[docId])
    const docValues = values.filter(uidValues)
    res.status(200).json({card: getCard(docValues, result), random: getRandom(docValues, 5) })
  } catch(err) {
    console.log(err)
    res.status(500).json({err})
  }
}) 

router.get('/dictionary/:docId', async ({ query, user_cash, params }, res) => {
  try {
    const { docId } = params
    const { limit, skip = 0, filter, search = '' } = query
    const { [docId]: values = [] } = await user_cash(tmp[docId])
    const sorted = values.filter(getFilter(filter, ({_id}) => _id.includes(search)))
      .sort(({_id: a}, {_id: b}) => (a > b) - (a < b))
      .map((v, index) => ({...v, index}))
    const total = sorted.length
    res.status(200).json({values: sorted.splice(skip, limit), total })
  } catch(err) {
    console.log(err)
    res.status(500).json({err})
  }
}) 


router.get('/translate/:service/:method/:key', async ({params, user_cash}, res) => {
  try {
    const { service, method, key } = params
    const { dictionary = {}, results = {} } =  await user_cash()
    const getValues = async () => {
      switch(method) {
        case 'key': return await translate[service]['key'](key)
        case 'dictinary': return await translate[service]['key'](key)
        case 'id': return [
          ...Object.values(dictionary)
            .filter(({_id, exclude} = {}) => _id === key && !exclude)
            .map((v) => ({...v, result: results[v.uid]})),
          ...await translate[service]['id'](key) || [],
        ].filter(unic2(({dst}) => dst))
      }
    }
    res.status(200).json(await getValues())
  } catch(e) {
    console.error(e);
    res.status(500).json(e)
  }
}) 

router.get('/text/:docId', async ({ query, user_cash, params }, res) => {
  try {
    const { docId } = params
    const { limit, mark: skip = 0 } = query
    const {keys = [], refs, getObj} = await user_cash(tmp[docId])
    const items = [...keys].splice(skip, limit)
    const values = items.map((v) => ({...v, _id: refs[v.key]}))
    const obj = getObj(values.map(({_id}) => _id).filter(unic))
    res.status(200).json({ values, obj, skip: (+skip) + (+limit) })
  } catch(e) { 
    console.log(e);
    res.status(500).json({err: true})
  }
})
router.post('/text/:docId', async ({ body, user_cash, params }, res) => {
  try {
    const { docId } = params
    const { key, value, values } = body
    const {addValue} = await user_cash(tmp[docId])
    await addValue(key, value || key, await getUid(values))
    res.status(200).json({ ok: true })
  } catch(err) {
    console.log(err);
    res.status(500).json({ err: true})
  }
})

router.post('/text/edit/:docId', async ({ body, user_cash, params }, res) => {
  try {
    const { docId } = params
    const { mark, start, end } = body
    const {keys, updateValues} = await user_cash(tmp[docId])
    keys.splice(mark + start, end - start + 1)    
    await update('documents', params.docId, () => ({ keys })).then(updateValues)
    res.status(200).json({ ok: true })
  } catch(err) {
    console.log(err);
    res.status(500).json({ err: true}) 
  }
}) 

router.delete('/', async ({ body, user_id }, res) => {
  try {
    const { rows } = await get('documents')
    await remove('documents', rows.filter(({id}) => body.docs.includes(id)))
    res.status(200).json({ ok: true })
  } catch(err) {
    console.log(err);
    res.status(500).json({ err: true})
  }
  
})

router.post('/upload', require('./pdfFile.js'), async ({body, user_id}, res) => {
  try {
    const { title, keys = [] } = body?.pdfFile || {}
    const {_id: id} = await update('documents', false, () => ({title, keys, user_id})) || {}
    res.status(200).json({ id })

  } catch(e) {
    console.log(e);
    res.status(500).json({err: true})
  }
}) 

  router.post('/:docId', async ({ body, params }, res) => {
     
    try {
      const { docId } = params
      const { title, desc } = body
      await update('documents', docId, () => ({title, desc}))
      tmp[docId] = {...tmp[docId], title, desc}
      res.status(200).json({ ok: true })
    } catch(err) {
      console.log(err);
      res.status(500).json({err})
    }
  }) 



module.exports = router

