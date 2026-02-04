/**
 * Keycloak configuration
 */

export const keycloakConfig = {
  url: process.env.KEYCLOAK_FRONTEND_URL || 'http://localhost:8080',
  realm: process.env.KEYCLOAK_REALM || 'looper-hq',
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'looper-hq-web',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
  
  // OAuth endpoints
  endpoints: {
    auth: '/realms/{realm}/protocol/openid-connect/auth',
    token: '/realms/{realm}/protocol/openid-connect/token',
    userinfo: '/realms/{realm}/protocol/openid-connect/userinfo',
    logout: '/realms/{realm}/protocol/openid-connect/logout',
  },
  
  // Token settings
  tokenExpiry: 3600, // 1 hour
  refreshTokenExpiry: 86400, // 24 hours
};

export function getKeycloakAuthUrl(): string {
  return `${keycloakConfig.url}${keycloakConfig.endpoints.auth.replace('{realm}', keycloakConfig.realm)}`;
}

export function getKeycloakTokenUrl(): string {
  return `${keycloakConfig.url}${keycloakConfig.endpoints.token.replace('{realm}', keycloakConfig.realm)}`;
}

export function getKeycloakUserInfoUrl(): string {
  return `${keycloakConfig.url}${keycloakConfig.endpoints.userinfo.replace('{realm}', keycloakConfig.realm)}`;
}

export function getKeycloakLogoutUrl(): string {
  return `${keycloakConfig.url}${keycloakConfig.endpoints.logout.replace('{realm}', keycloakConfig.realm)}`;
}
