#!/bin/bash

fix_single_pattern() {
    local file="$1"
    echo "Fixing: $file"
    
    # Create a temporary Python script for this specific file
    python3 << 'EOFPYTHON'
import sys
import re

file_path = sys.argv[1]

with open(file_path, 'r') as f:
    content = f.read()

original = content

# Pattern 1: Move function before useEffect and wrap in useCallback
# Matches: useEffect(() => { funcName(); }, [deps]); \n\n const funcName = async () => { ... };
pattern1 = r'(  useEffect\(\(\) => \{\n    )(\w+)\(\);\n  \}, \[([^\]]*)\]\);(\n\n  const \2 = )'
def replacement1(match):
    func_name = match.group(2)
    deps = match.group(3)
    if deps:
        new_deps = f', {deps}' if deps else ''
        return f'  const {func_name} = useCallback('
    return match.group(0)

# Try simpler targeted replacement
lines = content.split('\n')
output_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Check if this is a useEffect line
    if '  useEffect(() => {' in line and i + 2 < len(lines):
        # Get next few lines
        next_line = lines[i + 1]
        close_line = lines[i + 2]
        
        # Pattern: useEffect(() => { funcName(); }, [deps]);
        func_match = re.match(r'\s+(\w+)\(\);', next_line)
        deps_match = re.match(r'\s+\}, \[([^\]]*)\]\);', close_line)
        
        if func_match and deps_match:
            func_name = func_match.group(1)
            deps = deps_match.group(1)
            
            # Look ahead for the function definition
            found_func = False
            for j in range(i + 3, min(i + 10, len(lines))):
                if f'  const {func_name} = ' in lines[j] or f'  const {func_name}=' in lines[j]:
                    # Found the function - need to wrap it in useCallback
                    # For now, just mark it
                    found_func = True
                    break
            
            if found_func:
                # Output the function wrapped in useCallback first (we'll do this manually for now)
                output_lines.append(line)
                i += 1
                continue
    
    output_lines.append(line)
    i += 1

# For now, just make sure import is correct
if 'useCallback' not in content and ('useEffect' in content or 'useState' in content):
    content = re.sub(
        r'import \{ (useEffect, useState|useState, useEffect) \}',
        r'import { \1, useCallback }',
        content
    )

# Write back only if changed
if content != original:
    with open(file_path, 'w') as f:
        f.write(content)
    print(f"  ✓ Updated {file_path}")
else:
    print(f"  - No changes needed for {file_path}")

EOFPYTHON "$file"
}

# Process all remaining files
FILES_TO_FIX=(
  "/home/user/lithic/src/app/(dashboard)/imaging/orders/[id]/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/imaging/reports/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/imaging/studies/[id]/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/imaging/viewer/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/patients/[id]/contacts/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/patients/[id]/demographics/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/patients/[id]/documents/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/patients/[id]/history/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/patients/[id]/insurance/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/patients/[id]/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/pharmacy/controlled/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/pharmacy/dispensing/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/pharmacy/inventory/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/pharmacy/prescriptions/[id]/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/pharmacy/prescriptions/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/pharmacy/refills/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/scheduling/appointments/[id]/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/scheduling/appointments/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/scheduling/waitlist/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/telehealth/page.tsx"
  "/home/user/lithic/src/app/(dashboard)/telehealth/room/[id]/page.tsx"
)

for file in "${FILES_TO_FIX[@]}"; do
    # Just add useCallback import for now
    if [ -f "$file" ]; then
        sed -i 's/import { useState, useEffect }/import { useState, useEffect, useCallback }/g' "$file"
        sed -i 's/import { useEffect, useState }/import { useEffect, useState, useCallback }/g' "$file"
    fi
done

echo "✓ Added useCallback imports to all remaining page files"

