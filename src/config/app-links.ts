/**
 * Store links for KKOO apps (mobile + subdomains).
 * Mobile app store links + subdomain web app URLs.
 */

import { subdomainConfig } from './subdomains';

const env = import.meta.env;

export const appLinks = {
  /** KKOO Marketplace (buyers) - mobile apps */
  marketplace: {
    googlePlay:
      (env.VITE_KKOO_BUYERS_GOOGLE_PLAY_URL as string | undefined) ??
      'https://play.google.com/store/apps/details?id=kkoo.co.tz.kkoo',
    appStore:
      (env.VITE_KKOO_BUYERS_APP_STORE_URL as string | undefined) ??
      'https://apps.apple.com/app/kkoo-marketplace/id123456789',
  },
  /** Kkoo Business (sellers) - mobile + desktop */
  business: {
    googlePlay:
      (env.VITE_KKOO_BUSINESS_GOOGLE_PLAY_URL as string | undefined) ??
      'https://play.google.com/store/apps/details?id=co.tz.kkooapp.kkooBusiness',
    appStore:
      (env.VITE_KKOO_BUSINESS_APP_STORE_URL as string | undefined) ??
      'https://apps.apple.com/app/kkoo-business/id123456789',
    windows:
      (env.VITE_KKOO_BUSINESS_WINDOWS_URL as string | undefined) ??
      'https://kkooapp.co.tz/downloads/kkoo-business/Kkoo-Business-Setup.exe',
    mac:
      (env.VITE_KKOO_BUSINESS_MAC_URL as string | undefined) ??
      'https://kkooapp.co.tz/downloads/kkoo-business/Kkoo-Business.dmg',
  },
  /** KKOO Eats (food & groceries) - mobile apps */
  eats: {
    googlePlay: 'https://play.google.com/store/apps/details?id=com.kkoo.eats',
    appStore: 'https://apps.apple.com/app/kkoo-eats/id123456789',
  },
  /** KKOO Rides (drivers / earn) - mobile apps */
  rides: {
    googlePlay: 'https://play.google.com/store/apps/details?id=com.kkoo.rides',
    appStore: 'https://apps.apple.com/app/kkoo-rides/id123456789',
  },
  /** KKOO Stay (accommodation) - mobile apps */
  stay: {
    googlePlay: 'https://play.google.com/store/apps/details?id=com.kkoo.stay',
    appStore: 'https://apps.apple.com/app/kkoo-stay/id123456789',
  },

  /** Subdomain apps (web) - routing for main domain */
  subdomains: {
    eats: subdomainConfig.getServiceUrl('eats'),
    stay: subdomainConfig.getServiceUrl('stay'),
    ride: subdomainConfig.getServiceUrl('ride'),
    market: subdomainConfig.getServiceUrl('market'),
  },

  /** Main domain */
  main: subdomainConfig.mainDomain,
} as const
