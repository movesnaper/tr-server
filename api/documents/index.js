const express = require('express')
const router = express.Router()
const { get, remove, update, getInfo, getUid } = require('./functions')
const translate = require('./translate')
const { keyIsValid, unic2, unic } = require('../filters.js')
const tmp = {}

router.get('/', async ({user_id}, res) => {
  try {
    const {rows} = await get('documents')
    const values = [...rows.map(({doc}) => doc), tmp[user_id]].filter((v) => !!v)
      .map(({ _id: id, title, desc, user_id: user }) => ({ id, title, desc, user }))
    res.status(200).json({values})
  } catch(e) {
    console.log(e);
    res.status(500).json(e)
  }
})

router.get('/info/:docId', async ({ user_cash, params }, res) => {
  try {
    const {title, values, user_id, keys } =  await user_cash(params)
    res.status(200).json({...getInfo(values), title, user_id, totalKeys: keys.length})
  } catch(e) {
    console.error(e);
    res.status(500).json({err: e })
  }
})


router.get('/merge/:docId', async ({ user_cash, params }, res) => {
  try {
    const {keys, user_id, merge } =  await user_cash(params)
    const {refs: user_refs, dictionary} = await get('users', user_id)
    const objRefs = (cur, {key}) => ({...cur, [key]: user_refs[key]})
    const refs = keys.reduce(objRefs, {})
    const ids = Object.values(refs).filter(unic)
    const values = dictionary.filter(({_id}) => ids.includes(_id))
    const result = value => ({...value, result: undefined})
    await merge(refs, values.map(result))
    res.status(200).json({ok: true})
  } catch(e) {
    console.error(e)
    res.status(500).json({err: e }) 
  } 
}) 

router.get('/card/:docId', async ({ user_cash, params }, res) => {
  try {
    const {getCard, getRandom} = await user_cash(params)
    res.status(200).json({card: getCard(), random: getRandom(5) })
  } catch(err) {
    console.log(err)
    res.status(500).json({err})
  }
}) 

router.get('/dictionary/:docId', async ({ query, user_cash, params }, res) => {
  try {
    const { limit, skip = 0 } = query
    const { values = []} =  await user_cash(params)
    const predicate = ({_id: a}, {_id: b}) => (a > b) - (a < b)
    const sorted = [...values].sort(predicate).splice(skip, limit)
    res.status(200).json({ values: sorted, skip: (+skip) + (+limit) })
  } catch(err) {
    console.log(err)
    res.status(500).json({err})
  }
})
 
router.post('/results/:docId', async ({ body, user_cash, params }, res) => {
  try {
    const { setValue} =  await user_cash(params)
    res.status(200).json({ rerult: await setValue(body) })
  } catch(err) {
    console.log(err);
    res.status(500).json({ err: true})
  }
})

router.get('/translate/:service/:method/:key', async ({params, user_cash}, res) => {
  try {
    const { service, method, key } = params
    const { dictionary = []} =  await user_cash(params)
    const result = [
      ...(method === 'id' ? dictionary.filter(({_id}) => _id === key) : []),
      ...await translate[service][method](key) || []
    ].filter(unic2(({dst}) => dst))
    res.status(200).json(result)
  } catch(e) {
    console.log(e);
    // res.status(500).json(e)
  }
}) 

router.get('/text/:docId', async ({ query, user_cash, params }, res) => {
  try {
    const { limit, mark: skip = 0 } = query
    const {keys = [], getObj} = await user_cash(params)
    const values = [...keys].splice(skip, limit) 
    // .filter(({str}, index, arr) => {
    //   return !(/[0-9\n]/.test(str) && /[a-z]/.test(arr[index + 1]?.str[0])) 
    // })

    const obj = getObj(values.map(({key}) => key))
    res.status(200).json({ values, obj, skip: (+skip) + (+limit) })
  } catch(e) {
    console.log(e);
    res.status(500).json({err: true})
  }
})

router.post('/text/:docId', async ({ body, user_cash, params }, res) => {
  try {
    const { ref: key, key: value, values } = body
    const {addValue} = await user_cash(params)
    addValue(key, value, await getUid(values))
    res.status(200).json({ ok: true })
  } catch(err) {
    console.log(err);
    res.status(500).json({ err: true})
  }
}) 

router.post('/text/edit/:docId', async ({ body, user_cash, params }, res) => {
  try {
    const { mark, start, end } = body
    const {keys, updateValues} = await user_cash(params)
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
    const docs = rows.filter(({id}) => body.docs.includes(id))
    await remove('documents', {docs: docs.map(({doc}) => doc)})
    res.status(200).json({ ok: true })
  } catch(err) {
    console.log(err);
    res.status(500).json({ err: true})
  }
  
})

router.post('/upload', require('./pdfFile.js'), async ({body, user_id}, res) => {
  try {
    const { title, keys = [] } = body?.pdfFile || {}
    const {length} = keys.filter(({key}) => keyIsValid(key)).filter(unic2(({key}) => key))
    const desc = `${user_id} keys: ${length}`
    const {_id: id} = await update('documents', false, () => ({title, desc, keys, user_id}))
    res.status(200).json({ id, title, desc, user: user_id })
  } catch(e) {
    console.log(e);
    res.status(500).json({err: true})
  }
})

  router.post('/:docId', async ({ user_id, body, params, user_cash }, res) => {
    
    try {
      const { title, desc } = body
      const {updateValues} = await user_cash(params)
      await update('documents', params.docId, () => ({title, desc, user_id}))
      .then(updateValues)
      res.status(200).json({ ok: true })
    } catch(err) {
      console.log(err);
      res.status(500).json({err})
    }
  }) 



module.exports = router

