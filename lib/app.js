const debug = require('./debug')('*', 'green')

const app = {
  start(config) {
    debug('Up and running')
  },
}

module.exports = app
