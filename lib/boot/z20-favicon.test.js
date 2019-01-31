/**
 * Test favicon
 */
const assert = require('assert')
const { fetch } = require('../util/fetch')
const test = require('../util/test')
const { readFile } = require('../util/fs')

module.exports = async (app, config) => {
  const { get: getFavicon } = fetch({
    port: config.http.port,
    path: '/favicon.ico',
  })

  await test.module('Favicon', async () => {
    await test('Can load favicon', async () => {
      const { statusCode, headers } = await getFavicon()

      assert.strictEqual(statusCode, 200)

      assert.strictEqual(headers['content-type'], 'image/ico')
    })

    await test('Got public/favicon.ico content', async () => {
      const { data: ico } = await getFavicon()

      const icoFromFile = await readFile('public/favicon.ico')

      assert.strictEqual(ico, icoFromFile.toString())
    })
  })
}
