<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Bike, Clock, CheckCircle2, AlertCircle, Calendar, Wrench } from 'lucide-vue-next'

const route = useRoute()
const plate = ref(route.params.plate || '')
const service = ref(null)
const loading = ref(false)
const error = ref('')

async function fetchStatus() {
  if (!plate.value) return
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`/api/public/status/${plate.value}`)
    if (res.ok) {
      service.value = await res.json()
    } else {
      error.value = 'No se encontró información para esta placa.'
      service.value = null
    }
  } catch (err) {
    error.value = 'Error al conectar con el servidor.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (plate.value) fetchStatus()
})
</script>

<template>
  <div class="public-status fade-in">
    <div class="status-card glass shadow-2xl">
      <div class="card-header">
        <div class="logo">🏍️</div>
        <h1>Estado de tu Moto</h1>
        <div class="plate-badge">{{ plate }}</div>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Consultando base de datos...</p>
      </div>

      <div v-else-if="service" class="service-details">
        <div class="main-status" :class="service.status.toLowerCase().replace(' ', '-')">
          <CheckCircle2 v-if="service.status === 'Entregado'" class="icon" />
          <Wrench v-else-if="service.status === 'En Taller'" class="icon" />
          <Clock v-else class="icon" />
          <h2>{{ service.status }}</h2>
          <p v-if="service.status === 'Pendiente'">Tu moto está en fila para ser atendida.</p>
          <p v-if="service.status === 'En Taller'">Nuestro equipo está trabajando en ella ahora mismo.</p>
          <p v-if="service.status === 'Completado'">¡Tu moto está lista! Puedes pasar por ella.</p>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <User class="icon" />
            <div class="text">
              <label>Propietario</label>
              <span>{{ service.owner_name }}</span>
            </div>
          </div>
          <div class="info-item">
            <Bike class="icon" />
            <div class="text">
              <label>Modelo</label>
              <span>{{ service.bike_model }}</span>
            </div>
          </div>
          <div class="info-item">
            <Calendar class="icon" />
            <div class="text">
              <label>Fecha Ingreso</label>
              <span>{{ service.entry_date }}</span>
            </div>
          </div>
          <div class="info-item">
            <Clock class="icon" />
            <div class="text">
              <label>Entrega Estimada</label>
              <span>{{ service.expected }}</span>
            </div>
          </div>
        </div>

        <div class="issue-box glass">
          <label>Motivo de Ingreso</label>
          <p>{{ service.issue }}</p>
        </div>
      </div>

      <div v-else class="status-search">
        <div class="search-box">
          <input v-model="plate" type="text" placeholder="Ingresa tu placa..." @keyup.enter="fetchStatus" />
          <button @click="fetchStatus" class="btn-check">Consultar</button>
        </div>
        <p v-if="error" class="error-msg"><AlertCircle class="icon" /> {{ error }}</p>
      </div>

      <div class="card-footer">
        <p>Taller Duke ERP v2.0 - Servicio Profesional</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.public-status {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 50%, #111827 0%, #030712 100%);
  padding: 2rem;
}

.status-card {
  width: 100%;
  max-width: 550px;
  padding: 3.5rem;
  border-radius: 40px;
  text-align: center;
}

.card-header { margin-bottom: 3rem; }
.logo { font-size: 4rem; margin-bottom: 1rem; }
h1 { font-size: 2rem; font-weight: 950; margin-bottom: 1rem; }
.plate-badge { 
  display: inline-block; padding: 0.5rem 2rem; 
  background: #eab308; color: #000; font-weight: 900; 
  border-radius: 8px; font-size: 1.25rem; letter-spacing: 2px;
}

.main-status { padding: 2.5rem; border-radius: 30px; margin-bottom: 2.5rem; }
.main-status .icon { width: 50px; height: 50px; margin-bottom: 1rem; }
.main-status h2 { font-size: 2.5rem; font-weight: 950; margin-bottom: 0.5rem; }
.main-status p { font-weight: 600; opacity: 0.9; }

.main-status.pendiente { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.main-status.en-taller { background: rgba(99, 102, 241, 0.1); color: #818cf8; }
.main-status.completado, .main-status.entregado { background: rgba(16, 185, 129, 0.1); color: #10b981; }

.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem; }
.info-item { display: flex; gap: 1rem; text-align: left; align-items: center; }
.info-item .icon { width: 20px; color: var(--text-secondary); }
.info-item label { display: block; font-size: 0.6rem; font-weight: 800; text-transform: uppercase; color: var(--text-secondary); }
.info-item span { font-weight: 700; font-size: 0.95rem; }

.issue-box { padding: 1.5rem; border-radius: 20px; text-align: left; }
.issue-box label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0.5rem; display: block; color: var(--primary-color); }
.issue-box p { font-size: 0.9rem; line-height: 1.5; }

.search-box { display: flex; flex-direction: column; gap: 1rem; }
.search-box input { 
  padding: 1.25rem; border-radius: 16px; background: rgba(255,255,255,0.05); 
  border: 1px solid var(--border-color); color: white; text-align: center;
  font-size: 1.5rem; font-weight: 800; text-transform: uppercase;
}
.btn-check { 
  padding: 1.25rem; border-radius: 16px; background: var(--primary-gradient);
  color: white; font-weight: 900; border: none; cursor: pointer;
}

.error-msg { margin-top: 1.5rem; color: #f87171; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 600; }
.card-footer { margin-top: 3rem; opacity: 0.3; font-size: 0.7rem; font-weight: 700; }

.spinner { 
  width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1);
  border-left-color: var(--primary-color); border-radius: 50%;
  margin: 20px auto; animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
