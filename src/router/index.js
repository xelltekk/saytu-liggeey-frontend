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
        path: 'aujourdhui',
        name: 'aujourdhui',
        component: () => import('@/views/AujourdhuiView.vue'),
      },
      {
        path: 'agenda',
        name: 'agenda',
        component: () => import('@/views/AgendaView.vue'),
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
        path: 'categories-produits',
        name: 'categories-produits',
        component: () => import('@/views/CategoriesProduitsView.vue'),
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
        path: 'recouvrement',
        name: 'recouvrement',
        component: () => import('@/views/RecouvrementView.vue'),
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
        path: 'roles-permissions',
        name: 'roles-permissions',
        component: () => import('@/views/RolesPermissionsView.vue'),
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
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) {
      return {
        el: to.hash,
        top: 24,
        behavior: 'smooth',
      }
    }

    return false
  },
})

// Mapping route → rôles autorisés
const routeRoles = {
  '/clients': ['admin', 'gerant', 'commercial', 'comptable'],
  '/aujourdhui': ['admin', 'gerant', 'commercial', 'magasinier', 'comptable', 'caissier'],
  '/agenda': ['admin', 'gerant', 'commercial', 'magasinier', 'comptable', 'caissier'],
  '/prospection': ['admin', 'gerant', 'commercial'],
  '/produits': ['admin', 'gerant', 'commercial', 'magasinier', 'comptable'],
  '/categories-produits': ['admin', 'gerant', 'commercial', 'magasinier', 'comptable'],
  '/entrepots': ['admin', 'gerant', 'magasinier', 'comptable'],
  '/stock': ['admin', 'gerant', 'magasinier', 'comptable'],
  '/devis': ['admin', 'gerant', 'commercial', 'comptable'],
  '/factures': ['admin', 'gerant', 'commercial', 'comptable'],
  '/paiements': ['admin', 'gerant', 'comptable', 'caissier'],
  '/recouvrement': ['admin', 'gerant', 'commercial', 'comptable'],
  '/achats': ['admin', 'gerant', 'magasinier', 'comptable'],
  '/leasing': ['admin', 'gerant', 'commercial', 'magasinier', 'comptable'],
  '/fournisseurs-reglements': ['admin', 'gerant', 'comptable'],
  '/depenses': ['admin', 'gerant', 'comptable', 'caissier', 'commercial', 'magasinier'],
  '/tresorerie-comptes': ['admin', 'gerant', 'comptable'],
  '/caisse': ['admin', 'gerant', 'comptable', 'caissier'],
  '/compta': ['admin', 'gerant', 'comptable'],
  '/utilisateurs': ['admin'],
  '/roles-permissions': ['admin'],
  '/activites': ['admin', 'gerant'],
  '/notifications': ['admin', 'gerant', 'commercial', 'magasinier', 'comptable', 'caissier'],
  '/rh': ['admin', 'gerant', 'commercial', 'magasinier', 'comptable'],
  '/parametres': ['admin'],
}

const routePermissions = {
  '/clients': 'clients.view',
  '/aujourdhui': 'pilotage.view',
  '/agenda': 'agenda.view',
  '/prospection': 'prospection.view',
  '/produits': 'produits.view',
  '/categories-produits': 'produits.view',
  '/entrepots': 'stock.view',
  '/stock': 'stock.view',
  '/devis': 'devis.view',
  '/factures': 'factures.view',
  '/paiements': 'paiements.view',
  '/recouvrement': 'recouvrement.view',
  '/achats': 'achats.view',
  '/leasing': 'leasing.view',
  '/fournisseurs-reglements': 'fournisseurs_reglements.view',
  '/depenses': 'depenses.view',
  '/tresorerie-comptes': 'tresorerie.view',
  '/caisse': 'caisse.view',
  '/compta': 'comptabilite.view',
  '/utilisateurs': 'utilisateurs.view',
  '/roles-permissions': 'access_control.view',
  '/activites': 'activites.view',
  '/notifications': 'notifications.view',
  '/rh': 'rh.view',
  '/parametres': 'parametres.view',
}

function hasPermission(user, permission) {
  if (!permission) return false
  if (user?.role === 'admin') return true
  return Array.isArray(user?.permissions?.flat) && user.permissions.flat.includes(permission)
}

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  // 1) Route invité (login) → toujours libre
  if (to.meta.guest) {
    // Si déjà connecté, on l'envoie au dashboard
    if (auth.isAuthenticated && to.name === 'login') {
      return next({ name: auth.user?.role === 'caissier' ? 'caisse' : 'dashboard' })
    }
    return next()
  }

  if (to.meta.requiresAuth && ! auth.sessionChecked) {
    try {
      await auth.fetchMe()
    } catch (error) {
      return next({ name: 'login' })
    }
  }

  // 2) Route protégée + non connecté → vers login
  if (to.meta.requiresAuth && ! auth.isAuthenticated) {
    try {
      await auth.fetchMe()
    } catch (error) {
      return next({ name: 'login' })
    }
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
      if (! allowedRoles.includes(role) && !hasPermission(auth.user, routePermissions[prefix])) {
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
