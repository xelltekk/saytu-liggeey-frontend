const empty = value => value == null || String(value).trim() === ''

function checks(data, errors) {
  const add = (key, message) => { errors[key] ??= [message] }
  const text = (key, label, max, required = false) => {
    if (required && empty(data[key])) add(key, `${label} ne doit pas être vide.`)
    else if (String(data[key] ?? '').length > max) add(key, `${label} ne doit pas dépasser ${max} caractères.`)
  }
  const number = (key, label, min, max = Infinity, required = false, integer = false) => {
    if (empty(data[key])) { if (required) add(key, `Merci de renseigner ${label.toLowerCase()}.`); return }
    const value = Number(data[key])
    if (!Number.isFinite(value)) add(key, `${label} doit être un nombre valide.`)
    else if (integer && !Number.isInteger(value)) add(key, `${label} doit être un nombre entier.`)
    else if (value < min) add(key, `${label} doit être supérieur ou égal à ${min}.`)
    else if (value > max) add(key, `${label} ne doit pas dépasser ${max}.`)
  }
  return {add, text, number}
}

export function validateCommercialDocument(form, kind) {
  const errors = {}, {add, text, number} = checks(form, errors)
  if (empty(form.client_id)) add('client_id', 'Sélectionnez un client dans la liste des résultats.')
  const start = kind === 'devis' ? 'date_devis' : 'date_facture'
  const end = kind === 'devis' ? 'date_validite' : 'date_echeance'
  for (const key of [start, end]) {
    if (empty(form[key])) add(key, 'Merci de renseigner cette date.')
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(form[key]) || !Number.isFinite(Date.parse(form[key]))) add(key, 'Saisissez une date valide.')
  }
  if (!errors[start] && !errors[end] && form[end] < form[start]) add(end, kind === 'devis'
    ? 'La date de validité ne doit pas précéder la date du devis.'
    : 'La date d’échéance ne doit pas précéder la date de facture.')
  number('delai_paiement_jours', 'Le délai de paiement', 0, 365, false, true)
  number('remise_globale_pourcent', 'La remise globale', 0, 100)
  text('reference_client', 'La référence client', 100)
  text('objet', 'L’objet', 255)
  if (!form.lignes?.length) add('lignes', 'Ajoutez au moins une ligne.')
  for (const [index, line] of (form.lignes || []).entries()) {
    const lineErrors = {}, c = checks(line, lineErrors)
    c.text('designation', 'La désignation', 5000, true)
    c.text('unite', 'L’unité', 20)
    c.number('quantite', 'La quantité', 0.001, Infinity, true)
    c.number('prix_unitaire_ht', 'Le prix unitaire', 0, Infinity, true)
    c.number('remise_pourcent', 'La remise', 0, 100)
    c.number('taux_tva', 'Le taux de TVA', 0, 100, true)
    for (const [key, messages] of Object.entries(lineErrors)) errors[`lignes.${index}.${key}`] = messages
  }
  return errors
}

export function validateCommercialProduct(form, stock = null, hasLocations = false) {
  const errors = {}, {add, text, number} = checks(form, errors)
  text('libelle', 'Le libellé', 191, true)
  for (const [key, label, max] of [['reference','La référence',60],['code_barre','Le code-barres',60],['marque','La marque',100],['modele','Le modèle',100],['unite','L’unité',20]]) text(key,label,max)
  if (!['produit','service','pack'].includes(form.type)) add('type','Sélectionnez un type de produit.')
  number('prix_vente_ht','Le prix de vente',0,Infinity,true)
  number('prix_achat_ht','Le prix d’achat',0)
  number('taux_tva','Le taux de TVA',0,100,true)
  for (const key of ['stock_alerte','stock_securite','garantie_mois']) number(key,'Cette valeur',0,Infinity,false,true)
  if (form.type === 'pack') {
    if (!form.pack_items?.length) add('pack_items','Ajoutez au moins un composant au pack.')
    const used = new Set()
    for (const [index,item] of (form.pack_items || []).entries()) {
      if (!item.composant_id) add(`pack_items.${index}.composant_id`,'Sélectionnez un composant.')
      else if (used.has(Number(item.composant_id))) add(`pack_items.${index}.composant_id`,'Ce composant est déjà présent dans le pack.')
      used.add(Number(item.composant_id))
      if (empty(item.quantite) || !Number.isFinite(Number(item.quantite)) || Number(item.quantite)<0.001) add(`pack_items.${index}.quantite`,'La quantité doit être supérieure ou égale à 0.001.')
    }
  }
  if (stock?.enabled) {
    const stockErrors = {}, c = checks(stock,stockErrors)
    if (!stock.entrepot_id) c.add('entrepot_id','Sélectionnez un entrepôt.')
    if (hasLocations && !stock.emplacement_id) c.add('emplacement_id','Sélectionnez un emplacement.')
    c.number('quantite','La quantité initiale',0.001,Infinity,true)
    c.number('prix_unitaire','Le prix unitaire',0)
    c.text('motif','Le motif',100)
    for (const [key,messages] of Object.entries(stockErrors)) errors[`stock_initial.${key}`]=messages
  }
  return errors
}

export function focusInvalidField(root, errors) {
  const key = Object.keys(errors)[0]
  const field = [...(root?.querySelectorAll('[data-validation-field]') || [])].find(el => el.dataset.validationField === key)
  const target = field?.matches('input,select,textarea,[contenteditable]') ? field : field?.querySelector('[contenteditable],input,select,textarea')
  if (target) { target.focus(); target.scrollIntoView({block:'center',behavior:'smooth'}) }
  else root?.querySelector('[role=alert]')?.scrollIntoView({block:'start',behavior:'smooth'})
}
