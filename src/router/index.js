import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '@/utils/supabase.js'

// Views
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import DashboardView from '@/views/auth/DashboardView.vue'
import MapView from '@/views/auth/MapView.vue'
import ResidentView from '@/views/auth/ResidentView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
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
      meta: { requiresAuth: true, role: 'Employee' },
    },
    {
      path: '/map',
      name: 'mapview',
      component: MapView,
      meta: { requiresAuth: true, role: 'Employee' },
    },
    {
      path: '/residentdashboard',
      name: 'residentdashboard',
      component: ResidentView,
      meta: { requiresAuth: true, role: 'Resident' },
    },
  ],
})

router.beforeEach(async (to) => {
  const session = await isAuthenticated()
  const role = session?.user?.user_metadata?.role

  // Not logged in & trying to access a protected route
  if (!session && to.meta.requiresAuth) {
    return { name: 'login' }
  }

  // Logged in & trying to access login/register
  if (session && !to.meta.requiresAuth && (to.name === 'login' || to.name === 'register')) {
    return { name: role === 'Resident' ? 'residentdashboard' : 'dashboard' }
  }

  // Logged in but accessing a route not allowed by their role
  if (session && to.meta.requiresAuth && to.meta.role && to.meta.role !== role) {
    console.log(
      `Access denied: User with role '${role}' tried to access route requiring '${to.meta.role}'`,
    )
    return { name: role === 'Resident' ? 'residentdashboard' : 'dashboard' }
  }

  return true
})

export default router
