import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Force Turbopack to use this app as root (avoids picking C:\Users\toure\ when multiple lockfiles exist)
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
