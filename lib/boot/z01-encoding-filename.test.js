const assert = require('assert')
const test = require('../util/test')

module.exports = async app => {
  await test.module('Encoding', async () => {
    const { db } = app

    const { TestEncoding } = await db.addCollection({
      name: 'testEncoding',
      idGenerator: item => item.name,
    })

    await test('Encoding id to filename', async () => {
      const name = '?/+=.,:!'
      const item = await TestEncoding.create({
        name,
      })

      assert.strictEqual(item._id, name)

      const exists = await TestEncoding.exists(name)

      assert(exists)

      const items = await TestEncoding.list()

      assert.deepStrictEqual(items, [name])
    })

    await TestEncoding.empty()
  })
}
