// Canon 102 / 409 / 112 only. These are NOT the ERP's cumulative A4 counters.
export const COUNTERS = ['102', '409', '112']
export const emptyReport = () => ({ date: '', serial: '', counters: { 102: '', 409: '', 112: '' } })

function integer(value, label) {
  if (value === '' || value === null || value === undefined || typeof value === 'boolean' || !Number.isSafeInteger(Number(value)) || Number(value) < 0) throw Error(`${label} : saisissez un entier positif ou nul.`)
  return Number(value)
}
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(value + 'T00:00:00Z')
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
export function compareReports(reports, options) {
  if (!options.verified) throw Error('Vérifiez les dates, séries et compteurs puis cochez la confirmation.')
  if (!options.a4) throw Error('Confirmez les formats A4 et les grands formats couleur avant le calcul.')
  const [old, recent] = reports
  if (!old || !recent || !validDate(old.date) || !validDate(recent.date) || recent.date <= old.date) throw Error('La date récente doit être postérieure à la date précédente ; vérifiez les deux dates.')
  const serial = old.serial.trim().toUpperCase()
  if (!serial || serial !== recent.serial.trim().toUpperCase()) throw Error('Les deux relevés doivent avoir le même numéro de série.')
  if (options.expectedSerial && serial !== options.expectedSerial.trim().toUpperCase()) throw Error('Le numéro de série ne correspond pas à l’imprimante du contrat.')
  const values = reports.map(r => COUNTERS.map(c => integer(r.counters[c], `Compteur ${c}`)))
  for (const v of values) if (v[0] < v[1] + 2 * v[2]) throw Error('Compteurs incohérents : le total 102 est inférieur à la couleur et au noir grand format.')
  const delta = values[1].map((v, i) => v - values[0][i])
  if (delta.some(v => v < 0)) throw Error('Un compteur diminue : vérifiez les valeurs et l’ordre des relevés.')
  const largeColor = integer(options.largeColor, 'Grands formats couleur')
  const black = delta[0] - delta[1] - 2 * delta[2], color = delta[1] - 2 * largeColor
  if (black < 0 || color < 0) throw Error('Compteurs incohérents : le résultat A4 serait négatif.')
  const prices = [options.blackPrice, options.colorPrice].map(v => {
    if (v === '' || v === null || v === undefined || !Number.isFinite(Number(v)) || Number(v) < 0) throw Error('Renseignez deux tarifs positifs ou nuls.')
    return Number(v)
  })
  const round = n => Math.round((n + Number.EPSILON) * 100) / 100
  const blackAmount = round(black * prices[0]), colorAmount = round(color * prices[1]), total = round(blackAmount + colorAmount)
  if (![blackAmount, colorAmount, total].every(v => Number.isFinite(v) && v <= Number.MAX_SAFE_INTEGER / 100)) throw Error('Montant trop élevé ; vérifiez les compteurs et tarifs.')
  return { start: old.date, end: recent.date, serial, black, color, blackPrice: prices[0], colorPrice: prices[1], blackAmount, colorAmount, total, largeBlack: delta[2], largeColor, delta }
}

export function comparisonCsv(result) {
  // Quote every cell and neutralize spreadsheet formula prefixes in user-controlled serials.
  const cell = v => '"' + String(v).replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""') + '"'
  return '\uFEFF' + [
    ['Début', 'Fin', 'Série', 'Type', 'Faces A4', 'Prix HT CFA', 'Montant HT CFA', 'Grands formats exclus'],
    [result.start, result.end, result.serial, 'Noir', result.black, result.blackPrice, result.blackAmount, result.largeBlack],
    [result.start, result.end, result.serial, 'Couleur', result.color, result.colorPrice, result.colorAmount, result.largeColor],
    ['', '', '', 'Total consommation HT (hors forfait, loyer et taxes)', '', '', result.total, ''],
  ].map(row => row.map(cell).join(';')).join('\r\n')
}

export function parseReport(text) {
  const counters = {}, conflicts = new Set()
  for (const line of text.split(/\r?\n/)) {
    const normalized = line.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    let code
    if (/^\s*[1il|][0o][2z]\b/i.test(line) || /\btotal\s*2\b/.test(normalized)) code = '102'
    else if (/^\s*4[0o]9\b/i.test(line) || /copie.*impression.*(?:quadri|monochrom)/.test(normalized)) code = '409'
    else if (/^\s*[1il|][1il|][2z]\b/i.test(line) || /noir\s*\/\s*grand/.test(normalized)) code = '112'
    if (!code) continue
    let tail = line.replace(/^\s*\S+\s*/, '')
    if (code === '102') tail = line.replace(/^.*?total\s*2\b/i, '')
    else if (line.includes(')')) tail = line.slice(line.lastIndexOf(')') + 1)
    const match = tail.replace(/[|\]\s]+$/g, '').trim().match(/^(\d+(?:[ .\u00a0]\d{3})*)$/)
    if (!match) continue
    const value = Number(match[1].replace(/\D/g, ''))
    if (!Number.isSafeInteger(value) || (counters[code] !== undefined && counters[code] !== value)) conflicts.add(code)
    counters[code] = value
  }
  for (const code of conflicts) delete counters[code]
  const date = text.match(/(\d{2})\s*\/\s*(\d{2})\s*\/\s*(20\d{2})/)
  const serial = text.match(/(?:série|serie)[^\n]*?([A-Z]{2,5}\d{4,})/i)
  return { counters, date: date ? `${date[3]}-${date[2]}-${date[1]}` : '', serial: serial?.[1].toUpperCase() || '', conflicts: [...conflicts] }
}
export function columnRectangle(width, height) {
  return { left: Math.round(width * .78), top: Math.round(height * .18), width: Math.round(width * .18), height: Math.round(height * .13) }
}
export function mergeCounterColumn(report, text, columnText) {
  const rows = columnText.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const layout = (/rapport\s+du\s+compteur/i.test(text) && /iR-ADV\s+C5535/i.test(text)) || /noir\s*\/\s*grand/i.test(text) && /rapport\s+du\s+compteur/i.test(text) && /copie.*impression/i.test(text) && /501\s+lecture/i.test(text)
  if (!layout || rows.length !== 4 || rows.some(l => !/^\d+(?:[ .]\d{3})*$/.test(l))) return report
  const [large, total, color] = rows.map(l => Number(l.replace(/\D/g, '')))
  if (total < color + 2 * large) return report
  const counters = { ...report.counters }
  for (const [code, value] of Object.entries({ 112: large, 102: total, 409: color })) {
    if (report.conflicts?.includes(code) || !Number.isSafeInteger(value) || (counters[code] !== undefined && counters[code] !== value)) delete counters[code]
    else counters[code] = value
  }
  return { ...report, counters }
}
