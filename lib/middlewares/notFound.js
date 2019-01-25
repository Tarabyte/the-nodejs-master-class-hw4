/**
 * Respond 404
 */

module.exports = (req, res) => res(404, new Error(`Incorrect url ${req.url}`))
