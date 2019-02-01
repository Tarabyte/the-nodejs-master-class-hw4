/**
 * Home route handler
 */
const page = require('./page')

module.exports = page({
  main: 'index.html',
  head: {
    title: 'Pizza Delivery Club',
  },
})
