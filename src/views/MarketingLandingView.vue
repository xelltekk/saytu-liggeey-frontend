<template>
  <main class="saytu-landing min-h-screen overflow-hidden">
    <nav class="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5">
      <RouterLink to="/decouvrir" class="flex items-center gap-3">
        <span class="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-300 text-lg font-black text-white shadow-lg shadow-cyan-500/20">SL</span>
        <span>
          <strong class="block text-base text-white">Saytu Liggéey 2.0</strong>
          <span class="text-xs text-cyan-100/80">ERP simple pour PME</span>
        </span>
      </RouterLink>
      <div class="flex items-center gap-2">
        <a href="#demo" class="landing-secondary">Demander une démo</a>
        <RouterLink to="/login" class="landing-login">Connexion</RouterLink>
      </div>
    </nav>

    <section class="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 pb-12 pt-4 lg:grid-cols-[1fr_420px] lg:pb-20">
      <div class="relative z-10">
        <p class="landing-kicker">Gestion commerciale, stock, caisse et recouvrement</p>
        <h1 class="mt-5 max-w-4xl text-4xl font-black leading-tight text-white md:text-6xl">
          Pilotez votre entreprise sans vous perdre dans les tableaux.
        </h1>
        <p class="mt-5 max-w-2xl text-base leading-8 text-cyan-50/86 md:text-lg">
          Saytu Liggéey aide les PME à suivre les clients, devis, factures, stocks, paiements, caisse, achats et activités dans une interface claire, rapide et adaptée au terrain.
        </p>

        <div class="mt-7 flex flex-wrap gap-3">
          <a href="#demo" class="landing-primary">
            <CalendarCheck class="h-5 w-5" />
            Réserver une démo
          </a>
          <RouterLink to="/login" class="landing-ghost">Accéder à l’espace client</RouterLink>
        </div>

        <div class="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
          <article v-for="metric in metrics" :key="metric.label" class="landing-metric">
            <strong>{{ metric.value }}</strong>
            <span>{{ metric.label }}</span>
          </article>
        </div>
      </div>

      <section id="demo" class="landing-form-card">
        <div class="mb-5 flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.18em] text-sky-600">Démo personnalisée</p>
            <h2 class="mt-1 text-2xl font-black text-slate-950">Parlez-nous de votre besoin</h2>
          </div>
          <span class="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">24h ouvrées</span>
        </div>

        <form class="space-y-3" @submit.prevent="submitDemoRequest">
          <input v-model="form.website" tabindex="-1" autocomplete="off" class="hidden" aria-hidden="true" />

          <label class="landing-field">
            <span>Société *</span>
            <input v-model.trim="form.societe" required placeholder="Ex: SEAS Sénégal" />
          </label>

          <div class="grid gap-3 sm:grid-cols-2">
            <label class="landing-field">
              <span>Contact</span>
              <input v-model.trim="form.contact_nom" placeholder="Nom du responsable" />
            </label>

            <label class="landing-field">
              <span>Téléphone</span>
              <input v-model="form.telephone" type="tel" data-phone-input placeholder="77 123 45 67" />
            </label>
          </div>

          <label class="landing-field">
            <span>Email professionnel *</span>
            <input v-model.trim="form.email" type="email" required placeholder="contact@entreprise.com" />
          </label>

          <div class="grid gap-3 sm:grid-cols-2">
            <label class="landing-field">
              <span>Formule visée</span>
              <select v-model="form.plan">
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
              </select>
            </label>

            <label class="landing-field">
              <span>Taille équipe</span>
              <select v-model="form.taille">
                <option value="1-3 utilisateurs">1–3 utilisateurs</option>
                <option value="4-10 utilisateurs">4–10 utilisateurs</option>
                <option value="11-25 utilisateurs">11–25 utilisateurs</option>
                <option value="25+ utilisateurs">25+ utilisateurs</option>
              </select>
            </label>
          </div>

          <label class="landing-field">
            <span>Besoin principal</span>
            <select v-model="form.besoin">
              <option value="Facturation et recouvrement">Facturation et recouvrement</option>
              <option value="Stock et achats">Stock et achats</option>
              <option value="Caisse et boutique">Caisse et boutique</option>
              <option value="Leasing imprimantes">Leasing imprimantes</option>
              <option value="Gestion complète">Gestion complète</option>
            </select>
          </label>

          <label class="landing-field">
            <span>Message</span>
            <textarea v-model.trim="form.message" rows="3" placeholder="Dites-nous ce que vous voulez suivre ou améliorer..."></textarea>
          </label>

          <button type="submit" class="landing-submit" :disabled="submitting">
            <Send class="h-5 w-5" />
            {{ submitting ? 'Envoi en cours...' : 'Envoyer ma demande' }}
          </button>

          <p v-if="successMessage" class="landing-success">{{ successMessage }}</p>
          <p v-if="errorMessage" class="landing-error">{{ errorMessage }}</p>
        </form>
      </section>
    </section>

    <section class="relative z-10 mx-auto grid w-full max-w-7xl gap-4 px-5 pb-14 md:grid-cols-3">
      <article v-for="feature in features" :key="feature.title" class="landing-feature">
        <span class="landing-feature-icon">
          <component :is="feature.icon" class="h-5 w-5" />
        </span>
        <h3>{{ feature.title }}</h3>
        <p>{{ feature.text }}</p>
      </article>
    </section>

    <section class="relative z-10 mx-auto w-full max-w-7xl px-5 pb-20">
      <div class="landing-pricing">
        <div class="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="landing-kicker text-sky-700">Offres simples</p>
            <h2 class="mt-2 text-3xl font-black text-slate-950">Démarrer petit, évoluer sans changer d’outil.</h2>
          </div>
          <p class="max-w-md text-sm leading-6 text-slate-600">Les montants sont indicatifs. Le devis final est généré depuis XELLTEKK Admin selon les modules et le nombre d’utilisateurs.</p>
        </div>

        <div class="grid gap-3 md:grid-cols-3">
          <article v-for="offer in offers" :key="offer.name" class="landing-offer" :class="offer.featured ? 'landing-offer-featured' : ''">
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3>{{ offer.name }}</h3>
                <p>{{ offer.text }}</p>
              </div>
              <span v-if="offer.featured">Conseillé</span>
            </div>
            <strong>{{ offer.price }}</strong>
            <ul>
              <li v-for="item in offer.items" :key="item">
                <Check class="h-4 w-4" />
                {{ item }}
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  CalendarCheck,
  Check,
  ClipboardList,
  Layers3,
  Send,
  WalletCards,
} from 'lucide-vue-next'
import api from '@/services/api'

const submitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const form = reactive({
  website: '',
  societe: '',
  contact_nom: '',
  email: '',
  telephone: '',
  plan: 'business',
  taille: '4-10 utilisateurs',
  besoin: 'Gestion complète',
  message: '',
})

const metrics = [
  { value: '360°', label: 'vue client claire' },
  { value: '3 min', label: 'devis ou facture' },
  { value: '1 outil', label: 'vente, stock, caisse' },
]

const features = [
  {
    title: 'Commercial plus fluide',
    text: 'Prospects, clients, devis, factures, relances et situation client dans un même parcours.',
    icon: ClipboardList,
  },
  {
    title: 'Stock maîtrisé',
    text: 'Produits, photos, catégories, entrepôts, mouvements et transferts internes suivis proprement.',
    icon: Layers3,
  },
  {
    title: 'Caisse et trésorerie',
    text: 'Tickets, modes de paiement, clôture, paiements clients, écarts et alertes pour garder le contrôle.',
    icon: WalletCards,
  },
]

const offers = [
  {
    name: 'Starter',
    price: '15 000 FCFA / mois',
    text: 'Pour structurer rapidement la vente.',
    items: ['Clients et devis', 'Factures', 'Caisse simple'],
  },
  {
    name: 'Pro',
    price: '35 000 FCFA / mois',
    text: 'Pour une PME qui vend et suit son stock.',
    items: ['Stock et achats', 'Recouvrement', 'Agenda et activités'],
    featured: true,
  },
  {
    name: 'Business',
    price: '60 000 FCFA / mois',
    text: 'Pour piloter toute l’entreprise.',
    items: ['Tous les modules', 'Rôles avancés', 'Sécurité et exports'],
  },
]

async function submitDemoRequest() {
  successMessage.value = ''
  errorMessage.value = ''
  submitting.value = true

  try {
    const { data } = await api.post('/public/demo-request', {
      ...form,
      telephone: cleanPhone(form.telephone),
    })
    successMessage.value = data.message || 'Demande transmise. Nous vous recontactons rapidement.'
    Object.assign(form, {
      website: '',
      societe: '',
      contact_nom: '',
      email: '',
      telephone: '',
      plan: 'business',
      taille: '4-10 utilisateurs',
      besoin: 'Gestion complète',
      message: '',
    })
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Impossible d’envoyer la demande pour le moment.'
  } finally {
    submitting.value = false
  }
}

function cleanPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('00221')) return digits.slice(5, 14)
  if (digits.startsWith('221') && digits.length > 9) return digits.slice(3, 12)
  return digits.slice(0, 9)
}
</script>

<style scoped>
.saytu-landing {
  background:
    radial-gradient(circle at 8% 10%, rgb(34 211 238 / 0.36), transparent 30rem),
    radial-gradient(circle at 92% 8%, rgb(37 99 235 / 0.36), transparent 28rem),
    linear-gradient(135deg, #12344a 0%, #0f4c81 46%, #0e7490 100%);
  color: white;
}

.saytu-landing::after {
  position: fixed;
  inset: auto -10% -25% -10%;
  height: 42vh;
  pointer-events: none;
  background: radial-gradient(ellipse at center, rgb(45 212 191 / 0.36), transparent 64%);
  content: '';
}

.landing-kicker {
  color: rgb(165 243 252 / 0.92);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.landing-primary,
.landing-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb, #22d3ee);
  color: white;
  font-weight: 900;
  box-shadow: 0 18px 40px rgb(14 165 233 / 0.28);
  transition: 160ms ease;
}

.landing-primary {
  padding: 0.9rem 1.2rem;
}

.landing-submit {
  width: 100%;
  min-height: 3rem;
}

.landing-primary:hover,
.landing-submit:hover {
  transform: translateY(-1px);
  filter: brightness(1.04);
}

.landing-submit:disabled {
  cursor: wait;
  opacity: 0.72;
  transform: none;
}

.landing-ghost,
.landing-login,
.landing-secondary {
  display: inline-flex;
  min-height: 2.55rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 0.88rem;
  font-weight: 800;
}

.landing-ghost,
.landing-login {
  border: 1px solid rgb(255 255 255 / 0.22);
  color: white;
  padding: 0.75rem 1rem;
}

.landing-secondary {
  color: rgb(207 250 254 / 0.9);
  padding: 0.75rem 0.2rem;
}

.landing-metric,
.landing-feature,
.landing-form-card,
.landing-pricing {
  border: 1px solid rgb(255 255 255 / 0.18);
  background: rgb(255 255 255 / 0.94);
  box-shadow: 0 24px 80px rgb(8 47 73 / 0.26);
}

.landing-metric {
  border-radius: 1.35rem;
  padding: 1rem;
}

.landing-metric strong {
  display: block;
  color: #082f49;
  font-size: 1.7rem;
  font-weight: 1000;
}

.landing-metric span {
  color: #0f6f8f;
  font-size: 0.82rem;
  font-weight: 800;
}

.landing-form-card,
.landing-pricing {
  border-radius: 2rem;
  color: #0f172a;
  padding: 1.2rem;
}

.landing-field span {
  display: block;
  margin-bottom: 0.35rem;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 900;
}

.landing-field input,
.landing-field select,
.landing-field textarea {
  width: 100%;
  border: 1px solid #bae6fd;
  border-radius: 1rem;
  background: #f8fcff;
  color: #0f172a;
  outline: none;
  padding: 0.82rem 0.9rem;
  transition: 140ms ease;
}

.landing-field textarea {
  resize: vertical;
}

.landing-field input:focus,
.landing-field select:focus,
.landing-field textarea:focus {
  border-color: #22d3ee;
  box-shadow: 0 0 0 4px rgb(34 211 238 / 0.18);
}

.landing-success,
.landing-error {
  border-radius: 1rem;
  padding: 0.8rem 0.9rem;
  font-size: 0.88rem;
  font-weight: 800;
}

.landing-success {
  background: #dcfce7;
  color: #047857;
}

.landing-error {
  background: #fee2e2;
  color: #b91c1c;
}

.landing-feature {
  border-radius: 1.5rem;
  color: #0f172a;
  padding: 1rem;
}

.landing-feature-icon {
  display: grid;
  height: 2.8rem;
  width: 2.8rem;
  place-items: center;
  border-radius: 1rem;
  background: linear-gradient(135deg, #dbeafe, #cffafe);
  color: #0284c7;
}

.landing-feature h3,
.landing-offer h3 {
  margin-top: 0.9rem;
  color: #0f172a;
  font-size: 1.08rem;
  font-weight: 1000;
}

.landing-feature p,
.landing-offer p {
  margin-top: 0.35rem;
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.55;
}

.landing-offer {
  border: 1px solid #dbeafe;
  border-radius: 1.35rem;
  background: #f8fafc;
  padding: 1rem;
}

.landing-offer-featured {
  border-color: #22d3ee;
  background: linear-gradient(180deg, #eff6ff, #ecfeff);
}

.landing-offer span {
  border-radius: 999px;
  background: #0ea5e9;
  color: white;
  padding: 0.25rem 0.55rem;
  font-size: 0.7rem;
  font-weight: 900;
}

.landing-offer strong {
  display: block;
  margin-top: 1rem;
  color: #075985;
  font-size: 1.25rem;
  font-weight: 1000;
}

.landing-offer ul {
  margin-top: 0.85rem;
  display: grid;
  gap: 0.45rem;
  color: #334155;
  font-size: 0.88rem;
  font-weight: 700;
}

.landing-offer li {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.landing-offer li svg {
  color: #0891b2;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .landing-secondary {
    display: none;
  }
}
</style>
