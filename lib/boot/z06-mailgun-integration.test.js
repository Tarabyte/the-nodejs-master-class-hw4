/**
 * Test mailgun integration
 */
const assert = require('assert')
const test = require('../util/test')

module.exports = async app => {
  await test.module('MailGun Integration', async () => {
    const { MailGun } = app

    await test('MailGun should be declared', async () => {
      assert(MailGun, 'MailGun integration was not enabled')
    })

    await test(
      'Sending messages',
      async () => {
        const message = {
          to: 'o9926088@nwytg.net',
          subject: 'Test',
          text: 'Test message',
        }

        const result = await MailGun.send(message)

        assert(result, 'Unable to get sent message')
      },
      { timeout: 5000 }
    )
  })
}
