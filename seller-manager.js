// Seller Management System
let sellers = [];

// Initialize seller management
document.addEventListener('DOMContentLoaded', () => {
  setupSellerListeners();
  loadSellers();
});

function setupSellerListeners() {
  // Add seller button
  const addSellerBtn = document.querySelector('.add-seller-btn');
  console.log('✓ Seller Management loaded');
  
  if (addSellerBtn) {
    addSellerBtn.addEventListener('click', () => {
      console.log('📋 Opening seller modal');
      const form = document.getElementById('seller-form');
      if (form) {
        form.reset();
      }
      document.getElementById('add-seller-modal').classList.remove('hidden');
    });
  }
  
  // Bind form submit handler
  const form = document.getElementById('seller-form');
  console.log('Form element found:', !!form);
  
  if (form) {
    // Use a function that properly captures the event
    form.addEventListener('submit', function(e) {
      console.log('🎯 Form submit triggered!');
      e.preventDefault();
      e.stopPropagation();
      submitSellerForm(e);
    });
    console.log('✓ Form submit handler bound');
  }
}

async function submitSellerForm(e) {
  console.log('=== FORM SUBMISSION START ===');
  console.log('Event:', e.type, e);
  
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  try {
    // Step 1: Find form
    console.log('Step 1: Finding form...');
    const form = document.getElementById('seller-form');
    console.log('  Form found:', !!form, form?.id);
    
    if (!form) {
      alert('❌ Form not found in page');
      return;
    }
    
    // Step 2: Find all input elements
    console.log('Step 2: Finding input elements...');
    const nameEl = document.getElementById('form-seller-name');
    const emailEl = document.getElementById('form-seller-email');
    const pwdEl = document.getElementById('form-seller-password');
    
    console.log('  seller-name found:', !!nameEl);
    console.log('  seller-email found:', !!emailEl);
    console.log('  seller-password found:', !!pwdEl);
    
    // Step 3: Get values directly
    console.log('Step 3: Reading values...');
    
    // For name
    let name = '';
    if (nameEl) {
      console.log('  nameEl.value:', JSON.stringify(nameEl.value));
      name = String(nameEl.value).trim();
      console.log('  name (trimmed):', JSON.stringify(name), 'length:', name.length, 'empty:', name.length === 0);
    } else {
      console.log('  ❌ nameEl is null or undefined!');
    }
    
    // For email
    let email = '';
    if (emailEl) {
      console.log('  emailEl.value:', JSON.stringify(emailEl.value));
      email = String(emailEl.value).trim();
      console.log('  email (trimmed):', JSON.stringify(email), 'length:', email.length, 'empty:', email.length === 0);
    } else {
      console.log('  ❌ emailEl is null or undefined!');
    }
    
    // For password
    let password = '';
    if (pwdEl) {
      console.log('  pwdEl.value:', JSON.stringify(pwdEl.value));
      password = String(pwdEl.value).trim();
      console.log('  password (trimmed): [', password.length, 'chars]', 'empty:', password.length === 0);
    } else {
      console.log('  ❌ pwdEl is null or undefined!');
    }
    
    // Step 4: Validate each field
    console.log('Step 4: Validating...');
    
    if (!name || name.length === 0) {
      console.log('❌ Name validation FAILED');
      alert('❌ Please enter a seller name');
      nameEl?.focus();
      return;
    }
    console.log('✓ Name valid:', name);
    
    if (!email || email.length === 0) {
      console.log('❌ Email validation FAILED');
      console.log('   emailEl exists:', !!emailEl);
      console.log('   emailEl.value:', emailEl ? emailEl.value : 'N/A');
      console.log('   email variable:', JSON.stringify(email));
      alert('❌ Please enter an email address');
      emailEl?.focus();
      return;
    }
    console.log('✓ Email valid:', email);
    
    if (!password || password.length === 0) {
      console.log('❌ Password validation FAILED');
      alert('❌ Please enter a password');
      pwdEl?.focus();
      return;
    }
    console.log('✓ Password valid: [', password.length, 'chars]');
    
    if (password.length < 6) {
      console.log('❌ Password too short');
      alert('❌ Password must be at least 6 characters');
      pwdEl?.focus();
      return;
    }
    console.log('✓ Password length OK');

    console.log('✅ All validations passed!');
    console.log('Data to send:', { name, email, password: '[' + password.length + ' chars]' });
    
    const sellerData = {
      name,
      email,
      password: btoa(password),
      created_at: new Date().toISOString(),
      is_active: true,
      referral_code: generateReferralCode()
    };
    
    console.log('📤 Sending to Supabase...');
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/sellers`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(sellerData)
      }
    );
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Server error: ${response.status}`);
    }
    
    const result = await response.json();
    const newSeller = Array.isArray(result) ? result[0] : result;
    
    console.log('✨ Seller created:', newSeller);
    showNotification(`✓ "${name}" created!`);
    
    // Close modal and reload
    document.getElementById('add-seller-modal').classList.add('hidden');
    form.reset();
    await loadSellers();
    
  } catch (error) {
    console.error('❌ Error:', error.message, error);
    showNotification(`❌ ${error.message}`);
  }
}

async function loadSellers() {
  try {
    console.log('Loading sellers...');
    
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/sellers?order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to load sellers: ${response.status}`);
    }
    
    sellers = await response.json();
    console.log('✓ Loaded sellers:', sellers.length);
    
    // Render sellers list
    renderSellersList();
  } catch (error) {
    console.error('❌ Error loading sellers:', error.message);
    const sellersList = document.getElementById('sellers-list');
    if (sellersList) {
      sellersList.innerHTML = `<tr><td class="px-6 py-4 text-red-500">Error loading sellers: ${error.message}</td></tr>`;
    }
  }
}

function renderSellersList() {
  const sellersList = document.getElementById('sellers-list');
  
  if (!sellers || sellers.length === 0) {
    sellersList.innerHTML = '<tr><td class="px-6 py-4 text-slate-500 text-center">No sellers yet</td></tr>';
    return;
  }
  
  sellersList.innerHTML = sellers.map(seller => `
    <tr>
      <td class="px-6 py-4">${seller.name}</td>
      <td class="px-6 py-4">${seller.email}</td>
      <td class="px-6 py-4">
        <span class="px-3 py-1 rounded-full text-xs font-semibold ${seller.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
          ${seller.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td class="px-6 py-4 text-sm text-slate-500">${new Date(seller.created_at).toLocaleDateString()}</td>
      <td class="px-6 py-4">
        <button onclick="viewSellerDashboard('${seller.id}')" class="text-primary hover:text-primary/80 font-semibold text-sm">
          Dashboard
        </button>
        <button onclick="toggleSellerStatus('${seller.id}', ${!seller.is_active})" class="ml-4 text-slate-500 hover:text-slate-700 text-sm">
          ${seller.is_active ? 'Deactivate' : 'Activate'}
        </button>
        <button onclick="deleteSeller('${seller.id}')" class="ml-4 text-red-500 hover:text-red-700 text-sm">
          Delete
        </button>
      </td>
    </tr>
  `).join('');
}

async function toggleSellerStatus(sellerId, newStatus) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/sellers?id=eq.${sellerId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ is_active: newStatus })
      }
    );
    
    if (!response.ok) throw new Error(`Failed to update seller: ${response.status}`);
    
    showNotification(`✓ Seller ${newStatus ? 'activated' : 'deactivated'}`);
    await loadSellers();
  } catch (error) {
    console.error('❌ Error updating seller:', error.message);
    showNotification(`❌ Error: ${error.message}`);
  }
}

async function deleteSeller(sellerId) {
  if (!confirm('Are you sure you want to delete this seller?')) return;
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/sellers?id=eq.${sellerId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    
    if (!response.ok) throw new Error(`Failed to delete seller: ${response.status}`);
    
    showNotification('✓ Seller deleted');
    await loadSellers();
  } catch (error) {
    console.error('❌ Error deleting seller:', error.message);
    showNotification(`❌ Error: ${error.message}`);
  }
}

function viewSellerDashboard(sellerId) {
  const seller = sellers.find(s => s.id === sellerId);
  if (seller) {
    window.open(`seller-dashboard.html?seller_id=${seller.id}&referral=${seller.referral_code}`, '_blank');
  }
}

function generateReferralCode() {
  return 'REF-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function showNotification(msg) {
  const div = document.createElement('div');
  div.className = 'fixed top-4 right-4 bg-primary text-white px-6 py-3 rounded-lg shadow-lg z-50';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}
