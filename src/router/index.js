import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, supabase } from '@/utils/supabase.js'
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import DashboardView from '@/views/auth/DashboardView.vue'
import MapView from '@/views/auth/MapView.vue'
import ViewerView from '@/views/auth/ViewerDashboard.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },

    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresAuth: false },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/map',
      name: 'mapview',
      component: MapView,
      meta: { requiresAuth: true },
    },
    {
      path: '/viewerdashboard',
      name: 'viewer',
      component: ViewerView,
      meta: { requiresAuth: true },
    },
  ],
})
router.beforeEach(async (to) => {
  const loggedIn = await isAuthenticated()

  // Redirect logged-in users from public pages to dashboard
  if (loggedIn && !to.meta.requiresAuth) {
    return { name: 'dashboard' }
  }

  // Redirect guests from protected pages to home (not login)
  if (!loggedIn && to.meta.requiresAuth) {
    return { name: 'login' }
  }

  // No redirection needed
  return true
})

export default router
// router.beforeEach(async (to) => {
//   const isLoggedIn = await isAuthenticated()
//   if (to.name === 'home') {
//     return isLoggedIn ? { name: 'dashboard' } : { name: 'login' }
//   }
//   if (isLoggedIn && (to.name === 'login' || to.name === 'register')) {
//     return { name: 'dashboard' }
//   }
//   if (!isLoggedIn && to.path.startsWith('/login')) {
//     return { name: 'login' }
//   }
//   if (router.resolve(to).matched.length === 0) {
//     return { name: 'login' }
//   }
// })

// import { name } from '@vue/eslint-config-prettier/skip-formatting'

// ✅ Route Protection (Add this below your router definition)
// router.beforeEach((to, from, next) => {
//   const isAuthenticated = !!localStorage.getItem('user')

//   // Allow access to login & register pages without auth
//   if (to.name === 'login' || to.name === 'register') {
//     next()
//   } else if (!isAuthenticated) {
//     // Redirect to login if user is not authenticated
//     next({ name: 'login' })
//   } else {
//     // Allow access to all other routes
//     next()
//   }
// })
