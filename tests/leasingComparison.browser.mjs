// Run with SAYTU_TEST_RUNTIME pointing to the bundled node_modules directory.
// Uses only a localhost harness and generated documents; no ERP database or mail.
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import assert from 'node:assert/strict'
const require = createRequire(import.meta.url)
const runtime = process.env.SAYTU_TEST_RUNTIME
if (!runtime) throw Error('Set SAYTU_TEST_RUNTIME to the bundled node_modules path')
const { chromium } = require(join(runtime, 'playwright'))
const { PDFDocument, StandardFonts } = require(join(runtime, 'pdf-lib'))
const { createCanvas } = require(join(runtime, '@napi-rs/canvas'))
const browser = await chromium.launch({ headless: true, ...(process.env.SAYTU_TEST_BROWSER ? { channel: process.env.SAYTU_TEST_BROWSER } : {}) })
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
const errors = [], external = []
page.on('pageerror', error => errors.push(error.message))
page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:5179/')) external.push(request.url()) })
const fixture = async (recent, scan = false) => {
  const doc = await PDFDocument.create(), p = doc.addPage([595, 842])
  const lines = ['Rapport du compteur Canon', recent ? '27/10/2026' : '24/08/2026', 'Numero de serie TEST12345',
    `102 Total 2 ${recent ? 408785 : 405666}`, `409 Copie Impression (Couleur) ${recent ? 141377 : 139696}`, `112 Total (Noir/Grand format) ${recent ? 6 : 5}`, '501 Lecture 999999']
  if (scan) {
    const canvas = createCanvas(1190, 1684), ctx = canvas.getContext('2d')
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, 1190, 1684); ctx.fillStyle = 'black'; ctx.font = '28px Arial'
    lines.forEach((line, i) => ctx.fillText(line, 60, 100 + i * 70))
    const png = await doc.embedPng(canvas.toBuffer('image/png')); p.drawImage(png, { x: 0, y: 0, width: 595, height: 842 })
  } else {
    const font = await doc.embedFont(StandardFonts.Helvetica)
    lines.forEach((text, i) => p.drawText(text, { x: 30, y: 790 - i * 35, size: 12, font }))
  }
  return Buffer.from(await doc.save())
}
try {
  await page.goto('http://127.0.0.1:5179/tests/browser/leasing.html')
  await page.getByRole('heading', { name: 'Comparer deux relevés', exact: true }).waitFor()
  for (const i of [0, 1]) {
    await page.locator('input[type=file]').nth(i).setInputFiles({ name: `releve-${i}.pdf`, mimeType: 'application/pdf', buffer: await fixture(i === 1, i === 1) })
    await page.getByRole('status').nth(i).filter({ hasText: 'Trois compteurs lus' }).waitFor({ timeout: 180000 })
    console.log(i ? 'Scanned PDF OCR passed' : 'Text PDF passed')
  }
  await page.getByLabel('Faces couleur grand format sur la période', { exact: true }).fill('0')
  await page.getByRole('checkbox').nth(0).check(); await page.getByRole('checkbox').nth(1).check()
  await page.getByRole('button', { name: 'Calculer la consommation' }).click()
  await page.locator('#leasing-comparison-result').waitFor()
  assert.match((await page.locator('#leasing-comparison-result').innerText()).replace(/\s/g, ''), /129580CFA/)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exporter CSV' }).click()
  const download = await downloadPromise
  assert.match(download.suggestedFilename(), /comparaison-a4-2026-10-27.csv/)
  await page.screenshot({ path: join(tmpdir(), 'saytu-leasing-comparison-desktop.png'), fullPage: true })
  // Validate the print stylesheet without opening a native print dialog.
  await page.evaluate(() => document.body.classList.add('printing-leasing-comparison'))
  const printed = await page.pdf({ path: join(tmpdir(), 'saytu-leasing-comparison-test.pdf'), format: 'A4' })
  assert.equal((await PDFDocument.load(printed)).getPageCount(), 1, 'No blank pages in the printed result')
  await page.evaluate(() => document.body.classList.remove('printing-leasing-comparison'))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: join(tmpdir(), 'saytu-leasing-comparison-mobile.png'), fullPage: true })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await page.getByLabel('102 · Total 2 · récent', { exact: true }).fill('408786')
  assert.equal(await page.locator('#leasing-comparison-result').count(), 0)
  assert.equal(await page.getByRole('checkbox').nth(1).isChecked(), false)
  assert.deepEqual(errors, []); assert.deepEqual(external, [])
  console.log('PASS: text PDF + scanned PDF OCR, 129580 CFA, CSV download, print PDF, responsive width, invalidation, no external requests or JS errors')
  console.log('Screenshots and PDF:', tmpdir())
} catch (error) {
  console.error('Page errors:', errors)
  console.error('Page status:', await page.locator('[role=status]').allTextContents())
  await page.screenshot({ path: join(tmpdir(), 'saytu-leasing-comparison-failure.png'), fullPage: true })
  throw error
} finally { await browser.close() }
