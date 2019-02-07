/**
 * Orders API
 */
const { authenticated } = require('./auth')
const {
  validator,
  required,
  string,
  optional,
  queryValidator,
} = require('./validate')
const compose = require('../util/compose')

module.exports = {
  /**
   * List current user orders
   * Or get order by id
   */
  get: compose(
    authenticated,
    queryValidator({
      id: optional(string),
    })
  )(async (req, respond) => {
    const {
      user,
      app: {
        db: { Users, Orders },
      },
      query: { id },
    } = req
    const { orders: ids = [] } = await Users.read(user)

    // single item
    if (id) {
      // this might be 403 as well :)
      if (!ids.includes(id)) {
        return respond(404, new Error(`Order ${id} does not exist`))
      }

      const order = await Orders.read(id)

      return respond(200, { order })
    }

    const orders = await Promise.all(ids.map(id => Orders.read(id)))

    return respond(200, { orders })
  }),

  /**
   * Checkout current user cart
   */
  post: compose(
    authenticated,
    validator({
      paymentToken: [required, string],
    })
  )(async (req, respond) => {
    const {
      user,
      body: { paymentToken },
      app: {
        Stripe,
        MailGun,
        db: { Users, Orders },
      },
    } = req

    const userId = Users.getId(user)

    const currentUser = await Users.read(userId)
    const { cart } = currentUser

    // unable to checkout empty cart
    if (!cart || !cart.items.length) {
      const error = new Error('Nothing to checkout')
      error.details = {
        cart: 'cart is empty',
      }

      return respond(400, error)
    }

    // compose order data
    const orderData = {
      userId,
      items: cart.items,
      createdAt: Date.now(),
    }

    // create order
    const order = await Orders.create(orderData)

    //checkout
    const total = order.items.reduce(
      (sum, item) => sum + item.value * item.price,
      0
    )

    const payment = await Stripe.charge(paymentToken, {
      amount: total,
      description: `Order ${order._id}`,
    })

    // save payment details
    const payedOrder = await Orders.patch(order._id, { payment: payment.id })

    try {
      // send message
      const message = await MailGun.send({
        to: `${user.name} <${user.email}>`,
        subject: `Order ${order._id}`,
        text: `
Hello, ${user.name}!

Order ${order._id} created.

Total price: \$${total}
`,
      })

      // save message details
      await Orders.patch(order._id, { message: message.id })
    } catch (e) {
      console.warn('Unable to send email')
    }

    // set user-order relation
    await Users.patch(userId, currentUser => ({
      ...currentUser,
      // empty cart
      cart: null,
      // keep order id
      orders: (currentUser.orders || []).concat(order._id),
    }))

    // send created order to client
    return respond(200, { order: payedOrder })
  }),
}
