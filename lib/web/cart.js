/**
 * Shopping cart route handler
 */
const page = require('./page')
const authenticated = require('./authenticated')

module.exports = authenticated(
  page({
    main: 'cart.html',
    head: {
      title: 'Cart',
      description: 'Shopping cart',
    },
  })
)
