# LITHIC v0.2 - Agent Coordination Guide

**Coordinator: Agent 14**
**Status: Infrastructure Complete ✅**
**Date: 2026-01-01**

---

## 📋 INFRASTRUCTURE STATUS

### ✅ Completed

1. **Type Definitions (100%)**
   - All enterprise v0.2 types defined and exported
   - Type safety across all modules
   - Comprehensive DTOs for API operations

2. **Shared Utilities (100%)**
   - API response standardization
   - Validation utilities
   - Date/time utilities
   - All utilities exported and ready to use

3. **Integration Points (100%)**
   - Clear import patterns documented
   - API route patterns established
   - Validation patterns defined
   - Error handling standardized

---

## 🎯 AGENT READINESS CHECKLIST

Before starting your assigned module, ensure:

- [ ] Read this coordination guide completely
- [ ] Review your agent assignment in SCRATCHPAD.md
- [ ] Check dependencies on other agents
- [ ] Understand the type definitions for your module
- [ ] Review shared utilities available
- [ ] Follow the coding patterns below

---

## 📦 SHARED RESOURCES

### Type Definitions

All types are available from `@/types`:

```typescript
// Core types
import type {
  BaseEntity,
  ApiResponse,
  ApiError,
  ResponseMeta,
  PaginationParams,
} from "@/types";

// Enterprise module types
import type {
  Organization,
  Facility,
  Department,
  DataSharingAgreement,
  OrganizationContext,
} from "@/types";

// Telehealth module types
import type {
  TelehealthSession,
  VideoParticipant,
  WaitingRoomEntry,
  SessionRecording,
} from "@/types";

// CDS module types
import type {
  CDSRule,
  CDSAlert,
  DrugDrugInteraction,
  OrderSet,
  AlertFatigueMetrics,
} from "@/types";

// Population Health module types
import type {
  PatientRegistry,
  CareGap,
  RiskScore,
  QualityMeasure,
  SDOH,
} from "@/types";

// RBAC module types
import type {
  RolePermission,
  AccessPolicy,
  BreakGlassRequest,
  DepartmentAccess,
  LocationAccess,
} from "@/types";
```

### Shared Utilities

#### API Response Utilities

```typescript
import {
  successResponse,
  errorResponse,
  standardError,
  paginatedResponse,
  ErrorCodes,
  validatePagination,
} from "@/lib/utils/api-response";

// Success response
return NextResponse.json(successResponse(data));

// Error response
return NextResponse.json(standardError("NOT_FOUND", "Patient not found"), {
  status: 404,
});

// Paginated response
const { page, limit } = validatePagination(queryPage, queryLimit);
return NextResponse.json(paginatedResponse(items, page, limit, total));
```

#### Validation Utilities

```typescript
import {
  createValidator,
  isValidEmail,
  isValidPhoneNumber,
  isValidNPI,
  isValidICD10Code,
  isValidCPTCode,
  isValidBloodPressure,
  isValidTemperature,
} from "@/lib/utils/validation";

// Using the validator class
const validator = createValidator();
const result = validator
  .required(email, "Email")
  .email(email, "Email")
  .required(name, "Name")
  .length(name, 2, 100, "Name")
  .getResult();

if (!result.isValid) {
  return NextResponse.json(
    errorResponse("VALIDATION_ERROR", "Validation failed", {
      errors: result.errors,
    }),
    { status: 400 },
  );
}

// Individual validators
if (!isValidEmail(email)) {
  return standardError("INVALID_FORMAT", "Invalid email format");
}
```

#### Date Utilities

```typescript
import {
  formatDate,
  formatTime,
  formatDateTime,
  calculateAge,
  formatAge,
  formatRelativeTime,
  addDays,
  addMonths,
  isSameDay,
  isToday,
  differenceInDays,
  formatMedicalDateTime,
} from "@/lib/utils/date-utils";

// Format dates for display
const displayDate = formatDate(patient.dateOfBirth, "medical"); // MM/DD/YYYY
const age = calculateAge(patient.dateOfBirth); // number
const ageString = formatAge(patient.dateOfBirth); // "25 years"

// Format for medical records
const recordDate = formatMedicalDateTime(new Date(), true); // includes timezone

// Relative time
const lastSeen = formatRelativeTime(patient.lastVisit); // "2 hours ago"
```

---

## 🏗️ STANDARD PATTERNS

### API Route Structure

```typescript
// /src/app/api/[module]/[resource]/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  successResponse,
  errorResponse,
  standardError,
} from "@/lib/utils/api-response";
import { createValidator } from "@/lib/utils/validation";
import type { YourResourceType } from "@/types";

// GET - List resources with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Fetch data
    const items = await fetchItems(page, limit);
    const total = await countItems();

    return NextResponse.json(paginatedResponse(items, page, limit, total));
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(standardError("INTERNAL_ERROR"), { status: 500 });
  }
}

// POST - Create resource
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validator = createValidator();
    const result = validator
      .required(body.name, "Name")
      .required(body.organizationId, "Organization ID")
      .getResult();

    if (!result.isValid) {
      return NextResponse.json(
        errorResponse("VALIDATION_ERROR", "Validation failed", {
          errors: result.errors,
        }),
        { status: 400 },
      );
    }

    // Create resource
    const item = await createItem(body);

    return NextResponse.json(successResponse(item), { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(standardError("INTERNAL_ERROR"), { status: 500 });
  }
}
```

### React Component Structure

```typescript
'use client';

import { useState, useEffect } from 'react';
import { formatDate, formatRelativeTime } from '@/lib/utils/date-utils';
import type { YourResourceType } from '@/types';

interface YourComponentProps {
  resourceId: string;
}

export function YourComponent({ resourceId }: YourComponentProps) {
  const [data, setData] = useState<YourResourceType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/resources/${resourceId}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error?.message || 'Failed to load data');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [resourceId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div>
      <h2>{data.name}</h2>
      <p>Created: {formatDate(data.createdAt, 'long')}</p>
      <p>Last updated: {formatRelativeTime(data.updatedAt)}</p>
    </div>
  );
}
```

### Service Layer Pattern

```typescript
// /src/lib/services/your-service.ts

import type { YourResourceType, CreateYourResourceDto } from "@/types";

export class YourResourceService {
  /**
   * Fetch resource by ID
   */
  async getById(id: string): Promise<YourResourceType | null> {
    // Implementation
    return null;
  }

  /**
   * Create new resource
   */
  async create(data: CreateYourResourceDto): Promise<YourResourceType> {
    // Implementation
    throw new Error("Not implemented");
  }

  /**
   * Update existing resource
   */
  async update(
    id: string,
    data: Partial<YourResourceType>,
  ): Promise<YourResourceType> {
    // Implementation
    throw new Error("Not implemented");
  }

  /**
   * Delete resource
   */
  async delete(id: string): Promise<boolean> {
    // Implementation
    return false;
  }

  /**
   * List resources with pagination
   */
  async list(
    page: number,
    limit: number,
  ): Promise<{
    items: YourResourceType[];
    total: number;
  }> {
    // Implementation
    return { items: [], total: 0 };
  }
}

export const yourResourceService = new YourResourceService();
```

---

## 🔗 INTEGRATION DEPENDENCIES

### Foundation Agents (Must Complete First)

1. **Agent 9 - UI/Theme** → Provides shared UI components
2. **Agent 3 - RBAC** → Provides permission checking
3. **Agent 2 - SSO** → Provides authentication
4. **Agent 10 - Multi-Org** → Provides tenant context

### Dependent Agents (Can Work in Parallel After Foundation)

- **Agent 1 - Dashboard** → Depends on: Analytics (8), All modules
- **Agent 4 - Telehealth** → Depends on: Scheduling, Clinical
- **Agent 5 - FHIR** → Depends on: All clinical modules
- **Agent 6 - CDS** → Depends on: Pharmacy, Clinical
- **Agent 7 - Population Health** → Depends on: Clinical, Analytics
- **Agent 8 - Analytics** → Depends on: All data modules

---

## 🚨 CRITICAL COORDINATION POINTS

### Type Changes

- **DO NOT** modify base types in `/src/types/index.ts`
- **DO** extend types in your module-specific type file
- **DO** coordinate breaking changes with Coordinator (Agent 14)

### Database Schema

- **DO NOT** modify Prisma schema without coordination
- **DO** document required schema changes
- **DO** discuss with other agents if changes affect shared tables

### Shared UI Components

- **DO NOT** create duplicate components
- **DO** use components from Agent 9's UI library
- **DO** coordinate new component needs with Agent 9

### API Routes

- **DO** follow REST conventions
- **DO** use standard response formats
- **DO** validate all inputs
- **DO** handle errors gracefully
- **DO** log security-sensitive operations

---

## 📝 REPORTING PROGRESS

Update your status in SCRATCHPAD.md:

```markdown
| Agent X - Your Module | IN_PROGRESS | 15 | 2026-01-01 |
```

Status values:

- `PENDING` - Not started
- `IN_PROGRESS` - Active development
- `BLOCKED` - Waiting on dependencies
- `TESTING` - Development complete, testing
- `COMPLETED` - Fully complete

---

## 🐛 ERROR HANDLING

Always use try-catch and return proper error responses:

```typescript
try {
  // Your logic
} catch (error) {
  console.error("Descriptive error message:", error);

  // For specific errors
  if (error instanceof NotFoundError) {
    return NextResponse.json(standardError("NOT_FOUND"), { status: 404 });
  }

  // For generic errors
  return NextResponse.json(standardError("INTERNAL_ERROR"), { status: 500 });
}
```

---

## ✅ CODE QUALITY CHECKLIST

Before marking your module as complete:

- [ ] All TypeScript types are properly defined
- [ ] All imports use path aliases (`@/types`, `@/lib/utils`)
- [ ] All API routes use standardized responses
- [ ] All user inputs are validated
- [ ] All errors are handled gracefully
- [ ] Security-sensitive operations are logged
- [ ] No console.log in production code (use proper logging)
- [ ] JSDoc comments for public functions
- [ ] Follow existing code style and patterns
- [ ] Test all API endpoints
- [ ] Test all UI components
- [ ] No TypeScript errors
- [ ] No ESLint warnings

---

## 📞 NEED HELP?

- Review existing v0.1 code for patterns
- Check SCRATCHPAD.md for agent assignments
- Coordinate with Agent 14 for conflicts
- Document blockers and dependencies

---

**Agent 14 - Coordinator**
_Infrastructure ready. All agents cleared for development._ ✅
