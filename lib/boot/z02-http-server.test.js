const assert = require('assert')
const test = require('../util/test')
/**
 * Test server is running
 */
module.exports = async app => {
  const { http } = app

  await test('Server is up', () => {
    assert(http)

    // do not block execution
    http.unref()
  })
}
