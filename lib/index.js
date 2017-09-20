const version = require('../package.json').version
const http = require('http')
const URL = require('url')
const cuid = require('cuid')
const HttpHashRouter = require('http-hash-router')
const ReqLogger = require('req-logger')

const logger = ReqLogger({ version: version })
const endpoints = require('./endpoints')

const router = HttpHashRouter()

router.set('/api/occurence', {
  'POST': endpoints.findOccurence
})

module.exports = createServer

function createServer () {
  return http.createServer(handler)
}

function handler (req, res) {
  if (req.url === '/favicon.ico') return empty(req, res)

  req.id = cuid()
  logger(req, res, { requestId: req.id })
  router(req, res, { query: URL.parse(req.url, true).query }, onError)

  function onError (err) {
    if (!err) return

    if (process.env.NODE_ENV !== 'test') {
      console.error({ err: err, requestId: req.id })
    }
    const response = {
      error: http.STATUS_CODES[err.statusCode] || 'Error',
      details: err.message || ''
    }

    res.writeHead(err.statusCode || 500,
        { 'Content-Type': 'application/json' })

    res.end(JSON.stringify(response))
  }
}

function empty (req, res) {
  res.writeHead(204)
  res.end()
}
