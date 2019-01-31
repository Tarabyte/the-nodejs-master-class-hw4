/**
 * Favicon handling middleware
 */
const { readFile } = require('../util/fs')

module.exports = iconPath => {
  // read icon once
  const icon = readFile(iconPath)

  return async (req, respond) => {
    // only process GET /favicon.ico URL
    if (req.url !== '/favicon.ico' || req.method !== 'GET') {
      return
    }

    return respond(200, await icon, {
      'Content-Type': 'image/ico',
    })
  }
}
