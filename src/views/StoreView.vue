<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const parts = ref([])
const loading = ref(false)
const searchQuery = ref('')
const cart = ref([])
const showCart = ref(false)
const checkoutLoading = ref(false)
const customerName = ref('Mostrador')

// Filter state
const filters = ref({ category: 'Todas', brand: 'Todas', model: '' })

function clearFilters() {
  searchQuery.value = ''
  filters.value = { category: 'Todas', brand: 'Todas', model: '' }
}

async function fetchParts() {
  loading.value = true
  try {
    const res = await fetch('/api/parts', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    parts.value = await res.json()
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Shopping Cart Logic
function addToCart(part) {
  const existing = cart.value.find(item => item.id === part.id)
  if (existing) {
    if (existing.qty < part.stock) {
      existing.qty++
    }
  } else {
    cart.value.push({ ...part, qty: 1 })
  }
}

function removeFromCart(id) {
  cart.value = cart.value.filter(i => i.id !== id)
}

const cartTotal = computed(() => {
  return cart.value.reduce((acc, item) => acc + (item.price * item.qty), 0)
})

const cartCount = computed(() => {
  return cart.value.reduce((acc, item) => acc + item.qty, 0)
})

async function handleCheckout() {
  if (cart.value.length === 0) return
  checkoutLoading.value = true
  try {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        customerName: customerName.value,
        items: cart.value.map(i => ({ id: i.id, qty: i.qty }))
      })
    })
    
    if (res.ok) {
      alert('¡Venta realizada con éxito! 🏁')
      cart.value = []
      showCart.value = false
      customerName.value = 'Mostrador'
      await fetchParts()
    } else {
      const err = await res.json()
      alert(err.error || 'Error en la venta')
    }
  } catch (err) {
    alert('Error de conexión')
  } finally {
    checkoutLoading.value = false
  }
}

// Filtering
const filteredParts = computed(() => {
  return parts.value.filter(p => {
    const s = searchQuery.value.toLowerCase()
    const matchSearch = !s || 
      p.name.toLowerCase().includes(s) ||
      p.brand.toLowerCase().includes(s) ||
      (p.model && p.model.toLowerCase().includes(s))
      
    const matchCat = filters.value.category === 'Todas' || p.category === filters.value.category
    const matchBrand = filters.value.brand === 'Todas' || p.brand === filters.value.brand
    const matchModel = !filters.value.model || (p.model && p.model.toLowerCase().includes(filters.value.model.toLowerCase()))
    
    return matchSearch && matchCat && matchBrand && matchModel && p.stock > 0
  })
})

const categories = computed(() => ['Todas', ...new Set(parts.value.map(p => p.category))])
const brands = computed(() => ['Todas', ...new Set(parts.value.map(p => p.brand))])

onMounted(fetchParts)
</script>

<template>
  <div class="store-container fade-in">
    <header class="view-header">
      <div class="title-meta">
        <span class="sub">Venta Directa / POS</span>
        <h1>Tienda de Repuestos</h1>
      </div>
      
      <div class="header-actions">
        <button @click="showCart = !showCart" class="cart-trigger glass" :class="{ 'has-items': cartCount > 0 }">
          <span class="c-icon">🛒</span>
          <span class="c-label">Mi Carrito</span>
          <span v-if="cartCount > 0" class="c-badge">{{ cartCount }}</span>
        </button>
      </div>
    </header>

    <div class="search-bar-pos glass">
      <div class="search-input">
        <span class="icon">🔍</span>
        <input v-model="searchQuery" type="text" placeholder="Buscar por nombre, marca o modelo..." />
      </div>
      <div class="filter-controls">
        <select v-model="filters.category">
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="filters.brand">
          <option value="Todas">Todas las Marcas</option>
          <option v-for="b in brands" :key="b" :value="b">{{ b === 'Todas' ? 'Cualquier Marca' : b }}</option>
        </select>
        <input v-model="filters.model" type="text" placeholder="Modelo (Ej. 2024)" class="inline-input" />
        <button @click="clearFilters" class="btn-clear">🧹 Limpiar</button>
      </div>
    </div>

    <main class="store-grid">
      <div v-for="part in filteredParts" :key="part.id" class="part-card glass card-hover-fx">
        <div class="part-header">
          <span class="cat-pill">{{ part.category }}</span>
          <span class="stock-pill" :class="{ low: part.stock < 5 }">Stock: {{ part.stock }}</span>
        </div>
        
        <div class="part-body">
          <h3>{{ part.name }}</h3>
          <p class="brand-model">{{ part.brand }} | {{ part.model || 'Universal' }}</p>
          <div class="price-tag">${{ part.price.toLocaleString() }}</div>
        </div>

        <button @click="addToCart(part)" class="btn-add-cart">
          <span>Añadir al Carrito</span>
          <span class="icon">🛒</span>
        </button>
      </div>
      
      <div v-if="filteredParts.length === 0" class="empty-store glass">
        <span class="icon">📦</span>
        <h3>No se encontraron repuestos</h3>
        <p>Intenta con otros filtros o verifica el inventario.</p>
      </div>
    </main>

    <!-- Shopping Cart Sidebar -->
    <Teleport to="body">
      <Transition name="slide">
        <div v-if="showCart" class="cart-sidebar glass card-hover-fx">
          <div class="cart-head">
            <h2>🛒 Tu Pedido</h2>
            <button @click="showCart = false" class="close-btn">×</button>
          </div>

          <div class="cart-items">
            <div v-for="item in cart" :key="item.id" class="cart-item">
              <div class="item-info">
                <h4>{{ item.name }}</h4>
                <span>${{ item.price.toLocaleString() }} x {{ item.qty }}</span>
              </div>
              <div class="item-actions">
                <button @click="removeFromCart(item.id)" class="btn-remove">🗑️</button>
              </div>
            </div>
            
            <div v-if="cart.length === 0" class="empty-cart-msg">
              <p>El carrito está vacío</p>
            </div>
          </div>

          <div class="cart-footer" v-if="cart.length > 0">
            <div class="customer-input">
              <label>Cliente</label>
              <input v-model="customerName" type="text" placeholder="Nombre (Opcional)" />
            </div>
            
            <div class="total-row">
              <label>Total a Pagar</label>
              <span class="total-val">${{ cartTotal.toLocaleString() }}</span>
            </div>

            <button @click="handleCheckout" class="btn-checkout" :disabled="checkoutLoading">
              {{ checkoutLoading ? 'Procesando...' : 'Finalizar Venta 🏁' }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.store-container { padding: 3rem; max-width: 1600px; margin: 0 auto; }
.view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; }
h1 { font-size: 3rem; font-weight: 900; }
.sub { font-size: 0.85rem; font-weight: 700; color: var(--primary-color); text-transform: uppercase; letter-spacing: 2px; }

.cart-trigger {
  display: flex; align-items: center; gap: 1rem; padding: 1rem 2rem; border-radius: 99px;
  border: 2px solid var(--border-color); cursor: pointer; position: relative; transition: 0.3s;
}
.cart-trigger.has-items { border-color: var(--primary-color); background: var(--primary-glow); }
.c-badge { position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; width: 24px; height: 24px; border-radius: 50%; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; font-weight: 900; }

.search-bar-pos { display: flex; flex-wrap: wrap; gap: 1rem; padding: 1.5rem 2rem; border-radius: 20px; margin-bottom: 3rem; align-items: center; }
.search-input { flex: 2; min-width: 300px; display: flex; align-items: center; gap: 1rem; background: var(--bg-color); padding: 0.75rem 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); }
.search-input input { background: transparent; border: none; font-size: 1rem; width: 100%; color: var(--text-main); }
.filter-controls { flex: 3; display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: flex-end; align-items: center; }
.filter-controls select { width: 180px; padding: 0.75rem; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 12px; color: var(--text-main); font-weight: 600; }
.inline-input { width: 120px; padding: 0.75rem; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 12px; color: var(--text-main); }
.btn-clear { padding: 0.75rem 1.25rem; background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; color: var(--text-secondary); cursor: pointer; transition: 0.2s; font-weight: 700; white-space: nowrap; }
.btn-clear:hover { background: #ef4444; color: white; border-color: #ef4444; }

.store-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; }
.part-card { padding: 2rem; border-radius: 24px; display: flex; flex-direction: column; gap: 1.5rem; }
.part-header { display: flex; justify-content: space-between; align-items: center; }
.cat-pill { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--text-secondary); }
.stock-pill { font-size: 0.7rem; font-weight: 800; background: rgba(74, 222, 128, 0.1); color: #4ade80; padding: 0.25rem 0.75rem; border-radius: 99px; }
.stock-pill.low { background: rgba(239, 68, 68, 0.1); color: #f87171; }

.part-body h3 { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.25rem; }
.brand-model { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.5rem; }
.price-tag { font-size: 2rem; font-weight: 950; color: var(--primary-color); }

.btn-add-cart {
  width: 100%; padding: 1rem; background: var(--surface-color); border: 1px solid var(--border-color);
  color: var(--text-main); border-radius: 14px; font-weight: 800; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 1rem; transition: 0.3s;
}
.btn-add-cart:hover { background: var(--primary-color); color: white; transform: translateY(-3px); }

.empty-store { text-align: center; padding: 5rem; grid-column: 1 / -1; }
.empty-store .icon { font-size: 4rem; opacity: 0.2; }

/* Cart Sidebar */
.cart-sidebar {
  position: fixed; top: 0; right: 0; width: 450px; height: 100vh; background: var(--surface-color);
  z-index: 3000; padding: 3rem; display: flex; flex-direction: column; border-left: 1px solid var(--border-color);
}
.cart-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; }
.close-btn { background: transparent; border: none; font-size: 2.5rem; color: var(--text-main); cursor: pointer; }

.cart-items { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.5rem; }
.cart-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); }
.item-info h4 { margin-bottom: 0.25rem; }
.item-info span { color: var(--primary-color); font-weight: 800; }
.btn-remove { background: transparent; border: none; cursor: pointer; font-size: 1.25rem; }

.cart-footer { padding-top: 2rem; border-top: 2px solid var(--border-color); }
.customer-input { margin-bottom: 2rem; }
.customer-input label { display: block; font-size: 0.75rem; font-weight: 800; margin-bottom: 0.5rem; text-transform: uppercase; }
.customer-input input { width: 100%; padding: 1rem; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 12px; color: var(--text-main); }

.total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
.total-val { font-size: 2.5rem; font-weight: 950; color: #eab308; }

.btn-checkout {
  width: 100%; padding: 1.25rem; background: var(--primary-gradient); border: none; border-radius: 16px;
  color: white; font-weight: 900; font-size: 1.1rem; cursor: pointer; transition: 0.3s;
}
.btn-checkout:hover { transform: translateY(-5px); box-shadow: 0 10px 30px var(--primary-glow); }

/* Transitions */
.slide-enter-active, .slide-leave-active { transition: transform 0.4s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }

@media (max-width: 1000px) {
  .search-bar-pos { flex-direction: column; align-items: stretch; }
  .filter-controls { justify-content: flex-start; }
  .filter-controls select, .inline-input { flex: 1; width: auto; }
}
</style>
