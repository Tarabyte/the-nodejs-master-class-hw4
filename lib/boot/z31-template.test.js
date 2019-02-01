/**
 * Test template engine
 */
const assert = require('assert')
const test = require('../util/test')
const template = require('../util/template')

module.exports = async (app, config) => {
  await test.module('Template', async () => {
    await test('Basic template loading and interpolation', async () => {
      const tmpl = await template('templates/tests/test_101.html')

      assert.strictEqual(typeof tmpl, 'function')

      assert.strictEqual(await tmpl({ test: 'Test' }), 'Test')
    })

    await test('Including template', async () => {
      const tmpl = await template('templates/tests/test_including.html')

      assert.strictEqual(await tmpl({ test: 'test' }), 'include - test')
    })

    await test('Simultaneous rendering', async () => {
      assert.strictEqual(
        await template('templates/tests/test_101.html', { test: 'Something' }),
        'Something'
      )
    })
  })
}
