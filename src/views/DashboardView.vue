<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  TrendingUp, AlertTriangle, Settings, CheckCircle2, 
  DollarSign, Users, ArrowUpRight, Bike, Calendar
} from 'lucide-vue-next'
import { Line } from 'vue-chartjs'
import { 
  Chart as ChartJS, Title, Tooltip, Legend, 
  LineElement, CategoryScale, LinearScale, PointElement,
  Filler
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler)

const router = useRouter()
const stats = ref({ total: 0, pending: 0, in_progress: 0, completed: 0 })
const revenue = ref({ labor: 0, parts: 0, total: 0 })
const revenueHistory = ref([])
const user = localStorage.getItem('user') || 'Admin'
const mechanics = ref([])

const chartData = computed(() => ({
  labels: revenueHistory.value.map(h => h.month),
  datasets: [{
    label: 'Ingresos Mensuales',
    data: revenueHistory.value.map(h => h.revenue),
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    fill: true,
    tension: 0.4,
    pointRadius: 4,
    pointBackgroundColor: '#6366f1'
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
  }
}

async function fetchData() {
  try {
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    const [statRes, mechRes, reportRes] = await Promise.all([
      fetch('/api/services', { headers }),
      fetch('/api/mechanics', { headers }),
      fetch('/api/reports/revenue', { headers })
    ])
    
    const statData = await statRes.json()
    stats.value = statData.stats
    revenue.value = statData.revenue || { labor: 0, parts: 0, total: 0 }
    
    mechanics.value = await mechRes.json()
    revenueHistory.value = await reportRes.json()
  } catch (err) {
    console.error(err)
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="dashboard-home fade-in">
    <!-- Hero Section -->
    <section class="hero-card glass card-hover-fx">
      <div class="hero-content">
        <span class="date-badge">{{ new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
        <h1>¡Hola de nuevo, {{ user.split(' ')[0] }}! 🏍️</h1>
        <p>Tu taller tiene hoy <strong>{{ stats.pending }}</strong> servicios pendientes de ser atendidos.</p>
        
        <div class="hero-actions">
          <button @click="router.push('/services')" class="btn-primary">Nuevo Servicio</button>
          <button @click="router.push('/store')" class="btn-secondary">Venta Rápida</button>
        </div>
      </div>
      <div class="hero-trend glass">
        <div class="trend-header">
          <TrendingUp class="icon" />
          <span>Tendencia de Ingresos</span>
        </div>
        <div class="chart-container">
          <Line v-if="revenueHistory.length > 0" :data="chartData" :options="chartOptions" />
          <div v-else class="loading-chart">Cargando datos...</div>
        </div>
      </div>
    </section>

    <!-- Main Stats Grid -->
    <section class="stats-grid">
      <div @click="router.push('/services')" class="stat-card glass primary clickable">
        <div class="icon-wrap"><TrendingUp /></div>
        <div class="info">
          <label>Alcance Total</label>
          <div class="val">{{ stats.total }}</div>
          <span class="subtext">Servicios registrados</span>
        </div>
        <ArrowUpRight class="arrow" />
      </div>

      <div @click="router.push({ path: '/services', query: { status: 'Pendiente' } })" class="stat-card glass warning clickable">
        <div class="icon-wrap"><AlertTriangle /></div>
        <div class="info">
          <label>En Espera</label>
          <div class="val">{{ stats.pending }}</div>
          <span class="subtext">Requieren atención</span>
        </div>
        <ArrowUpRight class="arrow" />
      </div>

      <div @click="router.push({ path: '/services', query: { status: 'En Taller' } })" class="stat-card glass info clickable">
        <div class="icon-wrap"><Settings /></div>
        <div class="info">
          <label>En Rampa</label>
          <div class="val">{{ stats.in_progress }}</div>
          <span class="subtext">Operativos ahora</span>
        </div>
        <ArrowUpRight class="arrow" />
      </div>

      <div @click="router.push({ path: '/services', query: { status: 'Completado' } })" class="stat-card glass success clickable">
        <div class="icon-wrap"><CheckCircle2 /></div>
        <div class="info">
          <label>Listos</label>
          <div class="val">{{ stats.completed }}</div>
          <span class="subtext">Para entregar</span>
        </div>
        <ArrowUpRight class="arrow" />
      </div>
    </section>

    <div class="bottom-grid">
      <!-- Revenue Breakdown -->
      <section class="revenue-overview glass">
        <div class="section-header">
          <h3>Balance Mensual</h3>
          <DollarSign class="h-icon" />
        </div>
        <div class="revenue-items">
          <div class="rev-item">
            <div class="rev-label">Mano de Obra</div>
            <div class="rev-v">${{ (revenue.labor || 0).toLocaleString() }}</div>
            <div class="rev-bar"><div class="fill" :style="{ width: '60%' }"></div></div>
          </div>
          <div class="rev-item">
            <div class="rev-label">Venta de Repuestos</div>
            <div class="rev-v">${{ (revenue.parts || 0).toLocaleString() }}</div>
            <div class="rev-bar"><div class="fill purple" :style="{ width: '40%' }"></div></div>
          </div>
          <div class="total-rev">
            <label>Total Recaudado (Mes)</label>
            <div class="v">${{ (revenue.total || 0).toLocaleString() }}</div>
          </div>
        </div>
      </section>

      <!-- Team Mini View -->
      <section class="team-overview glass">
        <div class="section-header">
          <h3>Mecánicos Activos</h3>
          <Users class="h-icon" />
        </div>
        <div class="team-list">
          <div v-for="m in mechanics.slice(0, 4)" :key="m.id" class="mech-row">
            <div class="m-avatar">{{ m.name.charAt(0) }}</div>
            <div class="m-details">
              <span class="m-name">{{ m.name }}</span>
              <span class="m-spec">{{ m.specialty }}</span>
            </div>
            <div class="m-status-dot" :class="{ active: m.is_active }"></div>
          </div>
          <router-link to="/team" class="btn-all">Ver todo el equipo</router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.dashboard-home { padding: 3rem; max-width: 1600px; margin: 0 auto; }

.hero-card {
  padding: 3rem; border-radius: 40px; display: grid; grid-template-columns: 1.2fr 1fr;
  gap: 3rem; margin-bottom: 3rem; align-items: center; position: relative; overflow: hidden;
}

.date-badge { 
  display: inline-block; padding: 0.5rem 1.25rem; background: rgba(99, 102, 241, 0.1);
  color: #818cf8; border-radius: 99px; font-size: 0.7rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2rem;
}

h1 { font-size: 3.5rem; font-weight: 950; margin-bottom: 1rem; line-height: 1.1; }
p { font-size: 1.1rem; color: var(--text-secondary); margin-bottom: 2.5rem; }
p strong { color: #f9fafb; border-bottom: 2px solid var(--primary-color); }

.hero-actions { display: flex; gap: 1.5rem; }
.btn-primary { 
  padding: 1.25rem 2.5rem; border-radius: 18px; background: var(--primary-gradient);
  border: none; color: white; font-weight: 900; cursor: pointer; transition: 0.3s;
}
.btn-secondary {
  padding: 1.25rem 2.5rem; border-radius: 18px; background: rgba(255,255,255,0.05);
  border: 1px solid var(--border-color); color: white; font-weight: 800; cursor: pointer; transition: 0.3s;
}
.btn-primary:hover { transform: translateY(-5px); box-shadow: 0 20px 40px var(--primary-glow); }

.hero-trend { padding: 2rem; border-radius: 30px; height: 320px; display: flex; flex-direction: column; }
.trend-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; font-weight: 800; color: var(--text-secondary); }
.trend-header .icon { color: var(--primary-color); }
.chart-container { flex: 1; position: relative; }
.loading-chart { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary); }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; margin-bottom: 3rem; }
.stat-card { padding: 2.5rem; border-radius: 30px; display: flex; align-items: center; gap: 1.5rem; position: relative; }
.icon-wrap { 
  width: 60px; height: 60px; border-radius: 18px; display: flex; align-items: center; 
  justify-content: center; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color);
}
.stat-card.primary .icon-wrap { color: var(--primary-color); }
.stat-card.warning .icon-wrap { color: #f59e0b; }
.stat-card.info .icon-wrap { color: #3b82f6; }
.stat-card.success .icon-wrap { color: #10b981; }

.info label { display: block; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 0.25rem; }
.info .val { font-size: 2.25rem; font-weight: 950; }
.subtext { font-size: 0.7rem; color: var(--text-secondary); opacity: 0.6; }
.arrow { position: absolute; top: 1.5rem; right: 1.5rem; width: 18px; opacity: 0.3; }

.bottom-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 2rem; }
.revenue-overview, .team-overview { padding: 3rem; border-radius: 35px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; }
.section-header h3 { font-size: 1.5rem; font-weight: 900; }
.h-icon { color: var(--primary-color); opacity: 0.5; }

.revenue-items { display: flex; flex-direction: column; gap: 2rem; }
.rev-item { margin-bottom: 1rem; }
.rev-label { font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.5rem; }
.rev-v { font-size: 1.75rem; font-weight: 900; margin-bottom: 0.75rem; }
.rev-bar { height: 8px; background: rgba(255,255,255,0.05); border-radius: 10px; overflow: hidden; }
.rev-bar .fill { height: 100%; background: var(--primary-color); border-radius: 10px; }
.rev-bar .fill.purple { background: #a855f7; }

.total-rev { margin-top: 1rem; padding: 2rem; background: rgba(99, 102, 241, 0.05); border-radius: 20px; border: 1px dashed var(--primary-color); }
.total-rev label { font-size: 0.8rem; font-weight: 800; color: var(--primary-color); }
.total-rev .v { font-size: 2.5rem; font-weight: 950; color: #f9fafb; margin-top: 0.5rem; }

.team-list { display: flex; flex-direction: column; gap: 1.5rem; }
.mech-row { display: flex; align-items: center; gap: 1.25rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border-color); }
.m-avatar { 
  width: 50px; height: 50px; border-radius: 15px; background: var(--primary-glow); 
  display: flex; align-items: center; justify-content: center; font-weight: 900; color: var(--primary-color);
}
.m-details { flex: 1; display: flex; flex-direction: column; }
.m-name { font-weight: 800; font-size: 1rem; }
.m-spec { font-size: 0.75rem; color: var(--text-secondary); }
.m-status-dot { width: 10px; height: 10px; border-radius: 50%; background: #4b5563; }
.m-status-dot.active { background: #10b981; box-shadow: 0 0 10px #10b981; }

.btn-all { align-self: center; margin-top: 1rem; color: var(--primary-color); font-weight: 800; text-decoration: none; font-size: 0.9rem; }

@media (max-width: 1400px) {
  .hero-card { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 900px) {
  .bottom-grid { grid-template-columns: 1fr; }
}
</style>
