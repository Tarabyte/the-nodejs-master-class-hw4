/**
 * Parse query string
 */
const { parse } = require('url')

module.exports = req => {
  // assign parsed query to req.query
  ;({ query: req.query } = parse(req.url, true))
}
