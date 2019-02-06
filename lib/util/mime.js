/**
 * Infer mime type be extension
 */
const { extname } = require('path')

const types = {
  'text/plain': ['html', 'txt'],
  'image/jpeg': ['jpg', 'jpeg', 'jpe'],
  'image/ico': ['ico', 'icon'],
  'image/png': ['png'],
  'text/javascript': ['js'],
  'application/json': ['json'],
  'text/css': ['css'],
}

// transpose types to exts
const exts = Object.entries(types).reduce(
  (all, [type, exts]) =>
    exts.reduce((all, ext) => ((all[ext] = type), all), all),
  Object.create(null)
)

const unknown = file => {
  throw new Error(`Unable to extract mime type for ${file}`)
}

// lookup mime type by file extension
module.exports = file =>
  exts[
    extname(file)
      .substr(1)
      .toLowerCase()
  ] || unknown(file)
