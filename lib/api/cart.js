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
  gte,
  integer,
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

const sortByProduct = items => items.sort((a, b) => a.productId > b.productId)
const emptyCart = () => ({
  items: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
})

module.exports = {
  /**
   * Add or replace item to current user cart
   */
  post: compose(
    authenticated,
    validator({
      productId: [required, string],
      value: [required, number, gte(1), integer],
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
      const { cart = emptyCart() } = currentUser

      const updatedCart = {
        ...cart,
        updatedAt: Date.now(),
        // add item to the items list copying current price
        items: sortByProduct([
          ...cart.items.filter(item => item.productId !== productId),
          { productId, value, price: product.price },
        ]),
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

    return respond(200, updatedUser.cart)
  }),

  /**
   * Get current user cart
   */
  get: authenticated(async (req, respond) => {
    const {
      user,
      app: {
        db: { Users, Products },
      },
    } = req

    const { cart } = await Users.read(user)

    if (!cart) {
      return respond(200, emptyCart())
    }

    // join products
    cart.items = await Promise.all(
      cart.items.map(async item => {
        const product = await Products.read(item.productId)

        return {
          ...item,
          product,
        }
      })
    )

    return respond(200, cart)
  }),

  /**
   * Update product entry by value
   */
  patch: compose(
    authenticated,
    queryValidator({
      productId: [required, string],
    }),
    validator({
      value: [required, number, integer],
    }),
    productIsAvailable
  )(async (req, respond) => {
    const {
      user,
      query: { productId },
      body: { value },
      product,
      app: {
        db: { Users },
      },
    } = req

    const { cart } = await Users.patch(Users.getId(user), currentUser => {
      const cart = currentUser.cart || emptyCart()

      const exist = cart.items.find(item => item.productId === productId)

      return {
        ...currentUser,
        cart: {
          ...cart,
          modifiedAt: Date.now(),
          // update item by value or insert new
          items: sortByProduct(
            exist
              ? cart.items.map(item =>
                  item === exist
                    ? {
                        ...item,
                        value: item.value + value,
                      }
                    : item
                )
              : [...cart.items, { productId, value, price: product.price }]
          ),
        },
      }
    })

    return respond(200, cart)
  }),
}
