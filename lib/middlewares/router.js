/**
 * Simple router middleware
 */
const { parse: parseUrl } = require('url')

module.exports = (endPoint, handlers = {}) => (req, respond) => {
  const { url, method } = req

  // extract requested endpoint from url
  const { pathname } = parseUrl(url, true)
  const requestedEndPoint = pathname.replace(/^\/+|\/+$/g, '')

  if (requestedEndPoint !== endPoint) {
    // not our end point
    return
  }

  // select a handler by method
  const handler = handlers[method.toLowerCase()]

  if (!handler) {
    // collect supported methods
    const Allow = Object.keys(handlers)
      .map(key => key.toUpperCase())
      .join(', ')

    // process options request
    if (method === 'OPTIONS') {
      // list allow
      return respond(204, {}, { Allow })
    }

    // respond method not allowed
    // send allow header (to be spec compliant)
    return respond(405, new Error(`Method not supported ${method}`), { Allow })
  }

  // delegate to handler
  return handler(req, respond)
}
