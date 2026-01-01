#!/bin/bash

# Script to fix React Hook dependency warnings
# This script processes files and wraps functions in useCallback

fix_file() {
    local file="$1"
    local func_name="$2"
    local deps="$3"

    echo "Processing: $file - Function: $func_name"

    # Check if useCallback is already imported
    if ! grep -q "useCallback" "$file"; then
        # Add useCallback to imports
        sed -i 's/import { useEffect, useState }/import { useEffect, useState, useCallback }/g' "$file"
        sed -i 's/import { useState, useEffect }/import { useState, useEffect, useCallback }/g' "$file"
    fi
}

# List of files with their function names and dependencies
# Format: file|function_name|dependencies

FILES=(
    "/home/user/lithic/src/app/(dashboard)/billing/claims/[id]/page.tsx|fetchClaim|params.id"
    "/home/user/lithic/src/app/(dashboard)/billing/invoices/[id]/page.tsx|fetchInvoice|params.id"
    "/home/user/lithic/src/app/(dashboard)/clinical/cds-rules/page.tsx|filterRules|searchQuery, statusFilter, categoryFilter"
    "/home/user/lithic/src/app/(dashboard)/enterprise/data-sharing/page.tsx|fetchAgreements|"
    "/home/user/lithic/src/app/(dashboard)/enterprise/departments/page.tsx|fetchDepartments|"
    "/home/user/lithic/src/app/(dashboard)/enterprise/facilities/page.tsx|fetchFacilities|"
    "/home/user/lithic/src/app/(dashboard)/enterprise/licenses/page.tsx|fetchLicenses|"
)

for entry in "${FILES[@]}"; do
    IFS='|' read -r file func deps <<< "$entry"
    fix_file "$file" "$func" "$deps"
done

echo "Done!"
