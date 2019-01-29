/**
 * Shopping Cart API
 */
const { authenticated } = require('./auth')
const {
  validator,
  required,
  string,
  number,
  queryValidator,
} = require('./validate')
const compose = require('../util/compose')

const productIsAvailable = next => async (req, respond) => {
  const {
    app: {
      db: { Products },
    },
  } = req
  const productId = req.query.productId || req.body.productId

  const product = await Products.read(productId)

  if (!product) {
    const error = new Error('Product does not exist')
    error.details = {
      productId,
    }

    return respond(422, error)
  }

  req.product = product

  return next(req, respond)
}

module.exports = {
  /**
   * Add or replace item to current user cart
   */
  post: compose(
    authenticated,
    validator({
      productId: [required, string],
      value: [required, number],
    }),
    productIsAvailable
  )(async (req, respond) => {
    const {
      app: {
        db: { Users },
      },
      body: { productId, value },
      user,
      product,
    } = req

    // patch user.cart or create new
    const updatedUser = await Users.patch(Users.getId(user), currentUser => {
      const {
        cart = {
          items: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      } = currentUser

      const updatedCart = {
        ...cart,
        updatedAt: Date.now(),
        // add item to the items list copying current price
        items: [
          ...cart.items.filter(item => item.productId !== productId),
          { productId, value, price: product.price },
        ],
      }

      return { ...currentUser, cart: updatedCart }
    })

    return respond(200, updatedUser.cart)
  }),

  /**
   * Remove item from the cart
   */
  delete: compose(
    authenticated,
    queryValidator({
      productId: [required, string],
    })
  )(async (req, respond) => {
    const {
      user,
      query: { productId },
      app: {
        db: { Users },
      },
    } = req

    const updatedUser = await Users.patch(Users.getId(user), currentUser => {
      const { cart } = currentUser

      return {
        ...currentUser,
        cart: {
          ...cart,
          modifiedAt: Date.now(),
          items: cart.items.filter(item => item.productId !== productId),
        },
      }
    })

    return respond(200, updatedUser)
  }),
}
