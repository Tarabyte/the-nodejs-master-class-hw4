/**
 * Test checkout API
 */
const assert = require('assert')
const { fetch } = require('../util/fetch')
const test = require('../util/test')

module.exports = async (app, config) => {
  const {
    db: { Users, Products, Orders },
  } = app

  const {
    http: { port },
    mailgun: { testEmail },
  } = config

  await test.module(
    'Orders API Test',
    async ({ user, token, products }) => {
      const { post: checkout, get: list } = fetch({
        port,
        path: '/orders',
        headers: {
          token,
        },
      })

      await test('No payment token', async () => {
        const { statusCode } = await checkout({
          data: {},
        })

        assert.strictEqual(statusCode, 422)
      })

      await test(
        'Successful checkout',
        async () => {
          const { statusCode, data } = await checkout({
            data: {
              paymentToken: 'tok_visa',
            },
          })

          assert.strictEqual(statusCode, 200, data.message)

          const order = await Orders.read(data.order._id)

          assert(order)

          const dbUser = await Users.read(user.id)

          assert(Array.isArray(dbUser.orders))
          assert.strictEqual(dbUser.orders.length, 1)
          assert.strictEqual(dbUser.orders[0], data.order._id)
        },
        { timeout: 5000 }
      )

      await test('Get orders', async () => {
        const { statusCode, data } = await list()

        assert.strictEqual(statusCode, 200, data.message)

        const dbUser = await Users.read(user.id)

        const orders = await Promise.all(
          dbUser.orders.map(id => Orders.read(id))
        )

        assert.deepStrictEqual(data.orders, orders)
      })

      await test('Getting non existent order', async () => {
        const { statusCode, data } = await list({
          query: { id: 'not in there' },
        })

        assert.strictEqual(statusCode, 404, data.mess)
      })

      await test('Get order by id', async () => {
        const {
          orders: [id],
        } = await Users.read(user.id)

        assert(id, 'No orders')

        const { statusCode, data } = await list({
          query: {
            id,
          },
        })

        assert.strictEqual(statusCode, 200, data.message)
      })
    },
    {
      async setup() {
        const credentials = {
          email: testEmail,
          password: 'aaaaaa',
        }
        const userData = {
          ...credentials,
          name: 'Testing Checkout Api',
          address: 'Some address',
        }

        // create user
        const { statusCode: userCreated, data: user } = await fetch({
          port,
          path: '/users',
        }).post({
          data: userData,
        })

        assert.strictEqual(userCreated, 200, user.message)

        // login
        const {
          statusCode: tokenCreated,
          data: { id: token },
        } = await fetch({
          port,
          path: '/tokens',
        }).post({ data: credentials })

        assert.strictEqual(tokenCreated, 200, 'Failed to login')

        const products = await Products.all()

        // add products
        const { post: addItem } = fetch({
          port,
          path: '/cart',
          headers: { token },
        })

        function* enumerate(iterator) {
          let index = 0
          for (const item of iterator) {
            yield { index: index++, item }
          }
        }

        // add all products
        for (const { index, item } of enumerate(products)) {
          const { statusCode: productAdded } = await addItem({
            data: {
              productId: item.id,
              value: index + 1,
            },
          })

          assert.strictEqual(productAdded, 200)
        }

        return {
          user,
          token,
          products,
        }
      },
      async teardown() {
        if (await Users.exists(testEmail)) {
          await Users.removeById(testEmail)
        }
      },
    }
  )
}
