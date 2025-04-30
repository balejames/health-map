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
