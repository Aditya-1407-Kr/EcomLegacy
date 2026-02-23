// EcomLegacy Admin Panel - localStorage version
let currentTab = 'dashboard';

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  setupListeners();
  updateDashboard();
  switchTab('dashboard');
});

function setupListeners() {
  // Tab clicks
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(link.dataset.tab);
    });
  });
  
  // Add product button
  const addBtn = document.querySelector('.add-product-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const form = document.getElementById('product-form');
      form.reset();
      form.dataset.mode = 'add';
      document.getElementById('add-product-modal').classList.remove('hidden');
    });
  }
  
  // Close modal
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('add-product-modal').classList.add('hidden');
    });
  });
  
  const modal = document.getElementById('add-product-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'add-product-modal') {
        modal.classList.add('hidden');
      }
    });
  }
  
  // Image file upload handler
  const imageInput = document.querySelector('input[name="image-upload"]');
  if (imageInput) {
    imageInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('❌ Image must be less than 5MB');
        imageInput.value = '';
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification('❌ Please select a valid image file');
        imageInput.value = '';
        return;
      }
      
      // Convert to base64
      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById('image-data').value = event.target.result;
          showNotification('✓ Image loaded successfully');
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('❌ Error reading file:', error);
        showNotification('❌ Error loading image');
      }
    });
  }
  
  // Form submit
  const form = document.getElementById('product-form');
  if (form) {
    form.addEventListener('submit', submitForm);
  }
}

function switchTab(tabName) {
  currentTab = tabName;
  
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.add('hidden');
  });
  
  // Show selected tab
  const tab = document.getElementById(tabName + '-tab');
  if (tab) tab.classList.remove('hidden');
  
  // Update nav
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.tab === tabName) {
      link.classList.add('sidebar-active');
    } else {
      link.classList.remove('sidebar-active');
    }
  });
  
  // Update title
  const titles = {
    dashboard: 'Dashboard',
    products: 'Product Management',
    orders: 'Orders',
    analytics: 'Analytics'
  };
  
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[tabName];
  
  // Load data
  if (tabName === 'products') loadProducts();
  else if (tabName === 'orders') loadOrders();
  else if (tabName === 'analytics') loadAnalytics();
}

async function loadProducts() {
  try {
    const tbody = document.getElementById('products-list');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-slate-500">Loading...</td></tr>';
    
    console.log('📦 Fetching products from:', `${SUPABASE_URL}/rest/v1/products`);
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=*&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    console.log('📦 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Error response:', errorData);
      throw new Error(`Failed to fetch products: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const products = await response.json();
    console.log('✓ Raw products data:', products);
    
    if (!products || products.length === 0) {
      console.log('ℹ️ No products found');
      tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-500">No products. Click "Add New Product" to start.</td></tr>';
      return;
    }
    
    tbody.innerHTML = '';
    products.forEach(p => {
      const row = document.createElement('tr');
      row.className = 'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50';
      row.innerHTML = `
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden">
              ${p.image ? `<img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover" onerror="this.style.display='none'"/>` : ''}
            </div>
            <div>
              <p class="font-semibold text-sm">${p.name}</p>
              <p class="text-xs text-slate-500">${p.category}</p>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 font-semibold">₹${parseFloat(p.price).toFixed(2)}</td>
        <td class="px-6 py-4">${p.category}</td>
        <td class="px-6 py-4 text-right space-x-2">
          <button onclick="editProd(${p.id})" class="text-primary hover:text-primary/70 text-sm font-bold">Edit</button>
          <button onclick="delProd(${p.id})" class="text-red-500 hover:text-red-700 text-sm font-bold">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
    console.log('✓ Products loaded:', products.length, 'products');
  } catch (error) {
    console.error('❌ Error loading products:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    const tbody = document.getElementById('products-list');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-slate-500">Error loading products. Check browser console (F12) for details.</td></tr>';
    }
  }
}

async function loadOrders() {
  try {
    const list = document.getElementById('orders-list');
    if (!list) return;
    
    list.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-slate-500">Loading...</td></tr>';
    
    console.log('📦 Fetching orders from:', `${SUPABASE_URL}/rest/v1/sales`);
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/sales?select=*&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    console.log('📦 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Error response:', errorData);
      throw new Error(`Failed to fetch sales: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const sales = await response.json();
    console.log('✓ Raw sales data:', sales);
    
    if (!sales || sales.length === 0) {
      console.log('ℹ️ No orders found');
      list.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-500">No orders yet</td></tr>';
      return;
    }
    
    list.innerHTML = sales.map(s => `
      <tr class="border-b border-slate-100 dark:border-slate-800">
        <td class="px-6 py-4 font-bold">#${(s.id || '').toString().substring(0, 8)}</td>
        <td class="px-6 py-4">${s.product_name || 'Unknown'}</td>
        <td class="px-6 py-4 font-bold">₹${parseFloat(s.amount || 0).toFixed(2)}</td>
        <td class="px-6 py-4"><span class="px-3 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 text-xs font-bold rounded-full">Completed</span></td>
        <td class="px-6 py-4 text-sm text-slate-500">${new Date(s.created_at).toLocaleDateString()}</td>
        <td class="px-6 py-4">
          <button onclick="deleteSale('${s.id}')" class="text-red-500 hover:text-red-700 text-sm font-bold transition-colors">Delete</button>
        </td>
      </tr>
    `).join('');
    console.log('✓ Orders loaded:', sales.length, 'sales');
  } catch (error) {
    console.error('❌ Error loading orders:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    const list = document.getElementById('orders-list');
    if (list) {
      list.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-500">Error loading orders. Check browser console (F12) for details.</td></tr>';
    }
  }
}

async function deleteSale(saleId) {
  if (!confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
    return;
  }

  try {
    console.log('🗑️ Deleting sale:', saleId);
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/sales?id=eq.${saleId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete sale: ${response.status}`);
    }

    console.log('✓ Sale deleted successfully:', saleId);
    alert('✓ Sale deleted successfully');
    loadOrders(); // Reload orders list
    updateDashboard(); // Update dashboard stats
  } catch (error) {
    console.error('❌ Error deleting sale:', error.message);
    alert('❌ Error deleting sale: ' + error.message);
  }
}

async function loadAnalytics() {
  try {
    console.log('📊 Loading analytics data...');
    
    // Fetch products and sales data
    const productsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    const salesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/sales?select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    console.log('📊 Products response status:', productsRes.status);
    console.log('📊 Sales response status:', salesRes.status);

    if (!productsRes.ok || !salesRes.ok) {
      const productsError = !productsRes.ok ? await productsRes.text() : 'OK';
      const salesError = !salesRes.ok ? await salesRes.text() : 'OK';
      throw new Error(`Failed to fetch analytics: Products(${productsRes.status}): ${productsError} | Sales(${salesRes.status}): ${salesError}`);
    }

    const products = await productsRes.json();
    const sales = await salesRes.json();
    
    console.log('📊 Products:', products);
    console.log('📊 Sales:', sales);
    
    const revenue = sales.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
    
    const topProducts = document.getElementById('top-products');
    if (topProducts) {
      topProducts.innerHTML = (products && products.length > 0) ? products.slice(0, 5).map((p, i) => `
        <div class="flex justify-between items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
          <div>
            <p class="text-sm font-bold">${i + 1}. ${p.name}</p>
            <p class="text-xs text-slate-500">₹${parseFloat(p.price).toFixed(2)}</p>
          </div>
        </div>
      `).join('') : '<p class="text-slate-500">No products</p>';
    }
    
    const chart = document.getElementById('revenue-chart');
    if (chart) {
      chart.innerHTML = `
        <div class="space-y-4">
          <div class="text-center">
            <p class="text-3xl font-bold text-primary">₹${revenue.toFixed(2)}</p>
            <p class="text-sm text-slate-500">Total Revenue</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <p class="text-2xl font-bold">${(sales && sales.length) || 0}</p>
              <p class="text-xs text-slate-500">Total Sales</p>
            </div>
            <div class="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <p class="text-2xl font-bold">${(products && products.length) || 0}</p>
              <p class="text-xs text-slate-500">Total Products</p>
            </div>
          </div>
        </div>
      `;
    }
    console.log('✓ Analytics loaded successfully');
  } catch (error) {
    console.error('❌ Error loading analytics:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    const chart = document.getElementById('revenue-chart');
    const topProducts = document.getElementById('top-products');
    if (chart) {
      chart.innerHTML = '<p class="text-slate-500 text-center py-8">Error loading analytics. Check browser console (F12) for details.</p>';
    }
    if (topProducts) {
      topProducts.innerHTML = '<p class="text-slate-500">Error loading data</p>';
    }
  }
}

async function updateDashboard() {
  try {
    const productsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/products?select=id`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    const salesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/sales?select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    let totalProducts = 0;
    let totalSales = 0;
    let totalRevenue = 0;

    if (productsRes.ok) {
      const products = await productsRes.json();
      totalProducts = products.length;
    }

    if (salesRes.ok) {
      const sales = await salesRes.json();
      totalSales = sales.length;
      totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
    }
    
    const el1 = document.getElementById('total-products');
    const el2 = document.getElementById('total-sales');
    const el3 = document.getElementById('total-revenue');
    const el4 = document.getElementById('pending-orders');

    if (el1) el1.textContent = totalProducts;
    if (el2) el2.textContent = totalSales;
    if (el3) el3.textContent = '₹' + totalRevenue.toFixed(2);
    if (el4) el4.textContent = '0';

    console.log('✓ Dashboard updated');
  } catch (error) {
    console.error('❌ Error updating dashboard:', error.message);
  }
}

async function submitForm(e) {
  e.preventDefault();
  
  const form = e.target;
  const name = form.querySelector('input[name="name"]').value.trim();
  const price = form.querySelector('input[name="price"]').value;
  const category = form.querySelector('input[name="category"]').value.trim();
  const image = document.getElementById('image-data').value;
  const productLink = form.querySelector('input[name="product-link"]').value.trim();
  const description = form.querySelector('textarea[name="description"]').value.trim();
  
  if (!name || !price || !category || !image || !productLink) {
    showNotification('✗ Fill all required fields (including image and product link)');
    return;
  }
  
  try {
    const mode = form.dataset.mode || 'add';
    const priceNum = parseFloat(price);
    
    if (isNaN(priceNum) || priceNum < 0) {
      showNotification('✗ Price must be a valid number');
      return;
    }
    
    // Validate product link
    try {
      new URL(productLink);
    } catch {
      showNotification('✗ Product link must be a valid URL');
      return;
    }
    
    const productData = {
      name,
      price: priceNum,
      category,
      image,
      product_link: productLink,
      description,
      created_at: new Date().toISOString()
    };
    
    if (mode === 'add') {
      // Insert new product
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/products`,
        {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(productData)
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to add product: ${response.status}`);
      }
      
      // Show success modal with product link
      showProductSuccessModal(name, productLink, true);
    } else {
      // Update existing product
      const productId = form.dataset.productId;
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/products?id=eq.${productId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(productData)
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to update product: ${response.status}`);
      }
      
      // Show success modal with product link
      showProductSuccessModal(name, productLink, false);
    }
    
    document.getElementById('add-product-modal').classList.add('hidden');
    form.reset();
    await loadProducts();
    await updateDashboard();
  } catch (error) {
    console.error('❌ Error saving product:', error.message);
    showNotification(`❌ Error: ${error.message}`);
  }
}

async function editProd(id) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=eq.${id}&select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch product details');
    }

    const [product] = await response.json();
    
    if (!product) {
      showNotification('❌ Product not found');
      return;
    }
    
    const form = document.getElementById('product-form');
    form.dataset.mode = 'edit';
    form.dataset.productId = id;
    form.querySelector('input[name="name"]').value = product.name;
    form.querySelector('input[name="price"]').value = product.price;
    form.querySelector('input[name="category"]').value = product.category;
    document.getElementById('image-data').value = product.image;
    form.querySelector('input[name="product-link"]').value = product.product_link || '';
    form.querySelector('textarea[name="description"]').value = product.description || '';
    
    document.getElementById('add-product-modal').classList.remove('hidden');
  } catch (error) {
    console.error('❌ Error loading product:', error.message);
    showNotification(`❌ Error: ${error.message}`);
  }
}

async function delProd(id) {
  if (!confirm('Delete this product?')) return;
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=eq.${id}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete: ${response.status}`);
    }

    showNotification('✓ Product deleted successfully!');
    await loadProducts();
    await updateDashboard();
  } catch (error) {
    console.error('❌ Error deleting product:', error.message);
    showNotification(`❌ Error: ${error.message}`);
  }
}

function showNotification(msg) {
  const div = document.createElement('div');
  div.className = 'fixed top-4 right-4 bg-primary text-white px-6 py-3 rounded-lg shadow-lg z-50';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// Success Modal for Product Creation/Update
function showProductSuccessModal(productName, productLink, isNew = true) {
  console.log('🎯 SHOWING PRODUCT SUCCESS MODAL');
  console.log('Product Name:', productName);
  console.log('Product Link:', productLink);
  console.log('Is New:', isNew);
  
  let countdown = 5;
  
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm";
  modal.innerHTML = `
    <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-10 max-w-2xl w-full text-center space-y-8 shadow-2xl border-2 border-blue-500">
      <!-- Success Icon -->
      <div class="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
        <span class="material-symbols-outlined text-6xl text-blue-500">check_circle</span>
      </div>
      
      <!-- Main Heading -->
      <div>
        <h2 class="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-2">
          ${isNew ? 'Product Created! 🚀' : 'Product Updated! ✨'}
        </h2>
        <p class="text-lg text-slate-700 dark:text-slate-300">
          <span class="font-bold">"${productName}"</span> is now live
        </p>
      </div>
      
      <!-- Product Link Section -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 space-y-3 border border-blue-200 dark:border-blue-900">
        <p class="text-sm font-semibold text-slate-600 dark:text-slate-400">📌 Product Download Link:</p>
        <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-700 break-all">
          <span class="text-xs text-slate-600 dark:text-slate-400 flex-1" id="product-link-text">${productLink}</span>
          <button class="copy-link-btn flex-shrink-0 bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-lg font-semibold transition-all text-sm" title="Copy to clipboard">
            <span class="material-symbols-outlined text-sm">content_copy</span>
          </button>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400">✓ Link saved. Ready to share with customers!</p>
      </div>
      
      <!-- Instant Redirect Message -->
      <div class="bg-amber-50 dark:bg-amber-950 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4">
        <p class="text-amber-900 dark:text-amber-200 font-bold flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-xl">bolt</span>
          Opening link in <span class="countdown-timer font-black text-lg">${countdown}s</span>
        </p>
        <p class="text-sm text-amber-800 dark:text-amber-300 mt-2">Your product link will open automatically</p>
      </div>
      
      <!-- Actions -->
      <div class="flex gap-3">
        <button class="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg open-link-btn">
          <span class="material-symbols-outlined">open_in_new</span>
          Test Link
        </button>
        <button class="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 return-btn">
          <span class="material-symbols-outlined">arrow_back</span>
          Return Now
        </button>
      </div>
      
      <!-- Info Text -->
      <p class="text-xs text-slate-500 dark:text-slate-400">This link is what customers will use to download the product</p>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Countdown timer for auto-redirect
  const countdownEl = modal.querySelector(".countdown-timer");
  const countdownInterval = setInterval(() => {
    countdown--;
    countdownEl.textContent = countdown + 's';
    console.log('⏱️ Product modal countdown:', countdown);
    
    // Update color based on time
    if (countdown <= 2) {
      countdownEl.classList.add("text-red-500", "animate-pulse");
    }
    
    if (countdown === 0) {
      clearInterval(countdownInterval);
      console.log('⏰ AUTO-REDIRECT TRIGGERED!');
      console.log('🌐 Opening product link automatically:', productLink);
      window.open(productLink, '_blank');
      
      // Keep modal visible for 2 more seconds, then close
      setTimeout(() => {
        console.log('📍 Closing product success modal');
        modal.remove();
      }, 2000);
    }
  }, 1000);
  
  // Copy link button
  const copyBtn = modal.querySelector(".copy-link-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(productLink);
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '<span class="material-symbols-outlined text-sm">check</span>';
      copyBtn.classList.add("bg-green-500");
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.classList.remove("bg-green-500");
      }, 2000);
      console.log('✓ Link copied to clipboard');
    });
  }
  
  // Open link button
  const openBtn = modal.querySelector(".open-link-btn");
  if (openBtn) {
    openBtn.addEventListener("click", () => {
      clearInterval(countdownInterval);
      console.log('🌐 Opening product link:', productLink);
      window.open(productLink, '_blank');
    });
  }
  
  // Return button
  const returnBtn = modal.querySelector(".return-btn");
  if (returnBtn) {
    returnBtn.addEventListener("click", () => {
      clearInterval(countdownInterval);
      console.log('📍 Returning to products list');
      modal.remove();
    });
  }
}
