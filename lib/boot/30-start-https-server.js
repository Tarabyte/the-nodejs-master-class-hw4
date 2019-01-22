/**
 * Starts https server.
 */
const { createServer } = require('https')
const { readFileSync } = require('fs')

const listen = require('../util/listen')
const makeLogger = require('../debug')
const { notify } = makeLogger
const debug = makeLogger('START_HTTPS', 'blue')

module.exports = async (app, config) => {
  const { https } = config

  if (!https) {
    debug('No https config found. Skipping https server.')
    return
  }

  const { port, key, cert } = https
  try {
    debug('Starting https server on port %i.', port)

    const server = createServer(
      {
        key: readFileSync(key),
        cert: readFileSync(cert),
      },
      app.handler
    )

    await listen(server, { port })

    app.https = server

    notify.green('Server is up and running https://localhost:%i', port)
  } catch (e) {
    notify.red('Unable to start https server on port %i.', port)

    throw e
  }
}
