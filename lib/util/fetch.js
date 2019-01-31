/**
 * Request utility
 */
const http = require('http')
const https = require('https')
const { stringify } = require('querystring')

const identity = str => str
const json = JSON.parse

const fetch = (options = {}) =>
  new Promise((resolve, reject) => {
    const {
      path = '/',
      host = 'localhost',
      method = 'GET',
      headers: originalHeaders = {},
      query,
      data,
      form,
      secure = false,
      ...moreOptions
    } = options

    if (data && form) {
      reject(new Error('Unable to send data and form simultaneously'))
      return
    }

    let body = ''
    // copy headers we are going to mutate them
    const headers = { ...originalHeaders }

    // send data as json
    if (typeof data === 'object') {
      body = JSON.stringify(data)
      headers['Content-Type'] = 'application/json'
    }

    // send form as x-www-form-urlencoded
    if (typeof form === 'object') {
      body = stringify(form)
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
    }

    if (body) {
      headers['Content-Length'] = Buffer.byteLength(body)
    }

    // add search params
    const finalPath = query ? `${path}?${stringify(query)}` : path

    const { request } = secure ? https : http

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
          const contentType = headers['content-type']

          const parse = contentType.endsWith('/json') ? json : identity

          let data = null
          if (buffer.length) {
            try {
              data = parse(buffer.join(''))
            } catch (e) {
              return reject(e)
            }
          }

          resolve({
            statusCode,
            headers,
            req,
            res,
            data,
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

// methods
fetch.fetch = defaultOptions =>
  ['get', 'post', 'put', 'delete'].reduce(
    (methods, name) => (
      (methods[name] = options =>
        fetch({
          ...defaultOptions,
          method: name.toUpperCase(),
          ...options,
        })),
      methods
    ),
    Object.create(null)
  )

module.exports = fetch
