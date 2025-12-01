// API Types based on OpenAPI schema

export interface ErrorResponse {
  code: string;
  message: string;
  timestamp: string;
}

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface UserDTO {
  id?: number;
  login: string;
  password?: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  middle_name?: string;
  full_name?: string;
  email: string;
  date_of_birth: string;
  coins?: number;
}

export interface PhotoResponse {
  id: number;
}

export interface AdminPresentResponse {
  id: number;
  name: string;
  priceCoins: number;
  stock: number;
  photos: PhotoResponse[];
}

export interface MobilePresentResponse {
  id: number;
  name: string;
  priceCoins: number;
  stock: number;
  photoIds: number[];
}

export interface PresentUpdateRequest {
  name?: string;
  priceCoins?: number;
  stock?: number;
}

export interface GroupDTO {
  id?: number;
  group_name: string;
  teacher_id?: number;
  teacher?: UserDTO;
  students?: UserDTO[];
}

export interface CreateGroupRequest {
  group_name: string;
  teacher_id: number;
}

// Coins History Types
export interface CoinsHistoryRecord {
  id: number;
  user?: UserDTO & { group_name?: string };
  admin?: UserDTO;
  coins: number;
  date: string;
  reason?: string;
}

export interface AddCoinsRequest {
  coins: number;
  reason?: string;
}

// Order Types
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';

export interface OrderDTO {
  id: number;
  customer: UserDTO;
  present_id: number;
  status: OrderStatus;
  date: string;
}

export interface PageableResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      empty: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  first: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    empty: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  empty: boolean;
}

export interface CreateOrderRequest {
  presentId: number;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}
