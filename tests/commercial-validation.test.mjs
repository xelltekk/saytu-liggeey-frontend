import assert from 'node:assert/strict'
import {validateCommercialDocument as document, validateCommercialProduct as product} from '../src/utils/commercialValidation.mjs'
import {errorMessagesFromResponse,validationErrors} from '../src/utils/formErrors.js'
const line={designation:'Service',quantite:1,prix_unitaire_ht:0,taux_tva:0,remise_pourcent:''}
const form={client_id:1,date_facture:'2026-11-04',date_echeance:'2026-11-30',lignes:[line]}
assert.deepEqual(document(form,'facture'),{})
const errors=document({...form,client_id:null,date_echeance:'2026-10-01',lignes:[{...line,designation:'  ',quantite:0,prix_unitaire_ht:-1,remise_pourcent:101,taux_tva:null}]},'facture')
for(const field of ['client_id','date_echeance','lignes.0.designation','lignes.0.quantite','lignes.0.prix_unitaire_ht','lignes.0.remise_pourcent','lignes.0.taux_tva']) assert(errors[field],field)
assert.deepEqual(product({libelle:'Service',type:'service',prix_vente_ht:0,taux_tva:0}),{})
assert(product({libelle:' ',type:'pack',prix_vente_ht:-1,taux_tva:18,pack_items:[]}).pack_items)
assert(product({libelle:'Produit',type:'produit',prix_vente_ht:100,taux_tva:18},{enabled:true,quantite:0},true)['stock_initial.entrepot_id'])
assert.deepEqual(validationErrors(new Error('offline')), {})
assert.match(errorMessagesFromResponse(new Error('offline'))[0],/Connexion interrompue/)
assert.match(errorMessagesFromResponse({response:{status:500,data:'<html>Error</html>'}})[0],/serveur/)
assert.match(errorMessagesFromResponse({response:{status:422,data:{errors:{'lignes.0.quantite':['Quantité invalide']}}}})[0],/1.*Quantité/)
console.log('PASS commercial validation: required fields, dates, numeric ranges, zero rates, pack/stock, network errors')
