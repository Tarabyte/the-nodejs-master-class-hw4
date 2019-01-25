/**
 * Request utility
 */
const { request } = require('http')
const { stringify } = require('querystring')

module.exports = (options = {}) =>
  new Promise((resolve, reject) => {
    const {
      path = '/',
      host = 'localhost',
      method = 'GET',
      headers = {},
      query,
      data,
      ...moreOptions
    } = options

    const body = data !== undefined ? JSON.stringify(data) : ''

    // send body as json
    if (body) {
      headers['Content-Type'] = 'application/json'
      headers['Content-Length'] = Buffer.byteLength(body)
    }

    // add search params
    const finalPath = query ? `${path}?${stringify(query)}` : path

    const req = request(
      {
        path: finalPath,
        host,
        method,
        headers,
        ...moreOptions,
      },
      res => {
        const { statusCode, headers } = res
        const buffer = []
        res.setEncoding('utf-8')

        res.on('error', reject)

        // collect data to buffer
        res.on('data', chunk => buffer.push(chunk))

        res.on('end', () => {
          resolve({
            statusCode,
            headers,
            req,
            res,
            data: buffer.length ? JSON.parse(buffer.join('')) : null,
          })
        })
      }
    )

    // catch
    req.on('error', reject)

    // send body
    body && req.write(body)
    req.end()
  })
