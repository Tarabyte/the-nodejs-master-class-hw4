/**
 * Setup stripe integration
 */
const makeLogger = require('../debug')
const { fetch } = require('../util/fetch')

const debug = makeLogger('STRIPE', 'blue')

module.exports = async (app, config) => {
  const { stripe: stripeConfig } = config

  if (!stripeConfig) {
    debug('Skipping stripe setup. No stripe config found')
    return
  }

  debug('Setting up stripe integration %j', stripeConfig)

  const { key } = stripeConfig

  if (!key) {
    throw new Error('Illegal stripe config. "key" is required')
  }

  const { post } = fetch({
    secure: true,
    host: 'api.stripe.com',
    headers: {
      Authorization: `Bearer ${key}`,
    },
  })

  app.Stripe = {
    /**
     * Creates a charge
     * order.amount - amount to charge
     * [order.currency] - currency (usd)
     * @param {String} token Card token
     * @param {Object} order Order details
     */
    async charge(token, order = {}) {
      if (!token) {
        throw new Error('token is required')
      }

      const { amount, currency = 'usd', description, ...details } = order

      if (typeof amount !== 'number') {
        throw new Error('order.amount is required number')
      }

      const chargeAmount = amount.toFixed(2) * 100

      // fire the request
      const { statusCode, data: charge } = await post({
        path: '/v1/charges',
        form: {
          source: token,
          amount: chargeAmount,
          currency,
          description,
          ...details,
        },
      })

      // successful charge
      if (statusCode === 200) {
        return charge
      }

      const error = new Error('Unable to charge')

      error.statusCode = statusCode
      error.details = charge

      throw error
    },
  }
}
