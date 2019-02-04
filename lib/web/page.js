/**
 * Default page layout
 */
const template = require('../util/template')

// call root layout template
const layout = (...args) => template('templates/layout.html', ...args)

module.exports = (data, helpers, headers) => async (req, respond) =>
  respond(
    200,
    await layout(
      {
        req,
        // web app related config
        config: { ...req.app.config.web },
        ...(typeof data === 'function' ? data(req) : data),
      },
      typeof helpers === 'function' ? helpers(req) : helpers
    ),
    {
      'Content-Type': 'text/html',
      ...(typeof headers === 'function' ? headers(req) : headers),
    }
  )
