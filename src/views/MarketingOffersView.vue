<template>
  <main class="offers-page min-h-screen overflow-hidden">
    <nav class="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5">
      <RouterLink to="/decouvrir" class="flex items-center gap-3">
        <span class="brand-mark">SL</span>
        <span>
          <strong class="block text-base text-white">Saytu Liggéey 2.0</strong>
          <span class="text-xs text-cyan-100/80">Offres commerciales</span>
        </span>
      </RouterLink>
      <div class="flex items-center gap-2">
        <RouterLink to="/conditions-commerciales" class="offers-link">Conditions</RouterLink>
        <RouterLink :to="{ name: 'decouvrir', hash: '#demo' }" class="offers-link">Démo</RouterLink>
        <RouterLink :to="{ name: 'decouvrir', hash: '#essai' }" class="offers-link">Essai</RouterLink>
        <RouterLink to="/login" class="offers-login">Connexion</RouterLink>
      </div>
    </nav>

    <section class="mx-auto w-full max-w-7xl px-5 pb-12 pt-3">
      <div class="offers-hero">
        <div>
          <p class="offers-kicker">Offres & tarifs</p>
          <h1>Choisissez la formule qui suit votre rythme.</h1>
          <p>
            Trois offres simples pour vendre, encaisser, suivre le stock et garder le contrôle.
            Le devis final reste personnalisable selon vos modules, utilisateurs et besoins terrain.
          </p>
        </div>
        <RouterLink :to="{ name: 'decouvrir', hash: '#essai' }" class="offers-primary">
          Démarrer un essai
          <ArrowRight class="h-5 w-5" />
        </RouterLink>
      </div>

      <section class="mt-6 grid gap-4 lg:grid-cols-3">
        <article
          v-for="offer in offers"
          :key="offer.key"
          class="offer-card"
          :class="{ 'offer-card-featured': offer.featured }"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="offer-eyebrow">{{ offer.audience }}</p>
              <h2>{{ offer.name }}</h2>
            </div>
            <span v-if="offer.featured" class="offer-badge">Conseillé</span>
          </div>

          <p class="offer-summary">{{ offer.summary }}</p>

          <div class="offer-price">
            <strong>{{ offer.price }}</strong>
            <span>{{ offer.note }}</span>
          </div>

          <ul class="offer-list">
            <li v-for="item in offer.items" :key="item">
              <Check class="h-4 w-4" />
              <span>{{ item }}</span>
            </li>
          </ul>

          <RouterLink
            :to="{ name: 'decouvrir', query: { plan: offer.key }, hash: '#essai' }"
            class="offer-cta"
          >
            Choisir {{ offer.name }}
            <ArrowRight class="h-4 w-4" />
          </RouterLink>
        </article>
      </section>

      <section class="comparison-card mt-6">
        <div class="comparison-head">
          <div>
            <p class="offers-kicker text-sky-700">Comparatif rapide</p>
            <h2>Voir l’essentiel sans se perdre.</h2>
          </div>
          <p>Les modules peuvent être ajustés avant émission du devis.</p>
        </div>

        <div class="comparison-table" role="table" aria-label="Comparatif des offres Saytu Liggéey">
          <div class="comparison-row comparison-header" role="row">
            <span role="columnheader">Fonction</span>
            <span role="columnheader">Starter</span>
            <span role="columnheader">Pro</span>
            <span role="columnheader">Business</span>
          </div>

          <div v-for="row in comparison" :key="row.label" class="comparison-row" role="row">
            <span role="cell">{{ row.label }}</span>
            <span role="cell">{{ row.starter }}</span>
            <span role="cell">{{ row.pro }}</span>
            <span role="cell">{{ row.business }}</span>
          </div>
        </div>
      </section>

      <section class="offers-bottom mt-6">
        <div>
          <ShieldCheck class="h-9 w-9" />
          <h2>Vous hésitez ? On vous conseille la bonne formule.</h2>
          <p>
            L’objectif n’est pas de vendre gros, mais de choisir propre : les modules utiles maintenant,
            avec la possibilité d’évoluer ensuite.
          </p>
        </div>
        <RouterLink :to="{ name: 'decouvrir', query: { plan: 'pro' }, hash: '#essai' }" class="offers-primary">
          Parler à XELLTEKK
          <ArrowRight class="h-5 w-5" />
        </RouterLink>
        <RouterLink to="/conditions-commerciales" class="offers-secondary-cta">
          Voir les conditions
        </RouterLink>
      </section>
    </section>
  </main>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { ArrowRight, Check, ShieldCheck } from 'lucide-vue-next'

const offers = [
  {
    key: 'starter',
    name: 'Starter',
    audience: 'Petite équipe',
    price: '15 000 FCFA / mois',
    note: 'démarrage léger',
    summary: 'Pour gérer les clients, devis, factures et encaissements simples sans complexité.',
    items: [
      'Clients, devis et factures',
      'Paiements clients',
      'Caisse simple',
      'Tableau de bord essentiel',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    audience: 'PME active',
    price: '35 000 FCFA / mois',
    note: 'meilleur équilibre',
    summary: 'Pour une entreprise qui vend, suit son stock, relance ses clients et contrôle ses opérations.',
    items: [
      'Tout Starter',
      'Stock, produits et entrepôts',
      'Achats fournisseurs',
      'Agenda, relances et activités',
    ],
    featured: true,
  },
  {
    key: 'business',
    name: 'Business',
    audience: 'Pilotage complet',
    price: '60 000 FCFA / mois',
    note: 'modules avancés',
    summary: 'Pour centraliser les ventes, la caisse, la trésorerie, les accès et les contrôles avancés.',
    items: [
      'Tout Pro',
      'Rôles et permissions avancés',
      'Sécurité, exports et historiques',
      'Leasing, RH et suivi complet',
    ],
  },
]

const comparison = [
  { label: 'Clients, devis, factures', starter: 'Inclus', pro: 'Inclus', business: 'Inclus' },
  { label: 'Caisse et paiements', starter: 'Simple', pro: 'Avancé', business: 'Avancé' },
  { label: 'Stock et achats', starter: '—', pro: 'Inclus', business: 'Inclus' },
  { label: 'Agenda et relances', starter: '—', pro: 'Inclus', business: 'Inclus' },
  { label: 'Rôles et permissions', starter: 'Base', pro: 'Base', business: 'Avancé' },
  { label: 'Sécurité et historiques', starter: 'Base', pro: 'Suivi', business: 'Complet' },
]
</script>

<style scoped>
.offers-page {
  background:
    radial-gradient(circle at 12% 12%, rgb(34 211 238 / 0.34), transparent 27rem),
    radial-gradient(circle at 92% 10%, rgb(37 99 235 / 0.32), transparent 30rem),
    linear-gradient(135deg, #12344a 0%, #0f4c81 48%, #0e7490 100%);
  color: white;
}

.offers-page::after {
  position: fixed;
  inset: auto -10% -26% -10%;
  height: 44vh;
  pointer-events: none;
  background: radial-gradient(ellipse at center, rgb(45 212 191 / 0.32), transparent 64%);
  content: '';
}

.brand-mark {
  display: grid;
  height: 2.75rem;
  width: 2.75rem;
  place-items: center;
  border-radius: 1rem;
  background: linear-gradient(135deg, #2563eb, #22d3ee);
  color: white;
  font-size: 1.05rem;
  font-weight: 1000;
  box-shadow: 0 18px 42px rgb(34 211 238 / 0.22);
}

.offers-link,
.offers-login,
.offers-primary,
.offers-secondary-cta,
.offer-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border-radius: 999px;
  font-weight: 900;
  transition: 160ms ease;
}

.offers-link {
  min-height: 2.6rem;
  padding: 0.75rem 0.9rem;
  color: rgb(207 250 254 / 0.92);
}

.offers-login {
  min-height: 2.6rem;
  border: 1px solid rgb(255 255 255 / 0.22);
  padding: 0.75rem 1rem;
  color: white;
}

.offers-secondary-cta {
  min-height: 3rem;
  border: 1px solid #bae6fd;
  background: #f8fcff;
  color: #075985;
  padding: 0.9rem 1.15rem;
  white-space: nowrap;
}

.offers-primary,
.offer-cta {
  background: linear-gradient(135deg, #2563eb, #22d3ee);
  color: white;
  box-shadow: 0 18px 44px rgb(14 165 233 / 0.28);
}

.offers-primary {
  min-height: 3rem;
  padding: 0.9rem 1.15rem;
  white-space: nowrap;
}

.offers-primary:hover,
.offer-cta:hover,
.offers-login:hover {
  transform: translateY(-1px);
  filter: brightness(1.04);
}

.offers-kicker {
  color: rgb(165 243 252 / 0.92);
  font-size: 0.78rem;
  font-weight: 1000;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.offers-hero,
.offer-card,
.comparison-card,
.offers-bottom {
  position: relative;
  z-index: 1;
  border: 1px solid rgb(255 255 255 / 0.18);
  background: rgb(255 255 255 / 0.94);
  color: #0f172a;
  box-shadow: 0 24px 80px rgb(8 47 73 / 0.24);
}

.offers-hero {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1.25rem;
  border-radius: 2rem;
  padding: 1.5rem;
}

.offers-hero h1 {
  margin-top: 0.65rem;
  max-width: 52rem;
  color: #082f49;
  font-size: clamp(2.1rem, 5vw, 4.4rem);
  font-weight: 1000;
  line-height: 0.98;
}

.offers-hero p:not(.offers-kicker) {
  margin-top: 1rem;
  max-width: 48rem;
  color: #475569;
  font-size: 1rem;
  line-height: 1.75;
}

.offer-card {
  border-radius: 1.75rem;
  padding: 1.15rem;
}

.offer-card-featured {
  border-color: #22d3ee;
  background: linear-gradient(180deg, #eff6ff, #ecfeff);
  transform: translateY(-0.3rem);
}

.offer-eyebrow {
  color: #0284c7;
  font-size: 0.75rem;
  font-weight: 1000;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.offer-card h2,
.comparison-head h2,
.offers-bottom h2 {
  color: #0f172a;
  font-weight: 1000;
}

.offer-card h2 {
  margin-top: 0.25rem;
  font-size: 1.75rem;
}

.offer-badge {
  border-radius: 999px;
  background: #0ea5e9;
  color: white;
  padding: 0.3rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 1000;
}

.offer-summary {
  margin-top: 0.9rem;
  min-height: 4.7rem;
  color: #475569;
  line-height: 1.65;
}

.offer-price {
  margin-top: 1rem;
  border-top: 1px solid #dbeafe;
  padding-top: 1rem;
}

.offer-price strong {
  display: block;
  color: #075985;
  font-size: 1.45rem;
  font-weight: 1000;
}

.offer-price span {
  color: #64748b;
  font-size: 0.84rem;
  font-weight: 800;
}

.offer-list {
  margin-top: 1rem;
  display: grid;
  gap: 0.55rem;
  color: #334155;
  font-weight: 760;
}

.offer-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.offer-list svg {
  flex-shrink: 0;
  color: #0891b2;
}

.offer-cta {
  margin-top: 1.15rem;
  min-height: 2.9rem;
  width: 100%;
}

.comparison-card,
.offers-bottom {
  border-radius: 1.75rem;
  padding: 1.1rem;
}

.comparison-head,
.offers-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.comparison-head h2,
.offers-bottom h2 {
  margin-top: 0.35rem;
  font-size: 1.45rem;
}

.comparison-head p,
.offers-bottom p {
  color: #475569;
  line-height: 1.6;
}

.comparison-head > p {
  max-width: 26rem;
  font-size: 0.92rem;
}

.comparison-table {
  margin-top: 1rem;
  overflow: hidden;
  border: 1px solid #dbeafe;
  border-radius: 1.15rem;
}

.comparison-row {
  display: grid;
  grid-template-columns: 1.5fr repeat(3, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid #dbeafe;
}

.comparison-row:first-child {
  border-top: 0;
}

.comparison-row span {
  padding: 0.75rem 0.9rem;
  color: #334155;
  font-size: 0.9rem;
  font-weight: 780;
}

.comparison-row span:not(:first-child) {
  text-align: center;
}

.comparison-header {
  background: linear-gradient(135deg, #e0f2fe, #ecfeff);
}

.comparison-header span {
  color: #075985;
  font-weight: 1000;
}

.offers-bottom svg {
  color: #0891b2;
}

.offers-bottom > div {
  max-width: 48rem;
}

@media (max-width: 900px) {
  .offers-hero,
  .comparison-head,
  .offers-bottom {
    align-items: stretch;
    flex-direction: column;
  }

  .offer-card-featured {
    transform: none;
  }
}

@media (max-width: 640px) {
  .offers-link {
    display: none;
  }

  .comparison-table {
    overflow-x: auto;
  }

  .comparison-row {
    min-width: 620px;
  }
}
</style>
