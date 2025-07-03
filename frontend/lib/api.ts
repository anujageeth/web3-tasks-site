const API_BASE_URL = ''; // Use empty string for relative paths (middleware)

export const apiClient = {
  // GET request
  get: async (endpoint: string, options?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  // POST request
  post: async (endpoint: string, data?: any, options?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  // PUT request
  put: async (endpoint: string, data?: any, options?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },

  // DELETE request
  delete: async (endpoint: string, options?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
      ...options,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  },
};

// Specific API functions
export const authAPI = {
  verify: (address: string, message: string, signature: string) =>
    apiClient.post('/api/auth/verify', { address, message, signature }),
  
  getUser: () => apiClient.get('/api/auth/user'),
  
  logout: () => apiClient.post('/api/auth/logout'),
};

export const profileAPI = {
  get: () => apiClient.get('/api/profile'),
  
  update: (data: any) => apiClient.put('/api/profile', data),
  
  getByAddress: (address: string) => apiClient.get(`/api/profile/${address}`),
};

export const eventsAPI = {
  getLatest: (page = 1, limit = 3) => apiClient.get(`/api/events?page=${page}&limit=${limit}`),
  
  getUserCreated: () => apiClient.get('/api/events/user/created'),
  
  getUserJoined: () => apiClient.get('/api/events/user/joined'),
  
  getById: (id: string) => apiClient.get(`/api/events/${id}`),
  
  join: (id: string) => apiClient.post(`/api/events/${id}/join`),
  
  create: (data: any) => apiClient.post('/api/events', data),
  
  update: (id: string, data: any) => apiClient.put(`/api/events/${id}`, data),
  
  delete: (id: string) => apiClient.delete(`/api/events/${id}`),
};

export const tasksAPI = {
  getHistory: () => apiClient.get('/api/tasks/history'),
  
  getUserTasks: (eventId: string) => apiClient.get(`/api/tasks/user/event/${eventId}`),
  
  verifyTwitterTask: (data: any) => apiClient.post('/api/twitter/verify-task', data),
};