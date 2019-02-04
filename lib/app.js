const path = require('path')
const { Readable } = require('stream')
const { readdir } = require('./util/fs')
const makeLogger = require('./debug')
const parseBody = require('./middlewares/parseBody')
const notFound = require('./middlewares/notFound')
const parseQuery = require('./middlewares/parseQuery')
const parseUser = require('./middlewares/parseUser')
const router = require('./middlewares/router')
const favicon = require('./middlewares/favicon')
const static = require('./middlewares/static')

const usersCtrl = require('./api/users')
const tokensCtrl = require('./api/tokens')
const productsCtrl = require('./api/products')
const cartCtrl = require('./api/cart')
const ordersCtrl = require('./api/orders')

const home = require('./web/home')
const login = require('./web/login')
const signup = require('./web/signup')
const logout = require('./web/logout')

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

// infer serializer by content type
const inferSerializer = (serializers => type => {
  // various application/json content types
  if (type.endsWith('/json')) {
    return serializers.json
  }

  // text/plain, text/html etc
  if (type.startsWith('text/')) {
    return serializers.text
  }

  // binary files
  return serializers.buffer
})({
  /**
   * Stringify objects to json.
   * Handle Errors specially
   */
  json(payload) {
    return JSON.stringify(
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
  },

  /**
   * Converts payload toString.
   */
  text(payload) {
    return payload != null ? payload.toString() : ''
  },

  /**
   * Returns buffer as is. Throwing error for another types types.
   */
  buffer(payload) {
    if (!(payload instanceof Buffer)) {
      throw new Error('Only accepting buffers')
    }

    return payload
  },
})

const app = {
  /**
   * Starts application w/ the given config
   * @param {Object} config
   */
  async start(config) {
    try {
      app.config = config
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
    favicon('./public/favicon.ico'),
    static('public'),
    parseBody,
    parseQuery,
    parseUser,

    // API
    router('api', {
      users: usersCtrl,
      tokens: tokensCtrl,
      products: productsCtrl,
      cart: cartCtrl,
      orders: ordersCtrl,
    }),

    // Web App
    router('', {
      '': home,
      login,
      signup,
      logout,
    }),
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
      headers = {
        'Content-Type': 'application/json',
        ...headers,
      }

      // set all headers
      Object.entries(headers).forEach(([header, value]) => {
        res.setHeader(header, value)
      })

      try {
        // pipe stream into response if
        if (payload instanceof Readable) {
          res.writeHead(status)

          payload.pipe(res)
        } else {
          // pick serializer
          const serializer = inferSerializer(headers['Content-Type'])

          // serialize body (this line might throw)
          const responseBody = serializer(payload)

          res.writeHead(status)
          res.end(responseBody)
        }
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
        console.log(e)
        send(500, e, {})

        break
      }
    }
  },
}

module.exports = app
