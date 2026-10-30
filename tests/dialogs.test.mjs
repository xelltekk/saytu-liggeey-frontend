import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import vm from 'node:vm'
import { reactive } from 'vue'

test('themed confirmations queue and prompts distinguish cancel from empty input', async () => {
  const source = readFileSync(new URL('../src/composables/useConfirm.js', import.meta.url), 'utf8').replace(/^import .*$/gm, '').replace(/export /g, '')
  const context = vm.createContext({ reactive, window: { requestAnimationFrame: fn => setTimeout(fn, 0) } })
  vm.runInContext(source + '\nglobalThis.api = { requestConfirmation, requestPrompt, useConfirmHost };', context)
  const { requestConfirmation: confirm, requestPrompt: prompt, useConfirmHost } = context.api
  const host = useConfirmHost()
  const first = confirm('Quitter ?'), second = confirm('Supprimer ?')
  assert.equal(host.state.message, 'Quitter ?')
  host.cancel(); assert.equal(await first, false)
  await new Promise(r => setTimeout(r, 10))
  assert.equal(host.state.message, 'Supprimer ?')
  host.confirm(); assert.equal(await second, true)
  const input = prompt('Motif', 'Initial')
  assert.equal(host.state.inputValue, 'Initial')
  host.state.inputValue = ''; host.confirm(); assert.equal(await input, '')
  const cancelled = prompt('Motif', 'Initial'); host.cancel(); assert.equal(await cancelled, null)
  const normal = confirm('Encore ?'); assert.equal(host.state.mode, 'confirm'); host.confirm(); assert.equal(await normal, true)
})

test('application no longer calls native browser dialogs', () => {
  const root = new URL('../src/', import.meta.url)
  for (const file of readdirSync(root, { recursive: true }).filter(f => /\.(vue|js|ts)$/.test(f))) {
    const source = readFileSync(new URL(file.replaceAll('\\', '/'), root), 'utf8')
    assert.doesNotMatch(source, /\bwindow\.(confirm|prompt|alert)\s*\(/, file)
  }
})
