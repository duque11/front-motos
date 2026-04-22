<script setup>
import { useRouter, useRoute } from 'vue-router'
import { inject } from 'vue'

const router = useRouter()
const route = useRoute()
const { isDark, toggleTheme } = inject('theme')

const role = localStorage.getItem('role')
const mechId = localStorage.getItem('mechanicId')

const menuItems = role === 'admin' 
  ? [
      { name: 'Panel Principal', icon: '📊', path: '/dashboard' },
      { name: 'Servicios', icon: '🔧', path: '/services' },
      { name: 'Historial de Placas', icon: '📜', path: '/history' },
      { name: 'Inventario / Repuestos', icon: '📦', path: '/inventory' },
      { name: 'Ventas / Mostrador', icon: '🛒', path: '/store' },
      { name: 'Clientes', icon: '👤', path: '/clients' },
      { name: 'Equipo / Trabajadores', icon: '👥', path: '/team' }
    ]
  : [
      { name: 'Mi Historial', icon: '👨‍🔧', path: '/team/' + mechId }
    ]

function handleLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('role')
  localStorage.removeItem('mechanicId')
  router.push('/login')
}
</script>

<template>
  <aside class="sidebar glass">
    <div class="sidebar-header">
      <span class="logo-icon">🏍️</span>
      <div class="logo-text">
        <span class="title">Taller Duke</span>
        <span class="badge">ERP</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <router-link 
        v-for="item in menuItems" 
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: route.path === item.path }"
      >
        <span class="icon">{{ item.icon }}</span>
        <span class="label">{{ item.name }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <button @click="toggleTheme" class="theme-toggle glass">
        <span class="t-icon">{{ isDark ? '☀️' : '🌙' }}</span>
        <span class="label">{{ isDark ? 'Modo Día' : 'Modo Noche' }}</span>
      </button>

      <button @click="handleLogout" class="logout-btn">
        <span class="icon">🚪</span>
        <span class="label">Cerrar Sesión</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 280px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem;
  position: sticky;
  top: 0;
  border-right: 1px solid var(--border-color);
  z-index: 100;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 3rem;
  padding-left: 0.5rem;
}

.logo-icon {
  font-size: 2.5rem;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.title {
  font-weight: 800;
  font-size: 1.25rem;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.badge {
  font-size: 0.65rem;
  background: var(--primary-color);
  color: white;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  width: fit-content;
  font-weight: 900;
  margin-top: -2px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s;
}

.nav-item:hover {
  background: rgba(var(--primary-color-rgb), 0.1);
  color: var(--text-main);
}

.nav-item.active {
  background: var(--primary-glow);
  color: var(--primary-color);
  box-shadow: inset 0 0 0 1px rgba(var(--primary-color-rgb), 0.2);
}

.nav-item.active .icon {
  transform: scale(1.2);
}

.nav-item .icon {
  font-size: 1.2rem;
  transition: transform 0.3s;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.theme-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  font-weight: 700;
  cursor: pointer;
  border-radius: var(--radius-lg);
  transition: all 0.3s;
  font-size: 0.85rem;
}

.theme-toggle:hover {
  background: rgba(var(--primary-color-rgb), 0.1);
  border-color: var(--primary-color);
}

.t-icon {
  font-size: 1.1rem;
  filter: drop-shadow(0 0 5px var(--primary-color));
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1rem;
  background: transparent;
  border: none;
  color: var(--danger-color);
  font-weight: 700;
  cursor: pointer;
  border-radius: var(--radius-lg);
  transition: all 0.2s;
  font-size: 0.85rem;
}

.logout-btn:hover {
  background: var(--danger-soft-bg);
}
</style>
