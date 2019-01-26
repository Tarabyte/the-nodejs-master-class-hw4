/**
 * Test stripe integration
 */
const assert = require('assert')
const test = require('../util/test')

module.exports = async app => {
  await test.module('Stripe Integration', async () => {
    await test('App has stripe object', async () => {
      assert(app.Stripe, 'Stripe service is not defined')
    })

    await test(
      'Create successful charge',
      async () => {
        const token = 'tok_visa'
        const order = {
          amount: 9.99,
        }

        const charge = await app.Stripe.charge(token, order)

        assert(charge.id, 'Incorrect charge id')
        assert.strictEqual(charge.amount, 999)
        assert.strictEqual(charge.currency, 'usd')
      },
      // extend timeout to 5 seconds
      { timeout: 5000 }
    )
  })
}
