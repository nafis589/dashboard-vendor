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
