/**
 * Profile route handler
 */
const page = require('./page')
const authenticated = require('./authenticated')

module.exports = authenticated(
  page({
    main: 'profile.html',
    head: {
      title: 'Profile',
      description: '',
    },
  })
)
