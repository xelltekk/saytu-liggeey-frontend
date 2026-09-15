<template>
  <main class="terms-page min-h-screen overflow-hidden">
    <nav class="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5">
      <RouterLink to="/decouvrir" class="flex items-center gap-3">
        <span class="brand-mark">SL</span>
        <span>
          <strong class="block text-base text-white">Saytu Liggéey 2.0</strong>
          <span class="text-xs text-cyan-100/80">Conditions commerciales</span>
        </span>
      </RouterLink>
      <div class="flex items-center gap-2">
        <RouterLink to="/offres" class="terms-link">Offres</RouterLink>
        <RouterLink :to="{ name: 'decouvrir', hash: '#demo' }" class="terms-login">Demander une démo</RouterLink>
      </div>
    </nav>

    <section class="mx-auto w-full max-w-7xl px-5 pb-14 pt-3">
      <div class="terms-hero">
        <div>
          <p class="terms-kicker">Cadre client</p>
          <h1>Des conditions simples avant de démarrer.</h1>
          <p>
            Cette page résume le fonctionnement commercial de Saytu Liggéey.
            Le devis et le contrat signés restent les documents qui font foi pour chaque client.
          </p>
        </div>
        <RouterLink :to="{ name: 'decouvrir', query: { plan: 'pro' }, hash: '#demo' }" class="terms-primary">
          Demander un contrat personnalisé
          <ArrowRight class="h-5 w-5" />
        </RouterLink>
      </div>

      <section class="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article class="terms-card terms-summary">
          <BookOpenText class="h-9 w-9" />
          <h2>Ce que le client obtient</h2>
          <ul>
            <li v-for="item in included" :key="item">
              <Check class="h-4 w-4" />
              <span>{{ item }}</span>
            </li>
          </ul>
        </article>

        <article class="terms-card">
          <div class="terms-grid">
            <div v-for="step in steps" :key="step.title" class="terms-step">
              <span>{{ step.number }}</span>
              <div>
                <h3>{{ step.title }}</h3>
                <p>{{ step.text }}</p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="section in sections" :key="section.title" class="terms-card terms-small-card">
          <component :is="section.icon" class="h-7 w-7" />
          <h2>{{ section.title }}</h2>
          <p>{{ section.text }}</p>
        </article>
      </section>

      <section class="terms-bottom mt-6">
        <div>
          <ShieldCheck class="h-9 w-9" />
          <h2>À retenir</h2>
          <p>
            L’abonnement est activé après acceptation du devis et paramétrage de la licence.
            Les modules, utilisateurs, prix et conditions exactes sont confirmés dans le contrat client.
          </p>
        </div>
        <div class="terms-actions">
          <RouterLink to="/offres" class="terms-secondary">Comparer les offres</RouterLink>
          <a
            href="ms-outlook://compose?to=xelltekk%40xelltekk.com&subject=Demande%20contrat%20Saytu%20Ligg%C3%A9ey"
            class="terms-primary"
          >
            Écrire à XELLTEKK
            <ArrowRight class="h-5 w-5" />
          </a>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import {
  ArrowRight,
  BookOpenText,
  Check,
  Clock3,
  CreditCard,
  DatabaseZap,
  Headphones,
  KeyRound,
  RotateCcw,
  ShieldCheck,
} from 'lucide-vue-next'

const included = [
  'Accès à l’application selon la formule choisie.',
  'Modules activés par licence : ventes, caisse, stock, comptabilité ou autres selon contrat.',
  'Paramétrage initial de l’entreprise et des accès utilisateurs.',
  'Accompagnement au démarrage et support selon priorité convenue.',
]

const steps = [
  {
    number: '01',
    title: 'Démo et cadrage',
    text: 'On vérifie les modules utiles, le nombre d’utilisateurs et le périmètre réel avant le devis.',
  },
  {
    number: '02',
    title: 'Devis et contrat',
    text: 'XELLTEKK transmet une proposition claire avec formule, prix, durée, support et modalités de paiement.',
  },
  {
    number: '03',
    title: 'Activation licence',
    text: 'Après accord, la licence est créée, les modules sont activés et les premiers utilisateurs sont configurés.',
  },
  {
    number: '04',
    title: 'Mise en service',
    text: 'L’équipe démarre avec les données de base, les rôles, les modèles PDF et les premières vérifications.',
  },
]

const sections = [
  {
    title: 'Abonnement',
    text: 'Le service fonctionne par abonnement. La formule peut évoluer si l’entreprise ajoute des modules ou utilisateurs.',
    icon: KeyRound,
  },
  {
    title: 'Paiement',
    text: 'Les conditions de règlement sont précisées sur le devis : à la réception, mensuel, annuel ou selon accord.',
    icon: CreditCard,
  },
  {
    title: 'Support',
    text: 'Les demandes sont traitées selon leur priorité : blocage, correction, assistance ou amélioration fonctionnelle.',
    icon: Headphones,
  },
  {
    title: 'Données',
    text: 'Le client reste propriétaire de ses données. Les exports disponibles facilitent la reprise et le contrôle.',
    icon: DatabaseZap,
  },
  {
    title: 'Sécurité',
    text: 'Les accès sont nominatifs. Les rôles et permissions permettent de limiter ce que chaque utilisateur peut faire.',
    icon: ShieldCheck,
  },
  {
    title: 'Résiliation',
    text: 'La résiliation, le préavis et l’export des données sont confirmés dans le contrat signé avec le client.',
    icon: RotateCcw,
  },
  {
    title: 'Disponibilité',
    text: 'Les maintenances importantes sont planifiées autant que possible hors périodes critiques pour le client.',
    icon: Clock3,
  },
]
</script>

<style scoped>
.terms-page {
  background:
    radial-gradient(circle at 12% 12%, rgb(34 211 238 / 0.34), transparent 27rem),
    radial-gradient(circle at 92% 10%, rgb(37 99 235 / 0.32), transparent 30rem),
    linear-gradient(135deg, #12344a 0%, #0f4c81 48%, #0e7490 100%);
  color: white;
}

.terms-page::after {
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

.terms-link,
.terms-login,
.terms-primary,
.terms-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border-radius: 999px;
  font-weight: 900;
  transition: 160ms ease;
}

.terms-link {
  min-height: 2.6rem;
  padding: 0.75rem 0.9rem;
  color: rgb(207 250 254 / 0.92);
}

.terms-login {
  min-height: 2.6rem;
  border: 1px solid rgb(255 255 255 / 0.22);
  padding: 0.75rem 1rem;
  color: white;
}

.terms-primary {
  min-height: 3rem;
  background: linear-gradient(135deg, #2563eb, #22d3ee);
  color: white;
  padding: 0.9rem 1.15rem;
  box-shadow: 0 18px 44px rgb(14 165 233 / 0.28);
  white-space: nowrap;
}

.terms-secondary {
  min-height: 3rem;
  border: 1px solid #bae6fd;
  background: #f8fcff;
  color: #075985;
  padding: 0.9rem 1.15rem;
}

.terms-primary:hover,
.terms-secondary:hover,
.terms-login:hover {
  transform: translateY(-1px);
  filter: brightness(1.04);
}

.terms-kicker {
  color: rgb(165 243 252 / 0.92);
  font-size: 0.78rem;
  font-weight: 1000;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.terms-hero,
.terms-card,
.terms-bottom {
  position: relative;
  z-index: 1;
  border: 1px solid rgb(255 255 255 / 0.18);
  background: rgb(255 255 255 / 0.94);
  color: #0f172a;
  box-shadow: 0 24px 80px rgb(8 47 73 / 0.24);
}

.terms-hero {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1.25rem;
  border-radius: 2rem;
  padding: 1.5rem;
}

.terms-hero h1 {
  margin-top: 0.65rem;
  max-width: 56rem;
  color: #082f49;
  font-size: clamp(2rem, 4.6vw, 4rem);
  font-weight: 1000;
  line-height: 1;
}

.terms-hero p:not(.terms-kicker) {
  margin-top: 1rem;
  max-width: 52rem;
  color: #475569;
  font-size: 1rem;
  line-height: 1.75;
}

.terms-card,
.terms-bottom {
  border-radius: 1.75rem;
  padding: 1.15rem;
}

.terms-card > svg,
.terms-bottom svg {
  color: #0891b2;
}

.terms-card h2,
.terms-bottom h2 {
  margin-top: 0.65rem;
  color: #0f172a;
  font-size: 1.35rem;
  font-weight: 1000;
}

.terms-summary ul {
  margin-top: 1rem;
  display: grid;
  gap: 0.65rem;
}

.terms-summary li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: #334155;
  line-height: 1.55;
  font-weight: 760;
}

.terms-summary li svg {
  margin-top: 0.2rem;
  flex-shrink: 0;
  color: #0891b2;
}

.terms-grid {
  display: grid;
  gap: 0.8rem;
}

.terms-step {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.85rem;
  border: 1px solid #dbeafe;
  border-radius: 1.15rem;
  background: linear-gradient(135deg, #f8fcff, #ecfeff);
  padding: 0.9rem;
}

.terms-step > span {
  display: grid;
  height: 2.35rem;
  min-width: 2.35rem;
  place-items: center;
  border-radius: 0.9rem;
  background: #dbeafe;
  color: #075985;
  font-size: 0.82rem;
  font-weight: 1000;
}

.terms-step h3 {
  color: #0f172a;
  font-size: 1rem;
  font-weight: 1000;
}

.terms-step p,
.terms-small-card p,
.terms-bottom p {
  margin-top: 0.35rem;
  color: #475569;
  line-height: 1.62;
}

.terms-small-card {
  min-height: 12.5rem;
}

.terms-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.terms-bottom > div:first-child {
  max-width: 54rem;
}

.terms-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .terms-hero,
  .terms-bottom {
    align-items: stretch;
    flex-direction: column;
  }

  .terms-actions {
    justify-content: stretch;
  }

  .terms-actions > * {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .terms-link {
    display: none;
  }
}
</style>
