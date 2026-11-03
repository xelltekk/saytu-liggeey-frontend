<template>
<main style="margin:24px auto;padding:20px;max-width:1100px;background:white">
<h1 class="text-xl font-bold mb-5">Désignation — devis et facture</h1>
<form @submit.prevent="save">
<Editor v-model="text" v-model:html="html" :products="products" required />
<button class="btn-primary mt-4" type="submit">Enregistrer l’essai</button>
<button class="btn-secondary mt-4" type="button" @click="text='';html=''">Vider</button>
<button v-if="saved" class="btn-secondary" type="button" @click="reopen">Rouvrir</button>
</form>
<h2 class="mt-6 mb-3 font-bold">Aperçu du document</h2><Formatted :text="text" :html="html"/>
<pre data-testid="plain" class="sr-only">{{text}}</pre><pre data-testid="saved" class="sr-only">{{JSON.stringify(saved)}}</pre>
</main>
</template>
<script setup>
import { ref } from 'vue'
import Editor from '/src/components/RichDesignationEditor.vue'
import Formatted from '/src/components/FormattedDesignation.vue'
const text=ref(''),html=ref(''),saved=ref(null)
const products=[{id:1,libelle:'Ordinateur portable',reference:'PR-001',prix_vente_ht:250000,taux_tva:18}]
function save(){saved.value={text:text.value,html:html.value}}
function reopen(){text.value=saved.value.text;html.value=saved.value.html}
</script>
