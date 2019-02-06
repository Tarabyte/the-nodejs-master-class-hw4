/**
 * Application wide logic
 */
const delay = ms => new Promise(r => setTimeout(r, ms))
const minute = 60 * 1000
const MAX_RETRIES = 3
const tokenExtendInterval = 1 * minute
const retryIn = () => minute * (0.25 + 0.75 * Math.random())
const extendToken = async (retry = 0) => {
  const { token } = app

  // stop if no token
  if (!token) {
    return
  }

  try {
    // extend token on server
    const { ok, data, status } = await callAPI('/api/tokens', {
      query: { id: token },
      method: 'PUT',
      data: {
        extend: true,
      },
    })

    // unable to extend data
    if (!ok) {
      console.warn('Failed to extend token', status, data)
      const error = new Error('Failed to extend token')
      error.status = status

      throw error
    }

    // wait some time
    await delay(tokenExtendInterval)

    // start over
    return extendToken(0)
  } catch (e) {
    const shouldRetry =
      retry < MAX_RETRIES && ![401, 403, 500].includes(e.status)

    if (shouldRetry) {
      console.warn(`Retrying token extend ${retry}`)
      // wait some random delay
      await delay(retryIn())

      return extendToken(retry + 1)
    }

    console.error(
      'Unable to extend token.',
      `Retried ${retry} times. Error status code ${e.status || 0}.`
    )
  }
}

const app = {
  get token() {
    return window.sessionStorage.getItem('token')
  },

  set token(token) {
    if (token) {
      // persist token locally
      window.sessionStorage.setItem('token', token)
      // set cookie to enable authenticated document requests
      document.cookie = `token=${encodeURIComponent(token)}`
    } else {
      // clean storage
      window.sessionStorage.removeItem('token')
      // and cookie by setting it to be expired
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
  },

  // log in using credentials
  async logIn(credentials) {
    const result = await callAPI('/api/tokens', {
      method: 'POST',
      data: credentials,
    })

    // failed
    if (!result.ok) {
      return result
    }

    // save token
    app.token = result.data.id

    // run token extending loop
    extendToken()

    return result
  },

  // log current user out
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

    // clear token
    app.token = null

    return result
  },

  // boot application
  bootstrap() {
    extendToken()
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

      this.clearErrors()

      this.classList.add('submitting')

      // disable buttons
      const buttons = [...this.querySelectorAll('button[type=submit]')]
      buttons.forEach(button => (button.disabled = true))

      try {
        let data = null
        try {
          data = this.getData()
        } catch (e) {
          // process validation errors
          if (e instanceof ValidationError) {
            return this.setError(e.message, e.details)
          }

          throw e
        }

        const response = await this.request(data)

        await this[response.ok ? 'onOk' : 'onFail'](response, data)
      } catch (e) {
        this.onGlobalFailure(e)
      } finally {
        this.classList.remove('submitting')

        // enable buttons
        buttons.forEach(button => (button.disabled = false))
      }
    })
  }

  /**
   * Override method
   */
  get method() {
    const method = this.getAttribute('method')

    if (!method) {
      return 'get'
    }

    return method.toLowerCase()
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

  // Collect data before sending to server
  getData() {
    // collect data
    const data = [...this.entries()].reduce(
      (acc, [name, value]) => ((acc[name] = value), acc),
      Object.create(null)
    )

    return data
  }

  // handle ok result
  onOk() {
    throw new Error('onOk method should be implemented by subclasses')
  }

  // handle errors
  onFail(response) {
    Maybe.of(response.data).then(({ message, details }) =>
      this.setError(message, details)
    )
  }

  // handle if was not able to hit the server or impl failed
  onGlobalFailure(e) {
    alert(e.toString())
  }

  // set error message if container is available
  setError(text, details) {
    Maybe.of(this.querySelector('.form-error-message')).then(
      el => (el.textContent = text)
    )

    Maybe.of(details).then(details => {
      // set individual errors
      Object.entries(details).forEach(([fieldName, message]) => {
        Maybe.of(this.querySelector(`[name=${fieldName}]`)) // find field
          .then(field => field.closest('.form-control')) // find its control
          .then(
            control => control.querySelector('.form-control-error-message') // find error message placeholder
          )
          .then(errorEl => (errorEl.textContent = message))
      })
    })
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

// validation exception
class ValidationError extends Error {
  constructor(message, details) {
    super(message)

    this.message = message
    this.details = details
  }
}

// boot the app
app.bootstrap()

// export app and stuff
export default app
export { AjaxFormElement, callAPI, Maybe, ValidationError }
