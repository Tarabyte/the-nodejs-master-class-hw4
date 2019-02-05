/**
 * Home route handler
 */
const page = require('./page')

module.exports = page({
  main: 'index.html',
  head: {
    title: 'Home',
    description: 'Welcome to Pizza Delivery Club fast pizza delivery',
  },
})
