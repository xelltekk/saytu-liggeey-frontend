import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/components/NotificationsBell.vue', import.meta.url), 'utf8')
function luminance(hex) {
  const rgb = hex.match(/[a-f\d]{2}/gi).map(v => parseInt(v, 16) / 255)
    .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]
}
test('portal notification text has explicit dark colors with AA contrast', () => {
  for (const part of ['title', 'message', 'date']) {
    assert.ok(source.includes(`class="portal-notification-${part}"`))
    const color = source.match(new RegExp(`\\.portal-notification-${part}\\s*\\{[^}]*color:\\s*(#[a-f0-9]+)`, 'i'))?.[1]
    assert.ok(color)
    for (const background of ['#f0f9ff', '#e0f2fe']) {
      assert.ok((luminance(background) + .05) / (luminance(color) + .05) >= 4.5)
    }
  }
  assert.match(source, /overflow-wrap: anywhere/)
  assert.match(source, /\.portal-notification:focus-visible/)
})
