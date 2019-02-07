/**
 * Shopping cart checkout route handler
 */
const page = require('./page')
const authenticated = require('./authenticated')

module.exports = authenticated(
  page({
    main: 'checkout.html',
    head: {
      title: 'Checkout',
      description: 'Create order',
    },
  })
)
