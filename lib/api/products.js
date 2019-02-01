/**
 * Products API
 */
const { authenticated } = require('./auth')

module.exports = {
  get: authenticated(async (req, respond) => {
    const {
      app: {
        db: { Products },
      },
    } = req

    const products = await Products.all()

    return respond(200, { products })
  }),
}
