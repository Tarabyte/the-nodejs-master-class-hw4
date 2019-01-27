const assert = require('assert')
const test = require('../util/test')
/**
 * Test server is running
 */
module.exports = async app => {
  const { http } = app

  // do not block execution
  if (http) {
    http.unref()
  }

  await test.module('HTTP server', async () => {
    await test('Server is up', () => {
      assert(http, 'HTTP server was not configured')
    })
  })
}
