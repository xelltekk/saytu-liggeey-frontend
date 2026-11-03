<template><main class="p-5"><FactureForm v-if="kind==='facture'" :facture="record" @saved="saved=true"/><DevisForm v-else :devis="record" @saved="saved=true"/><p v-if="saved">Document enregistré</p></main></template>
<script setup>
import { ref } from 'vue'
import FactureForm from '/src/components/FactureForm.vue'
import DevisForm from '/src/components/DevisForm.vue'
const kind=new URLSearchParams(location.search).get('kind') || 'facture'
const saved=ref(false)
const record={id:123,client_id:1,type:'standard',statut:'brouillon',date_facture:'2026-11-03',date_echeance:'2026-12-03',date_devis:'2026-11-03',date_validite:'2026-12-03',lignes:[{id:1,designation:'Service initial',designation_html:'<b>Service initial</b>',quantite:1,prix_unitaire_ht:1000,taux_tva:0,remise_pourcent:0,unite:'pièce',type_ligne:'service'}]}
</script>
