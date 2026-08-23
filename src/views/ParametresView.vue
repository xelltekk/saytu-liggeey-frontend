<template>
  <div>
    <!-- Loader initial -->
    <div v-if="loading && !societe.id" class="bg-white rounded-lg p-12 text-center text-gray-500">
      Chargement des paramètres...
    </div>

    <div v-else class="space-y-5 max-w-5xl mx-auto">
      <!-- Bandeau intro -->
      <div class="theme-hero rounded-lg p-5 text-white shadow-sm">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-bold">⚙️ Paramètres de la société</h2>
            <p class="mt-1 text-sm text-white/85">Ces informations apparaîtront sur tous vos PDF (factures, devis...).</p>
          </div>
          <button @click="ouvrirApercu" class="theme-hero-action font-semibold px-4 py-2 rounded transition" :disabled="!apercuPossible">
            👁️ Aperçu PDF
          </button>
        </div>
      </div>

      <!-- ===== APPARENCE ===== -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 class="font-semibold text-gray-900">Apparence</h3>
        </div>
        <div class="p-5">
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <button
              v-for="theme in themes"
              :key="theme.id"
              type="button"
              @click="choisirTheme(theme.id)"
              class="flex items-center justify-between gap-4 rounded-lg border p-4 text-left transition"
              :class="themeId === theme.id
                ? 'border-xelltekk-500 bg-xelltekk-50 ring-2 ring-xelltekk-100'
                : 'border-gray-200 bg-white hover:border-xelltekk-300 hover:bg-gray-50'"
            >
              <span class="min-w-0">
                <span class="block text-sm font-semibold text-gray-900">{{ theme.name }}</span>
                <span class="block text-xs text-gray-500">{{ theme.description }}</span>
              </span>
              <span class="flex shrink-0 items-center gap-1.5">
                <span
                  v-for="swatch in theme.swatches"
                  :key="swatch"
                  class="h-6 w-6 rounded-full border border-white shadow-sm ring-1 ring-gray-200"
                  :style="{ backgroundColor: swatch }"
                ></span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- ===== SECTION 1 : INFORMATIONS LÉGALES ===== -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 class="font-semibold text-gray-900">🏢 Informations légales</h3>
        </div>
        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="label">Raison sociale <span class="text-red-500">*</span></label>
            <input v-model="societe.nom" type="text" class="input" placeholder="Ex: XELLTEKK SARL" required />
          </div>

          <div>
            <label class="label">Forme juridique</label>
            <select v-model="societe.forme_juridique" class="input">
              <option value="">— Sélectionner —</option>
              <option value="SARL">SARL</option>
              <option value="SUARL">SUARL</option>
              <option value="SA">SA</option>
              <option value="EI">Entreprise Individuelle</option>
              <option value="GIE">GIE</option>
              <option value="ONG">ONG</option>
              <option value="Association">Association</option>
            </select>
          </div>

          <div>
            <label class="label">Capital social</label>
            <input v-model.number="societe.capital_social" type="number" min="0" step="100000" class="input" placeholder="1 000 000" />
          </div>

          <div>
            <label class="label">NINEA</label>
            <input v-model="societe.ninea" type="text" class="input" placeholder="006468542R1" />
          </div>

          <div>
            <label class="label">RCCM</label>
            <input v-model="societe.rccm" type="text" class="input" placeholder="N-DKR-2020-A-704" />
          </div>

          <div>
            <label class="label">N° TVA (si assujetti)</label>
            <input v-model="societe.numero_tva" type="text" class="input" placeholder="Optionnel" />
          </div>

          <div>
            <label class="label">Devise par défaut</label>
            <select v-model="societe.devise_defaut" class="input">
              <option value="XOF">XOF — Franc CFA</option>
              <option value="EUR">EUR — Euro</option>
              <option value="USD">USD — Dollar US</option>
            </select>
          </div>
        </div>
      </div>

      <!-- ===== SECTION 2 : ADRESSE & CONTACT ===== -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 class="font-semibold text-gray-900">📍 Adresse & Contact</h3>
        </div>
        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="label">Adresse</label>
            <input v-model="societe.adresse" type="text" class="input" placeholder="Parcelles Assainies Unité 13 N°159" />
          </div>

          <div>
            <label class="label">BP (Boîte postale)</label>
            <input v-model="societe.bp" type="text" class="input" placeholder="BP 13000" />
          </div>

          <div>
            <label class="label">Code postal</label>
            <input v-model="societe.code_postal" type="text" class="input" placeholder="Optionnel" />
          </div>

          <div>
            <label class="label">Ville</label>
            <input v-model="societe.ville" type="text" class="input" placeholder="Dakar" />
          </div>

          <div>
            <label class="label">Pays</label>
            <input v-model="societe.pays" type="text" class="input" placeholder="Sénégal" />
          </div>

          <div>
            <label class="label">Téléphone fixe</label>
            <input v-model="societe.telephone" type="tel" data-phone-input class="input" placeholder="33 835 15 10" />
          </div>

          <div>
            <label class="label">Mobile</label>
            <input v-model="societe.mobile" type="tel" data-phone-input class="input" placeholder="77 437 09 52" />
          </div>

          <div>
            <label class="label">Email professionnel</label>
            <input v-model="societe.email" type="email" class="input" placeholder="contact@xelltekk.com" />
          </div>

          <div>
            <label class="label">Site web</label>
            <input v-model="societe.site_web" type="text" class="input" placeholder="www.xelltekk.com" />
          </div>

          <div class="md:col-span-2">
            <label class="label">Slogan / Baseline (apparaît sous le logo)</label>
            <input v-model="societe.slogan" type="text" class="input" placeholder="Votre partenaire IT & Télécom de confiance" />
          </div>
        </div>
      </div>

      <!-- ===== SECTION 3 : BANQUE & PAIEMENTS ===== -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 class="font-semibold text-gray-900">💳 Informations bancaires & paiements</h3>
        </div>
        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">Banque</label>
            <input v-model="societe.banque" type="text" class="input" placeholder="ORABANK" />
          </div>

          <div>
            <label class="label">Numéro de compte / RIB</label>
            <input v-model="societe.rib" type="text" class="input font-mono" placeholder="043148301901" />
          </div>

          <div>
            <label class="label">Nom du propriétaire du compte</label>
            <input v-model="societe.titulaire_compte" type="text" class="input" placeholder="Ex: XELLTEKK SARL" />
          </div>

          <div class="md:col-span-2">
            <label class="label">IBAN</label>
            <input v-model="societe.iban" type="text" class="input font-mono" placeholder="SN08 SN175 0140 4043 1483 0190 178" />
          </div>

          <div>
            <label class="label">Code SWIFT/BIC</label>
            <input v-model="societe.swift" type="text" class="input font-mono" placeholder="Optionnel" />
          </div>

          <div>
            <label class="label">🌊 Wave Business</label>
            <input v-model="societe.wave_business" type="text" class="input" placeholder="+221 77 437 09 52" />
          </div>

          <div>
            <label class="label">🟠 Orange Money Business</label>
            <input v-model="societe.orange_money_business" type="text" class="input" placeholder="+221 77 437 09 52" />
          </div>

          <div>
            <label class="label">⚪ Free Money Business</label>
            <input v-model="societe.free_money_business" type="text" class="input" placeholder="Optionnel" />
          </div>
        </div>
      </div>

      <!-- ===== SECTION 4 : IDENTITÉ VISUELLE ===== -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 class="font-semibold text-gray-900">🎨 Identité visuelle</h3>
        </div>
        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Logo -->
          <div>
            <label class="label">Logo de la société</label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-xelltekk-500 transition-colors">
              <div v-if="societe.logo" class="mb-3">
                <img :src="logoUrl" alt="Logo" class="max-h-44 mx-auto" />
              </div>
              <div v-else class="mb-3 text-gray-400">
                <div class="text-5xl mb-1">🖼️</div>
                <div class="text-xs">Aucun logo défini</div>
              </div>

              <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/gif,image/webp"
                     @change="onFileSelected" class="hidden" />

              <div class="flex gap-2 justify-center">
                <button @click="$refs.fileInput.click()" :disabled="uploadingLogo" class="btn-secondary text-sm">
                  <span v-if="uploadingLogo">📤 Téléversement...</span>
                  <span v-else>📁 {{ societe.logo ? 'Changer le logo' : 'Choisir un logo' }}</span>
                </button>
                <button v-if="societe.logo" @click="supprimerLogo" :disabled="uploadingLogo" class="btn-danger text-sm">
                  🗑️ Retirer
                </button>
              </div>
              <p class="text-xs text-gray-500 mt-2">PNG, JPG ou GIF — Max 2 Mo — 500x180 px recommandé</p>
            </div>
          </div>

          <!-- Couleur principale -->
          <div>
            <label class="label">Couleur principale (PDF, bandeaux...)</label>
            <div class="flex items-center gap-3">
              <input v-model="societe.couleur_principale" type="color" class="h-10 w-20 rounded cursor-pointer border border-gray-300" />
              <input v-model="societe.couleur_principale" type="text" class="input flex-1 font-mono" placeholder="#1e40af" />
            </div>
            <p class="text-xs text-gray-500 mt-2">Utilisée pour l'en-tête des PDF et l'interface.</p>

            <div class="mt-4 p-3 rounded" :style="`background: ${societe.couleur_principale || '#1e40af'}; color: white;`">
              <div class="font-bold">Aperçu de la couleur</div>
              <div class="text-xs opacity-90">Ce bandeau apparaîtra en haut de vos PDF</div>
            </div>

            <div class="mt-3">
              <label class="label">Taux de TVA par défaut (%)</label>
              <input v-model.number="societe.tva_defaut" type="number" min="0" max="100" step="0.01" class="input" placeholder="18" />
            </div>

            <label class="mt-4 flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <input v-model="societe.afficher_tva_facture" type="checkbox" class="mt-1 h-4 w-4" />
              <span>
                <span class="block text-sm font-semibold text-gray-800">Afficher la TVA sur les factures PDF</span>
                <span class="block text-xs text-gray-500">Si désactivé, les PDF affichent uniquement le prix et le total, sans colonne TVA.</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- ===== SECTION 5 : MENTIONS PERSONNALISÉES ===== -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-5 py-3 bg-gray-50 border-b border-gray-200">
          <h3 class="font-semibold text-gray-900">📜 Mentions personnalisées</h3>
        </div>
        <div class="p-5">
          <label class="label">Pied de facture (apparaît en bas des PDF)</label>
          <textarea v-model="societe.pied_de_facture" rows="3" class="input"
                    placeholder="Ex: En cas de retard de paiement, des pénalités au taux légal en vigueur seront appliquées."></textarea>
          <p class="text-xs text-gray-500 mt-2">Texte libre — apparaîtra sur tous vos PDF (factures, devis, avoirs).</p>
        </div>
      </div>

      <!-- ===== ACTIONS ===== -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="text-sm text-gray-500">
          <span v-if="lastSaved">✓ Dernière sauvegarde : {{ formatDate(lastSaved) }}</span>
          <span v-else>Configurez les informations puis cliquez sur Enregistrer</span>
        </div>
        <div class="flex gap-3">
          <button @click="recharger" :disabled="saving" class="btn-secondary">🔄 Annuler</button>
          <button @click="enregistrer" :disabled="saving" class="btn-primary">
            <span v-if="saving">⏳ Enregistrement...</span>
            <span v-else>💾 Enregistrer les paramètres</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import api from '@/services/api'
import { useToast } from '@/composables/useToast'
import { useTheme } from '@/composables/useTheme'
import { useConfirm } from '@/composables/useConfirm'

const toast = useToast()
const { confirm: askConfirm } = useConfirm()

const loading = ref(true)
const saving = ref(false)
const uploadingLogo = ref(false)
const lastSaved = ref(null)
const fileInput = ref(null)
const { themes, themeId, setTheme } = useTheme()

const societe = reactive({
  id: null,
  nom: '', forme_juridique: '', ninea: '', rccm: '', capital_social: null, numero_tva: '',
  adresse: '', code_postal: '', bp: '', ville: '', pays: 'Sénégal',
  telephone: '', mobile: '', fax: '', email: '', site_web: '', slogan: '',
  banque: '', rib: '', titulaire_compte: '', iban: '', swift: '',
  wave_business: '', orange_money_business: '', free_money_business: '',
  logo: '', couleur_principale: '#1e40af',
  devise_defaut: 'XOF', tva_defaut: 18, afficher_tva_facture: false,
  pied_de_facture: '',
})

const logoUrl = computed(() => {
  if (! societe.logo) return ''
  const separator = societe.logo.includes('?') ? '&' : '?'
  return `${societe.logo}${separator}t=${Date.now()}`
})

const apercuPossible = computed(() => societe.id && societe.nom)

function notifierIdentiteSociete() {
  window.dispatchEvent(new CustomEvent('societe:updated', {
    detail: {
      nom: societe.nom,
      slogan: societe.slogan,
      logo: societe.logo,
      couleur_principale: societe.couleur_principale,
      devise_defaut: societe.devise_defaut,
    },
  }))
}

function choisirTheme(value) {
  setTheme(value)
}

async function charger() {
  loading.value = true
  try {
    const { data } = await api.get('/parametres/societe')
    Object.assign(societe, data)
    lastSaved.value = data.updated_at
  } catch (e) {
    toast.error('Erreur de chargement des paramètres')
  } finally {
    loading.value = false
  }
}

async function enregistrer() {
  saving.value = true
  try {
    // Préparer les données à envoyer (on retire logo et id qui ne sont pas dans la validation)
    const payload = { ...societe }
    delete payload.id
    delete payload.logo
    delete payload.created_at
    delete payload.updated_at

    const { data } = await api.put('/parametres/societe', payload)
    Object.assign(societe, data.societe)
    lastSaved.value = data.societe.updated_at
    notifierIdentiteSociete()
    toast.success('Paramètres enregistrés avec succès')
  } catch (e) {
    const msg = e.response.data.message || 'Erreur lors de l\'enregistrement'
    toast.error(msg)
    if (e.response.data.errors) {
      console.error('Erreurs de validation :', e.response.data.errors)
    }
  } finally {
    saving.value = false
  }
}

async function onFileSelected(event) {
  const file = event.target.files?.[0]
  if (! file) return

  if (file.size > 2 * 1024 * 1024) {
    toast.error('Le fichier dépasse 2 Mo')
    return
  }

  uploadingLogo.value = true
  const formData = new FormData()
  formData.append('logo', file)

  try {
    const { data } = await api.post('/parametres/societe/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    Object.assign(societe, data.societe)
    notifierIdentiteSociete()
    toast.success('Logo téléversé')
  } catch (e) {
    const msg = e.response.data.message || 'Erreur lors du téléversement'
    toast.error(msg)
  } finally {
    uploadingLogo.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function supprimerLogo() {
  if (!await askConfirm({ message: 'Supprimer le logo ?', tone: 'danger', confirmLabel: 'Supprimer' })) return
  uploadingLogo.value = true
  try {
    const { data } = await api.delete('/parametres/societe/logo')
    Object.assign(societe, data.societe)
    notifierIdentiteSociete()
    toast.success('Logo supprimé')
  } catch (e) {
    toast.error('Erreur')
  } finally {
    uploadingLogo.value = false
  }
}

async function recharger() {
  if (await askConfirm({ message: 'Annuler les modifications non enregistrées ?', tone: 'primary' })) {
    charger()
  }
}

async function ouvrirApercu() {
  // Cherche la première facture pour faire l'aperçu PDF
  try {
    const { data } = await api.get('/factures', { params: { per_page: 1 } })
    if (data.data && data.data.length > 0) {
      const facture = data.data[0]
      const { ouvrirPDF } = await import('@/services/pdf')
      await ouvrirPDF(`/factures/${facture.id}/pdf`)
    } else {
      toast.info('Créez d\'abord une facture pour voir l\'aperçu PDF.')
    }
  } catch (e) {
    toast.error('Impossible d\'ouvrir l\'aperçu')
  }
}

function formatDate(d) {
  if (! d) return '–'
  return new Date(d).toLocaleString('fr-FR')
}

onMounted(() => charger())
</script>

<style scoped>
.label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}
</style>
