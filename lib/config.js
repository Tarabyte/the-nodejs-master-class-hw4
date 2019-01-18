/**
 * Initializes current config based on NODE_ENV value.
 */
const { readFileSync, existsSync } = require('fs')
const { join } = require('path')
const debug = require('./debug')('config', 'cyan')

/**
 * Loads config json config file by configuration name relative to current working directory.
 * @param {String} name Configuration name
 */
const load = name => {
  const fileName = join(process.cwd(), `.env.${name}.json`)

  if (!existsSync(fileName)) {
    debug.red('Config file %s does not exist', fileName)

    return {}
  }

  debug('Loading config file %s', fileName)

  const contents = readFileSync(fileName)

  // assumming json encoded config
  return JSON.parse(contents)
}

const { NODE_ENV = 'development' } = process.env

module.exports = {
  ...load(NODE_ENV), // current env config
  ...load(`${NODE_ENV}.local`), // possible local overrides
}
