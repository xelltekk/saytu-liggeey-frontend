import { COUNTERS, parseReport, columnRectangle, mergeCounterColumn } from '../utils/leasingComparison.mjs'

const base = '/assets/leasing-comparator/runtime/'
const assetUrl = path => new URL(`${base}${path}`, globalThis.location?.origin || 'http://localhost').href
let enginePromise
async function engines() {
  if (!enginePromise) enginePromise = (async () => {
    const pdfjs = await import(/* @vite-ignore */ `${base}pdf.mjs`)
    pdfjs.GlobalWorkerOptions.workerSrc = `${base}pdf.worker.mjs`
    if (!globalThis.Tesseract) await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      const timeout = setTimeout(() => { script.remove(); reject(Error('Chargement du moteur OCR trop long. Réessayez.')) }, 20000)
      script.src = `${base}tesseract.min.js`
      script.onload = () => { clearTimeout(timeout); resolve() }
      script.onerror = () => { clearTimeout(timeout); script.remove(); reject(Error('Moteur OCR indisponible. Réessayez ou saisissez les valeurs manuellement.')) }
      document.head.appendChild(script)
    })
    return { pdfjs, tesseract: globalThis.Tesseract }
  })().catch(error => { enginePromise = null; throw error })
  return enginePromise
}

export function validatePdfFile(file) {
  if (!file || !/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) throw Error('Choisissez un fichier PDF.')
  if (!file.size || file.size > 30 * 1024 * 1024) throw Error('Chaque PDF doit faire entre 1 octet et 30 Mo.')
}

// Uploaded bytes stay on the device; only static engine files are fetched.
// The optional engine loader supports deterministic tests without real documents.
export async function readLeasingPdf(file, { signal, onProgress = () => {}, onPreview = () => {}, loadEngines = engines, timeoutMs = 180000, stageTimeoutMs = 30000 } = {}) {
  validatePdfFile(file)
  let worker, loadingTask, doc, renderTask, timer
  let stopped = false
  let cancelRead
  const cancelled = new Promise((_, reject) => { cancelRead = reject })
  // Cancellation can occur between awaited operations.
  cancelled.catch(() => {})
  const wait = promise => Promise.race([promise, cancelled])
  const cleanup = fn => { try { Promise.resolve(fn()).catch(() => {}) } catch {} }
  const stage = async (promise, label, limit = stageTimeoutMs) => {
    onProgress(label)
    let deadline
    try {
      return await wait(Promise.race([promise, new Promise((_, reject) => {
        deadline = setTimeout(() => reject(Error(`${label} Délai dépassé. Réessayez ou utilisez la saisie manuelle.`)), limit)
      })]))
    } finally { clearTimeout(deadline) }
  }
  const abort = () => {
    stopped = true
    cleanup(() => renderTask?.cancel())
    cleanup(() => worker?.terminate())
    cleanup(() => loadingTask?.destroy())
    cancelRead(new DOMException('Lecture annulée.', 'AbortError'))
  }
  const check = () => { if (stopped || signal?.aborted) throw new DOMException('Lecture annulée.', 'AbortError') }
  signal?.addEventListener('abort', abort, { once: true })
  timer = setTimeout(abort, timeoutMs)
  try {
    check()
    const bytes = new Uint8Array(await wait(file.arrayBuffer()))
    if (!new TextDecoder().decode(bytes.slice(0, 1024)).includes('%PDF-')) throw Error('Le fichier ne contient pas un PDF valide.')
    const { pdfjs, tesseract } = await stage(loadEngines(), 'Chargement des outils PDF…')
    check()
    loadingTask = pdfjs.getDocument({
      data: bytes, isEvalSupported: false, useSystemFonts: true, stopAtErrors: true,
      wasmUrl: assetUrl('pdf-wasm/'),
      standardFontDataUrl: assetUrl('standard_fonts/'),
      cMapUrl: assetUrl('cmaps/'), cMapPacked: true,
    })
    doc = await stage(loadingTask.promise, 'Ouverture du document PDF…')
    check()
    if (doc.numPages > 10) throw Error('Choisissez un PDF de 10 pages maximum.')
    const reports = [], texts = [], previews = []
    for (let p = 1; p <= doc.numPages; p++) {
      check()
      onProgress(`Lecture de la page ${p} / ${doc.numPages}…`)
      const page = await stage(doc.getPage(p), `Ouverture de la page ${p} / ${doc.numPages}…`)
      const content = await stage(page.getTextContent(), `Extraction du texte de la page ${p} / ${doc.numPages}…`)
      let text = content.items.map(x => x.str + (x.hasEOL ? '\n' : ' ')).join('')
      let report = parseReport(text)
      const natural = page.getViewport({ scale: 1 })
      // Bound raster allocations even for unusually large PDF page dimensions.
      const scale = Math.min(3, Math.sqrt(12000000 / (natural.width * natural.height)), 5000 / Math.max(natural.width, natural.height))
      const viewport = page.getViewport({ scale })
      if (!Number.isFinite(viewport.width) || viewport.width <= 0 || viewport.height <= 0) throw Error('Dimensions de page PDF invalides.')
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height)
      try {
        renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport })
        await stage(renderTask.promise, `Préparation de l’aperçu de la page ${p} / ${doc.numPages}…`)
        check()
        // Safe raster preview: no embedded PDF scripting or external links.
        const preview = document.createElement('canvas')
        preview.width = Math.min(1400, canvas.width)
        preview.height = Math.round(canvas.height * preview.width / canvas.width)
        preview.getContext('2d').drawImage(canvas, 0, 0, preview.width, preview.height)
        previews.push(preview.toDataURL('image/jpeg', .85))
        preview.width = preview.height = 0
        onPreview({ previews: [...previews], text: [...texts, text].join('\n\n') })
        if (COUNTERS.some(c => report.counters[c] === undefined)) {
          if (!worker) worker = await stage(tesseract.createWorker('eng', 1, {
            workerPath: new URL(`${base}worker.min.js`, location.origin).href,
            corePath: new URL(`${base}core/`, location.origin).href,
            langPath: new URL(`${base}lang/`, location.origin).href,
            gzip: false,
            cacheMethod: 'none',
            errorHandler: () => cancelRead(Error('Le moteur OCR n’a pas pu charger ou lire ce PDF. Réessayez ou utilisez la saisie manuelle.')),
            logger: m => {
              if (stopped || signal?.aborted) return
              const labels = { 'loading tesseract core': 'Chargement du moteur de reconnaissance', 'initializing tesseract': 'Initialisation du moteur', 'loading language traineddata': 'Chargement du modèle de lecture (première utilisation : environ 23 Mo)', 'initializing api': 'Préparation de la reconnaissance', 'recognizing text': `Reconnaissance page ${p}` }
              onProgress(`${labels[m.status] || 'Préparation de la lecture'} : ${Math.round((m.progress || 0) * 100)} %`)
            },
          }).then(created => {
            if (stopped || signal?.aborted) { void created.terminate().catch(() => {}); check() }
            return created
          }), 'Initialisation de la reconnaissance du PDF scanné…', 90000)
          check()
          await wait(worker.setParameters({ tessedit_char_whitelist: '', tessedit_pageseg_mode: '3' }))
          text = (await stage(worker.recognize(canvas), `Reconnaissance du texte de la page ${p}…`, 60000)).data.text
          report = parseReport(text)
          const rect = columnRectangle(canvas.width, canvas.height), crop = document.createElement('canvas')
          crop.width = rect.width * 2; crop.height = rect.height * 2
          try {
            crop.getContext('2d').drawImage(canvas, rect.left, rect.top, rect.width, rect.height, 0, 0, crop.width, crop.height)
            await wait(worker.setParameters({ tessedit_char_whitelist: '0123456789', tessedit_pageseg_mode: '6' }))
            const column = (await stage(worker.recognize(crop), `Vérification des compteurs de la page ${p}…`, 60000)).data.text
            report = mergeCounterColumn(report, text, column)
            text += '\nSeconde lecture des compteurs :\n' + column
          } finally { crop.width = crop.height = 0 }
        }
        check()
        reports.push(report); texts.push(text)
      } finally { canvas.width = canvas.height = 0; page.cleanup() }
    }
    const candidates = reports.filter(r => Object.keys(r.counters).length || r.conflicts?.length)
    if (candidates.length > 1) throw Error('Plusieurs relevés détectés : utilisez un seul relevé par fichier.')
    return { report: candidates[0] || reports[0], text: texts.join('\n\n'), previews }
  } catch (error) {
    if (!loadingTask) enginePromise = null
    if (stopped || signal?.aborted) throw new DOMException('Lecture annulée ou délai dépassé. Vous pouvez saisir les valeurs manuellement.', 'AbortError')
    throw error
  } finally {
    stopped = true
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
    // Broken workers must not keep the UI waiting during cleanup.
    cleanup(() => worker?.terminate())
    cleanup(() => loadingTask?.destroy())
  }
}
