import { AjaxFormElement, callAPI, Maybe } from '/public/app.js'

// Checkout form logic
customElements.define(
  'checkout-form',
  class extends AjaxFormElement {
    onOk() {
      Maybe.of(this.querySelector('.form-success-message')).then(el => {
        el.textContent = 'Order Successfully Created'

        // redirect to orders page
        setTimeout(() => {
          window.location.assign('/orders')
        }, 5000)
      })
    }

    async request() {
      const method = this.getAttribute('method')
      const url = this.getAttribute('action')

      // find card element
      const card = this.querySelector('stripe-card')

      // create paymentToken
      const token = await card.createToken()

      return callAPI(url, {
        method,
        data: {
          paymentToken: token.id,
        },
      })
    }
  },
  { extends: 'form' }
)

const loadStripe = () =>
  new Promise(resolve => {
    if (window.Stripe) {
      resolve(window.Stripe)
    }

    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'

    script.onload = () => {
      resolve(window.Stripe)
    }

    document.head.appendChild(script)
  })

const uniqueId = (i => () => `stripe-card-${i++}`)(0)

// stripe card input element
customElements.define(
  'stripe-card',
  class extends HTMLElement {
    get apiKey() {
      return this.getAttribute('api-key')
    }

    constructor(...args) {
      super(...args)

      // create node to mount card to
      const target = document.createElement('div')
      this.mount = uniqueId()
      target.setAttribute('id', this.mount)

      this.appendChild(target)
    }

    createToken() {
      return Promise.reject(new Error('Not initialized'))
    }

    async connectedCallback() {
      const Stripe = await loadStripe()

      const client = Stripe(this.apiKey)

      const card = client.elements().create('card', {})

      card.mount(`#${this.mount}`)

      // make create token function public
      this.createToken = async () => {
        const result = await client.createToken(card)

        if (result.error) {
          throw new Error('Unable to process payment')
        }

        return result.token
      }
    }
  }
)
