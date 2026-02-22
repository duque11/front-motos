<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { 
  Plus, Search, Filter, RotateCcw, Edit2, 
  Package, Box, HardDrive, Settings, Hash
} from 'lucide-vue-next'

const parts = ref([])
const loading = ref(false)
const searchKey = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const currentPartId = ref(null)

const filters = ref({
  brand: 'Todas',
  model: 'Todos',
  category: 'Todas'
})

const newPart = ref({
  name: '',
  brand: '',
  model: '',
  price: 0,
  stock: 0,
  category: 'Motor'
})

const categories = ['Motor', 'Transmisión', 'Frenos', 'Eléctrico', 'Suspension', 'Tornillería', 'Accesorios', 'Aceite']

async function fetchParts() {
  loading.value = true
  try {
    const res = await fetch('/api/parts', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    parts.value = await res.json()
  } catch (err) {
    console.error('Error fetching parts:', err)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!newPart.value.name || !newPart.value.brand) return
  
  const url = isEditing.value ? `/api/parts/${currentPartId.value}` : '/api/parts'
  const method = isEditing.value ? 'PATCH' : 'POST'
  
  try {
    const res = await fetch(url, {
      method: method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(newPart.value)
    })
    if (res.ok) {
      await fetchParts()
      resetForm()
    }
  } catch (err) {
    console.error('Error saving part:', err)
  }
}

function startEdit(part) {
  isEditing.value = true
  currentPartId.value = part.id
  newPart.value = { ...part }
  showModal.value = true
}

function resetForm() {
  showModal.value = false
  isEditing.value = false
  currentPartId.value = null
  newPart.value = { name: '', brand: '', model: '', price: 0, stock: 0, category: 'Motor' }
}

function clearFilters() {
  filters.value = { brand: 'Todas', model: 'Todos', category: 'Todas' }
  searchKey.value = ''
}

// Cascading Options
const availableBrands = computed(() => {
  const b = [...new Set(parts.value.map(p => p.brand))]
  return ['Todas', ...b.sort()]
})

const availableModels = computed(() => {
  if (filters.value.brand === 'Todas') return ['Todos']
  const m = [...new Set(parts.value.filter(p => p.brand === filters.value.brand).map(p => p.model))]
  return ['Todos', ...m.sort()]
})

const availableCategories = computed(() => {
  let p = parts.value
  if (filters.value.brand !== 'Todas') p = p.filter(x => x.brand === filters.value.brand)
  if (filters.value.model !== 'Todos') p = p.filter(x => x.model === filters.value.model)
  const c = [...new Set(p.map(x => x.category))]
  return ['Todas', ...c.sort()]
})

// Reset children filters when parent changes
watch(() => filters.value.brand, () => { filters.value.model = 'Todos'; filters.value.category = 'Todas' })
watch(() => filters.value.model, () => { filters.value.category = 'Todas' })

const filteredResult = computed(() => {
  return parts.value.filter(p => {
    const matchBrand = filters.value.brand === 'Todas' || p.brand === filters.value.brand
    const matchModel = filters.value.model === 'Todos' || p.model === filters.value.model
    const matchCat = filters.value.category === 'Todas' || p.category === filters.value.category
    const matchSearch = !searchKey.value || 
      p.name.toLowerCase().includes(searchKey.value.toLowerCase()) ||
      (p.model && p.model.toLowerCase().includes(searchKey.value.toLowerCase()))
    
    return matchBrand && matchModel && matchCat && matchSearch
  })
})

onMounted(fetchParts)
</script>

<template>
  <div class="inventory-container fade-in">
    <header class="view-header">
      <div class="title-meta">
        <span class="sub">Logística & Almacén</span>
        <h1>Inventario Maestro</h1>
      </div>
      <button @click="resetForm(); showModal = true" class="btn-add-main glass card-hover-fx">
        <Plus class="icon" />
        <span>Añadir Repuesto</span>
      </button>
    </header>

    <!-- Advanced Filter Section -->
    <section class="filter-panel glass">
      <div class="filter-grid">
        <div class="filter-group">
          <label>1. Seleccionar Marca</label>
          <select v-model="filters.brand">
            <option v-for="b in availableBrands" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>
        
        <div class="filter-group" :class="{ disabled: filters.brand === 'Todas' }">
          <label>2. Modelo de Moto</label>
          <select v-model="filters.model" :disabled="filters.brand === 'Todas'">
            <option v-for="m in availableModels" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>3. Categoría / Tipo</label>
          <select v-model="filters.category">
            <option v-for="c in availableCategories" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div class="filter-group search-group">
          <label>4. Búsqueda Rápida</label>
          <div class="input-with-icon">
            <Search class="i-icon" />
            <input v-model="searchKey" type="text" placeholder="Ej. Filtro aceite..." />
          </div>
        </div>
      </div>

      <div class="filter-footer">
        <button @click="clearFilters" class="btn-clear-filters">
          <RotateCcw class="btn-i" />
          <span>Limpiar Filtros</span>
        </button>
      </div>
    </section>

    <main class="inventory-main">
      <div v-if="loading" class="loading-full">
        <div class="spinner-pro"></div>
        <p>Expertos sincronizando el almacén...</p>
      </div>

      <div class="table-card glass">
        <div class="table-header">
          <span class="results-count">Encontrados: <strong>{{ filteredResult.length }}</strong> repuestos</span>
        </div>
        
        <div class="scroll-table">
          <table class="pro-table">
            <thead>
              <tr>
                <th>Repuesto / Descripción</th>
                <th>Marca</th>
                <th>Modelo Compatible</th>
                <th>Categoría</th>
                <th class="text-right">Precio</th>
                <th class="text-center">Stock</th>
                <th class="text-right">Ajuste</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in filteredResult" :key="p.id" class="row-fx">
                <td>
                  <div class="p-name">{{ p.name }}</div>
                </td>
                <td><span class="brand-tag">{{ p.brand }}</span></td>
                <td><span class="model-tag">{{ p.model || 'Universal' }}</span></td>
                <td><span class="cat-chip">{{ p.category }}</span></td>
                <td class="text-right price-val">${{ (p.price || 0).toLocaleString() }}</td>
                <td class="text-center">
                  <div class="stock-pill" :class="{ low: p.stock < 10, empty: p.stock === 0 }">
                    {{ p.stock }}
                  </div>
                </td>
                <td class="text-right">
                  <button @click="startEdit(p)" class="btn-tool"><Edit2 /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="filteredResult.length === 0 && !loading" class="empty-box">
          <div class="empty-icon">📂</div>
          <h3>Sin coincidencias exactas</h3>
          <p>Prueba ajustando los filtros de Marca o Modelo.</p>
        </div>
      </div>
    </main>

    <!-- Modal Form -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="resetForm">
        <div class="modal-box glass popup-fx">
          <div class="box-head">
            <h2>{{ isEditing ? 'Editar Repuesto' : 'Nuevo Repuesto' }}</h2>
            <button @click="resetForm" class="close-x">×</button>
          </div>
          
          <form @submit.prevent="handleSubmit" class="box-form">
            <div class="input-row full">
              <label>Descripción del Repuesto</label>
              <input v-model="newPart.name" type="text" placeholder="Ej. Guardabarros Delantero" required />
            </div>

            <div class="input-row split">
              <div class="field">
                <label>Marca de Moto</label>
                <input v-model="newPart.brand" type="text" placeholder="Honda..." required />
              </div>
              <div class="field">
                <label>Modelo Específico</label>
                <input v-model="newPart.model" type="text" placeholder="XRE 300..." />
              </div>
            </div>

            <div class="input-row split">
              <div class="field">
                <label>Categoría</label>
                <select v-model="newPart.category">
                  <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                </select>
              </div>
              <div class="field">
                <label>Precio de Venta</label>
                <input v-model.number="newPart.price" type="number" required />
              </div>
            </div>

            <div class="input-row split">
              <div class="field">
                <label>Stock Inicial</label>
                <input v-model.number="newPart.stock" type="number" required />
              </div>
            </div>

            <button type="submit" class="btn-save" :class="{ 'btn-edit-save': isEditing }">
              {{ isEditing ? 'Guardar Cambios' : 'Vincular al Almacén' }}
            </button>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.inventory-container {
  padding: 3rem;
  max-width: 1600px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
}

h1 { font-size: 3.5rem; font-weight: 900; margin: 0; }
.sub { color: var(--primary-color); font-weight: 800; text-transform: uppercase; letter-spacing: 2px; font-size: 1rem; }

.btn-add-main {
  padding: 1rem 2rem;
  border-radius: 99px;
  border: 2px solid var(--primary-color);
  color: var(--text-main);
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: 0.3s;
}

.btn-add-main:hover { background: var(--primary-color); transform: scale(1.05); }

/* Filter Panel */
.filter-panel {
  padding: 2.5rem;
  border-radius: var(--radius-xl);
  margin-bottom: 3rem;
  border: 1px solid rgba(255,255,255,0.05);
  position: relative;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
}

.filter-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  letter-spacing: 1px;
}

.filter-group select, .filter-group input {
  width: 100%;
  padding: 1.1rem;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  color: var(--text-main);
  font-weight: 600;
}

.filter-group.disabled { opacity: 0.4; }

.search-group { grid-column: span 1; }

.input-with-icon { position: relative; }
.i-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); opacity: 0.5; }
.input-with-icon input { padding-left: 3rem; }

.filter-footer {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
}

.btn-clear-filters {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--text-secondary);
  padding: 0.5rem 1.2rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: 0.3s;
}

.btn-clear-filters:hover {
  background: rgba(255,255,255,0.05);
  color: white;
  border-color: var(--primary-color);
}

/* Table Section */
.table-card { border-radius: 20px; overflow: hidden; }

.table-header { padding: 1.5rem 2.5rem; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05); }
.results-count { font-size: 0.85rem; color: var(--text-secondary); }
.results-count strong { color: var(--primary-color); }

.scroll-table { max-height: 700px; overflow-y: auto; }

.pro-table { width: 100%; border-collapse: collapse; }
.pro-table th {
  padding: 1.5rem 2.5rem;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 900;
  text-transform: uppercase;
  color: var(--text-secondary);
  background: rgba(0,0,0,0.1);
  position: sticky; top: 0;
  z-index: 10;
}

.pro-table td { padding: 1.25rem 2.5rem; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.95rem; }

.row-fx:hover { background: rgba(var(--primary-color-rgb), 0.05); }

.p-name { font-weight: 700; color: var(--text-main); }
.brand-tag { font-weight: 800; font-size: 0.75rem; text-transform: uppercase; color: var(--primary-color); }
.model-tag { font-family: monospace; font-size: 0.85rem; opacity: 0.8; }
.cat-chip { padding: 0.2rem 0.6rem; background: var(--border-color); border-radius: 6px; font-size: 0.7rem; font-weight: 700; }
.price-val { font-weight: 900; color: #4ade80; }

.stock-pill {
  display: inline-block;
  padding: 0.25rem 1rem;
  border-radius: 12px;
  background: rgba(74, 222, 128, 0.1);
  color: #4ade80;
  font-weight: 900;
  min-width: 40px;
}

.stock-pill.low { background: rgba(250, 204, 21, 0.1); color: #facc15; }
.stock-pill.empty { background: rgba(248, 113, 113, 0.1); color: #f87171; }

.btn-tool { background: transparent; border: none; cursor: pointer; opacity: 0.4; transition: 0.2s; }
.btn-tool:hover { opacity: 1; transform: scale(1.2); }

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.9); backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center; z-index: 2000;
}

.modal-box { width: 90%; max-width: 550px; padding: 3rem; border-radius: 20px; }
.box-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
.box-head h2 { font-size: 1.5rem; font-weight: 900; }
.close-x { background: transparent; border: none; font-size: 2rem; color: white; cursor: pointer; }

.input-row { margin-bottom: 1.5rem; }
.input-row.split { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.field label { display: block; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0.6rem; color: var(--text-secondary); }

.box-form input, .box-form select {
  width: 100%; padding: 1rem; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 12px; color: var(--text-main);
}

.btn-save {
  width: 100%; padding: 1.25rem; background: var(--primary-color); color: white; border: none; border-radius: 12px; font-weight: 900; cursor: pointer; margin-top: 1.5rem;
}

.btn-edit-save { background: #f97316; }

.empty-box { text-align: center; padding: 5rem; opacity: 0.5; }
.empty-icon { font-size: 4rem; margin-bottom: 1rem; }

@media (max-width: 1100px) {
  .filter-grid { grid-template-columns: 1fr 1fr; }
}
</style>
