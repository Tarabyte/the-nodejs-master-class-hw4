import {
  AjaxTableElement,
  AjaxFormElement,
  ValidationError,
  callAPI,
} from '/public/app.js'

// product table
customElements.define('products-table', class extends AjaxTableElement {}, {
  extends: 'table',
})

// shopping cart table
customElements.define('shopping-cart-table', AjaxTableElement, {
  extends: 'table',
})

// add to cart form
customElements.define(
  'add-to-cart-form',
  class extends AjaxFormElement {
    onOk(response) {
      // reload shopping cart
      document.querySelector('table[is=shopping-cart-table]').reload()
    }

    getData() {
      const data = super.getData()

      const { value } = data

      const numValue = parseInt(value)

      if (Number.isNaN(numValue)) {
        throw new ValidationError('Value should be a number')
      }

      return { ...data, value: numValue }
    }
  },
  {
    extends: 'form',
  }
)

// actions
// Actions Form
customElements.define(
  'cart-actions-form',
  class extends AjaxFormElement {
    onOk() {
      // reload shopping cart
      this.closest('table[is=shopping-cart-table]').reload()
    }

    getData() {
      const { action, value, productId } = super.getData()

      const numValue = parseInt(value)

      if (Number.isNaN(numValue)) {
        throw new Error('value should be number')
      }

      switch (action) {
        case 'add':
          return { productId, value: numValue + 1 }

        case 'remove':
          return { productId, value: numValue - 1 }

        case 'clear':
          return { productId, value: 0 }
        default:
          throw new Error(`Unsupported action ${action}`)
      }
    }

    request(data) {
      const { value, productId } = data
      const action = this.getAttribute('action')

      // still some items left
      if (value > 0) {
        return callAPI(action, {
          method: 'POST',
          data,
        })
      }

      // remove entire row
      return callAPI(action, {
        method: 'DELETE',
        query: {
          productId,
        },
      })
    }
  },
  { extends: 'form' }
)

// button that set form action
customElements.define(
  'cart-action-button',
  class extends HTMLButtonElement {
    get action() {
      return this.getAttribute('action')
    }

    constructor(...args) {
      super(...args)

      this.addEventListener('click', () => {
        this.closest(
          'form[is=cart-actions-form]'
        ).elements.action.value = this.action
      })
    }
  },
  { extends: 'button' }
)
