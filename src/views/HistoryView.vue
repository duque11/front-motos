<script setup>
import { ref, onMounted } from 'vue'
import { Search, History, Bike, User, Calendar, ClipboardList } from 'lucide-vue-next'

const plate = ref('')
const services = ref([])
const loading = ref(false)
const searched = ref(false)

async function searchHistory() {
  if (!plate.value) return
  loading.value = true
  try {
    const res = await fetch(`/api/history/search?plate=${plate.value}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    services.value = await res.json()
    searched.value = true
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="history-container fade-in">
    <header class="view-header">
      <div class="title-meta">
        <span class="sub">Archivo Maestro</span>
        <h1>Historial por Placa</h1>
      </div>
    </header>

    <div class="search-section glass card-hover-fx">
      <div class="search-input-group">
        <Search class="s-icon" />
        <input 
          v-model="plate" 
          @keyup.enter="searchHistory"
          type="text" 
          placeholder="Ingrese placa (Ej: ABC-123)" 
          maxlength="10"
        />
        <button @click="searchHistory" :disabled="loading" class="btn-primary">
          {{ loading ? 'Buscando...' : 'Buscar Historial' }}
        </button>
      </div>
    </div>

    <main class="results-area">
      <div v-if="services.length > 0" class="timeline">
        <div v-for="s in services" :key="s.id" class="history-card glass card-hover-fx">
          <div class="card-status" :class="s.status.toLowerCase().replace(' ', '-')">
            {{ s.status }}
          </div>
          
          <div class="card-grid">
            <div class="info-block">
              <Calendar class="icon" />
              <div class="details">
                <label>Fecha de Ingreso</label>
                <span>{{ s.entry_date }}</span>
              </div>
            </div>
            
            <div class="info-block">
              <Bike class="icon" />
              <div class="details">
                <label>Vehículo</label>
                <span>{{ s.bike_model }}</span>
              </div>
            </div>

            <div class="info-block">
              <User class="icon" />
              <div class="details">
                <label>Mecánico</label>
                <span>{{ s.mechanic_name }}</span>
              </div>
            </div>

            <div class="info-block">
              <ClipboardList class="icon" />
              <div class="details">
                <label>Descripción del Problema</label>
                <p>{{ s.issue_description }}</p>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <div class="cost-summary">
              Total Invertido: <strong>${{ s.total_cost.toLocaleString() }}</strong>
            </div>
            <button class="btn-text">Ver Detalles Completos →</button>
          </div>
        </div>
      </div>

      <div v-else-if="searched" class="empty-state">
        <div class="empty-icon">📂</div>
        <h3>No hay registros</h3>
        <p>No encontramos servicios registrados para la placa "{{ plate }}"</p>
      </div>
      
      <div v-else class="initial-state">
        <History class="large-icon" />
        <p>Ingrese una placa para ver el historial completo de mantenimientos.</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.history-container { padding: 3rem; max-width: 1200px; margin: 0 auto; }
.view-header { margin-bottom: 3rem; }
h1 { font-size: 3rem; font-weight: 900; }
.sub { font-size: 0.85rem; font-weight: 700; color: var(--primary-color); text-transform: uppercase; letter-spacing: 2px; }

.search-section { padding: 2.5rem; border-radius: 24px; margin-bottom: 4rem; }
.search-input-group { display: flex; gap: 1.5rem; align-items: center; }
.s-icon { color: var(--text-secondary); width: 24px; }
input { 
  flex: 1; background: transparent; border: none; font-size: 1.5rem; font-weight: 700; 
  color: var(--text-main); outline: none; text-transform: uppercase;
}
.btn-primary { 
  background: var(--primary-gradient); color: white; border: none; 
  padding: 1rem 2.5rem; border-radius: 14px; font-weight: 800; cursor: pointer;
  transition: 0.3s;
}
.btn-primary:hover { transform: translateY(-3px); box-shadow: 0 10px 20px var(--primary-glow); }

.timeline { display: flex; flex-direction: column; gap: 2rem; }
.history-card { padding: 2.5rem; border-radius: 24px; position: relative; overflow: hidden; }
.card-status { 
  position: absolute; top: 1.5rem; right: 1.5rem; font-size: 0.7rem; font-weight: 900;
  padding: 0.4rem 1rem; border-radius: 99px; text-transform: uppercase;
  background: rgba(255,255,255,0.05); color: var(--text-secondary);
}
.card-status.entregado { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.card-status.pendiente { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

.card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; margin-top: 1rem; }
.info-block { display: flex; gap: 1rem; align-items: flex-start; }
.info-block .icon { color: var(--primary-color); width: 20px; margin-top: 3px; }
.details label { display: block; font-size: 0.65rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.25rem; }
.details span { font-weight: 700; font-size: 1.1rem; }
.details p { font-size: 0.9rem; line-height: 1.5; color: var(--text-secondary); }

.card-footer { 
  margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);
  display: flex; justify-content: space-between; align-items: center;
}
.cost-summary { font-size: 0.95rem; }
.cost-summary strong { color: var(--accent-color); font-size: 1.25rem; margin-left: 0.5rem; }
.btn-text { background: transparent; border: none; color: var(--primary-color); font-weight: 800; cursor: pointer; }

.empty-state, .initial-state { text-align: center; padding: 6rem; opacity: 0.6; }
.empty-icon, .large-icon { font-size: 4rem; margin-bottom: 2rem; color: var(--text-secondary); }
</style>
