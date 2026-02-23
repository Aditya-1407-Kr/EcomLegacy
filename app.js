// Admin Login Functions
function openAdminLogin() {
  document.getElementById('admin-login-modal').classList.remove('hidden');
}

function closeAdminLogin() {
  document.getElementById('admin-login-modal').classList.add('hidden');
  document.getElementById('admin-login-form').reset();
}

// Cart Management
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let allProducts = [];
let filteredProducts = [];

let priceRange = { min: 0, max: 250000 };
let selectedRatings = [];

// Save cart to localStorage
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Add item to cart
async function addToCart(productName, productPrice, productId) {
  console.log('🛒 Adding to cart:', { productName, productPrice, productId });
  
  // Fetch full product details from Supabase (including product_link)
  let productLink = '';
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=eq.${productId}&select=id,name,price,product_link,cover_image`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.ok) {
      const products = await response.json();
      if (products.length > 0) {
        productLink = products[0].product_link || '';
        console.log('✓ Fetched product link:', productLink);
      }
    } else {
      console.log('⚠️ Could not fetch product link from Supabase');
    }
  } catch (error) {
    console.error('❌ Error fetching product:', error);
  }
  
  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: productId,
      name: productName,
      price: parseFloat(productPrice),
      quantity: 1,
      product_link: productLink
    });
  }
  
  console.log('📦 Cart item added:', { productId, productLink });
  
  saveCart();
  showNotification(`Added "${productName}" to cart!`);
  updateCartCount();
}

// Update cart count in header
function updateCartCount() {
  // Cart functionality removed per user request
}

// Show notification
function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "fixed top-4 right-4 bg-primary text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse";
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 2000);
}

// Load products from Supabase database
async function loadProductsFromSupabase() {
  try {
    console.log('Fetching products from Supabase...');
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

    if (!response.ok) {
      throw new Error(`Supabase Error: ${response.status} ${response.statusText}`);
    }

    const products = await response.json();
    
    if (!products || products.length === 0) {
      console.warn('No products found in database');
      allProducts = [];
    } else {
      allProducts = products;
      console.log(`✓ Loaded ${products.length} products from Supabase`);
    }
    
    applyFilters();
  } catch (error) {
    console.error('❌ Error loading products:', error.message);
    showNotification(`❌ Failed to load products: ${error.message}`);
    allProducts = [];
    applyFilters();
  }
}

// Apply filters and render products
function applyFilters() {
  let filtered = [...allProducts]; // Create a copy to avoid modifying original
  
  // Filter by price range
  filtered = filtered.filter(p => {
    const price = parseFloat(p.price) || 0;
    return price >= priceRange.min && price <= priceRange.max;
  });
  
  // Filter by rating if selected
  if (selectedRatings.length > 0) {
    filtered = filtered.filter(p => {
      const rating = parseFloat(p.rating || '4.8');
      return selectedRatings.some(r => rating >= r && rating < r + 1);
    });
  }
  
  filteredProducts = filtered;
  renderProducts(filteredProducts);
}

// Render products to marketplace
function renderProducts(products) {
  // Try multiple selectors to find the grid
  let grid = document.querySelector('#product-grid') || 
             document.querySelector('.grid.grid-cols-1') ||
             document.querySelector('[class*="grid-cols"]');
  
  if (!grid) {
    console.error('Grid element not found');
    return;
  }
  
  // Remove existing dynamic product cards
  const existingCards = grid.querySelectorAll('.product-card');
  existingCards.forEach(card => card.remove());
  
  if (products.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'col-span-full text-center py-12';
    emptyMsg.innerHTML = '<p class="text-slate-500 text-lg">No products found</p>';
    grid.appendChild(emptyMsg);
    return;
  }
  
  // Add new product cards
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all hover:shadow-2xl hover:-translate-y-1';
    card.dataset.category = product.category || 'uncategorized';
    card.dataset.price = product.price;
    card.dataset.rating = '4.8';
    
    const categoryDisplay = product.category ? `<span class="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">${product.category}</span>` : '';
    
    card.innerHTML = `
      <div class="aspect-[4/3] bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
        <img alt="${product.name}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="${product.image}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23e2e8f0%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-family=%22Arial%22 font-size=%2214%22 fill=%22%2364748b%22%3EImage Not Available%3C/text%3E%3C/svg%3E'" />
        <div class="action-buttons absolute bottom-4 inset-x-4 flex gap-2">
          <button class="buy-btn flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.price}">
            <span class="material-symbols-outlined text-sm">shopping_cart</span> Buy Now
          </button>
          <button class="view-btn w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-lg transition-colors hover:text-primary" data-product-id="${product.id}" data-product-name="${product.name}" data-product-price="${product.price}" data-product-description="${product.description}" data-product-image="${product.image}">
            <span class="material-symbols-outlined text-lg">visibility</span>
          </button>
        </div>
      </div>
      <div class="p-5">
        ${categoryDisplay}
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-bold text-lg leading-tight group-hover:text-primary transition-colors">${product.name}</h3>
          <div class="flex items-center text-yellow-400">
            <span class="material-symbols-outlined text-sm fill-1">star</span>
            <span class="text-xs font-bold text-slate-900 dark:text-white ml-1">4.8</span>
          </div>
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">${product.description || 'Quality product'}</p>
        <div class="flex items-center gap-2">
          <span class="text-xl font-extrabold text-slate-900 dark:text-white">₹${parseFloat(product.price).toFixed(2)}</span>
        </div>
      </div>
    `;
    
    grid.appendChild(card);
  });
  
  // Re-attach event listeners
  initializeProductButtons();
}

document.addEventListener("DOMContentLoaded", () => {
  // Setup admin login form
  const loginForm = document.getElementById('admin-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('admin-email').value.trim();
      const password = document.getElementById('admin-password').value;
      const errorDiv = document.getElementById('admin-error');
      
      try {
        console.log('🔐 Attempting admin login with email:', email);
        
        // Fetch admin from sellers table
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/sellers?email=eq.${encodeURIComponent(email)}`,
          {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Accept': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to authenticate: ${response.status}`);
        }
        
        const admins = await response.json();
        
        if (!admins || admins.length === 0) {
          errorDiv.textContent = '❌ Admin account not found';
          errorDiv.classList.remove('hidden');
          console.log('❌ No admin found with email:', email);
          setTimeout(() => errorDiv.classList.add('hidden'), 3000);
          return;
        }
        
        const admin = admins[0];
        
        // Decode and verify password
        const storedPassword = atob(admin.password);
        if (storedPassword !== password) {
          errorDiv.textContent = '❌ Invalid password';
          errorDiv.classList.remove('hidden');
          console.log('❌ Password mismatch for admin:', admin.name);
          setTimeout(() => errorDiv.classList.add('hidden'), 3000);
          return;
        }
        
        // Check if admin is active
        if (!admin.is_active) {
          errorDiv.textContent = '❌ Your admin account has been deactivated';
          errorDiv.classList.remove('hidden');
          console.log('❌ Admin account is inactive:', admin.name);
          setTimeout(() => errorDiv.classList.add('hidden'), 3000);
          return;
        }
        
        // Login successful
        console.log('✓ Admin authenticated:', admin.name);
        localStorage.setItem('adminLoggedIn', 'true');
        window.location.href = 'admin.html';
        
      } catch (error) {
        console.error('❌ Admin login error:', error);
        errorDiv.textContent = '❌ Login error: ' + error.message;
        errorDiv.classList.remove('hidden');
        setTimeout(() => errorDiv.classList.add('hidden'), 3000);
      }
    });
  }
  
  // Close modal when clicking outside
  const modal = document.getElementById('admin-login-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAdminLogin();
      }
    });
  }
  
  // Initialize cart count
  updateCartCount();
  
  // Load products from Supabase
  loadProductsFromSupabase();
  
  // Initialize buttons after products load
  setTimeout(initializeProductButtons, 500);
});

// Switch between Shop, Latest, Freebies


function initializeProductButtons() {
  const products = document.querySelectorAll(".product-card");

  /* BUY BUTTON */
  document.querySelectorAll(".buy-btn").forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      
      const productId = button.dataset.productId;
      const productName = button.dataset.productName;
      const productPrice = button.dataset.productPrice;
      
      addToCart(productName, productPrice, productId);
      
      setTimeout(() => {
        window.location.href = "checkout.html";
      }, 500);
    });
  });

  /* VIEW BUTTON */
  document.querySelectorAll(".view-btn").forEach(button => {
    button.addEventListener("click", () => {
      const product = {
        id: button.dataset.productId,
        name: button.dataset.productName,
        price: button.dataset.productPrice,
        description: button.dataset.productDescription,
        image: button.dataset.productImage,
        category: button.parentElement.parentElement.parentElement.querySelector('span[class*="bg-primary"]')?.textContent?.trim() || 'General',
        rating: "4.8"
      };

      showProductModal(product);
    });
  });

  /* PRODUCT MODAL */
  function showProductModal(product) {
    const modal = document.createElement("div");
    modal.className = "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in";
    modal.innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-3xl max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        <!-- Header -->
        <div class="sticky top-0 bg-gradient-to-r from-primary to-primary/80 text-white flex items-center justify-between p-6 border-b border-primary/20">
          <h2 class="text-2xl font-bold flex items-center gap-3">
            <span class="material-symbols-outlined">visibility</span>
            Product Details
          </h2>
          <button class="close-modal text-white/80 hover:text-white transition-colors">
            <span class="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <!-- Content -->
        <div class="p-8 space-y-6">
          <!-- Image -->
          <div class="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 h-80">
            <img src="${product.image}" alt="${product.name}" class="w-full h-full object-cover" />
            <div class="absolute top-4 left-4 bg-${product.category === 'General' ? 'slate' : 'primary'}/90 px-4 py-2 rounded-full text-white text-sm font-semibold">
              ${product.category}
            </div>
          </div>

          <!-- Product Info -->
          <div class="space-y-4">
            <!-- Title & Rating -->
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">${product.name}</h1>
                <div class="flex items-center gap-3">
                  <div class="flex items-center bg-yellow-50 dark:bg-yellow-950 px-3 py-1.5 rounded-lg">
                    ${['★', '★', '★', '★', '★'].map(() => '<span class="text-yellow-400 text-lg">★</span>').join('')}
                    <span class="ml-2 font-bold text-slate-900 dark:text-white">${product.rating}</span>
                  </div>
                  <p class="text-sm text-slate-500 dark:text-slate-400">(256 reviews)</p>
                </div>
              </div>
            </div>

            <!-- Price Section -->
            <div class="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-2xl p-6 border border-primary/20">
              <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">Price</p>
              <p class="text-4xl font-extrabold text-primary">₹${parseFloat(product.price).toFixed(2)}</p>
            </div>

            <!-- Description -->
            <div class="space-y-2">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">Description</h3>
              <p class="text-slate-600 dark:text-slate-300 leading-relaxed text-base">${product.description || 'Quality premium product available for instant delivery.'}</p>
            </div>

            <!-- Features -->
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl">
                <p class="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Instant Delivery</p>
                <p class="font-bold text-slate-900 dark:text-white">✓ Download Immediately</p>
              </div>
              <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl">
                <p class="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold mb-1">Premium Quality</p>
                <p class="font-bold text-slate-900 dark:text-white">✓ High Grade Product</p>
              </div>
            </div>

            <!-- Quantity & Action -->
            <div class="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div class="flex items-center gap-4">
                <div>
                  <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">Quantity</p>
                  <div class="flex items-center border-2 border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden">
                    <button class="qty-decrease px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-bold">−</button>
                    <input type="number" class="qty-input w-16 text-center border-none bg-transparent py-2 font-bold text-slate-900 dark:text-white" value="1" min="1" />
                    <button class="qty-increase px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-bold">+</button>
                  </div>
                </div>
              </div>
              
              <!-- Buttons -->
              <div class="flex gap-3">
                <button class="buy-from-modal flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined">shopping_cart</span> 
                  Buy Now
                </button>
                <button class="close-modal-alt px-6 py-3.5 border-2 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close buttons
    modal.querySelectorAll(".close-modal, .close-modal-alt").forEach(btn => {
      btn.addEventListener("click", () => modal.remove());
    });

    modal.querySelector(".buy-from-modal").addEventListener("click", () => {
      const qtyInput = modal.querySelector(".qty-input");
      const quantity = qtyInput ? parseInt(qtyInput.value, 10) : 1;
      
      if (isNaN(quantity) || quantity < 1) {
        alert("Please enter a valid quantity");
        return;
      }
      
      const productPrice = product.price;
      
      // Add items to cart with exact specified quantity
      const existingItem = cart.find(item => item.id === product.id);
      if (existingItem) {
        existingItem.quantity = quantity;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: parseFloat(productPrice),
          quantity: quantity
        });
      }
      saveCart();
      
      setTimeout(() => {
        window.location.href = "checkout.html";
      }, 500);
    });
    
    // Quantity controls
    const qtyInput = modal.querySelector(".qty-input");
    modal.querySelector(".qty-decrease").addEventListener("click", () => {
      const current = parseInt(qtyInput.value) || 1;
      if (current > 1) qtyInput.value = current - 1;
    });
    modal.querySelector(".qty-increase").addEventListener("click", () => {
      const current = parseInt(qtyInput.value) || 1;
      qtyInput.value = current + 1;
    });

    // Close on background click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /* CATEGORY FILTER */
  document.querySelectorAll("[data-filter-category]").forEach(button => {
    button.addEventListener("click", () => {
      const category = button.dataset.filterCategory;

      document.querySelectorAll("[data-filter-category]").forEach(btn => {
        btn.classList.remove("bg-primary/10", "text-primary");
      });
      button.classList.add("bg-primary/10", "text-primary");

      products.forEach(product => {
        product.style.display =
          category === "all" || product.dataset.category === category
            ? "block"
            : "none";
      });
    });
  });

  /* RATING FILTER */
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      // Update selected ratings array
      selectedRatings = [];
      document.querySelectorAll('input[type="checkbox"]:checked').forEach((checked, index) => {
        // Find the rating value from parent container
        const parent = checked.closest('label');
        if (parent) {
          const stars = parent.querySelectorAll('.material-symbols-outlined');
          const rating = stars.length;
          selectedRatings.push(rating);
        }
      });
      applyFilters();
    });
  });

  /* PRICE RANGE SLIDER */
  const priceInputs = document.querySelectorAll('input[type="range"]');
  if (priceInputs.length >= 2) {
    priceInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const minInput = priceInputs[0];
        const maxInput = priceInputs[1];
        
        let minVal = parseFloat(minInput.value) || 0;
        let maxVal = parseFloat(maxInput.value) || 250000;
        
        if (minVal > maxVal) {
          [minVal, maxVal] = [maxVal, minVal];
          minInput.value = minVal;
          maxInput.value = maxVal;
        }
        
        priceRange = { min: minVal, max: maxVal };
        applyFilters();
        showNotification(`Price: ₹${minVal} - ₹${maxVal}`);
      });
    });
  }
  document.querySelectorAll("button").forEach(button => {
    if (button.textContent.includes("Apply Filters")) {
      button.addEventListener("click", () => {
        // Get price range values
        const priceInputs = document.querySelectorAll('input[type="range"]');
        if (priceInputs.length >= 2) {
          const minPrice = parseFloat(priceInputs[0].value) || 0;
          const maxPrice = parseFloat(priceInputs[1].value) || 250000;
          priceRange = { min: minPrice, max: maxPrice };
        }
        
        // Get selected ratings
        selectedRatings = [];
        const ratingCheckboxes = document.querySelectorAll('input[type="checkbox"]');
        ratingCheckboxes.forEach((checkbox, index) => {
          if (checkbox.checked) {
            selectedRatings.push(5 - index); // 5 stars, 4 stars, etc.
          }
        });
        
        applyFilters();
        showNotification("✓ Filters applied successfully!");
      });
    }
  });

  /* SORT */
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      const grid = document.querySelector(".grid");
      if (!grid) return;
      
      const items = Array.from(grid.querySelectorAll(".product-card"));

      if (e.target.value === "Price: Low to High") {
        items.sort((a, b) => parseFloat(a.dataset.price) - parseFloat(b.dataset.price));
      } else if (e.target.value === "Best Rated") {
        items.sort((a, b) => parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating));
      }

      items.forEach(item => grid.appendChild(item));
      showNotification(`Sorted by: ${e.target.value}`);
    });
  }

  /* HEADER BUTTONS */
  document.querySelectorAll("header button.p-2").forEach(button => {
    button.addEventListener("click", function(e) {
      if (this.querySelector(".material-symbols-outlined")) {
        const icon = this.querySelector(".material-symbols-outlined").textContent;
        if (icon.includes("favorite")) {
          this.classList.toggle("text-red-500");
          showNotification("Added to favorites!");
        } else if (icon.includes("shopping_bag")) {
          showNotification(`You have ${cart.reduce((sum, item) => sum + item.quantity, 0)} items in your cart`);
        }
      }
    });
  });
}