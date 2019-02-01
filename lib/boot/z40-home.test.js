/**
 * Test home route
 */
const assert = require('assert')
const test = require('../util/test')
const { fetch } = require('../util/fetch')

module.exports = async (app, config) => {
  await test.module('Web: Index', async () => {
    const { get } = fetch({
      port: config.http.port,
      path: '/',
    })

    await test('should be 200', async () => {
      const { statusCode } = await get()
      assert.strictEqual(statusCode, 200)
    })
  })
}
