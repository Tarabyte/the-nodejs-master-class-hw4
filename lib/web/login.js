/**
 * login route handler
 */
const page = require('./page')

module.exports = page({
  main: 'login.html',
  head: {
    title: 'Log In',
  },
})
