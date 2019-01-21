/**
 * Various fs helpers
 */
const fs = require('fs')
const { promisify } = require('util')

/**
 * Promisify various fs methods
 *
 * Only required on node 8 and below.
 */
'readdir|mkdir|rmdir|open|close|read|fstat|write|unlink|truncate|access'
  .split('|')
  .forEach(fn => {
    exports[fn] = promisify(fs[fn])
  })

// ensure folder exists
exports.ensuredir = async (...args) => {
  try {
    await exports.mkdir(...args)
  } catch (e) {
    if (e.code !== 'EEXIST') {
      // rethrow if unable to create a folder
      throw e
    }
  }
}
