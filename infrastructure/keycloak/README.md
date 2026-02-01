# Keycloak Realm Configuration

## ⚠️ SECURITY WARNING

**DEVELOPMENT ONLY**: The realm configuration file `looper-hq-realm.json` contains hardcoded test credentials.

### Test Users

The realm includes these test users for development:

| Username | Password   | Role   |
|----------|------------|--------|
| admin    | admin123   | admin  |
| lawyer   | lawyer123  | lawyer |
| client   | client123  | client |

### ⚠️ BEFORE PRODUCTION

**NEVER use this configuration in production!**

Before deploying to production, you MUST:

1. **Change all default passwords**
2. **Remove or disable all test users**
3. **Configure proper OAuth/OIDC client secrets**
4. **Enable SSL/TLS**
5. **Configure proper frontend URLs**
6. **Review and adjust all security settings**
7. **Enable audit logging**
8. **Configure proper session timeouts**

## Realm Configuration

The `looper-hq-realm.json` file contains:

- **Realm**: looper-hq
- **Clients**: 
  - `looper-hq-web` - Main web application
  - `looper-hq-admin` - Admin portal
- **Roles**:
  - `user` - Standard user
  - `lawyer` - Lawyer with case management access
  - `admin` - Administrator with full access
  - `client` - Client for case inquiry
- **Groups**: lawyers, clients, admins
- **Protocol Mappers**: Configured for role-based access control

## Usage

The realm is automatically imported when Keycloak starts with the `--import-realm` flag.

To manually import or update:

1. Access Keycloak Admin Console: http://localhost:8080
2. Login with admin credentials
3. Select "Add realm" or update existing realm
4. Import the JSON file

## Customization

To customize the realm configuration:

1. Make changes via Keycloak Admin Console UI
2. Export the realm: Realm Settings > Action > Partial export
3. Update `looper-hq-realm.json` with your changes
4. Restart Keycloak to apply changes

## References

- [Keycloak Server Administration](https://www.keycloak.org/docs/latest/server_admin/)
- [Keycloak Securing Applications](https://www.keycloak.org/docs/latest/securing_apps/)
