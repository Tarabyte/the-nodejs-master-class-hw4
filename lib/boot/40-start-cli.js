/**
 * Enable CLI for managers
 */
const debug = require('../debug')('CLI', 'cyan')
const cli = require('../cli')

module.exports = (app, config) => {
  const { cli: cliOptions } = config

  if (!cliOptions) {
    debug('No CLI options configured. Disabling CLI.')
    return
  }

  debug('Starting CLI')

  cli(app, cliOptions)
}
