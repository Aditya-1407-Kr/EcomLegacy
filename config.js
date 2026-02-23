// Supabase Configuration
const SUPABASE_URL = 'https://qxcbbmybhrdmzeneigfd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4Y2JibXliaHJkbXplbmVpZ2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTk4MTcsImV4cCI6MjA4NzA5NTgxN30.J2FsqoK_glSFiIU9XH3CKc5J-C3wKM0Ye83iGYCh9LI';

// Razorpay Configuration (Live Mode)
const RAZORPAY_KEY_ID = 'rzp_live_SAqP9aUwlMRhAl';

// Support Email Configuration
const SUPPORT_EMAIL = 'a67023299@gmail.com';

// Initialize Supabase
class SupabaseClient {
  constructor() {
    this.baseURL = SUPABASE_URL;
    this.apiKey = SUPABASE_ANON_KEY;
  }

  async request(table, method = 'GET', data = null, filters = null) {
    try {
      let url = `${this.baseURL}/rest/v1/${table}`;
      
      const options = {
        method: method,
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      };

      // Build filter query string
      if (filters) {
        const filterParams = new URLSearchParams();
        for (const [key, value] of Object.entries(filters)) {
          filterParams.append(key, value);
        }
        url += '?' + filterParams.toString();
      }

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      
      if (!response.ok) {
        console.error('Supabase error:', response.status, response.statusText);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Supabase request error:', error);
      return null;
    }
  }

  // GET all records
  async getAll(table) {
    return await this.request(table, 'GET');
  }

  // GET single record
  async getOne(table, id) {
    return await this.request(`${table}?id=eq.${id}`, 'GET');
  }

  // GET with filters
  async getByFilter(table, filters) {
    return await this.request(table, 'GET', null, filters);
  }

  // POST - Insert new record
  async insert(table, data) {
    try {
      let url = `${this.baseURL}/rest/v1/${table}`;
      const options = {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      };

      console.log('Inserting to table:', table);
      console.log('With data:', data);

      const response = await fetch(url, options);
      const responseText = await response.text();

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response body:', responseText);

      if (!response.ok) {
        console.error('Insert failed:', response.status, response.statusText, responseText);
        throw new Error(`Database error: ${response.status} - ${responseText}`);
      }

      const result = JSON.parse(responseText);
      return result;
    } catch (error) {
      console.error('Insert request error:', error);
      throw error;
    }
  }

  // PUT - Update record
  async update(table, id, data) {
    try {
      let url = `${this.baseURL}/rest/v1/${table}?id=eq.${id}`;
      
      console.log('Updating table:', table, 'ID:', id);
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update error:', response.status, errorText);
        throw new Error(`Update failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  }

  // DELETE - Delete record
  async delete(table, id) {
    try {
      let url = `${this.baseURL}/rest/v1/${table}?id=eq.${id}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }
}

// Create global instance
const db = new SupabaseClient();

// Load Razorpay SDK
function loadRazorpay() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.head.appendChild(script);
  });
}
