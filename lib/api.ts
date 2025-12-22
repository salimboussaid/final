import {
  UserDTO,
  GroupDTO,
  CreateGroupRequest,
  AdminPresentResponse,
  MobilePresentResponse,
  PresentUpdateRequest,
  ErrorResponse,
  CoinsHistoryRecord,
  AddCoinsRequest,
  OrderDTO,
  PageableResponse,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  TeacherSummary,
  StudentSummary,
} from './types';

// Direct connection to backend - CORS should now be enabled on the server
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://212.220.105.29:8079/api';

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Authentication helper
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Try to get credentials from localStorage
  if (typeof window !== 'undefined') {
    const credentials = localStorage.getItem('auth_credentials');
    if (credentials) {
      const { login, password } = JSON.parse(credentials);
      const encoded = btoa(`${login}:${password}`);
      headers['Authorization'] = `Basic ${encoded}`;
    }
  }

  return headers;
}

// Save credentials to localStorage
export function setAuthCredentials(login: string, password: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_credentials', JSON.stringify({ login, password }));
  }
}

// Clear credentials
export function clearAuthCredentials(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_credentials');
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ErrorResponse | null = null;
    try {
      errorData = await response.json();
    } catch (e) {
      // Failed to parse error response, ignore
    }

    throw new ApiError(
      response.status,
      errorData?.code || 'UNKNOWN_ERROR',
      errorData?.message || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  // Handle 204 No Content or empty body
  if (response.status === 204) {
    return null as T;
  }

  // Safely parse body
  const text = await response.text();
  if (!text) {
    return null as T;
  }

  return JSON.parse(text) as T;
}


// User API
export const userApi = {
  getCurrentUser: async (): Promise<UserDTO> => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<UserDTO>(response);
  },

  getUserById: async (id: number): Promise<UserDTO> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<UserDTO>(response);
  },

  createUser: async (user: UserDTO): Promise<UserDTO> => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(user),
    });
    return handleResponse<UserDTO>(response);
  },

  updateUser: async (id: number, user: UserDTO): Promise<UserDTO> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(user),
    });
    return handleResponse<UserDTO>(response);
  },

  deleteUser: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(response);
  },

  // Add coins to a student
  addCoins: async (userId: number, coins: number, reason?: string): Promise<UserDTO> => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/coins`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ coins, reason } as AddCoinsRequest),
    });
    return handleResponse<UserDTO>(response);
  },

  // Get coins history for a specific user
  getCoinsHistory: async (userId: number): Promise<CoinsHistoryRecord[]> => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/coinsHistory`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<CoinsHistoryRecord[]>(response);
  },

  // Get all coins history (for teachers - coins they awarded)
  getAllCoinsHistory: async (): Promise<CoinsHistoryRecord[]> => {
    const response = await fetch(`${API_BASE_URL}/users/allCoinsHistory`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<CoinsHistoryRecord[]>(response);
  },

  // New listing endpoints
  getTeachers: async (
    page = 0,
    size = 20,
    sortBy = 'secondName',
    sortDir = 'asc'
  ): Promise<PageableResponse<TeacherSummary>> => {
    const response = await fetch(
      `${API_BASE_URL}/users/teachers?page=${page}&size=${size}&sortBy=${encodeURIComponent(sortBy)}&sortDir=${encodeURIComponent(sortDir)}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse<PageableResponse<TeacherSummary>>(response);
  },

  getStudents: async (
    page = 0,
    size = 20,
    sortBy = 'secondName',
    sortDir = 'asc'
  ): Promise<PageableResponse<StudentSummary>> => {
    const response = await fetch(
      `${API_BASE_URL}/users/students?page=${page}&size=${size}&sortBy=${encodeURIComponent(sortBy)}&sortDir=${encodeURIComponent(sortDir)}`,
      { headers: getAuthHeaders() }
    );
    return handleResponse<PageableResponse<StudentSummary>>(response);
  },
};

// Group API
export const groupApi = {
  getAvailableGroups: async (): Promise<GroupDTO[]> => {
    const response = await fetch(`${API_BASE_URL}/groups`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<GroupDTO[]>(response);
  },

  getGroupById: async (id: number): Promise<GroupDTO> => {
    const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<GroupDTO>(response);
  },

  createGroup: async (group: CreateGroupRequest): Promise<GroupDTO> => {
    const response = await fetch(`${API_BASE_URL}/groups`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(group),
    });
    return handleResponse<GroupDTO>(response);
  },

  updateGroup: async (id: number, group: GroupDTO): Promise<GroupDTO> => {
    const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(group),
    });
    return handleResponse<GroupDTO>(response);
  },

  deleteGroup: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(response);
  },

  addStudentToGroup: async (groupId: number, studentId: number): Promise<GroupDTO> => {
    const response = await fetch(
      `${API_BASE_URL}/groups/${groupId}/students/${studentId}`,
      { 
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<GroupDTO>(response);
  },

  removeStudentFromGroup: async (groupId: number, studentId: number): Promise<GroupDTO> => {
    const response = await fetch(
      `${API_BASE_URL}/groups/${groupId}/students/${studentId}`,
      { 
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );
    return handleResponse<GroupDTO>(response);
  },
};

// Present API
export const presentApi = {
  // Presents API returns a plain array, not paginated
  getPresents: async (page = 0, size = 100): Promise<MobilePresentResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/presents?page=${page}&size=${size}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<MobilePresentResponse[]>(response);
  },

  // Alias for consistency - presents API already returns all items
  getAllPresents: async (): Promise<MobilePresentResponse[]> => {
    return presentApi.getPresents(0, 1000);
  },

  getPresent: async (id: number): Promise<AdminPresentResponse> => {
    const response = await fetch(`${API_BASE_URL}/presents/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<AdminPresentResponse>(response);
  },

  searchPresents: async (query: string): Promise<MobilePresentResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/presents/search?query=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<MobilePresentResponse[]>(response);
  },

  createPresent: async (
    name: string,
    priceCoins: number,
    stock: number,
    photos: File[]
  ): Promise<AdminPresentResponse> => {
    const formData = new FormData();
    photos.forEach((photo) => formData.append('photos', photo));

    // Get auth headers but remove Content-Type for FormData
    const headers = getAuthHeaders();
    delete (headers as Record<string, string>)['Content-Type'];

    const response = await fetch(
      `${API_BASE_URL}/presents?name=${encodeURIComponent(name)}&priceCoins=${priceCoins}&stock=${stock}`,
      {
        method: 'POST',
        headers,
        body: formData,
      }
    );
    return handleResponse<AdminPresentResponse>(response);
  },

  updatePresent: async (id: number, update: PresentUpdateRequest): Promise<AdminPresentResponse> => {
    const response = await fetch(`${API_BASE_URL}/presents/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(update),
    });
    return handleResponse<AdminPresentResponse>(response);
  },

  deletePresent: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/presents/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(response);
  },

  addPhotos: async (presentId: number, photos: File[]): Promise<AdminPresentResponse> => {
    const formData = new FormData();
    photos.forEach((photo) => formData.append('photos', photo));

    // Get auth headers but remove Content-Type for FormData
    const headers = getAuthHeaders();
    delete (headers as Record<string, string>)['Content-Type'];

    const response = await fetch(`${API_BASE_URL}/presents/${presentId}/photos`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse<AdminPresentResponse>(response);
  },

  deletePhoto: async (presentId: number, photoId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/presents/${presentId}/photos/${photoId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(response);
  },

  getPhotoUrl: (presentId: number, photoId: number): string => {
    return `${API_BASE_URL}/presents/${presentId}/photos/${photoId}`;
  },
};

// Order API
export const orderApi = {
  getOrders: async (page = 0, size = 100, sortBy = 'orderDate', sortDir = 'desc'): Promise<PageableResponse<OrderDTO>> => {
    const response = await fetch(`${API_BASE_URL}/orders?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<PageableResponse<OrderDTO>>(response);
  },

  // Helper to get all orders (handles pagination internally)
  getAllOrders: async (): Promise<OrderDTO[]> => {
    const allOrders: OrderDTO[] = [];
    let page = 0;
    let hasMore = true;
    
    while (hasMore) {
      const response = await orderApi.getOrders(page, 100);
      allOrders.push(...response.content);
      hasMore = !response.last;
      page++;
    }
    
    return allOrders;
  },

  getOrderById: async (id: number): Promise<OrderDTO> => {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<OrderDTO>(response);
  },

  createOrder: async (presentId: number): Promise<OrderDTO> => {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ presentId } as CreateOrderRequest),
    });
    return handleResponse<OrderDTO>(response);
  },

  updateOrderStatus: async (id: number, status: string): Promise<OrderDTO> => {
    // Backend expects status as query parameter
    const response = await fetch(`${API_BASE_URL}/orders/${id}?status=${encodeURIComponent(status)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse<OrderDTO>(response);
  },

  cancelOrder: async (id: number): Promise<OrderDTO> => {
    const response = await fetch(`${API_BASE_URL}/orders/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<OrderDTO>(response);
  },
};

export { ApiError };
