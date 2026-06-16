/**
 * Composable for navigating to KKOO subdomain apps.
 * Provides utilities for generating subdomain URLs and routing users to services.
 */

import { computed } from 'vue';
import { subdomainConfig } from '@/config/subdomains';

type ServiceType = 'eats' | 'stay' | 'ride' | 'market';

export function useSubdomainNavigation() {
  /**
   * Get the full URL for a service subdomain
   * @param service - Service name
   * @returns Full subdomain URL
   */
  const getServiceUrl = (service: ServiceType): string => {
    return subdomainConfig.getServiceUrl(service);
  };

  /**
   * Navigate to a service subdomain
   * @param service - Service name
   * @param options - Navigation options
   */
  const navigateToService = (
    service: ServiceType,
    options: { newWindow?: boolean; path?: string } = {}
  ) => {
    const { newWindow = false, path = '' } = options;
    const baseUrl = getServiceUrl(service);
    const fullUrl = path ? `${baseUrl}${path}` : baseUrl;

    if (newWindow) {
      window.open(fullUrl, '_blank');
    } else {
      window.location.href = fullUrl;
    }
  };

  /**
   * Get service display information (name, icon, description, colors)
   */
  const getServiceInfo = (service: ServiceType) => {
    return subdomainConfig.getServiceInfo(service);
  };

  /**
   * Get all services with their metadata
   */
  const allServices = computed(() => subdomainConfig.getAllServices());

  /**
   * Check if a URL is external (subdomain)
   */
  const isExternalSubdomain = (url: string): boolean => {
    return url.startsWith('http://') || url.startsWith('https://');
  };

  /**
   * Generate a safe link href for a service
   */
  const getLinkHref = (service: ServiceType): string => {
    return getServiceUrl(service);
  };

  return {
    getServiceUrl,
    navigateToService,
    getServiceInfo,
    allServices,
    isExternalSubdomain,
    getLinkHref,
  };
}
