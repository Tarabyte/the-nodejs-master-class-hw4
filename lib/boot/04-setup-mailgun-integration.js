/**
 * Enable MailGun Integration
 */
const makeLogger = require('../debug')
const { fetch } = require('../util/fetch')

const debug = makeLogger('MAILGUN', 'blue')

module.exports = async (app, config) => {
  const { mailgun: mailgunConfig } = config

  if (!mailgunConfig) {
    debug('Skipping MailGun integration setup. No config.mailgun found')
    return
  }

  debug('Setting up MailGun integration %j', mailgunConfig)

  const { key, domain, from } = mailgunConfig

  if (!key) {
    throw new Error('mailgun.key is required')
  }

  if (!domain) {
    throw new Error('mailgun.domain is required')
  }

  // prepopulate fetch w/ data
  const { post } = fetch({
    host: 'api.mailgun.net',
    secure: true,
    headers: {
      Authorization: `Basic ${Buffer.from(key).toString('base64')}`,
    },
  })

  app.MailGun = {
    async send(message) {
      const { statusCode, data } = await post({
        path: `/v3/${domain}/messages`,
        form: {
          from,
          ...message,
        },
      })

      if (statusCode === 200) {
        return data
      }

      const error = new Error('Unable to send email')
      error.statusCode = statusCode
      error.details = data

      throw error
    },
  }
}
