/**
 * Start http server on boot
 */
const { createServer } = require('http')

const listen = require('../util/listen')
const makeLogger = require('../debug')
const { notify } = makeLogger
const debug = makeLogger('START_HTTP', 'cyan')

module.exports = async (app, config) => {
  const { http } = config

  if (!http) {
    debug('No http config found. Skipping http server.')
    return
  }

  const server = createServer(app.handler)
  const { port } = http

  try {
    debug('Starting http server on port %i', port)

    await listen(server, { port })
    app.http = server

    notify.green('Server is up and running http://localhost:%i', port)
  } catch (e) {
    notify.red('Unable to start server on port %i.', port)

    // rethrow further
    throw e
  }
}
