"""
bump_version.py

Run this script from the root of your GitHub repo before pushing changes.
It finds every ?v=X.X in every .html file and bumps the version number by 0.1.

Usage:
    python bump_version.py
"""

import os
import re

# File extensions to search
TARGET_EXTENSION = ".html"

# Regex pattern to find version strings like ?v=1.1 or ?v=1.12
VERSION_PATTERN = re.compile(r'\?v=(\d+)\.(\d+)')

def bump_version(match):
    major = int(match.group(1))
    minor = int(match.group(2))
    minor += 1
    return f"?v={major}.{minor}"

def process_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        original = f.read()

    updated = VERSION_PATTERN.sub(bump_version, original)

    if updated != original:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(updated)
        return True
    return False

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    changed_files = []

    for dirpath, dirnames, filenames in os.walk(root):
        # Skip hidden folders like .git
        dirnames[:] = [d for d in dirnames if not d.startswith(".")]

        for filename in filenames:
            if filename.endswith(TARGET_EXTENSION):
                filepath = os.path.join(dirpath, filename)
                if process_file(filepath):
                    rel = os.path.relpath(filepath, root)
                    changed_files.append(rel)

    if changed_files:
        print(f"Version bumped in {len(changed_files)} file(s):")
        for f in changed_files:
            print(f"  {f}")
    else:
        print("No version strings found. Make sure your CSS/JS links include ?v=X.X")

if __name__ == "__main__":
    main()