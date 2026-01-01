#!/usr/bin/env python3
import re
import sys

def fix_react_hook_dependencies(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original_content = content

    # Step 1: Add useCallback to imports if missing
    if 'useCallback' not in content:
        # Pattern 1: import { useEffect, useState } from "react";
        content = re.sub(
            r'(import\s+\{\s*useEffect,\s*useState\s*\})',
            r'\1, useCallback}',
            content
        )
        content = re.sub(
            r'(import\s+\{\s*useState,\s*useEffect\s*\})',
            r'\1, useCallback}',
            content
        )

    # Step 2: Find and wrap functions that are called in useEffect
    # Pattern: const functionName = async () => { ... };
    # followed by useEffect(() => { functionName(); }, [deps]);

    # This is complex, so let's do a simpler pattern match for common cases
    patterns = [
        (r'(  useEffect\(\(\) => \{\n    )(\w+)\(\);(\n  \}, \[)([^\]]+)(\]\);)\n\n(  const \2 = async \(\) => \{)',
         r'\6 = useCallback(async () => {'),

        # Move useEffect after function and wrap function
        (r'(  const )(\w+)( = async \(\) => \{[^}]+\}[^}]+\};)\n\n  useEffect\(\(\) => \{\n    \2\(\);\n  \}, \[([^\]]+)\]\);',
         r'\1\2 = useCallback(async () => {\n    // function body\n  }, [\4]);\n\n  useEffect(() => {\n    \2();\n  }, [\2]);'),
    ]

    # Actually, let's use a more manual approach for safety
    # Just output which files need fixing
    print(f"File: {filepath}")

    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  ✓ Fixed imports")
    else:
        print(f"  - No import changes needed")

    return content != original_content

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: fix_react_hooks.py <file>")
        sys.exit(1)

    filepath = sys.argv[1]
    fixed = fix_react_hook_dependencies(filepath)
    sys.exit(0 if fixed else 1)
