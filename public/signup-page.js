import app, { AjaxFormElement } from '/public/app.js'

customElements.define(
  'signup-form',
  class extends AjaxFormElement {
    async onOk(_, data) {
      const credentials = {
        email: data.email,
        password: data.password,
      }

      await app.logIn(credentials)

      window.location.replace('/')
    }
  },
  {
    extends: 'form',
  }
)
