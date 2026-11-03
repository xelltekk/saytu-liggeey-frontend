const allowed = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'BR', 'DIV', 'P', 'UL', 'OL', 'LI'])
const blocked = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'SVG', 'MATH', 'TEMPLATE'])

export function cleanDesignationHtml(html) {
  const source = new DOMParser().parseFromString(String(html || ''), 'text/html')
  const target = document.createElement('div')
  function copy(node, parent) {
    if (node.nodeType === 3) { parent.append(document.createTextNode(node.textContent)); return }
    if (node.nodeType !== 1 || blocked.has(node.tagName)) return
    const dest = allowed.has(node.tagName) ? document.createElement(node.tagName.toLowerCase()) : parent
    if (dest !== parent) parent.append(dest)
    for (const child of node.childNodes) copy(child, dest)
  }
  for (const child of source.body.childNodes) copy(child, target)
  return target.innerHTML
}

export function designationText(html) {
  const root = new DOMParser().parseFromString(cleanDesignationHtml(html), 'text/html').body
  function read(node) {
    if (node.nodeType === 3) return node.textContent
    if (node.nodeName === 'BR') return '\n'
    let value = ''
    for (const child of node.childNodes) {
      if (['DIV', 'P', 'LI', 'UL', 'OL'].includes(child.nodeName) && value && !value.endsWith('\n')) value += '\n'
      value += read(child)
    }
    return ['DIV', 'P', 'LI'].includes(node.nodeName) && !value.endsWith('\n') ? value + '\n' : value
  }
  return read(root).replace(/\u00a0/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

export function plainDesignationHtml(text) {
  const node = document.createElement('div')
  node.textContent = String(text || '')
  return node.innerHTML.replace(/\n/g, '<br>')
}
