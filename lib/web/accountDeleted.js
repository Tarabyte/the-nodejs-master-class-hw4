/**
 * Account deleter route handler
 */
const page = require('./page')

module.exports = page({
  main: 'account-deleted.html',
  head: {
    title: 'Account Delete',
    description: 'Sorry',
  },
})
