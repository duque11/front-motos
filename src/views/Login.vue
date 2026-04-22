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
    <div class="login-shell glass">
      <aside class="brand-panel">
        <div class="brand-badge">🏍️</div>
        <h1>Taller Duke</h1>
        <p class="subtitle">Gestión Profesional de Taller</p>
        <ul class="highlights">
          <li>Control de órdenes y clientes en tiempo real</li>
          <li>Paneles por rol para una operación más ágil</li>
          <li>Historial centralizado de servicios y estados</li>
        </ul>
      </aside>

      <section class="login-card">
        <h2>Bienvenido de nuevo</h2>
        <p class="form-subtitle">Inicia sesión para continuar</p>

        <form @submit.prevent="handleLogin">
          <div class="input-group">
            <label>Usuario</label>
            <div class="input-wrapper">
              <span class="input-icon">👤</span>
              <input
                v-model="username"
                type="text"
                placeholder="Nombre de usuario"
                required
                :disabled="loading"
              />
            </div>
          </div>

          <div class="input-group">
            <label>Contraseña</label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input
                v-model="password"
                type="password"
                placeholder="••••••••"
                required
                :disabled="loading"
              />
            </div>
          </div>

          <div v-if="error" class="error-msg">{{ error }}</div>

          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'Iniciando...' : 'Entrar al Sistema' }}
          </button>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: var(--bg-color);
  background-image:
    radial-gradient(circle at 100% 0%, rgba(var(--primary-color-rgb), 0.18), transparent 50%),
    radial-gradient(circle at 0% 100%, rgba(var(--primary-color-rgb), 0.1), transparent 45%);
}

.login-shell {
  width: min(960px, 100%);
  border-radius: var(--radius-xl);
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  overflow: hidden;
}

.brand-panel {
  padding: 2.75rem;
  background: linear-gradient(145deg, rgba(var(--primary-color-rgb), 0.22), var(--brand-panel-end));
  border-right: 1px solid rgba(var(--primary-color-rgb), 0.2);
}

.brand-badge {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 2rem;
  margin-bottom: 1rem;
  background: var(--badge-bg);
  box-shadow: inset 0 0 0 1px rgba(var(--primary-color-rgb), 0.18);
}

h1 {
  font-size: clamp(1.8rem, 2.5vw, 2.2rem);
  line-height: 1.1;
  margin-bottom: 0.35rem;
}

.subtitle {
  color: var(--text-secondary);
  margin-bottom: 1.4rem;
}

.highlights {
  display: grid;
  gap: 0.8rem;
  padding-left: 1.1rem;
  color: var(--text-main);
  opacity: 0.9;
  font-size: 0.92rem;
}

.login-card {
  padding: 2.75rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

h2 {
  font-size: 1.45rem;
  margin-bottom: 0.35rem;
}

.form-subtitle {
  color: var(--text-secondary);
  font-size: 0.92rem;
  margin-bottom: 1.75rem;
}

.input-group {
  margin-bottom: 1.15rem;
}

label {
  display: block;
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 0.95rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9rem;
  opacity: 0.8;
  pointer-events: none;
}

input {
  width: 100%;
  padding: 0.9rem 1rem 0.9rem 2.55rem;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-main);
  transition: all 0.2s;
}

input::placeholder {
  color: var(--placeholder-color);
}

input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px var(--primary-glow);
}

.error-msg {
  background: var(--danger-soft-bg);
  color: var(--danger-color);
  padding: 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  margin-bottom: 1rem;
  border: 1px solid var(--danger-border);
}

.btn-primary {
  width: 100%;
  margin-top: 0.45rem;
  padding: 0.95rem;
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px -10px var(--primary-glow);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 860px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    border-right: none;
    border-bottom: 1px solid rgba(var(--primary-color-rgb), 0.2);
    padding-bottom: 2rem;
  }

  .highlights {
    margin-bottom: 0;
  }
}

@media (max-width: 560px) {
  .login-container {
    padding: 0.75rem;
  }

  .brand-panel,
  .login-card {
    padding: 1.5rem;
  }
}
</style>
