/**
 * Application wide logic
 */
const app = {
  get token() {
    return window.sessionStorage.getItem('token')
  },

  async logIn(credentials) {
    const result = await callAPI('/api/tokens', {
      method: 'POST',
      data: credentials,
    })

    // failed
    if (!result.ok) {
      return result
    }

    // get token
    const { id: token } = result.data

    // persist token locally
    window.sessionStorage.setItem('token', token)

    // set cookie to enable authenticated document requests
    document.cookie = `token=${encodeURIComponent(token)}`

    return result
  },

  async logOut() {
    const { token } = app

    if (!token) {
      throw new Error('Unable to logout user was not logged in')
    }

    const result = await callAPI('/api/tokens', {
      query: { id: token },
      method: 'DELETE',
    })

    if (!result.ok) {
      return result
    }

    // clean storage
    window.sessionStorage.removeItem('token')
    // and cookie by setting it to be expired
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT'

    return result
  },
}

/**
 * Abstract Ajax Form Web Component
 */
class AjaxFormElement extends HTMLFormElement {
  constructor(...args) {
    super(...args)

    this.addEventListener('submit', async e => {
      // do not process to normal submit
      e.preventDefault()

      // collect data
      const data = [...this.entries()].reduce(
        (acc, [name, value]) => ((acc[name] = value), acc),
        Object.create(null)
      )

      this.clearErrors()

      this.classList.add('submitting')

      const buttons = [...this.querySelectorAll('button[type=submit]')]
      buttons.forEach(button => (button.disabled = true))

      try {
        const response = await this.request(data)

        await this[response.ok ? 'onOk' : 'onFail'](response, data)
      } catch (e) {
        this.onGlobalFailure(e)
      } finally {
        buttons.forEach(button => (button.disabled = false))
        this.classList.remove('submitting')
      }
    })
  }

  /**
   * Extract name value pairs from nested fields
   */
  *entries() {
    for (const item of this.elements) {
      const { name, value } = item

      if (name) {
        // TODO: add item value processing depending on item type.
        yield [name, value]
      }
    }
  }

  // make a request
  request(data) {
    const { method, action } = this

    const options = {
      method,
      data,
    }

    return callAPI(action, options)
  }

  // Process data before sending it to server
  processData(data) {
    return data
  }

  // handle ok result
  onOk() {
    throw new Error('onOk method should be implemented by subclasses')
  }

  // handle errors
  onFail(response) {
    Maybe.of(response.data)
      .then(({ message, details }) => {
        this.setError(message)
        return details
      })
      .then(details => {
        // set individual errors
        Object.entries(details).forEach(([fieldName, message]) => {
          Maybe.of(this.querySelector(`[name=${fieldName}]`))
            .then(field => field.closest('.form-control'))
            .then(control =>
              control.querySelector('.form-control-error-message')
            )
            .then(errorEl => (errorEl.textContent = message))
        })
      })
  }

  // handle if was not able to hit the server or impl failed
  onGlobalFailure(e) {
    alert(e.toString())
  }

  // set error message if container is available
  setError(text) {
    Maybe.of(this.querySelector('.form-error-message')).then(
      el => (el.textContent = text)
    )
  }

  clearErrors() {
    this.setError('')

    // clear individual errors
    const fieldErrors = this.querySelectorAll('.form-control-error-message')

    ;[...fieldErrors].forEach(errorEl => (errorEl.textContent = ''))
  }
}

// call api endpoin
async function callAPI(endpoint, options) {
  const { method = 'GET', data, headers = {}, query } = options

  const requestOptions = {
    method,
    headers,
    body: data,
  }

  if (typeof data === 'object') {
    headers['Content-Type'] = 'application/json'
    requestOptions.body = JSON.stringify(data)
  }

  const { token } = app

  if (token) {
    headers['token'] = token
  }

  const url = query ? `${endpoint}?${new URLSearchParams(query)}` : endpoint

  const response = await fetch(url, requestOptions)

  const { status, ok } = response

  try {
    const data = status === 204 ? null : await response.json()

    return { status, data, response, ok }
  } catch (data) {
    return {
      ok: false,
      status,
      data,
      response,
    }
  }
}

// maybe impl for poor :)
const Maybe = {
  of(value) {
    return value == null ? Maybe.nothing() : Maybe.just(value)
  },

  nothing() {
    return {
      then() {
        return this
      },
    }
  },

  just(value) {
    return {
      then(fn) {
        return Maybe.of(fn(value))
      },
    }
  },
}

export default app

export { AjaxFormElement, callAPI }
