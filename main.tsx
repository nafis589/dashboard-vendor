/**
 * Équivalent du point d'entrée SPA (BrowserRouter + providers).
 * Avec Next.js App Router, ce rôle est assuré par app/layout.tsx qui monte AppProviders.
 *
 * Stack providers :
 *   QueryClientProvider → AuthProvider → pages
 *
 * Routes : voir router.tsx et le dossier app/
 */
export { default as AppProviders } from '@/components/providers/AppProviders';
export { publicRoutes, protectedRoutes, allRoutes } from '@/router';
