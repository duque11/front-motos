<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { UserPlus, User, Phone, Mail, MapPin, Search } from 'lucide-vue-next'

const clients = ref([])
const loading = ref(false)
const searchQuery = ref('')
const showModal = ref(false)
const newClient = ref({ name: '', phone: '', email: '', address: '' })

let searchTimeout = null
watch(searchQuery, (val) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchClients(val)
  }, 300)
})

async function fetchClients(search = '') {
  loading.value = true
  try {
    const res = await fetch(`/api/clients?search=${search}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    clients.value = await res.json()
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function addClient() {
  try {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(newClient.value)
    })
    if (res.ok) {
      showModal.value = false
      newClient.value = { name: '', phone: '', email: '', address: '' }
      await fetchClients()
    }
  } catch (err) {
    console.error(err)
  }
}

const filteredClients = computed(() => clients.value)

onMounted(fetchClients)
</script>

<template>
  <div class="clients-container fade-in">
    <header class="view-header">
      <div class="title-meta">
        <span class="sub">CRM / Base de Datos</span>
        <h1>Mis Clientes</h1>
      </div>
      <button @click="showModal = true" class="btn-add glass">
        <UserPlus class="icon" />
        <span>Nuevo Cliente</span>
      </button>
    </header>

    <div class="search-bar glass">
      <Search class="icon" />
      <input v-model="searchQuery" type="text" placeholder="Buscar por nombre o celular..." />
    </div>

    <div class="clients-grid">
      <div v-for="c in filteredClients" :key="c.id" class="client-card glass card-hover-fx">
        <div class="client-avatar">
          {{ c.name.charAt(0) }}
        </div>
        <h3>{{ c.name }}</h3>
        
        <div class="contact-info">
          <div class="item">
            <Phone class="icon" />
            <span>{{ c.phone }}</span>
          </div>
          <div class="item">
            <Mail class="icon" />
            <span>{{ c.email || 'Sin correo' }}</span>
          </div>
          <div class="item">
            <MapPin class="icon" />
            <span>{{ c.address || 'Sin dirección' }}</span>
          </div>
        </div>
        
        <div class="client-footer">
          <span class="reg-date">Registrado: {{ c.created_at }}</span>
          <button class="btn-history">Ver CRM</button>
        </div>
      </div>
    </div>

    <!-- Modal Nuevo Cliente -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay">
        <div class="modal-content glass">
          <h2>Registrar Cliente</h2>
          <form @submit.prevent="addClient">
            <div class="input-group">
              <label>Nombre Completo</label>
              <input v-model="newClient.name" required type="text" />
            </div>
            <div class="input-group">
              <label>Teléfono / WhatsApp</label>
              <input v-model="newClient.phone" required type="text" />
            </div>
            <div class="input-group">
              <label>Correo Electrónico</label>
              <input v-model="newClient.email" type="email" />
            </div>
            <div class="input-group">
              <label>Dirección</label>
              <input v-model="newClient.address" type="text" />
            </div>
            <div class="modal-actions">
              <button type="button" @click="showModal = false" class="btn-cancel">Cancelar</button>
              <button type="submit" class="btn-save">Guardar Cliente</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.clients-container { padding: 3rem; max-width: 1400px; margin: 0 auto; }
.view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; }
h1 { font-size: 3rem; font-weight: 900; }
.sub { font-size: 0.85rem; font-weight: 700; color: var(--primary-color); text-transform: uppercase; letter-spacing: 2px; }

.btn-add { 
  display: flex; align-items: center; gap: 1rem; padding: 1rem 2rem; 
  border-radius: 99px; font-weight: 800; cursor: pointer; color: var(--primary-color);
  border: 1px solid var(--primary-glow);
}
.btn-add:hover { background: var(--primary-glow); }

.search-bar { display: flex; align-items: center; gap: 1rem; padding: 1rem 2rem; border-radius: 16px; margin-bottom: 3rem; }
.search-bar input { background: transparent; border: none; font-size: 1rem; color: white; width: 100%; }

.clients-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem; }
.client-card { padding: 2.5rem; border-radius: 24px; text-align: center; }

.client-avatar { 
  width: 80px; height: 80px; background: var(--primary-gradient); 
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 2rem; font-weight: 950; color: white; margin: 0 auto 1.5rem;
  box-shadow: 0 10px 30px var(--primary-glow);
}

.contact-info { display: flex; flex-direction: column; gap: 1rem; margin: 2rem 0; }
.contact-info .item { display: flex; align-items: center; gap: 1rem; color: var(--text-secondary); font-size: 0.9rem; }
.contact-info .icon { width: 16px; color: var(--primary-color); }

.client-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 1.5rem; }
.reg-date { font-size: 0.7rem; color: var(--text-secondary); font-weight: 700; }
.btn-history { background: transparent; border: none; color: var(--primary-color); font-weight: 800; cursor: pointer; font-size: 0.8rem; }

/* Modal Styles */
.modal-overlay { 
  position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
  background: rgba(0,0,0,0.8); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; z-index: 2000;
}
.modal-content { width: 100%; max-width: 500px; padding: 3rem; border-radius: 30px; }
.input-group { margin-bottom: 1.5rem; }
.input-group label { display: block; font-size: 0.7rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--text-secondary); text-transform: uppercase; }
.input-group input { width: 100%; padding: 1rem; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: white; }

.modal-actions { display: flex; gap: 1rem; margin-top: 2rem; }
.btn-cancel { flex: 1; padding: 1rem; background: transparent; border: 1px solid var(--border-color); color: white; border-radius: 12px; cursor: pointer; }
.btn-save { flex: 2; padding: 1rem; background: var(--primary-gradient); color: white; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; }
</style>
