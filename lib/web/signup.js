/**
 * Signup route handler
 */
const page = require('./page')

module.exports = page({
  main: 'signup.html',
  head: {
    title: 'Sign Up',
  },
})
