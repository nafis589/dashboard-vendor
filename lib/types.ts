export type VendorStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

export interface VendorUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'VENDOR';
  shop_name: string;
  status: VendorStatus;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export interface LoginResponse {
  data: {
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
    };
    accessToken: string;
    refreshToken: string;
  };
}

export interface VendorProfileResponse {
  data: VendorUser;
}

export interface ValidateLocationResponse {
  data: {
    isInTogo: boolean;
    region?: { id: string; name: string; capital: string };
  };
}

export interface RegisterResponse {
  data: {
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
    };
    accessToken: string;
    refreshToken: string;
  };
}

export interface VendorShippingRegionInput {
  region_id: string;
  is_home_region: boolean;
  price_per_km?: number | null;
  min_fee?: number;
  fixed_price?: number | null;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export interface VendorOrder {
  id: string;
  buyer_id: string;
  vendor_id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_fee: number;
  buyer_name: string;
  items_count: number;
  shipping_address: {
    first_name: string;
    last_name: string;
    phone: string;
    notes?: string | null;
    latitude?: number;
    longitude?: number;
    region_id?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface VendorOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  product_snapshot: {
    title: string;
    image: string | null;
    brand: string | null;
  };
}

export interface VendorOrderStatusHistoryEntry {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface VendorOrderDetail extends VendorOrder {
  payment_method: 'CASH_ON_DELIVERY' | 'BANK_TRANSFER';
  shipping_region_id: string;
  shipping_method: 'PER_KM' | 'FIXED';
  shipping_distance_km: number | null;
  tracking_number: string | null;
  items: VendorOrderItem[];
  status_history: VendorOrderStatusHistoryEntry[];
}

export interface VendorProduct {
  id: string;
  title: string;
  stock: number;
  status: string;
  price: number;
  primary_image?: string | null;
  category_name?: string | null;
  category_id?: string | null;
  views_count?: number;
  brand?: string | null;
  description?: string | null;
  condition?: string | null;
  material?: string | null;
  color?: string | null;
  size?: string | null;
}

export interface VendorProductImage {
  id: string;
  product_id: string;
  url: string;
  position: number;
  is_primary: boolean;
}

export interface VendorProductDetail extends VendorProduct {
  images: VendorProductImage[];
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
