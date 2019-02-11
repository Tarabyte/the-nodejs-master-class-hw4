/**
 * Test shopping cart API
 */
const assert = require('assert')
const test = require('../util/test')
const { fetch } = require('../util/fetch')

module.exports = async (app, config) => {
  const {
    db: { Users, Products },
  } = app

  const {
    http: { port },
  } = config

  await test.module(
    'Shopping Cart API',
    async ({ user, products, token }) => {
      const { post: addItem, delete: removeItem, get: getCart } = fetch({
        path: '/api/cart',
        port,
        headers: {
          token,
        },
      })

      const [product1, product2] = products

      await test('Adding item to shopping cart', async () => {
        const { statusCode, data } = await addItem({
          data: {
            productId: product1.id,
            value: 1,
          },
        })

        assert.strictEqual(statusCode, 200)

        assert.deepStrictEqual(data.items[0], {
          productId: product1.id,
          price: product1.price,
          value: 1,
        })
      })

      await test('Adding second item to shopping cart', async () => {
        const { statusCode, data } = await addItem({
          data: {
            productId: product2.id,
            value: 1,
          },
        })

        assert.strictEqual(statusCode, 200)

        assert.deepStrictEqual(data.items[1], {
          productId: product2.id,
          price: product2.price,
          value: 1,
        })
      })

      await test('Adding same item to shopping cart twice', async () => {
        const { statusCode, data } = await addItem({
          data: {
            productId: product1.id,
            value: 3,
          },
        })

        assert.strictEqual(statusCode, 200, data)

        assert.deepStrictEqual(data.items, [
          { productId: product1.id, price: product1.price, value: 3 },
          { productId: product2.id, price: product2.price, value: 1 },
        ])
      })

      await test('Removing item from shopping cart', async () => {
        const { statusCode, data } = await removeItem({
          query: {
            productId: product1.id,
          },
        })

        assert.strictEqual(statusCode, 200, data.message)

        const { cart } = await Users.read(user.id)

        assert.deepStrictEqual(cart.items, [
          { productId: product2.id, price: product2.price, value: 1 },
        ])
      })

      await test('Negative values', async () => {
        const { statusCode, data } = await addItem({
          data: {
            productId: product1.id,
            value: -1,
          },
        })

        assert.strictEqual(statusCode, 422, data.message)
      })

      await test('Float values', async () => {
        const { statusCode, data } = await addItem({
          data: {
            productId: product1.id,
            value: 1.22,
          },
        })

        assert.strictEqual(statusCode, 422, data.message)
      })

      await test('Users api should return user cart', async () => {
        const { statusCode, data } = await fetch({
          path: '/api/users',
          port,
          headers: {
            token,
          },
          query: {
            id: user.id,
          },
        }).get()

        assert.strictEqual(statusCode, 200)

        const userFromDb = await Users.read(user.id)

        assert.deepStrictEqual(data.cart, userFromDb.cart)
      })

      await test('Getting user cart', async () => {
        const { statusCode, data } = await getCart()

        assert.strictEqual(statusCode, 200)
      })
    },
    {
      async setup() {
        const credentials = {
          email: 'testing-shopping-cart-api@gmail.com',
          password: 'aaaaaaa',
        }
        const userData = {
          ...credentials,
          name: 'Test Shopping Cart',
          address: 'Elm st, 20',
        }

        const { statusCode: userCreated, data: user } = await fetch({
          path: '/api/users',
          port,
        }).post({
          data: userData,
        })

        assert.strictEqual(userCreated, 200, 'Failed to create user')

        const {
          data: { id: token },
        } = await fetch({
          path: '/api/tokens',
          port,
        }).post({
          data: credentials,
        })

        const products = await Products.all()

        return {
          user,
          token,
          products,
        }
      },

      async teardown() {
        await Users.removeById('testing-shopping-cart-api@gmail.com')
      },
    }
  )
}
