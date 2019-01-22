const { readdir } = require('./util/fs')
const path = require('path')

const makeLogger = require('./debug')
const { notify } = makeLogger
const debug = makeLogger('BOOT', 'blue')

// path to folder containing boot scripts
const BOOT_DIR = path.join(__dirname, 'boot')

// current env name
const NODE_ENV = (process.env.NODE_ENV || 'development').toLowerCase()

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

const app = {
  /**
   * Starts application w/ the given config
   * @param {*} config
   */
  async start(config) {
    try {
      await bootstrap(app, config)
      notify.green('Application is up and running')
    } catch (e) {
      notify.red('Unable to boot application due to ', e)

      // rethrow to enable further processing
      throw e
    }
  },

  /**
   * Request handler
   * @param {http.IncomminMessage} req Request object
   * @param {http.ServerResponse} res Response object
   */
  handler(req, res) {
    res.end(
      JSON.stringify({
        now: new Date(),
      })
    )
  },
}

module.exports = app
