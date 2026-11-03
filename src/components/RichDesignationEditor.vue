<template>
  <div class="designation-editor">
    <div class="designation-toolbar" role="toolbar" aria-label="Mise en forme de la désignation">
      <button type="button" title="Gras (Ctrl+B)" aria-label="Gras" @mousedown.prevent @click="format('bold')"><strong>G</strong></button>
      <button type="button" title="Italique (Ctrl+I)" aria-label="Italique" @mousedown.prevent @click="format('italic')"><em>I</em></button>
      <button type="button" title="Souligné (Ctrl+U)" aria-label="Souligné" @mousedown.prevent @click="format('underline')"><u>S</u></button>
      <button type="button" title="Liste à puces" aria-label="Liste à puces" @mousedown.prevent @click="format('insertUnorderedList')">• Liste</button>
      <button type="button" title="Effacer la mise en forme de la sélection" aria-label="Effacer la mise en forme" @mousedown.prevent @click="format('removeFormat')">Tx</button>
      <button type="button" class="product-button" :aria-expanded="searchOpen" @click="searchOpen = !searchOpen">Rechercher un produit</button>
    </div>
    <div v-if="searchOpen" class="product-search">
      <ProductDesignationSearch v-model="search" :products="products" placeholder="Référence ou nom du produit" @select="selectProduct" />
    </div>
    <div ref="editor" class="designation-content" contenteditable="true" role="textbox" aria-label="Désignation" aria-multiline="true" :aria-required="required" data-placeholder="Saisir une désignation…" @input="publish" @paste.prevent="paste" @drop.prevent @blur="rememberSelection" @keyup="rememberSelection" @mouseup="rememberSelection" @keydown="keydown"></div>
    <textarea class="sr-only" tabindex="-1" aria-label="Validation de la désignation" :value="modelValue" :required="required" @invalid.prevent="editor?.focus()"></textarea>
    <div class="designation-hint"><span>Entrée pour aller à la ligne</span><span :class="{ 'text-red-600': modelValue.length > 5000 }">{{ modelValue.length }} / 5 000</span></div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import ProductDesignationSearch from './ProductDesignationSearch.vue'
import { cleanDesignationHtml, designationText, plainDesignationHtml } from '@/services/designationFormatting.mjs'
const props = defineProps({ modelValue: { type: String, default: '' }, html: { type: String, default: '' }, products: { type: Array, default: () => [] }, required: Boolean })
const emit = defineEmits(['update:modelValue', 'update:html', 'select'])
const editor = ref(null), searchOpen = ref(false), search = ref('')
let savedRange = null, lastText = null, lastHtml = null
function sync() {
  if (!editor.value || (props.modelValue === lastText && props.html === lastHtml)) return
  const html = cleanDesignationHtml(props.html)
  editor.value.innerHTML = html && designationText(html) === props.modelValue.trim() ? html : plainDesignationHtml(props.modelValue)
  lastText = props.modelValue; lastHtml = props.html
  savedRange = null
}
function publish() {
  lastHtml = cleanDesignationHtml(editor.value.innerHTML)
  lastText = designationText(lastHtml)
  emit('update:modelValue', lastText)
  emit('update:html', lastHtml)
}
function rememberSelection() {
  const sel = window.getSelection()
  if (sel?.rangeCount && editor.value.contains(sel.anchorNode) && editor.value.contains(sel.focusNode)) savedRange = sel.getRangeAt(0).cloneRange()
}
function format(command) {
  editor.value.focus()
  if (savedRange && editor.value.contains(savedRange.commonAncestorContainer)) {
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(savedRange)
  }
  document.execCommand(command, false)
  publish(); rememberSelection()
}
function paste(event) {
  const text = event.clipboardData.getData('text/plain')
  document.execCommand('insertText', false, text)
  publish()
}
function keydown(event) {
  if (event.key === 'Enter') event.stopPropagation()
  if ((event.ctrlKey || event.metaKey) && ['b', 'i', 'u'].includes(event.key.toLowerCase())) {
    event.preventDefault(); format({ b: 'bold', i: 'italic', u: 'underline' }[event.key.toLowerCase()])
  }
}
async function selectProduct(product) {
  lastText = product.libelle || ''; lastHtml = ''
  emit('select', product); emit('update:modelValue', lastText); emit('update:html', '')
  searchOpen.value = false
  await nextTick(); editor.value.innerHTML = plainDesignationHtml(lastText); savedRange = null; editor.value.focus()
}
watch(() => [props.modelValue, props.html], sync)
onMounted(sync)
</script>

<style scoped>
.designation-editor { border: 1px solid var(--saytu-border, #cbd5e1); border-radius: 10px; background: var(--saytu-surface, white); overflow: visible; }
.designation-editor:focus-within { border-color: var(--saytu-primary, #0284c7); box-shadow: 0 0 0 2px #0ea5e922; }
.designation-toolbar { display:flex; flex-wrap:wrap; gap:3px; padding:5px 7px; border-bottom:1px solid var(--saytu-border, #e2e8f0); }
.designation-toolbar button { min-width:28px; min-height:28px; padding:3px 7px; border-radius:5px; font-size:12px; color:var(--saytu-text, #334155); }
.designation-toolbar button:hover, .designation-toolbar button:focus-visible { background:#0ea5e91a; outline:2px solid transparent; }
.designation-toolbar .product-button { margin-left:auto; color:var(--saytu-primary, #0369a1); }
.designation-content { min-height:72px; max-height:350px; overflow:auto; outline:none; padding:10px 12px; font-size:14px; line-height:1.5; white-space:pre-wrap; overflow-wrap:anywhere; }
.designation-content:empty::before { content:attr(data-placeholder); color:#94a3b8; pointer-events:none; }
.designation-content :deep(ul) { list-style:disc; padding-left:22px; }
.designation-content :deep(ol) { list-style:decimal; padding-left:22px; }
.designation-hint { display:flex; justify-content:space-between; gap:10px; padding:4px 10px 7px; font-size:10px; color:#64748b; }
.product-search { padding:8px; }
</style>
