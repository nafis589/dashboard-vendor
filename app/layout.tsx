import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import AppProviders from '@/components/providers/AppProviders';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Espace vendeur | Marketplace',
  description: 'Dashboard vendeur Marketplace',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="min-h-full font-sans antialiased text-[#1A1A1A]">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
