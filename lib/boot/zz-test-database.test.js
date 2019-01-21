const assert = require('assert')
const test = require('../util/test')

/**
 * Run various DB related tests
 */
module.exports = async (app, config) => {
  const { db } = app

  assert(db, 'DB was not initialized')

  await db.addCollection({ name: 'tests' })

  const { Tests } = db

  assert(Tests, 'Tests collection was not attached')

  await test('Collection is empty', async () => {
    // clean colletion
    await Tests.empty()

    // list items
    const items = await Tests.list()
    assert.deepStrictEqual(items, [])
  })

  await test('Exist returns false for non existent items', async () => {
    // check not exists
    const notThere = await Tests.exists('not-there')
    assert(!notThere)
  })

  await test('Item creation', async () => {
    // create new item
    const item = await Tests.create({
      name: 'test',
    })

    assert(item._id, 'Id was not specified')

    // check exists
    assert(await Tests.exists(item._id))
  })

  await test('List returns created items', async () => {
    await Tests.empty()

    const item1 = await Tests.create({
      name: 'test1',
    })

    const item2 = await Tests.create({
      name: 'test2',
    })

    const items = await Tests.list()

    assert.deepStrictEqual(items.sort(), [item1._id, item2._id].sort())
  })

  await test('Item updating', async () => {
    const item = await Tests.create({
      name: 'test-updating',
    })

    assert(await Tests.exists(item._id))

    item.name = 'modified'

    await Tests.update(item)

    // read item
    const itemFromDisk = await Tests.read(item._id)

    // different items
    assert(item !== itemFromDisk)

    // same contents
    assert.deepStrictEqual(item, itemFromDisk)
  })

  await test('Item removing', async () => {
    const item = await Tests.create({
      name: 'to be removed',
    })

    const exists = await Tests.exists(item._id)
    assert(exists)

    // remove
    await Tests.removeById(item._id)

    const notExists = await Tests.exists(item._id)
    assert(!notExists)
  })

  await test('Creating w/ the same id should fail', async () => {
    const item = await Tests.create({
      name: 'duplicate id',
    })

    try {
      await Tests.create(item)
      assert.fail('Should never reach here')
    } catch (e) {
      assert(e)
    }
  })

  await Tests.empty()
}
