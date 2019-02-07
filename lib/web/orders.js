/**
 * Orders route handler
 */
const page = require('./page')
const authenticated = require('./authenticated')

module.exports = authenticated(
  page({
    main: 'orders.html',
    head: {
      title: 'Orders',
      description: '',
    },
  })
)
