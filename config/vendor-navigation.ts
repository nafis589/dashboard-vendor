import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Star,
  Truck,
  User,
  type LucideIcon,
} from 'lucide-react';

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  badge?: boolean;
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const ORDERS_URL = '/orders';

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: 'Tableau de bord',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 2,
    label: 'Gestion',
    items: [
      {
        title: 'Mes produits',
        url: '/products',
        icon: Package,
      },
      {
        title: 'Commandes',
        url: ORDERS_URL,
        icon: ShoppingBag,
        badge: true,
      },
      {
        title: 'Livraison',
        url: '/shipping',
        icon: Truck,
      },
      {
        title: 'Mon profil',
        url: '/profile',
        icon: User,
      },
      {
        title: 'Avis',
        url: '/reviews',
        icon: Star,
      },
    ],
  },
];
