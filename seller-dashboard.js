// Seller Dashboard Logic
let currentSeller = null;
let sellerProducts = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  // Check if seller is logged in
  if (!localStorage.getItem('sellerLoggedIn')) {
    alert('❌ Please login first');
    window.location.href = 'seller-login.html';
    return;
  }
  
  await initializeDashboard();
  await loadSellerProducts();
  updateDashboardStats();
});

async function initializeDashboard() {
  try {
    // Get seller ID from localStorage
    const sellerId = localStorage.getItem('sellerId');
    const sellerName = localStorage.getItem('sellerName');
    
    if (!sellerId) {
      alert('❌ Invalid seller session');
      window.location.href = 'seller-login.html';
      return;
    }
    
    // Fetch seller data from Supabase
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/sellers?id=eq.${sellerId}`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    
    if (!response.ok) throw new Error('Failed to load seller');
    
    const sellers = await response.json();
    if (sellers.length === 0) throw new Error('Seller not found');
    
    currentSeller = sellers[0];
    document.getElementById('seller-name').textContent = currentSeller.name;
    
    console.log('✓ Seller loaded:', currentSeller.name);
  } catch (error) {
    console.error('❌ Error initializing dashboard:', error.message);
    alert('Error loading dashboard: ' + error.message);
  }
}

async function loadSellerProducts() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    
    if (!response.ok) throw new Error('Failed to load products');
    
    sellerProducts = await response.json();
    console.log('✓ Loaded products:', sellerProducts.length);
    
    renderProducts();
  } catch (error) {
    console.error('❌ Error loading products:', error.message);
    document.getElementById('products-list').innerHTML = `
      <tr>
        <td class="px-6 py-4 text-red-500 text-center" colspan="5">Error loading products: ${error.message}</td>
      </tr>
    `;
  }
}

function renderProducts() {
  const productsList = document.getElementById('products-list');
  
  if (!sellerProducts || sellerProducts.length === 0) {
    productsList.innerHTML = `
      <tr>
        <td class="px-6 py-4 text-slate-500 text-center" colspan="5">No products available</td>
      </tr>
    `;
    return;
  }
  
  productsList.innerHTML = sellerProducts.map(product => {
    const productLink = `marketplace.html?product=${product.id}`;
    const sales = 0; // Placeholder for actual sales data
    
    return `
      <tr>
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            ${product.image ? `<img src="${product.image}" alt="${product.name}" class="w-10 h-10 rounded object-cover"/>` : ''}
            <div>
              <p class="font-semibold">${product.name}</p>
              <p class="text-xs text-slate-500">${product.category || 'General'}</p>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 font-bold">₹${product.price}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <input type="text" value="${productLink}" readonly class="w-32 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono border border-slate-300 dark:border-slate-600"/>
            <button onclick="copyToClipboard('${productLink}')" class="px-2 py-1 bg-primary hover:bg-primary/90 text-white rounded text-xs transition-all">
              <span class="material-symbols-outlined text-sm">content_copy</span>
            </button>
            <button onclick="openProductLink('${productLink}')" class="px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded text-xs transition-all">
              <span class="material-symbols-outlined text-sm">open_in_new</span>
            </button>
          </div>
        </td>
        <td class="px-6 py-4">
          <span class="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">${sales} sales</span>
        </td>
        <td class="px-6 py-4">
          <button onclick="viewProductDetails('${product.id}')" class="text-primary hover:text-primary/80 font-semibold text-sm">
            View
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateDashboardStats() {
  document.getElementById('product-count').textContent = sellerProducts.length;
  
  // Calculate total sales from product prices as placeholder
  const totalSales = sellerProducts.reduce((sum, p) => sum + (p.price || 0), 0);
  document.getElementById('total-sales').textContent = totalSales.toFixed(2);
  
  // Placeholder for total orders
  document.getElementById('total-orders').textContent = '0';
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  alert('✓ Link copied to clipboard!');
}

function openProductLink(link) {
  window.open(link, '_blank');
}

function viewProductDetails(productId) {
  const product = sellerProducts.find(p => p.id === productId);
  if (product) {
    alert(`Product: ${product.name}\nPrice: ₹${product.price}\nCategory: ${product.category || 'General'}\n\nDescription:\n${product.description || 'N/A'}`);
  }
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    // Clear seller session
    localStorage.removeItem('sellerLoggedIn');
    localStorage.removeItem('sellerId');
    localStorage.removeItem('referralCode');
    localStorage.removeItem('sellerName');
    
    // Redirect to login
    window.location.href = 'seller-login.html';
  }
}
