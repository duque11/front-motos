<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const services = ref([])
const stats = ref({ total: 0, pending: 0, in_progress: 0, completed: 0 })
const revenue = ref({ labor: 0, parts: 0, total: 0 })
const loading = ref(false)
const showDetailModal = ref(false)
const selectedService = ref(null)

// Filtering
const searchPlate = ref('')
const statusFilter = ref(route.query.status || '')

const filteredServices = computed(() => {
  return services.value.filter(s => {
    const matchStatus = !statusFilter.value || s.status === statusFilter.value
    const matchPlate = !searchPlate.value || 
      s.plate_number?.toLowerCase().includes(searchPlate.value.toLowerCase()) ||
      s.owner_name?.toLowerCase().includes(searchPlate.value.toLowerCase())
    return matchStatus && matchPlate
  })
})

// Part Search
const partQuery = ref('')
const partResults = ref([])
const partQty = ref(1)

// Helper for authenticated fetch
async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { ...options.headers, 'Authorization': `Bearer ${token}` }
  const res = await fetch(url, { ...options, headers })
  if (res.status === 401) { router.push('/login'); throw new Error('Sesión expirada') }
  return res
}

const newService = ref({
  ownerName: '', bikeModel: '', plateNumber: '', issueDescription: '', status: 'Pendiente', mechanicId: null, laborCost: 0
})

const mechanics = ref([])

async function fetchMechanics() {
  const res = await authFetch('/api/mechanics'); mechanics.value = await res.json()
}

async function fetchServices() {
  loading.value = true
  try {
    const res = await authFetch('/api/services')
    const data = await res.json()
    services.value = data.services || []
    stats.value = data.stats || { total: 0, pending: 0, in_progress: 0, completed: 0 }
    revenue.value = data.revenue || { labor: 0, parts: 0, total: 0 }
    if (selectedService.value) {
      selectedService.value = services.value.find(s => s.id === selectedService.value.id)
    }
  } catch (err) { console.error(err) } finally { loading.value = false }
}

async function handleAddService() {
  if (!newService.value.ownerName || !newService.value.bikeModel) return
  const res = await authFetch('/api/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newService.value)
  })
  if (res.ok) {
    await fetchServices()
    newService.value = { ownerName: '', bikeModel: '', plateNumber: '', issueDescription: '', status: 'Pendiente', mechanicId: null, laborCost: 0 }
  }
}

async function updateStatus(id, status) {
  await authFetch(`/api/services/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
  await fetchServices()
}

async function deleteService(id) {
  if (!confirm('¿Eliminar registro? Se devolverá el stock de repuestos usados.')) return
  await authFetch(`/api/services/${id}`, { method: 'DELETE' })
  await fetchServices()
}

// Invoicing & Parts Logic
async function searchParts() {
  if (partQuery.value.length < 2) { partResults.value = []; return }
  const res = await authFetch(`/api/parts/search?q=${partQuery.value}`)
  partResults.value = await res.json()
}

async function addPartToService(partId) {
  const res = await authFetch(`/api/services/${selectedService.value.id}/parts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ partId, quantity: partQty.value })
  })
  if (res.ok) {
    partQuery.value = ''
    partResults.value = []
    partQty.value = 1
    await fetchServices()
  } else {
    const err = await res.json(); alert(err.error || 'Error')
  }
}

async function removePart(linkId) {
  await authFetch(`/api/services/${selectedService.value.id}/parts/${linkId}`, { method: 'DELETE' })
  await fetchServices()
}

async function updateLabor() {
  await authFetch(`/api/services/${selectedService.value.id}/costs`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ labor_cost: selectedService.value.labor_cost })
  })
  await fetchServices()
}

function openDetail(service) {
  selectedService.value = service
  showDetailModal.value = true
}

onMounted(() => { fetchServices(); fetchMechanics() })

watch(partQuery, searchParts)
watch(() => route.query.status, (newStatus) => {
  if (newStatus) statusFilter.value = newStatus
})
</script>

<template>
  <div class="services-container fade-in">
    <header class="view-header">
      <div class="title-meta">
        <span class="sub">Gestión Operativa</span>
        <h1>Servicios & Facturación</h1>
      </div>
      <div class="header-stats glass">
        <div class="h-stat">
          <span class="l">ACTIVOS</span>
          <span class="v">{{ stats.in_progress + stats.pending }}</span>
        </div>
        <div class="h-stat sep"></div>
        <div class="h-stat">
          <span class="l">TOTAL MES</span>
          <span class="v gold">${{ (revenue?.total || 0).toLocaleString() }}</span>
        </div>
      </div>
    </header>

    <div class="layout-grid">
      <!-- Input Aside -->
      <aside class="form-aside">
        <div class="form-card glass">
          <div class="card-head">
            <span class="icon">🎟️</span>
            <h2>Orden de Entrada</h2>
          </div>
          <form @submit.prevent="handleAddService">
            <div class="input-group">
              <label>Propietario</label>
              <input v-model="newService.ownerName" type="text" placeholder="Nombre completo" required />
            </div>
            
            <div class="input-group">
              <label>Vehículo / Modelo</label>
              <input v-model="newService.bikeModel" type="text" placeholder="Ej. Pulsar NS 200" required />
            </div>

            <div class="row">
              <div class="input-group">
                <label>Placa</label>
                <input v-model="newService.plateNumber" type="text" placeholder="ABC-123" />
              </div>
              <div class="input-group">
                <label>Mano Obra Est.</label>
                <input v-model.number="newService.laborCost" type="number" />
              </div>
            </div>

            <div class="input-group">
              <label>Reporte de Falla</label>
              <textarea v-model="newService.issueDescription" rows="2" placeholder="Síntomas..."></textarea>
            </div>

            <div class="row">
              <div class="input-group">
                <label>Mecánico</label>
                <select v-model="newService.mechanicId">
                  <option :value="null">Sin asignar</option>
                  <option v-for="m in mechanics" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
              </div>
              <div class="input-group">
                <label>Estado</label>
                <select v-model="newService.status">
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Taller">En Taller</option>
                  <option value="Completado">Listo</option>
                </select>
              </div>
            </div>

            <button type="submit" class="btn-submit">Abrir Orden</button>
          </form>
        </div>
      </aside>

      <!-- Services Table -->
      <main class="table-section">
        <div class="table-card glass">
          <div class="table-tools glass">
            <div class="search-box">
              <span class="s-icon">🔍</span>
              <input v-model="searchPlate" type="text" placeholder="Buscar por placa o cliente..." />
            </div>
            <div class="filter-chips">
              <button 
                v-for="st in ['', 'Pendiente', 'En Taller', 'Completado', 'Entregado']" 
                :key="st"
                @click="statusFilter = st"
                :class="{ active: statusFilter === st }"
                class="chip"
              >
                {{ st || 'Todos' }}
              </button>
            </div>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Moto & Cliente</th>
                  <th>Responsable</th>
                  <th>Estado</th>
                  <th class="right">Total Cuenta</th>
                  <th class="right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in filteredServices" :key="s.id" class="service-row" @click="openDetail(s)">
                  <td>
                    <div class="bike-cell">
                      <span class="b-model">{{ s.bike_model }}</span>
                      <span class="b-client">{{ s.owner_name }} • <small>{{ s.plate_number }}</small></span>
                    </div>
                  </td>
                  <td>
                    <div class="mech-cell">
                      <span class="m-icon">👨‍🔧</span>
                      <span class="m-name">{{ s.mechanic_name }}</span>
                    </div>
                  </td>
                  <td>
                    <span :class="['pill', s.status.toLowerCase().replace(' ', '-')]">{{ s.status }}</span>
                  </td>
                  <td class="right">
                    <span class="total-pill">${{ (s.total_cost || 0).toLocaleString() }}</span>
                  </td>
                  <td class="right" @click.stop>
                    <div class="actions">
                      <button @click="openDetail(s)" class="act eye">👁️</button>
                      <button @click="deleteService(s.id)" class="act trash">🗑️</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>

    <!-- DETAIL & INVOICING MODAL -->
    <Teleport to="body">
      <div v-if="showDetailModal" class="modal-backdrop" @click.self="showDetailModal = false">
        <div class="detail-modal glass popup-fx">
          <div class="modal-header">
            <div class="m-title">
              <h2>Orden #{{ selectedService?.id }}</h2>
              <span class="m-sub">{{ selectedService?.bike_model }} - {{ selectedService?.owner_name }}</span>
            </div>
            <button @click="showDetailModal = false" class="close-btn">×</button>
          </div>

          <div class="modal-body">
            <div class="detail-grid">
              <!-- Left: Summary & Parts -->
              <div class="detail-main">
                <section class="parts-management">
                  <h3>📦 Repuestos Aplicados</h3>
                  <div class="parts-list">
                    <div v-for="p in selectedService?.parts_list" :key="p.id" class="part-item">
                      <span class="p-qty">{{ p.quantity }}x</span>
                      <span class="p-name">{{ p.part_name }}</span>
                      <span class="p-subtotal">${{ p.subtotal.toLocaleString() }}</span>
                      <button @click="removePart(p.id)" class="btn-remove-p">×</button>
                    </div>
                    <div v-if="!selectedService?.parts_list?.length" class="empty-parts">
                      No hay repuestos cargados a esta orden.
                    </div>
                  </div>

                  <div class="part-picker-box glass">
                    <label>Agregar Repuesto del Almacén</label>
                    <div class="picker-input">
                      <input v-model="partQuery" type="text" placeholder="Buscar por nombre o modelo..." />
                      <input v-model.number="partQty" type="number" min="1" class="qty-input" />
                    </div>
                    <div v-if="partResults.length" class="results-popover glass">
                      <div v-for="r in partResults" :key="r.id" class="r-item" @click="addPartToService(r.id)">
                        <div class="r-info">
                          <span class="rn">{{ r.name }}</span>
                          <span class="rm">{{ r.brand }} {{ r.model }}</span>
                        </div>
                        <span class="rp">${{ r.price.toLocaleString() }}</span>
                        <span class="rs" :class="{ low: r.stock < 5 }">Stock: {{ r.stock }}</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <!-- Right: Costs & Status -->
              <div class="detail-side">
                <div class="cost-card glass">
                  <div class="cost-row">
                    <label>Mano de Obra</label>
                    <div class="input-val">
                      <span>$</span>
                      <input v-model.number="selectedService.labor_cost" type="number" @change="updateLabor" />
                    </div>
                  </div>
                  <div class="cost-row">
                    <label>Suma Repuestos</label>
                    <span>${{ (selectedService?.parts_cost || 0).toLocaleString() }}</span>
                  </div>
                  <div class="total-row">
                    <label>TOTAL FACTURADO</label>
                    <span class="grand-total">${{ (selectedService?.total_cost || 0).toLocaleString() }}</span>
                  </div>
                </div>

                <div class="status-manager">
                  <label>Actualizar Estado del Servicio</label>
                  <div class="status-grid">
                    <button 
                      v-for="st in ['Pendiente', 'En Taller', 'Completado', 'Entregado']" 
                      :key="st"
                      @click="updateStatus(selectedService.id, st)"
                      :class="{ active: selectedService.status === st }"
                      class="st-btn"
                    >
                      {{ st }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.services-container { padding: 3rem; max-width: 1600px; margin: 0 auto; }
.view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4rem; }
.sub { font-size: 0.85rem; font-weight: 700; color: var(--primary-color); text-transform: uppercase; letter-spacing: 2px; }
h1 { font-size: 3rem; font-weight: 900; }

.header-stats { display: flex; align-items: center; gap: 2rem; padding: 1.25rem 2.5rem; border-radius: 99px; }
.h-stat { display: flex; flex-direction: column; align-items: center; }
.h-stat .l { font-size: 0.6rem; font-weight: 800; opacity: 0.6; }
.h-stat .v { font-size: 1.75rem; font-weight: 950; }
.h-stat .v.gold { color: #eab308; }
.sep { height: 35px; width: 1px; background: var(--border-color); }

.layout-grid { display: grid; grid-template-columns: 420px 1fr; gap: 3rem; align-items: start; }
.form-card { padding: 2.5rem; border-radius: 24px; }
.card-head { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }

.input-group { margin-bottom: 1.5rem; }
label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.5rem; }

input, textarea, select {
  width: 100%; padding: 1.1rem; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 14px; color: var(--text-main);
}

.row { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem; }
.btn-submit {
  width: 100%; padding: 1.25rem; background: var(--primary-gradient); border: none; border-radius: 14px; color: white; font-weight: 800; cursor: pointer; transition: 0.3s;
}

/* Table */
.table-card { border-radius: 24px; overflow: hidden; }

.table-tools {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--bg-color);
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.search-box input {
  background: transparent;
  border: none;
  padding: 0;
  font-size: 0.9rem;
}

.filter-chips {
  display: flex;
  gap: 0.5rem;
}

.chip {
  padding: 0.5rem 1rem;
  border-radius: 99px;
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}

.chip:hover { background: rgba(var(--primary-color-rgb), 0.1); }
.chip.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
  box-shadow: 0 0 10px var(--primary-glow);
}

table { width: 100%; border-collapse: collapse; }
th { text-align: left; padding: 1.5rem; font-size: 0.7rem; font-weight: 950; text-transform: uppercase; color: var(--text-secondary); border-bottom: 2px solid var(--border-color); }
td { padding: 1.5rem; border-bottom: 1px solid var(--border-color); }

.service-row { cursor: pointer; transition: 0.2s; }
.service-row:hover { background: rgba(var(--primary-color-rgb), 0.05); }

.b-model { font-weight: 900; font-size: 1.1rem; display: block; color: var(--text-main); }
.b-client { font-size: 0.85rem; color: var(--text-secondary); }
.m-name { font-weight: 700; color: var(--primary-color); }
.total-pill { background: rgba(74, 222, 128, 0.1); color: #4ade80; padding: 0.4rem 0.8rem; border-radius: 8px; font-weight: 900; }

.pill { font-size: 0.65rem; font-weight: 900; padding: 0.35rem 0.8rem; border-radius: 99px; text-transform: uppercase; }
.pill.pendiente { background: rgba(251, 191, 36, 0.15); color: #b45309; }
[data-theme='dark'] .pill.pendiente { color: #fbbf24; }
.pill.en-taller { background: rgba(56, 189, 248, 0.15); color: #0369a1; }
[data-theme='dark'] .pill.en-taller { color: #38bdf8; }
.pill.completado { background: rgba(74, 222, 128, 0.15); color: #15803d; }
[data-theme='dark'] .pill.completado { color: #4ade80; }
.pill.entregado { background: rgba(168, 85, 247, 0.15); color: #7e22ce; }
[data-theme='dark'] .pill.entregado { color: #a855f7; }

.actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
.act { width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--surface-color); cursor: pointer; color: var(--text-main); transition: 0.2s; }
.act.eye:hover { background: var(--primary-color); color: white; }
.act.trash:hover { background: #ef4444; color: white; }

/* Detail Modal */
.modal-backdrop { position: fixed; inset: 0; background: var(--modal-backdrop-color); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.detail-modal { width: 95%; max-width: 1000px; padding: 2.5rem; border-radius: 28px; background: var(--surface-color); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
.m-title h2 { font-size: 2rem; font-weight: 900; }
.m-sub { color: var(--text-secondary); font-weight: 700; }
.modal-header .close-btn { background: transparent; border: none; color: var(--text-main); font-size: 2.5rem; cursor: pointer; }

.detail-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2.5rem; }

.parts-management h3 { margin-bottom: 1.5rem; font-size: 1rem; text-transform: uppercase; color: var(--primary-color); letter-spacing: 1px; }
.parts-list { background: var(--bg-color); border-radius: 18px; padding: 1.5rem; min-height: 200px; margin-bottom: 2rem; }
.part-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.p-qty { font-weight: 900; color: var(--primary-color); font-family: monospace; }
.p-name { flex: 1; font-weight: 600; }
.p-subtotal { font-weight: 800; color: #4ade80; }
.btn-remove-p { background: transparent; border: none; color: #ef4444; font-size: 1.25rem; font-weight: 900; cursor: pointer; }
.empty-parts { text-align: center; opacity: 0.4; padding-top: 3rem; }

.part-picker-box { padding: 1.5rem; border-radius: 18px; position: relative; }
.picker-input { display: flex; gap: 1rem; }
.qty-input { width: 80px !important; text-align: center; }

.results-popover { position: absolute; bottom: 100%; left: 0; right: 0; max-height: 250px; overflow-y: auto; z-index: 10; margin-bottom: 0.5rem; }
.r-item { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: 0.2s; }
.r-item:hover { background: var(--primary-color); }
.r-info { flex: 1; display: flex; flex-direction: column; }
.rn { font-weight: 700; }
.rm { font-size: 0.7rem; opacity: 0.7; }
.rp { font-weight: 900; color: #4ade80; }
.rs { font-size: 0.65rem; font-weight: 800; background: rgba(255,255,255,0.1); padding: 0.2rem 0.5rem; border-radius: 4px; }
.rs.low { background: #ef4444; color: white; }

.cost-card { padding: 2rem; border-radius: 20px; margin-bottom: 2rem; }
.cost-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
.cost-row label { margin-bottom: 0; }
.input-val { display: flex; align-items: center; gap: 0.5rem; background: var(--bg-color); padding: 0.5rem 1rem; border-radius: 10px; border: 1px solid var(--border-color); width: 140px; }
.input-val input { background: transparent; border: none; padding: 0; font-weight: 800; color: var(--text-main); }
.total-row { margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid rgba(255,255,255,0.1); }
.total-row label { font-size: 0.8rem; color: #fff; text-align: center; margin-bottom: 1rem; }
.grand-total { display: block; text-align: center; font-size: 2.25rem; font-weight: 950; color: #eab308; }

.status-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1rem; }
.st-btn { padding: 0.75rem; border-radius: 12px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-main); font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: 0.2s; }
.st-btn:hover { background: rgba(var(--primary-color-rgb), 0.1); }
.st-btn.active { background: var(--primary-color); border-color: var(--primary-color); color: white; box-shadow: 0 0 15px var(--primary-glow); }

@media (max-width: 1000px) {
  .detail-grid { grid-template-columns: 1fr; }
  .detail-side { order: -1; }
}
</style>
