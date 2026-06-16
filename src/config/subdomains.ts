/**
 * Subdomain and service URL configuration for KKOO ecosystem.
 * All transactional apps live at dedicated subdomains.
 *
 * Environment variables:
 * - VITE_MAIN_DOMAIN: Main domain URL
 * - VITE_EATS_URL: KKOO Eats subdomain
 * - VITE_STAY_URL: KKOO Stay subdomain
 * - VITE_RIDE_URL: KKOO Ride subdomain
 * - VITE_MARKET_URL: KKOO Market subdomain
 */

const env = import.meta.env;

export const subdomainConfig = {
  // Environment detection
  isProduction: env.PROD,
  isDevelopment: env.DEV,

  // Main domain
  mainDomain: env.VITE_MAIN_DOMAIN || 'https://kkooapp.co.tz',

  // Service subdomains - override via environment variables
  services: {
    eats: env.VITE_EATS_URL || 'https://eats.kkooapp.co.tz',
    stay: env.VITE_STAY_URL || 'https://stay.kkooapp.co.tz',
    ride: env.VITE_RIDE_URL || 'https://ride.kkooapp.co.tz',
    market: env.VITE_MARKET_URL || 'https://market.kkooapp.co.tz',
  },

  // Service display metadata for UI
  serviceInfo: {
    eats: {
      name: 'K\'KOO Eats',
      icon: 'solar:cup-hot-bold',
      description: 'Order food, groceries, and essentials from verified vendors',
      color: '#F7A829',
      accentGrad: 'linear-gradient(135deg, #5C308F 0%, #F7A829 100%)',
      dark: false,
    },
    stay: {
      name: 'K\'KOO Stay',
      icon: 'solar:home-bold',
      description: 'Book hotels and accommodations across Tanzania',
      color: '#7B46B3',
      accentGrad: 'linear-gradient(135deg, #5C308F 0%, #9B59CC 100%)',
      dark: false,
    },
    ride: {
      name: 'K\'KOO Ride',
      icon: 'solar:delivery-bold',
      description: 'Schedule reliable delivery and logistics services',
      color: '#F7A829',
      accentGrad: 'linear-gradient(135deg, #F7A829 0%, #E8940F 100%)',
      dark: false,
    },
    market: {
      name: 'K\'KOO Market',
      icon: 'solar:cart-large-2-bold',
      description: 'Shop products from trusted sellers with protected delivery',
      color: '#5C308F',
      accentGrad: 'linear-gradient(135deg, #5C308F 0%, #3B1A5A 100%)',
      dark: false,
    },
  },

  /**
   * Get the full URL for a service subdomain
   */
  getServiceUrl(service: 'eats' | 'stay' | 'ride' | 'market'): string {
    return subdomainConfig.services[service];
  },

  /**
   * Get service display information
   */
  getServiceInfo(service: 'eats' | 'stay' | 'ride' | 'market') {
    return subdomainConfig.serviceInfo[service];
  },

  /**
   * Get all services as array for iteration
   */
  getAllServices() {
    return [
      { key: 'eats' as const, ...subdomainConfig.serviceInfo.eats },
      { key: 'stay' as const, ...subdomainConfig.serviceInfo.stay },
      { key: 'ride' as const, ...subdomainConfig.serviceInfo.ride },
      { key: 'market' as const, ...subdomainConfig.serviceInfo.market },
    ];
  },
};

export default subdomainConfig;
