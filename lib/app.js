const path = require('path')
const { readdir } = require('./util/fs')
const makeLogger = require('./debug')
const parseBody = require('./middlewares/parseBody')
const notFound = require('./middlewares/notFound')
const parseQuery = require('./middlewares/parseQuery')
const parseUser = require('./middlewares/parseUser')
const router = require('./middlewares/router')

const usersCtrl = require('./handlers/users')
const tokensCtrl = require('./handlers/tokens')
const productsCtrl = require('./handlers/products')
const cartCtrl = require('./handlers/cart')
const ordersCtrl = require('./handlers/orders')

const { notify } = makeLogger
const debug = makeLogger('BOOT', 'blue')

// path to folder containing boot scripts
const BOOT_DIR = path.join(__dirname, 'boot')

// current env name
const NODE_ENV = (process.env.NODE_ENV || 'development').toLowerCase()
const isDev = NODE_ENV !== 'production'

// check if the script if for some env only
const shouldRunScript = fileName => {
  const base = path.basename(fileName, '.js')
  const parts = base.split('.')

  // if no .smth in file name
  if (parts.length === 1) {
    return true
  }

  const env = parts[parts.length - 1]

  return env.toLowerCase() === NODE_ENV
}

// Evaluate boot files from within the boot dir
const bootstrap = async (app, config) => {
  debug('Loading boot sequence from %s directory', BOOT_DIR)
  const bootSequence = await readdir(BOOT_DIR)

  // run files in order
  for (const bootFile of bootSequence.sort()) {
    const shouldRun = shouldRunScript(bootFile)
    if (shouldRun) {
      debug('Loading boot file %s.', bootFile)
      const boot = require(path.join(BOOT_DIR, bootFile))

      await boot(app, config)
    } else {
      debug('Skipping boot file %s for current env.', bootFile)
    }
  }
}

const DONE = Symbol('done response processing')

// construct unambiguos response object
const respond = (
  status = 200,
  payload = Object.create(null),
  headers = Object.create(null)
) => ({
  done: DONE,
  status,
  payload,
  headers,
})

const app = {
  /**
   * Starts application w/ the given config
   * @param {Object} config
   */
  async start(config) {
    try {
      await bootstrap(app, config)
      notify.green('Application is up and running')
    } catch (e) {
      notify.red('Unable to boot application')

      // rethrow to enable further processing
      throw e
    }
  },

  /**
   * Middlewares array
   */
  handlers: [
    parseBody,
    parseQuery,
    parseUser,
    router('users', usersCtrl),
    router('tokens', tokensCtrl),
    router('products', productsCtrl),
    router('cart', cartCtrl),
    router('orders', ordersCtrl),
  ],

  /**
   * Request handler
   * @param {http.IncomingMessage} req Request object
   * @param {http.ServerResponse} res Response object
   */
  async handler(req, res) {
    // set request application
    req.app = app

    // do send response
    const send = (status, payload, headers) => {
      // set all headers
      Object.entries({
        'Content-Type': 'application/json',
        ...headers,
      }).forEach(([header, value]) => {
        res.setHeader(header, value)
      })

      try {
        // this line might throw
        const responseBody = JSON.stringify(
          // pick message from Error object
          payload instanceof Error
            ? {
                ...payload, // copy all enumerable fields
                message: payload.message, // extract message
                // send stack trace in dev mode
                ...(isDev ? { stack: payload.stack } : null),
              }
            : payload
        )

        res.writeHead(status)
        res.end(responseBody)
      } catch (e) {
        // ouch failed to stringify the request
        send(500, e)
      }
    }

    // copy handlers just in case some handlers adds more
    const handlers = [...app.handlers, notFound]

    // run all request handlers
    for (const handler of handlers) {
      try {
        const response = await handler(req, respond)

        // check if handler wants to respond
        if (response && response.done === DONE) {
          send(response.status, response.payload, response.headers)

          // stop processing
          break
        }
      } catch (e) {
        send(500, e, {})

        break
      }
    }
  },
}

module.exports = app
