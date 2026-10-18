import { 
  setAuthSession, 
  clearAuthSession, 
  checkSessionValidity, 
  STORAGE_KEYS 
} from '@/utils/sessionManager';

// API service layer for connecting to the Node.js backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string | null, remember: boolean = false) {
    this.token = token;
    if (token) {
      setAuthSession(token, remember);
    } else {
      clearAuthSession();
    }
  }

  getToken(): string | null {
    if (!this.token) {
      if (typeof window !== 'undefined') {
        const validity = checkSessionValidity();
        if (!validity.valid) {
          this.token = null;
          return null;
        }
        this.token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || 
                     (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) : null);
      }
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: { id: string; name: string; email: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string) {
    return this.request<{ token: string; user: { id: string; name: string; email: string; role: string } }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async getProfile() {
    return this.request<{ user?: { id: string; name: string; email: string; role: string }; id?: string; name?: string; email?: string; role?: string }>('/auth/me');
  }

  async updatePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/update-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async updateProfile(updates: { name?: string; email?: string }) {
    return this.request<{ user: { id: string; name: string; email: string; role: string } }>('/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Products
  async getProducts(params?: { category?: string; search?: string; all?: string; brand?: string; origin?: string }) {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.brand) query.set('brand', params.brand);
    if (params?.origin) query.set('origin', params.origin);
    if (params?.search) query.set('search', params.search);
    if (params?.all) query.set('all', params.all);
    const queryStr = query.toString();
    return this.request<any[]>(`/products${queryStr ? `?${queryStr}` : ''}`);
  }

  async getProductBrands() {
    return this.request<string[]>('/products/brands');
  }

  async getOrigins() {
    return this.request<string[]>('/products/origins');
  }

  async getProduct(id: string) {
    return this.request<any>(`/products/${id}`);
  }

  async createProduct(product: any) {
    return this.request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, updates: any) {
    return this.request<any>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProduct(id: string) {
    return this.request<any>(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Orders
  async getOrders() {
    return this.request<any[]>('/orders');
  }

  async getAllOrders() {
    return this.request<any[]>('/orders/all');
  }

  async getOrder(id: string) {
    return this.request<any>(`/orders/${id}`);
  }

  async getMyOrders() {
    return this.request<any[]>('/orders/my-orders');
  }

  async createOrder(order: any) {
    return this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async updateOrderStatus(id: string, status: string, paymentStatus?: string) {
    return this.request<any>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, paymentStatus }),
    });
  }

  async deleteOrder(id: string) {
    return this.request<any>(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  // Customers
  async getCustomers() {
    return this.request<any[]>('/customers');
  }

  async createCustomer(customer: any) {
    return this.request<any>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async updateCustomer(id: string, updates: any) {
    return this.request<any>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteCustomer(id: string) {
    return this.request<any>(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // Reviews
  async getReviewStats() {
    return this.request<Record<string, { averageRating: number; reviewsCount: number }>>('/reviews/stats');
  }

  async getProductReviews(productId: string) {
    return this.request<any[]>(`/reviews/product/${productId}`);
  }

  async submitReview(productId: string, rating: number, reviewText: string) {
    return this.request<any>('/reviews', {
      method: 'POST',
      body: JSON.stringify({ productId, rating, reviewText }),
    });
  }

  async deleteReview(id: string) {
    return this.request<any>(`/reviews/${id}`, {
      method: 'DELETE',
    });
  }

  // Image Upload
  async uploadImage(file: File): Promise<{ imageUrl: string; filename: string }> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('image', file);

    const uploadUrl = API_BASE_URL.endsWith('/api') ? `${API_BASE_URL}/upload` : `${API_BASE_URL}/api/upload`;
    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Upload failed with status ${response.status}`);
      }

      return response.json();
    } catch (err: any) {
      // Fallback via Vite proxy path if direct URL failed
      if (uploadUrl.includes('localhost:5000')) {
        try {
          const fallbackRes = await fetch('/api/upload', {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });
          if (fallbackRes.ok) {
            return fallbackRes.json();
          }
        } catch {
          // Ignore fallback error and rethrow original
        }
      }
      throw err;
    }
  }

  async uploadMultipleImages(files: File[]): Promise<{ message: string; images: Array<{ imageUrl: string; filename: string }> }> {
    const token = this.getToken();
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    const uploadUrl = API_BASE_URL.endsWith('/api') ? `${API_BASE_URL}/upload/multiple` : `${API_BASE_URL}/api/upload/multiple`;
    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Gallery upload failed with status ${response.status}`);
      }

      return response.json();
    } catch (err: any) {
      if (uploadUrl.includes('localhost:5000')) {
        try {
          const fallbackRes = await fetch('/api/upload/multiple', {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });
          if (fallbackRes.ok) {
            return fallbackRes.json();
          }
        } catch {
          // Ignore
        }
      }
      throw err;
    }
  }

  // Reports & Inventory Restock
  async getDailySummaryReport() {
    return this.request<any>('/reports/daily-summary');
  }

  async sendDailyReportEmail(recipientEmail?: string) {
    return this.request<{
      success: boolean;
      deliveryStatus: string;
      message: string;
      recipient: string;
      subject: string;
      date: string;
      outOfStockCount: number;
      todayRevenue: number;
      todayOrdersCount: number;
      todayUnitsSold: number;
      summaryData: any;
      previewHtml: string;
    }>('/reports/send-daily-email', {
      method: 'POST',
      body: JSON.stringify({ recipientEmail }),
    });
  }

  async restockVariant(params: {
    productId: string;
    variantId?: string;
    sku?: string;
    weight?: string;
    flavor?: string;
    newStock?: number;
    addStock?: number;
  }) {
    return this.request<{ success: boolean; message: string; product: any }>('/reports/restock-variant', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Brands
  async getBrands(): Promise<BrandItem[]> {
    return this.request<BrandItem[]>('/brands');
  }

  async getBrand(idOrSlug: string): Promise<{ brand: BrandItem; products: any[] }> {
    return this.request<{ brand: BrandItem; products: any[] }>(`/brands/${idOrSlug}`);
  }

  async createBrand(brandData: Partial<BrandItem>): Promise<BrandItem> {
    return this.request<BrandItem>('/brands', {
      method: 'POST',
      body: JSON.stringify(brandData),
    });
  }

  async updateBrand(id: string, brandData: Partial<BrandItem>): Promise<BrandItem> {
    return this.request<BrandItem>(`/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(brandData),
    });
  }

  async deleteBrand(id: string, force = false): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/brands/${id}${force ? '?force=true' : ''}`, {
      method: 'DELETE',
    });
  }
}

export interface BrandItem {
  _id: string;
  name: string;
  slug?: string;
  logo?: string;
  description?: string;
  countryOfOrigin?: string;
  website?: string;
  featured?: boolean;
  order?: number;
  productCount?: number;
  isDynamic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const formatImageUrl = (url?: string): string => {
  if (!url) return '/placeholder.svg';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  if (url.startsWith('/uploads') || url.startsWith('/api/upload')) {
    if (API_BASE_URL.startsWith('http')) {
      const origin = API_BASE_URL.replace(/\/api\/?$/, '');
      return `${origin}${url}`;
    }
    return url;
  }
  return url;
};

export const api = new ApiService();
export { API_BASE_URL };
