import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
      },
      {
        path: 'dashboard',
        redirect: { name: 'dashboard' },
      },
      {
        path: 'clients',
        name: 'clients',
        component: () => import('@/views/ClientsView.vue'),
      },
      {
        path: 'prospection',
        name: 'prospection',
        component: () => import('@/views/ProspectionView.vue'),
      },
      {
        path: 'produits',
        name: 'produits',
        component: () => import('@/views/ProduitsView.vue'),
      },
      {
        path: 'devis',
        name: 'devis',
        component: () => import('@/views/DevisView.vue'),
      },
      {
        path: 'factures',
        name: 'factures',
        component: () => import('@/views/FacturesView.vue'),
      },
      {
        path: 'paiements',
        name: 'paiements',
        component: () => import('@/views/PaiementsView.vue'),
      },
      {
        path: 'achats',
        name: 'achats',
        component: () => import('@/views/AchatsView.vue'),
      },
      {
        path: 'leasing',
        name: 'leasing',
        component: () => import('@/views/LeasingView.vue'),
      },
      {
        path: 'fournisseurs-reglements',
        name: 'fournisseurs-reglements',
        component: () => import('@/views/FournisseurReglementsView.vue'),
      },
      {
        path: 'depenses',
        name: 'depenses',
        component: () => import('@/views/DepensesView.vue'),
      },
      {
        path: 'tresorerie-comptes',
        name: 'tresorerie-comptes',
        component: () => import('@/views/TresorerieComptesView.vue'),
      },
      {
        path: 'caisse',
        name: 'caisse',
        component: () => import('@/views/CaisseView.vue'),
      },
      {
        path: 'entrepots',
        name: 'entrepots',
        component: () => import('@/views/EntrepotsView.vue'),
      },
      {
        path: 'stock',
        name: 'stock',
        component: () => import('@/views/StockView.vue'),
      },
      {
        path: 'compta/plan',
        name: 'compta-plan',
        component: () => import('@/views/PlanComptableView.vue'),
      },
      {
        path: 'compta/ecritures',
        name: 'compta-ecritures',
        component: () => import('@/views/EcrituresView.vue'),
      },
      {
        path: 'ecritures',
        redirect: { name: 'compta-ecritures' },
      },
      {
        path: 'compta/grand-livre',
        name: 'compta-grand-livre',
        component: () => import('@/views/GrandLivreView.vue'),
      },
      {
        path: 'compta/balance',
        name: 'compta-balance',
        component: () => import('@/views/BalanceView.vue'),
      },
      {
        path: 'parametres',
        name: 'parametres',
        component: () => import('@/views/ParametresView.vue'),
      },
      {
        path: 'utilisateurs',
        name: 'utilisateurs',
        component: () => import('@/views/UtilisateursView.vue'),
      },
      {
        path: 'activites',
        name: 'activites',
        component: () => import('@/views/ActivitesView.vue'),
      },
      {
        path: 'notifications',
        name: 'notifications',
        component: () => import('@/views/NotificationsView.vue'),
      },
      {
        path: 'rh',
        name: 'rh',
        component: () => import('@/views/RhView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Mapping route → rôles autorisés
const routeRoles = {
  '/clients': ['admin', 'gerant', 'commercial', 'comptable'],
  '/prospection': ['admin', 'gerant', 'commercial'],
  '/produits': ['admin', 'gerant', 'commercial', 'magasinier', 'comptable'],
  '/entrepots': ['admin', 'gerant', 'magasinier', 'comptable'],
  '/stock': ['admin', 'gerant', 'magasinier', 'comptable'],
  '/devis': ['admin', 'gerant', 'commercial', 'comptable'],
  '/factures': ['admin', 'gerant', 'commercial', 'comptable'],
  '/paiements': ['admin', 'gerant', 'comptable', 'caissier'],
  '/achats': ['admin', 'gerant', 'magasinier', 'comptable'],
  '/leasing': ['admin', 'gerant', 'commercial', 'magasinier', 'comptable'],
  '/fournisseurs-reglements': ['admin', 'gerant', 'comptable'],
  '/depenses': ['admin', 'gerant', 'comptable', 'caissier', 'commercial', 'magasinier'],
  '/tresorerie-comptes': ['admin', 'gerant', 'comptable'],
  '/caisse': ['admin', 'gerant', 'comptable', 'caissier'],
  '/compta': ['admin', 'gerant', 'comptable'],
  '/utilisateurs': ['admin'],
  '/activites': ['admin', 'gerant'],
  '/notifications': ['admin', 'gerant', 'commercial', 'magasinier', 'comptable', 'caissier'],
  '/rh': ['admin', 'gerant', 'commercial', 'magasinier', 'comptable'],
  '/parametres': ['admin'],
}

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // 1) Route invité (login) → toujours libre
  if (to.meta.guest) {
    // Si déjà connecté, on l'envoie au dashboard
    if (auth.isAuthenticated && to.name === 'login') {
      return next({ name: auth.user?.role === 'caissier' ? 'caisse' : 'dashboard' })
    }
    return next()
  }

  // 2) Route protégée + non connecté → vers login
  if (to.meta.requiresAuth && ! auth.isAuthenticated) {
    return next({ name: 'login' })
  }

  // 3) Vérification du rôle pour cette route
  const role = auth.user?.role
  if (role === 'caissier' && to.path === '/') {
    return next({ name: 'caisse' })
  }
  if (role) {
    const prefix = Object.keys(routeRoles).find(p => to.path.startsWith(p))
    if (prefix) {
      const allowedRoles = routeRoles[prefix]
      if (! allowedRoles.includes(role)) {
        // Pas autorisé → vers le dashboard (évite la boucle car dashboard est libre)
        if (to.name !== 'dashboard') {
          return next({ name: role === 'caissier' ? 'caisse' : 'dashboard' })
        }
      }
    }
  }

  // 4) Tout va bien
  next()
})

export default router
