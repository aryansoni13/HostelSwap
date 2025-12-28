#!/bin/bash
# Exit on error
set -o errexit

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (ensure dev deps are installed for build)
cd ../frontend
# NODE_ENV=production skips devDeps by default. We need them for building.
npm install --include=dev

# Ensure binaries are executable (fixes potential 'Permission denied')
chmod +x node_modules/.bin/vite || true

npm run build

# Return to root
cd ..
