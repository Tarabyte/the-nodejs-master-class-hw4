/**
 * Body parser middleware that handles application/json bodies.
 */
const { StringDecoder } = require('string_decoder')

// collect and parse incomming data
const collect = async req =>
  new Promise((resolve, reject) => {
    const decoder = new StringDecoder('utf-8')
    const buffer = []

    // request might be interrupted
    req.on('error', reject)

    // parse a chunk of data
    req.on('data', data => buffer.push(decoder.write(data)))

    req.on('end', () => {
      // push last piece of data
      buffer.push(decoder.end())

      resolve(buffer.join(''))
    })
  })

module.exports = async (req, respond) => {
  const contentType = req.headers['content-type']

  // only parse application json
  if (contentType !== 'application/json') {
    return
  }

  const contentLength = parseInt(req.headers['content-length'], 10)

  // only parse if correct content length were specified
  if (Number.isNaN(contentLength)) {
    return respond(400, new Error('Incorrect Content-Length header'))
  }

  const data = await collect(req)

  try {
    req.body = JSON.parse(data)
  } catch (e) {
    return respond(400, new Error('Unable to parse request payload'))
  }
}
