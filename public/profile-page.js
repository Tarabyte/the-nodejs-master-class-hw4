import app, { AjaxFormElement, Maybe, ValidationError } from '/public/app.js'

// Edit profile form
customElements.define(
  'edit-profile-form',
  class extends AjaxFormElement {
    onOk() {
      window.location.reload()
    }
  },
  {
    extends: 'form',
  }
)

// Change password form
customElements.define(
  'change-password-form',
  class extends AjaxFormElement {
    onOk() {
      this.reset()

      Maybe.of(this.querySelector('.form-success-message')).then(el => {
        el.textContent = 'Password successfully changed'

        setTimeout(() => {
          if (this.isConnected) {
            el.textContent = ''
            el = null
          }
        }, 5000)
      })
    }

    // override data
    getData() {
      const data = super.getData()

      const { password, password2 } = data

      if (password !== password2) {
        throw new ValidationError('Passwords mismatch', {
          password2: 'should match',
        })
      }

      return { password }
    }
  },
  {
    extends: 'form',
  }
)

// Remove user
customElements.define(
  'delete-profile-form',
  class extends AjaxFormElement {
    onOk() {
      app.token = null
      window.location.replace('/bye')
    }

    getData() {
      if (!confirm('Are you sure? This operation is permanent.')) {
        throw new Error('Cancel')
      }
    }

    onGlobalFailure() {
      // do nothing
    }
  },
  { extends: 'form' }
)
