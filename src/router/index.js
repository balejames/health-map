import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import DashboardView from '@/views/auth/DashboardView.vue'
import MapView from '@/views/auth/MapView.vue'
import InquiryView from '@/views/auth/InquiryView.vue'


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
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: DashboardView,
    },
    {
      path: '/map',
      name: 'MapView',
      component: MapView,
    },
    {
      path: '/inquiry',
      name: 'InquiryView',
      component: InquiryView,
    },
  ],
})

// ✅ Route Protection (Add this below your router definition)
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('user')

  // Allow access to login & register pages without auth
  if (to.name === 'login' || to.name === 'register') {
    next()
  } else if (!isAuthenticated) {
    // Redirect to login if user is not authenticated
    next({ name: 'login' })
  } else {
    // Allow access to all other routes
    next()
  }
})

export default router
