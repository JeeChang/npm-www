// XXX Flesh this module out a bit more, and make it
// a standalone thing.
//
// It should detect a res.template() method, and use that
// to generate an error page

module.exports = errors

var STATUS_CODES = require("http").STATUS_CODES
, url = require("url")

function errors (er, req, res) {
  if (!req || !res) return errors.bind(null, er)

  var code, message, u

  u = url.parse(req.url)
  delete u.auth
  u = url.format(u)

  if (typeof er === "number") {
    code = er
    message = STATUS_CODES[code]
  } else if (typeof er === "string") {
    message = er
    code = 500
  } else if (er instanceof Error) {
    code = er.statusCode || 500
    message = er.message
  } else if (er) {
    code = er.statusCode || 500
    message = er.message || STATUS_CODES[code]
  }

  if (er && er.stack) {
    message += '\n' + er.stack
  }
  message += '\n'

  console.error("Error", code, u, message, er)

  // serve in either html or json
  var neg = req.negotiator
  if (!neg) {
    var Negotiator = require('negotiator')
    neg = req.negotiator = new Negotiator(req)
  }

  var avail = ['text/html', 'application/json', 'text/plain']
  , mt = neg.preferredMediaType(avail) || 'text/plain'

  res.statusCode = code
  res.setHeader('content-type', mt)
  var msg
  switch (mt) {
    case 'text/html':
      // XXX templates
      msg = new Buffer("<html><body><pre>" + code + " " + message 
                      + '\n' + u)
      break

    case 'application/json':
      msg = new Buffer(JSON.stringify(
        { ok:false, code:code, message: message, url: u}))
      break

    default:
      msg = new Buffer(code + " " + message + "\n" + u)
  }
  if (msg) res.setHeader('content-length', msg.length)
  res.end(msg)
}
