/**
 * logout route handler
 */
const page = require('./page')

module.exports = page({
  main: 'logout.html',
  head: {
    title: 'See You',
  },
})
