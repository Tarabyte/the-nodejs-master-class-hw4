/**
 * Promisifyed listen
 */

module.exports = (server, options) =>
  new Promise((resolve, reject) => {
    // handle error event to avoid async exception
    server.on('error', reject)

    server.listen(options, e => {
      if (e) {
        // this should be handled, but...
        reject(e)
      } else {
        resolve(server)
      }
    })
  })
