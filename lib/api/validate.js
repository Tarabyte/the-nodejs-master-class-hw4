/**
 * Request handler w/ validation
 */

// various common validators
const required = (value, name) =>
  value != null ? false : `${name} is required`

const type = expected => (value, name) =>
  typeof value === expected ? false : `${name} should be a ${expected}`

const matches = (pattern, message) => (value, name) =>
  pattern.test(value) ? false : message(name)

const isEmail = matches(
  /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
  name => `${name} is invalid email`
)

const length = len => (value, name) =>
  value.length === len ? false : `${name} should have length ${len}`

const minLength = min => (value, name) =>
  value.length >= min ? false : `${name} is too short`

const maxLength = max => (value, name) =>
  value.length <= max ? false : `${name} is too long`

const gte = min => (value, name) =>
  value >= min ? false : `${name} should be greater or equal to ${min}`

const lte = max => (value, name) =>
  value <= max ? false : `${name} should be less or equal to ${max}`

const integer = (value, name) =>
  Math.round(value) === value ? false : `${name} should be integer`

const optional = (...validators) => (value, name, obj) => {
  // check if field is defined
  if (typeof value === 'undefined') {
    return
  }

  // find first failing validator
  for (const validator of validators) {
    const error = validator(value, name, obj)
    if (error) {
      return error
    }
  }
}

const id = x => x
const updateBody = (req, data) => (req.body = data)

// validator middleware
const validator = (
  schema, // validation scheme
  // options
  {
    extract = id, // how to extract data from req
    merge = updateBody, // how to set extracted data back
    message = 'Entry is invalid', // error message if any errors,
    code = 422, // status code if any errors
  } = {}
) => next => {
  // flatten validators
  const validators = [].concat.apply(
    [],
    Object.entries(schema).map(([key, value]) => {
      if (typeof value === 'function') {
        return [[key, value]]
      }

      if (Array.isArray(value)) {
        return value.map(v => [key, v])
      }

      throw new Error('Unexpected validator')
    })
  )

  // validate function
  const validate = obj => {
    return validators.reduce((errors, [key, validator]) => {
      // validators are more detailed so only validate if the property is still valid
      if (!errors.has(key)) {
        const value = obj[key]
        const error = validator(value, key, obj)
        if (error) {
          errors.set(key, error)
        }
      }

      return errors
    }, new Map())
  }

  return (req, respond) => {
    // pass additional request object if some data is not in body
    // but primarily we expect data to be in request.body
    const obj = extract(req.body, req)
    const errors = validate(obj)

    if (errors.size) {
      const error = new Error(message)

      // add error messages to notify client
      error.details = [...errors.entries()].reduce(
        (acc, [key, value]) => ((acc[key] = value), acc),
        {}
      )

      // send validation error
      return respond(code, error)
    } else {
      // keep extracted body for next handler
      merge(req, obj)

      // delegate to next handler
      return next(req, respond)
    }
  }
}

// preconfigure query validator
const extractQuery = (_, req) => req.query
const updateQuery = (data, req) => (req.query = { ...req.query, ...data })
const queryValidator = (schema, options) =>
  validator(schema, { extract: extractQuery, merge: updateQuery, ...options })

module.exports = {
  validator,
  queryValidator,
  required,
  matches,
  isEmail,
  length,
  minLength,
  maxLength,
  optional,
  string: type('string'),
  number: type('number'),
  bool: type('boolean'),
  lte,
  gte,
  integer,
}
