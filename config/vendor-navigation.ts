import {
  HandCoins,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Package,
  ShoppingBag,
  Star,
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
export const OFFERS_URL = '/offers';
export const MESSAGES_URL = '/messages';

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
        title: 'Offres',
        url: OFFERS_URL,
        icon: HandCoins,
        badge: true,
      },
      {
        title: 'Messages',
        url: MESSAGES_URL,
        icon: MessageSquare,
        badge: true,
      },
      {
        title: 'Adresse & Livraison',
        url: '/shipping',
        icon: MapPin,
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
