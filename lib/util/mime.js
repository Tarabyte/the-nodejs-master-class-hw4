/**
 * Infer mime type be extension
 */
const { extname } = require('path')

const types = {
  'text/plain': ['html', 'txt'],
  'image/jpeg': ['jpg', 'jpeg', 'jpe'],
  'image/ico': ['ico', 'icon'],
}

// transpose types to exts
const exts = Object.entries(types).reduce(
  (all, [type, exts]) =>
    exts.reduce((all, ext) => ((all[ext] = type), all), all),
  Object.create(null)
)

// lookup mime type by file extension
module.exports = file =>
  exts[
    extname(file)
      .substr(1)
      .toLowerCase()
  ]
