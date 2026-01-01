# Lithic Security, Authentication & HIPAA Compliance Module

## Overview

Complete enterprise-grade security and authentication system for Lithic healthcare SaaS platform with HIPAA compliance, multi-factor authentication, role-based access control, and comprehensive audit logging.

## Architecture

### Module Structure

```
lithic/
├── src/
│   ├── app/
│   │   ├── (dashboard)/admin/          # Admin pages
│   │   │   ├── page.tsx                # Admin dashboard
│   │   │   ├── users/                  # User management
│   │   │   ├── roles/                  # Role management
│   │   │   ├── permissions/            # Permission matrix
│   │   │   ├── audit/                  # Audit logs
│   │   │   ├── security/               # Security center
│   │   │   ├── organizations/          # Organization settings
│   │   │   ├── integrations/           # Integration manager
│   │   │   └── settings/               # System settings
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── [...nextauth]/      # NextAuth handler
│   │       │   ├── register/           # User registration
│   │       │   └── mfa/                # MFA operations
│   │       └── admin/
│   │           ├── users/              # User CRUD operations
│   │           ├── roles/              # Role management
│   │           ├── permissions/        # Permission management
│   │           ├── audit/              # Audit log API
│   │           └── organizations/      # Organization API
│   ├── components/admin/               # Admin UI components
│   │   ├── UserManagement.tsx
│   │   ├── UserForm.tsx
│   │   ├── RoleManager.tsx
│   │   ├── PermissionMatrix.tsx
│   │   ├── AuditLog.tsx
│   │   ├── SecurityDashboard.tsx
│   │   ├── MFASetup.tsx
│   │   ├── SessionManager.tsx
│   │   ├── OrganizationSettings.tsx
│   │   ├── IntegrationManager.tsx
│   │   ├── AccessControl.tsx
│   │   └── ComplianceReport.tsx
│   ├── lib/
│   │   ├── auth.ts                     # NextAuth configuration
│   │   ├── permissions.ts              # RBAC logic
│   │   ├── audit.ts                    # Audit logging
│   │   ├── encryption.ts               # PHI encryption
│   │   ├── session.ts                  # Session management
│   │   └── mfa.ts                      # MFA/TOTP implementation
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── audit.service.ts
│   │   └── organization.service.ts
│   └── middleware.ts                   # Route protection
└── prisma/
    └── schema.prisma                   # Database schema
```

## Features

### 1. Authentication & Authorization

#### NextAuth.js Integration

- **Credentials Provider**: Email/password authentication with bcrypt hashing
- **Session Strategy**: JWT-based sessions with 30-day expiry
- **Automatic Session Refresh**: Periodic user data synchronization
- **Account Locking**: Automatic lockout after 5 failed attempts (30 minutes)
- **Password Security**: Minimum 12 characters, complexity requirements

#### Multi-Factor Authentication (MFA)

- **TOTP Support**: Time-based One-Time Password using otpauth
- **QR Code Generation**: Easy authenticator app setup
- **Backup Codes**: 10 one-time use backup codes
- **MFA Enforcement**: Organization-wide MFA requirement option
- **MFA Recovery**: Admin can force-disable MFA for users

### 2. Role-Based Access Control (RBAC)

#### Permission System

- **Granular Permissions**: Resource-level access control
- **Permission Scopes**: OWN, DEPARTMENT, ORGANIZATION, ALL
- **Dynamic Permission Checking**: Runtime permission validation
- **Temporary Access Grants**: Time-limited permission delegation
- **Permission Matrix**: Visual permission overview across roles

#### System Roles

1. **SUPER_ADMIN**: Full system access across all organizations
2. **ADMIN**: Organization-wide administrator
3. **PHYSICIAN**: Clinical access with prescription rights
4. **NURSE**: Clinical access with limited write permissions
5. **FRONT_DESK**: Patient and appointment management
6. **BILLING**: Financial and insurance operations
7. **VIEWER**: Read-only access

### 3. Audit Logging & Compliance

#### HIPAA-Compliant Audit Trail

- **Comprehensive Logging**: All user actions tracked
- **PHI Access Tracking**: Special logging for Protected Health Information
- **7-Year Retention**: Automatic retention period calculation
- **Tamper-Proof**: Immutable audit log entries
- **Export Capabilities**: CSV and JSON export for compliance

#### Audit Features

- **Action Tracking**: LOGIN, LOGOUT, CREATE, UPDATE, DELETE, PHI_ACCESSED
- **User Attribution**: User ID, name, email stored denormalized
- **Context Capture**: IP address, user agent, location
- **Change Tracking**: Before/after snapshots for updates
- **Search & Filter**: Advanced audit log querying
- **Analytics Dashboard**: Security insights and metrics

### 4. Session Management

#### Advanced Session Control

- **Multi-Device Support**: Track sessions across devices
- **Session Monitoring**: Real-time active session viewing
- **Session Revocation**: Individual or bulk session termination
- **Activity Tracking**: Last activity timestamps
- **Suspicious Activity Detection**: Anomaly detection algorithms
- **Session Timeout**: Configurable inactivity timeout

#### Security Features

- **Device Fingerprinting**: Track device information
- **Location Tracking**: Geographic session monitoring
- **Concurrent Session Limits**: Prevent session hijacking
- **Auto-Logout**: Inactive session cleanup

### 5. Data Encryption

#### PHI Encryption

- **AES-256-GCM**: Military-grade encryption algorithm
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt & IV**: Random salt and initialization vector per encryption
- **Authentication Tags**: Tamper detection
- **Field-Level Encryption**: Encrypt specific sensitive fields

#### Encryption Features

- **Master Key Management**: Environment-based key storage
- **Data Masking**: Partial data display (SSN, credit cards)
- **PHI Redaction**: Automatic PHI removal from logs
- **Secure Comparison**: Timing-attack resistant comparisons

### 6. Organization Management

#### Multi-Tenant Architecture

- **Organization Isolation**: Complete data separation
- **Organization Types**: Hospital, Clinic, Private Practice, etc.
- **Subscription Management**: Plan-based feature access
- **License Tracking**: User count limits
- **BAA Management**: Business Associate Agreement tracking

#### Organization Settings

- **Security Policies**: MFA requirements, session timeouts
- **Password Policies**: Complexity, expiration, history
- **IP Whitelisting**: Network-level access control
- **Branding**: Custom logos and colors

### 7. Integration Management

#### Supported Integrations

- **Epic EHR**: Electronic Health Records integration
- **FHIR API**: Fast Healthcare Interoperability Resources
- **HL7 Interface**: Health Level 7 messaging
- **AWS S3**: Document storage
- **Custom APIs**: Flexible integration framework

## Security Middleware

### Route Protection

```typescript
// Automatic authentication check for protected routes
// - /dashboard/* - Requires authenticated user
// - /admin/* - Requires admin role
// - Account status validation
// - Organization status validation
```

### Security Headers

- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: Enabled
- **Strict-Transport-Security**: HSTS enabled
- **Content-Security-Policy**: Restrictive CSP
- **Permissions-Policy**: Disabled camera, microphone, geolocation

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth handlers
- `GET /api/auth/mfa` - Get MFA status
- `POST /api/auth/mfa` - MFA operations (generate, enable, disable, verify)

### Admin - Users

- `GET /api/admin/users` - List users (paginated, filterable)
- `POST /api/admin/users` - Create user
- `GET /api/admin/users/[id]` - Get user details
- `PATCH /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Deactivate user

### Admin - Roles & Permissions

- `GET /api/admin/roles` - List roles
- `POST /api/admin/roles` - Create role
- `GET /api/admin/permissions` - Get permission matrix
- `POST /api/admin/permissions` - Grant permission or assign role

### Admin - Audit & Compliance

- `GET /api/admin/audit` - Get audit logs (with analytics option)
- `POST /api/admin/audit` - Generate compliance report
- Export functionality for CSV/JSON

### Admin - Organizations

- `GET /api/admin/organizations` - Get organization details
- `PATCH /api/admin/organizations` - Update organization settings

## Database Schema

### Core Models

- **User**: User accounts with MFA support
- **Role**: RBAC roles
- **Permission**: Granular permissions with scopes
- **Session**: Enhanced session tracking
- **AuditLog**: Comprehensive audit trail
- **Organization**: Multi-tenant organizations
- **AccessGrant**: Temporary access delegation
- **SecurityEvent**: Security incident tracking
- **EncryptionKey**: Key management for rotation

## Usage Examples

### Check Permission

```typescript
import { checkPermission } from "@/lib/permissions";

const hasAccess = await checkPermission({
  userId: "user-id",
  resource: "patient",
  action: "read",
  organizationId: "org-id",
});
```

### Log Audit Event

```typescript
import { logAudit } from "@/lib/audit";

await logAudit({
  userId: "user-id",
  action: "PHI_ACCESSED",
  resource: "Patient",
  resourceId: "patient-id",
  description: "Viewed patient medical record",
  organizationId: "org-id",
  isPHIAccess: true,
  phiType: "Medical Record",
});
```

### Encrypt PHI

```typescript
import { encrypt, decrypt } from "@/lib/encryption";

const encrypted = encrypt(sensitiveData);
const decrypted = decrypt(encrypted);
```

### Session Management

```typescript
import { createSession, validateSession, revokeSession } from "@/lib/session";

// Create session
const session = await createSession({
  userId: "user-id",
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
});

// Validate session
const isValid = await validateSession(sessionToken);

// Revoke session
await revokeSession(sessionId, "User logged out");
```

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/lithic

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-characters

# Encryption (optional, uses NEXTAUTH_SECRET if not set)
ENCRYPTION_KEY=your-encryption-key-min-32-characters
```

## Installation & Setup

1. **Install Dependencies**

```bash
npm install
# otpauth is already included for MFA/TOTP
```

2. **Database Setup**

```bash
npx prisma generate
npx prisma db push
# or
npx prisma migrate dev
```

3. **Initialize System Roles**

```typescript
import { initializeSystemRoles } from "@/lib/permissions";

await initializeSystemRoles("organization-id");
```

4. **Create First Admin User**

```typescript
import { createOrganization } from "@/services/organization.service";

const result = await createOrganization({
  name: "My Organization",
  type: "HOSPITAL",
  npi: "1234567890",
  taxId: "12-3456789",
  address: {},
  contactInfo: {},
  adminEmail: "admin@example.com",
  adminFirstName: "Admin",
  adminLastName: "User",
});
```

## Security Best Practices

### Password Security

- Minimum 12 characters
- Complexity requirements enforced
- Bcrypt with 12 rounds
- Password expiration (configurable)
- Password history tracking

### Session Security

- Short-lived JWT tokens
- Session timeout on inactivity
- Concurrent session monitoring
- Automatic session cleanup

### Data Protection

- Field-level encryption for PHI
- Data masking in logs
- Secure key storage
- Regular key rotation

### Audit Compliance

- All PHI access logged
- 7-year retention period
- Tamper-proof logging
- Regular compliance reports

## HIPAA Compliance Features

✅ **Access Control** - RBAC with permission scopes
✅ **Audit Controls** - Comprehensive audit logging
✅ **Data Integrity** - Encryption and tamper detection
✅ **Person/Entity Authentication** - MFA support
✅ **Transmission Security** - HTTPS enforcement
✅ **PHI Access Tracking** - Special PHI logging
✅ **BAA Management** - Agreement tracking
✅ **Breach Notification** - Security event monitoring
✅ **Data Retention** - 7-year audit log retention

## Admin Pages

1. **Admin Dashboard** - `/admin` - Overview and statistics
2. **User Management** - `/admin/users` - CRUD operations for users
3. **User Details** - `/admin/users/[id]` - Individual user management
4. **New User** - `/admin/users/new` - User creation form
5. **Roles** - `/admin/roles` - Role management
6. **Permissions** - `/admin/permissions` - Permission matrix
7. **Audit Logs** - `/admin/audit` - Compliance and audit trail
8. **Security** - `/admin/security` - Security dashboard and sessions
9. **Organizations** - `/admin/organizations` - Organization settings
10. **Integrations** - `/admin/integrations` - Third-party integrations
11. **Settings** - `/admin/settings` - System configuration

## Component Library

All admin components are fully functional with:

- Real-time data fetching
- Form validation
- Error handling
- Loading states
- Responsive design
- Accessibility features

## Testing

Recommended testing approach:

1. **Unit Tests**: Test utility functions (permissions, encryption, audit)
2. **Integration Tests**: Test API endpoints
3. **E2E Tests**: Test complete user flows (login, MFA, user management)
4. **Security Tests**: Test authentication, authorization, session handling

## Performance Considerations

- **Database Indexing**: All frequently queried fields indexed
- **Pagination**: All list endpoints support pagination
- **Caching**: Session data cached, user permissions cached
- **Lazy Loading**: Components load data on demand
- **Optimistic Updates**: UI updates before API confirmation

## Troubleshooting

### Common Issues

1. **MFA Not Working**: Ensure `otpauth` is installed and time is synchronized
2. **Session Expired**: Check `NEXTAUTH_SECRET` and session timeout settings
3. **Permission Denied**: Verify user role and permissions in database
4. **Audit Logs Not Appearing**: Check organization ID matching

## Future Enhancements

- [ ] WebAuthn/Passkey support
- [ ] SAML/SSO integration
- [ ] Advanced threat detection
- [ ] Automated compliance reporting
- [ ] Role hierarchy system
- [ ] Permission templates
- [ ] Session recording/replay
- [ ] Behavioral analytics

## License

Enterprise License - Lithic Healthcare SaaS Platform

## Support

For support and questions, contact the development team.

---

**Module Version**: 1.0.0
**Last Updated**: 2026-01-01
**Author**: Coding Agent 10 - Security & Compliance Team
