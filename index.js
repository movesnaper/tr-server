require('dotenv').config()
const express = require('express')
const fileUpload = require('express-fileupload')
const cors = require("cors")
const app = express()
app.use(express.json()); //Used to parse JSON bodies
app.use(express.urlencoded()); //Parse URL-encoded bodies

app.use(cors({ origin: process.env.ORIGIN }))
app.use(fileUpload({ defCharset: 'utf8', defParamCharset: 'utf8' }))
app.use('/', require('./api/index.js'))

app.listen(process.env.PORT, () => {
  console.log( `server start on port ${process.env.PORT}`)
})
