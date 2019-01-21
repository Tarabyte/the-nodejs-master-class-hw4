const config = require('./lib/config')
const app = require('./lib/app')

// launch application w/ the config
app.start(config).catch(e => {
  console.error('Unable to start application', e)

  // terminate the process w/ error code
  process.exit(-1)
})
