/**
 * Test Menu API
 */
const assert = require('assert')

const test = require('../util/test')
const { fetch } = require('../util/fetch')

module.exports = async (app, config) => {
  const {
    db: { Products },
  } = app

  const users = fetch({ path: '/users', port: config.http.port })
  const menu = fetch({ path: '/products', port: config.http.port })
  const tokens = fetch({ path: '/tokens', port: config.http.port })

  await test.module('Menu API', async () => {
    await test('Only authenticated users can get products', async () => {
      const { statusCode } = await menu.get()

      assert.strictEqual(statusCode, 401)
    })

    await test('Should return list of products', async () => {
      const credentials = {
        email: 'testingproductslist@gmail.com',
        password: 'affafaf',
      }

      // create user
      const { statusCode: userCreated } = await users.post({
        data: {
          ...credentials,
          name: 'Joe',
          address: 'Elm, 20',
        },
      })

      assert.strictEqual(userCreated, 200)

      // create token
      const {
        statusCode: tokenCreated,
        data: { id: token },
      } = await tokens.post({
        data: {
          ...credentials,
        },
      })

      assert.strictEqual(tokenCreated, 200)

      // list menu items
      const {
        statusCode: menuItemsListed,
        data: { products },
      } = await menu.get({
        headers: {
          token,
        },
      })

      assert.strictEqual(menuItemsListed, 200)

      const productsFromDB = await Promise.all(
        (await Products.list()).map(id => Products.read(id))
      )

      assert.deepStrictEqual(products, productsFromDB)
    })
  })
}
