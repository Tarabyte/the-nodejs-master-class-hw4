/**
 * Auth related helpers
 */
const crypto = require('crypto')
const config = require('../config')

const hash = str =>
  crypto
    .createHmac('sha256', config.secret)
    .update(str)
    .digest('hex')

const authenticated = next => (req, respond) => {
  const { user } = req

  if (!user) {
    return respond(401, new Error('Token is missing or expired'))
  }

  return next(req, respond)
}

module.exports = {
  hash,
  authenticated,
}
