<template><main class="p-5"><ProduitForm v-if="kind==='produit'" :produit="record" @saved="saved=true"/><FactureForm v-else-if="kind==='facture'" :facture="record" @saved="saved=true"/><DevisForm v-else :devis="record" @saved="saved=true"/><p v-if="saved">Document enregistré</p></main></template>
<script setup>
import { ref } from 'vue'
import ProduitForm from '/src/components/ProduitForm.vue'
import FactureForm from '/src/components/FactureForm.vue'
import DevisForm from '/src/components/DevisForm.vue'
const params=new URLSearchParams(location.search), kind=params.get('kind'), mode=params.get('mode')
const tax=mode==='empty'?null:Number(params.get('tax') || 0)
const saved=ref(false)
const record=mode==='new'?null:kind==='produit'?{id:123,libelle:'Produit test',type:'service',prix_vente_ht:1000,taux_tva:tax}: {id:123,client_id:1,type:'standard',statut:'brouillon',date_facture:'2026-11-03',date_echeance:'2026-12-03',date_devis:'2026-11-03',date_validite:'2026-12-03',lignes:[{id:1,designation:'Service initial',quantite:1,prix_unitaire_ht:1000,taux_tva:tax,remise_pourcent:0,unite:'pièce',type_ligne:'service'}]}
</script>
