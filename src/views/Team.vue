<script setup>
import { ref, onMounted, watch } from 'vue'

const mechanics = ref([])
const loading = ref(false)
const isEditing = ref(false)
const currentMechanicId = ref(null)

const newMechanic = ref({ 
  name: '', 
  specialty: 'Mecánico General', 
  phone: '',
  email: '',
  username: '', // IS
  password: '1234'
})

const specialties = ['Mecánico General', 'Especialista en Motores', 'Electrónica & Sensores', 'Suspensión & Frenos', 'Latonería & Pintura', 'Asistente']

// Auto-generate initials for Username (IS)
watch(() => newMechanic.value.name, (newName) => {
  if (newName) {
    const initials = newName
      .split(' ')
      .filter(w => w.length > 0)
      .map(word => word[0])
      .join('')
      .toUpperCase()
    newMechanic.value.username = initials
  }
})

function whatsappWelcome(mechanic) {
  if (!mechanic.phone) return
  const msg = `¡Hola *${mechanic.name}*! 👋 Bienvenido al equipo de *Taller Duke*. Estamos felices de tenerte con nosotros como *${mechanic.specialty}*. Tu usuario para la plataforma es: *${mechanic.username}*. ¡A trabajar con toda! 🏍️🔥`
  const url = `https://wa.me/57${mechanic.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(msg)}`
  window.open(url, '_blank')
}

async function fetchMechanics() {
  loading.value = true
  try {
    const res = await fetch('/api/mechanics', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    mechanics.value = await res.json()
  } catch (err) {
    console.error('Error fetching mechanics:', err)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!newMechanic.value.name) return
  
  const url = isEditing.value ? `/api/mechanics/${currentMechanicId.value}` : '/api/mechanics'
  const method = isEditing.value ? 'PATCH' : 'POST'
  
  try {
    const res = await fetch(url, {
      method: method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(newMechanic.value)
    })
    if (res.ok) {
      const savedMechanic = await res.json()
      alert('¡Personal registrado con éxito! 🏁')
      await fetchMechanics()
      
      // Auto-send WhatsApp on new registration
      if (!isEditing.value && savedMechanic.phone) {
        whatsappWelcome(savedMechanic)
      }
      
      resetForm()
    } else {
      const errorData = await res.json()
      alert(`Error: ${errorData.error || 'No se pudo guardar el trabajador'}`)
    }
  } catch (err) {
    alert('Error de conexión con el servidor')
    console.error('Error saving mechanic:', err)
  }
}

function startEdit(mechanic) {
  isEditing.value = true
  currentMechanicId.value = mechanic.id
  newMechanic.value = { 
    name: mechanic.name, 
    specialty: mechanic.specialty, 
    phone: mechanic.phone || '',
    email: mechanic.email || '',
    username: mechanic.username || '',
    password: '' // Keep empty for password if not changing
  }
  // Scroll to form
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function resetForm() {
  isEditing.value = false
  currentMechanicId.value = null
  newMechanic.value = { 
    name: '', 
    specialty: 'Mecánico General', 
    phone: '',
    email: '',
    username: '',
    password: '1234'
  }
}

async function deleteMechanic(id) {
  if (!confirm('¿Deseas dar de baja a este trabajador?')) return
  try {
    await fetch(`/api/mechanics/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    await fetchMechanics()
  } catch (err) {
    console.error('Error deleting mechanic:', err)
  }
}

onMounted(fetchMechanics)
</script>

<template>
  <div class="team-container fade-in">
    <header class="view-header">
      <div class="title-meta">
        <span class="sub">Recursos Humanos</span>
        <h1>Equipo de Élite</h1>
      </div>
      <div class="team-stats glass">
        <div class="stat">
          <span class="val">{{ mechanics.length }}</span>
          <span class="lab">Activos</span>
        </div>
      </div>
    </header>

    <div class="layout-grid">
      <!-- Sidebar for adding/editing mechanics -->
      <aside class="form-section">
        <div class="form-card glass highlight-border">
          <div class="card-head">
            <span :class="isEditing ? 'pulse-orange' : 'pulse'"></span>
            <h2>{{ isEditing ? 'Editar Especialista' : 'Nuevo Especialista' }}</h2>
          </div>
          
          <div v-if="isEditing" class="edit-banner">
            Editando a <strong>{{ newMechanic.name }}</strong>
            <button @click="resetForm" class="btn-cancel-top">×</button>
          </div>

          <form @submit.prevent="handleSubmit">
            <div class="input-group">
              <label>Nombre del Colaborador</label>
              <input v-model="newMechanic.name" type="text" placeholder="Ej. Ricardo Montaner" required />
            </div>
            
            <div class="input-group">
              <label>Especialidad Principal</label>
              <select v-model="newMechanic.specialty">
                <option v-for="spec in specialties" :key="spec" :value="spec">{{ spec }}</option>
              </select>
            </div>

            <div class="row">
              <div class="input-group">
                <label>IS (Login)</label>
                <input v-model="newMechanic.username" type="text" placeholder="CP" required />
              </div>
              <div class="input-group">
                <label>{{ isEditing ? 'Nueva Clave' : 'Contraseña' }}</label>
                <input v-model="newMechanic.password" type="password" placeholder="••••" required />
              </div>
            </div>

            <div class="input-group">
              <label>Contacto (Móvil)</label>
              <input v-model="newMechanic.phone" type="text" placeholder="+57 3..." />
            </div>

            <div class="input-group">
              <label>Correo Electrónico (Para Bienvenida)</label>
              <input v-model="newMechanic.email" type="email" placeholder="ejemplo@correo.com" />
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-submit" :class="{ 'btn-edit': isEditing }">
                <span class="content">
                  <span class="icon">{{ isEditing ? '💾' : '👔' }}</span>
                  {{ isEditing ? 'Guardar Cambios' : 'Vincular al Equipo' }}
                </span>
              </button>
              <button v-if="isEditing" type="button" @click="resetForm" class="btn-cancel">Cancelar</button>
            </div>
          </form>
        </div>
      </aside>

      <!-- Grid of mechanic cards -->
      <main class="team-content">
        <div class="mechanics-grid">
          <div v-for="m in mechanics" :key="m.id" class="mechanic-card glass card-hover-fx">
            <div class="card-inner">
              <div class="profile-header">
                <div class="profile-avatar overflow-hidden">
                  <div class="avatar-ring"></div>
                  <span class="avatar-emoji">👨‍🔧</span>
                </div>
                <div class="status-indicator" :class="{ active: m.is_active }"></div>
              </div>
              
              <div class="profile-body">
                <h3>{{ m.name }}</h3>
                <div class="is-badge">ID: {{ m.username }}</div>
                <div class="specialty-badge">{{ m.specialty }}</div>
                <div class="contact-info">
                  <span class="c-icon">📞</span>
                  <span class="c-text">{{ m.phone || 'Sin contacto' }}</span>
                </div>
                <div class="contact-info" v-if="m.email">
                  <span class="c-icon">📧</span>
                  <span class="c-text">{{ m.email }}</span>
                </div>
              </div>

              <div class="card-actions">
              <button @click="startEdit(m)" class="btn-action edit">✏️ Editar</button>
              <router-link :to="'/team/' + m.id" class="btn-action history">📋 Historial</router-link>
              <button @click="whatsappWelcome(m)" class="btn-action wa" v-if="m.phone">📱 WhatsApp</button>
              <button @click="deleteMechanic(m.id)" class="btn-action delete">🚫 Baja</button>
            </div>
            </div>
            <div class="card-glow"></div>
          </div>

          <div v-if="mechanics.length === 0" class="empty-state glass">
            <div class="empty-icon">🤝</div>
            <h3>Empieza a formar tu equipo</h3>
            <p>Registra a tu primer mecánico para empezar a asignar servicios.</p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.team-container {
  padding: 3rem;
  max-width: 1600px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5rem;
}

.sub {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent-color);
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-bottom: 0.5rem;
}

h1 {
  font-size: 3.5rem;
  font-weight: 900;
  margin: 0;
}

.team-stats {
  padding: 1.5rem 3rem;
  border-radius: 20px;
}

.stat .val { font-size: 2.5rem; font-weight: 900; display: block; color: var(--primary-color); text-align: center; }
.stat .lab { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-secondary); }

.layout-grid {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 4rem;
}

/* Form Card */
.form-card {
  padding: 3rem;
  border-radius: var(--radius-xl);
  position: relative;
  transition: all 0.3s ease;
}

.highlight-border {
  border: 2px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);
}

.card-head {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.pulse, .pulse-orange {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.pulse {
  background: var(--accent-color);
  box-shadow: 0 0 15px var(--accent-color);
  animation: pulse-ring 2s infinite;
}

.pulse-orange {
  background: #f97316;
  box-shadow: 0 0 15px #f97316;
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(3); opacity: 0; }
}

.edit-banner {
  background: rgba(249, 115, 22, 0.1);
  color: #fb923c;
  padding: 0.8rem 1.2rem;
  border-radius: var(--radius-md);
  margin-bottom: 2rem;
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-cancel-top {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}

.input-group { margin-bottom: 1.5rem; }
label {
  display: block;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-bottom: 0.6rem;
  letter-spacing: 1px;
}

input, select {
  width: 100%;
  padding: 1.1rem;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-main);
  font-size: 0.95rem;
  transition: all 0.3s;
}

input:focus, select:focus {
  border-color: var(--primary-color);
  background: var(--surface-color);
  box-shadow: 0 0 0 4px var(--primary-glow);
}

input[readonly] { opacity: 0.5; cursor: not-allowed; }

.row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.form-actions { display: flex; flex-direction: column; gap: 1rem; margin-top: 2rem; }

.btn-submit {
  width: 100%;
  padding: 1.25rem;
  background: var(--primary-color);
  border: none;
  border-radius: var(--radius-lg);
  color: white;
  font-weight: 800;
  cursor: pointer;
  transition: 0.4s;
}

.btn-submit.btn-edit { background: #f97316; }

.btn-submit:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px -10px var(--primary-glow);
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  padding: 1rem;
  border-radius: var(--radius-lg);
  font-weight: 700;
  cursor: pointer;
}

/* Mechanics Grid */
.mechanics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 2rem;
}

.mechanic-card {
  padding: 2.5rem;
  border-radius: var(--radius-xl);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.card-hover-fx:hover {
  transform: translateY(-5px);
  border-color: rgba(var(--primary-color-rgb), 0.3);
  box-shadow: 0 10px 20px -5px rgba(0,0,0,0.3);
}

.profile-header {
  position: relative;
  width: 110px;
  margin: 0 auto 2rem;
}

.profile-avatar {
  width: 110px;
  height: 110px;
  background: rgba(255,255,255,0.03);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3.5rem;
  position: relative;
  border: 1px solid var(--border-color);
}

.avatar-ring {
  position: absolute;
  inset: -4px;
  border: 1px solid rgba(var(--primary-color-rgb), 0.1);
  border-radius: 50%;
}

.status-indicator {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--text-secondary);
  border: 4px solid var(--surface-color);
}

.status-indicator.active { background: #4ade80; box-shadow: 0 0 15px #4ade80; }

h3 { font-size: 1.6rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--text-main); }

.is-badge {
  font-size: 0.75rem;
  font-weight: 900;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  opacity: 0.7;
}

.specialty-badge {
  display: inline-block;
  padding: 0.5rem 1.25rem;
  background: rgba(99, 102, 241, 0.1);
  color: var(--primary-color);
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 2rem;
}

.card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-action {
  padding: 0.85rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: 0.3s;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-action.edit {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  color: var(--text-main);
}

.btn-action.history {
  background: var(--primary-glow);
  color: var(--primary-color);
  border: 1px solid rgba(var(--primary-color-rgb), 0.2);
}

.btn-action.wa {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.btn-action.delete {
  background: rgba(239, 68, 68, 0.05);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.1);
}

.btn-action:hover { opacity: 0.8; transform: translateY(-3px); }
.btn-action.edit:hover { background: rgba(255, 255, 255, 0.1); }
.btn-action.delete:hover { background: #991b1b; color: white; }

.card-glow {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at top right, rgba(var(--primary-color-rgb), 0.1), transparent 70%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.5s;
}

.mechanic-card:hover .card-glow { opacity: 1; }

@media (max-width: 1200px) {
  .layout-grid { grid-template-columns: 1fr; }
  aside { max-width: 500px; margin: 0 auto; }
}
</style>
