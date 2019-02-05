/**
 * login route handler
 */
const page = require('./page')

module.exports = page({
  main: 'login.html',
  head: {
    title: 'Log In',
    description: 'Please enter your email and passord to continue.',
  },
})
