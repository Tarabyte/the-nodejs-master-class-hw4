/**
 * Add hardcoded menu items
 */
module.exports = async app => {
  const {
    db: { Products },
  } = app

  const products = await Products.list()

  if (!products.length) {
    await Promise.all(
      [
        { name: 'Pepperoni', price: 20 },
        { name: 'Four Cheese', price: 25 },
        { name: 'BBQ Steak', price: 30 },
      ].map(pizza => Products.create(pizza))
    )
  }
}
