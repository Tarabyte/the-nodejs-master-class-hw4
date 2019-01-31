/**
 * Serve static files
 */
const { accessSync, constants, createReadStream } = require('fs')
const path = require('path')
const { open, close } = require('../util/fs')
const mime = require('../util/mime')

module.exports = (dir, alias = dir) => {
  const fullDirectoryPath = path.resolve(process.cwd(), dir)

  // ensure dir exists
  accessSync(fullDirectoryPath, constants.R_OK)

  // url prefix to handle
  const prefix = `/${alias}/`

  return async (req, respond) => {
    // check if url is our url
    if (!req.url.startsWith(prefix)) {
      return
    }

    // if someone is asking for options :)
    if (req.method === 'OPTIONS') {
      return respond(204, null, { Allow: 'GET' })
    }

    // only serve GET requests
    if (req.method !== 'GET') {
      return respond(405, new Error('Method not allowed'), { Allow: 'GET' })
    }

    // normalize path
    const lookupPath = path.join(
      fullDirectoryPath,
      req.url.replace(new RegExp(`^${prefix}`, 'g'), '')
    )

    // check user does not trying to escape the directory
    if (!lookupPath.startsWith(fullDirectoryPath)) {
      return respond(403, new Error('Access denied'))
    }

    let fd = null
    try {
      // open descriptor to check we have read access
      fd = await open(lookupPath, 'r')

      // create read strem
      const readingFile = createReadStream(lookupPath, { fd })

      // pipe the stream
      return respond(200, readingFile, { 'Content-Type': mime(lookupPath) })
    } catch (e) {
      // on error close the descriptor
      if (fd) {
        await close(fd)
      }

      // respond 404 if no file found
      if (e.code === 'ENOENT') {
        return respond(404, new Error('File not found'))
      }

      // rethrow for further processing
      throw e
    }
  }
}
