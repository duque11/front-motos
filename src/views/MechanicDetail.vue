<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const mechanicId = route.params.id

const mechanic = ref(null)
const services = ref([])
const stats = ref({ total_jobs: 0, completed_jobs: 0, pending_jobs: 0 })
const loading = ref(true)

async function fetchWorkHistory() {
  loading.value = true
  try {
    const res = await fetch(`/api/mechanics/${mechanicId}/services`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    const data = await res.json()
    mechanic.value = data.mechanic
    services.value = data.services
    stats.value = data.stats
  } catch (err) {
    console.error('Error fetching work history:', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchWorkHistory)
</script>

<template>
  <div class="mechanic-detail fade-in" v-if="mechanic">
    <header class="detail-header">
      <button @click="router.back()" class="btn-back">← Volver al Equipo</button>
      <div class="profile-hero glass">
        <div class="avatar-large">👨‍🔧</div>
        <div class="hero-info">
          <h1>{{ mechanic.name }}</h1>
          <span class="specialty-tag">{{ mechanic.specialty }}</span>
          <div class="contact-meta">
            <span>📞 {{ mechanic.phone }}</span>
            <span class="status-badge" :class="{ active: mechanic.is_active }">
              {{ mechanic.is_active ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <div class="content-grid">
      <!-- Performance Stats -->
      <section class="meta-section">
        <div class="stats-mini-grid">
          <div class="mini-stat glass">
            <label>Trabajos Totales</label>
            <div class="val">{{ stats.total_jobs }}</div>
          </div>
          <div class="mini-stat glass green">
            <label>Completados</label>
            <div class="val">{{ stats.completed_jobs }}</div>
          </div>
          <div class="mini-stat glass gold">
            <label>Total M.O.</label>
            <div class="val">${{ (stats.total_labor || 0).toLocaleString() }}</div>
          </div>
        </div>
      </section>

      <!-- History List -->
      <section class="history-section">
        <h2>Historial de Trabajo</h2>
        <div class="history-list glass">
          <div v-for="s in services" :key="s.id" class="history-item">
            <div class="date">{{ s.entry_date }}</div>
            <div class="service-main">
              <span class="bike">{{ s.bike_model }}</span>
              <span class="client">Dueño: {{ s.owner_name }}</span>
            </div>
            <div class="description">{{ s.issue_description }}</div>
            <div class="service-labor">
              <span class="l-label">Mano de Obra</span>
              <span class="l-val">${{ (s.labor_cost || 0).toLocaleString() }}</span>
            </div>
            <div :class="['status-pill', s.status.toLowerCase().replace(' ', '-')]">
              {{ s.status }}
            </div>
          </div>
          <div v-if="services.length === 0" class="empty">Este trabajador aún no tiene servicios asignados.</div>
        </div>
      </section>
    </div>
  </div>
  <div v-else-if="loading" class="loading-full">Iniciando perfil...</div>
</template>

<style scoped>
.mechanic-detail { padding: 3rem; max-width: 1200px; margin: 0 auto; }

.detail-header { margin-bottom: 3rem; }
.btn-back { 
  background: transparent; 
  border: none; 
  color: var(--text-secondary); 
  font-weight: 700; 
  cursor: pointer; 
  margin-bottom: 2rem;
  transition: 0.3s;
}
.btn-back:hover { color: var(--primary-color); transform: translateX(-5px); }

.profile-hero {
  padding: 3rem;
  border-radius: var(--radius-xl);
  display: flex;
  gap: 3rem;
  align-items: center;
}

.avatar-large { font-size: 5rem; background: var(--surface-color); width: 140px; height: 140px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px dashed var(--primary-color); }

.hero-info h1 { font-size: 3rem; margin-bottom: 0.5rem; }
.specialty-tag { font-size: 0.85rem; font-weight: 800; color: var(--primary-color); text-transform: uppercase; letter-spacing: 2px; }

.contact-meta { display: flex; gap: 2rem; margin-top: 1.5rem; align-items: center; color: var(--text-secondary); font-weight: 500; }
.status-badge { font-size: 0.7rem; padding: 0.2rem 0.8rem; border-radius: 99px; background: var(--border-color); color: var(--text-secondary); }
.status-badge.active { background: #166534; color: #4ade80; }

.content-grid { display: grid; grid-template-columns: 300px 1fr; gap: 3rem; }

.stats-mini-grid { display: grid; gap: 1.5rem; }
.mini-stat { padding: 2rem; border-radius: var(--radius-lg); text-align: center; }
.mini-stat label { font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; }
.mini-stat .val { font-size: 2.5rem; font-weight: 900; margin-top: 0.5rem; }
.mini-stat.green .val { color: #4ade80; }
.mini-stat.yellow .val { color: #facc15; }
.mini-stat.gold .val { color: #eab308; }

.history-section h2 { margin-bottom: 2rem; font-size: 1.5rem; }
.history-list { border-radius: var(--radius-xl); overflow: hidden; }
.history-item { 
  display: grid; 
  grid-template-columns: 120px 200px 1fr 120px; 
  gap: 2rem; 
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
}

.service-labor {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.l-label { font-size: 0.6rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; }
.l-val { font-weight: 950; color: var(--primary-color); font-size: 1.1rem; }
.history-item:last-child { border: none; }

.date { font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); }
.bike { display: block; font-weight: 800; color: var(--text-main); }
.client { font-size: 0.75rem; color: var(--text-secondary); }
.description { font-size: 0.9rem; opacity: 0.8; }

.status-pill { font-size: 0.65rem; font-weight: 800; text-align: center; padding: 0.3rem; border-radius: 99px; text-transform: uppercase; }
.status-pill.pendiente { background: rgba(250, 204, 21, 0.1); color: #facc15; }
.status-pill.completado { background: rgba(74, 222, 128, 0.1); color: #4ade80; }

.loading-full { padding: 5rem; text-align: center; color: var(--text-secondary); font-size: 1.2rem; }

@media (max-width: 900px) {
  .profile-hero { flex-direction: column; text-align: center; }
  .content-grid { grid-template-columns: 1fr; }
  .history-item { grid-template-columns: 1fr 1fr; gap: 1rem; }
}
</style>
