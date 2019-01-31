/**
 * Static middleware test
 */
const assert = require('assert')
const test = require('../util/test')
const { readFile } = require('../util/fs')
const { fetch } = require('../util/fetch')

module.exports = async (app, config) => {
  const { get: loadFile, post } = fetch({
    port: config.http.port,
  })

  await test.module('Serving static files', async () => {
    await test('Should return 405 if method is not get', async () => {
      const { statusCode } = await post({
        path: '/public/logo.jpg',
      })

      assert.strictEqual(statusCode, 405)
    })

    await test('Should return 404 if file not found', async () => {
      const { statusCode } = await post({
        path: '/public/not_in_there.jpg',
      })

      assert.strictEqual(statusCode, 405)
    })

    await test('Should not escape root folder', async () => {
      const { statusCode } = await loadFile({
        path: '/public/../lib/app.js',
      })

      assert.strictEqual(statusCode, 403)
    })

    await test('Can load logo.jpg', async () => {
      const { statusCode, headers, data } = await loadFile({
        path: '/public/logo.jpg',
      })

      assert.strictEqual(statusCode, 200)

      assert.strictEqual(headers['content-type'], 'image/jpeg')

      const logoFromFS = await readFile('public/logo.jpg', 'utf-8')

      assert.strictEqual(data, logoFromFS)
    })
  })
}
