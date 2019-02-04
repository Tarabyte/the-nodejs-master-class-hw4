import app, { AjaxFormElement } from '/public/app.js'

customElements.define(
  'logout-form',
  class extends AjaxFormElement {
    request() {
      return app.logOut()
    }

    onOk() {
      window.location.assign('/logout')
    }

    onFail() {
      alert('Unable to logout')
    }
  },
  { extends: 'form' }
)
