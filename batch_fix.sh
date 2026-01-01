#!/bin/bash

# List of files to fix
FILES=(
  "/home/user/lithic/src/app/(dashboard)/clinical/cds-rules/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/enterprise/data-sharing/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/enterprise/departments/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/enterprise/facilities/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/enterprise/licenses/page.tsx"
)

for file in "${FILES[@]}"; do
  echo "Processing: $file"
  
  # Add useCallback to imports if missing
  if grep -q "import { useState, useEffect }" "$file"; then
    sed -i 's/import { useState, useEffect }/import { useState, useEffect, useCallback }/g' "$file"
  elif grep -q "import { useEffect, useState }" "$file"; then
    sed -i 's/import { useEffect, useState }/import { useEffect, useState, useCallback }/g' "$file"
  fi
  
  echo "  ✓ Updated imports"
done

echo "Done updating imports for batch 1!"
