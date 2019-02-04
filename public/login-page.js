import app, { AjaxFormElement } from '/public/app.js'

customElements.define(
  'login-form',
  class extends AjaxFormElement {
    onOk() {
      window.location.replace('/')
    }

    // use logIn function to make request for us
    request(credentials) {
      return app.logIn(credentials)
    }
  },
  {
    extends: 'form',
  }
)
