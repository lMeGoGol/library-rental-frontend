export type Role = 'admin' | 'librarian' | 'reader';
export type DiscountCategory = 'none' | 'student' | 'loyal' | 'pensioner' | 'vip';

export interface User {
  id: string;
  username: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  address?: string;
  phone?: string;
  discountCategory?: DiscountCategory;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto extends LoginDto {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  address?: string;
  phone?: string;
  role?: Role;
}

export interface AuthResponse {
  token: string;
  role: Role;
  message?: string;
}

export function mapUser(raw: any): User {
  return {
    id: raw._id ?? raw.id,
    username: raw.username,
  role: String(raw.role ?? 'reader').toLowerCase() as Role,
    firstName: raw.firstName,
    lastName: raw.lastName,
    middleName: raw.middleName,
    address: raw.address,
    phone: raw.phone,
    discountCategory: raw.discountCategory as DiscountCategory,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
