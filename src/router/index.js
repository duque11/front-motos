import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/DashboardView.vue'
import Services from '../components/Dashboard.vue'
import Inventory from '../views/Inventory.vue'
import Team from '../views/Team.vue'
import Store from '../views/StoreView.vue'

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'Login', component: Login },
    { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/services', name: 'Services', component: Services, meta: { requiresAuth: true } },
    { path: '/inventory', name: 'Inventory', component: Inventory, meta: { requiresAuth: true } },
    { path: '/team', name: 'Team', component: Team, meta: { requiresAuth: true } },
    { path: '/team/:id', name: 'MechanicDetail', component: () => import('../views/MechanicDetail.vue'), meta: { requiresAuth: true } },
    { path: '/store', name: 'Store', component: Store, meta: { requiresAuth: true } },
    { path: '/history', name: 'History', component: () => import('../views/HistoryView.vue'), meta: { requiresAuth: true } },
    { path: '/clients', name: 'Clients', component: () => import('../views/ClientsView.vue'), meta: { requiresAuth: true } },
    { path: '/status/:plate', name: 'PublicStatus', component: () => import('../views/PublicStatus.vue') }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Navigation Guard
router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('token')

    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login')
    } else if (to.path === '/login' && isAuthenticated) {
        next('/dashboard')
    } else {
        next()
    }
})

export default router
