<script setup>
import { ref, onMounted, computed, provide } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'

const route = useRoute()
const showSidebar = computed(() => route.path !== '/login' && route.path !== '/')

// Theme Management
const isDark = ref(localStorage.getItem('theme') !== 'light')

function toggleTheme() {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

provide('theme', { isDark, toggleTheme })

onMounted(() => {
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
})
</script>

<template>
  <div class="app-container">
    <Sidebar v-if="showSidebar" />
    <main class="main-content" :class="{ 'auth-screen': !showSidebar }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style>
.app-container {
  display: flex;
  min-height: 100vh;
  background: var(--bg-color);
}

.main-content {
  flex: 1;
  min-height: 100vh;
  overflow-y: auto;
  padding: 0;
}

.main-content.auth-screen {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Route Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
