/**
 * Simple router middleware
 */
const { parse: parseUrl } = require('url')

// remove multiple starting and ending / from the path
const normalizePath = url => parseUrl(url).pathname.replace(/^\/+|\/+$/g, '')

const pickHandlerByMethod = handlers => (req, respond) => {
  const { method } = req

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

/**
 * Creates route handling middleware
 * @param {String} prefix Base route
 * @param {Object} routes Route object
 */
const router = (prefix, routes) => {
  const handlers = Object.entries(routes).reduce((handlers, [key, handler]) => {
    const endPoint = prefix ? `${prefix}/${key}` : key

    handlers[endPoint] = pickHandlerByMethod(
      typeof handler === 'function' ? { get: handler } : handler
    )

    return handlers
  }, Object.create(null))

  return (req, respond) => {
    // extract requested endpoint from url
    const requestedEndPoint = normalizePath(req.url)

    // pick a handler
    const handler = handlers[requestedEndPoint]

    if (handler) {
      return handler(req, respond)
    }
  }
}

module.exports = router
