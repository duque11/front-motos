<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    })

    const data = await res.json()
    if (res.ok) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', data.user)
      localStorage.setItem('role', data.role)
      if (data.role === 'mechanic') {
        localStorage.setItem('mechanicId', data.id)
        router.push('/team/' + data.id)
      } else {
        router.push('/dashboard')
      }
    } else {
      error.value = data.error || 'Credenciales incorrectas'
    }
  } catch (err) {
    error.value = 'Error de conexión con el servidor'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container fade-in">
    <div class="login-card glass">
      <div class="logo">🏍️</div>
      <h1>Taller Duke</h1>
      <p class="subtitle">Gestión Profesional de Taller</p>

      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label>Usuario</label>
          <input 
            v-model="username" 
            type="text" 
            placeholder="Nombre de usuario" 
            required 
            :disabled="loading"
          />
        </div>
        
        <div class="input-group">
          <label>Contraseña</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="••••••••" 
            required 
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>

        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Iniciando...' : 'Entrar al Sistema' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color);
  background-image: 
    radial-gradient(circle at top right, rgba(var(--primary-color-rgb), 0.1), transparent),
    radial-gradient(circle at bottom left, rgba(var(--primary-color-rgb), 0.05), transparent);
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 3rem 2.5rem;
  border-radius: var(--radius-xl);
  text-align: center;
}

.logo {
  font-size: 3.5rem;
  margin-bottom: 1rem;
}

h1 {
  font-size: 1.75rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 2.5rem;
}

form {
  text-align: left;
}

.input-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

input {
  width: 100%;
  padding: 0.9rem 1.2rem;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-main);
  transition: all 0.2s;
}

input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px var(--primary-glow);
}

.error-msg {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.btn-primary {
  width: 100%;
  padding: 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px var(--primary-glow);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}
</style>
