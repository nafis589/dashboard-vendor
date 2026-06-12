/**
 * Définition des routes — mappées sur le App Router Next.js.
 * Publiques : app/(auth)/  ·  Protégées : app/(protected)/ + ProtectedRoute
 */
import type { ComponentType } from 'react';
import Dashboard from '@/views/Dashboard';
import ProductList from '@/views/ProductList';
import ProductNew from '@/views/ProductNew';
import OrderList from '@/views/OrderList';
import Shipping from '@/views/Shipping';
import Profile from '@/views/Profile';

export interface AppRoute {
  path: string;
  Component?: ComponentType<Record<string, unknown>>;
  protected: boolean;
}

/** Routes publiques (sans ProtectedRoute) → app/(auth)/login, app/(auth)/register */
export const publicRoutes: AppRoute[] = [
  { path: '/login', protected: false },
  { path: '/register', protected: false },
];

/** Routes protégées (avec ProtectedRoute) → app/(protected)/… */
export const protectedRoutes: AppRoute[] = [
  { path: '/', protected: true },
  { path: '/dashboard', Component: Dashboard, protected: true },
  { path: '/products', Component: ProductList, protected: true },
  { path: '/products/new', Component: ProductNew, protected: true },
  { path: '/products/:id/edit', protected: true },
  { path: '/orders', Component: OrderList, protected: true },
  { path: '/orders/:id', protected: true },
  { path: '/shipping', Component: Shipping, protected: true },
  { path: '/profile', Component: Profile, protected: true },
];

export const allRoutes = [...publicRoutes, ...protectedRoutes];
