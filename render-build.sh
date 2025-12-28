#!/bin/bash
# Exit on error
set -o errexit

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies and build
cd ../frontend
npm install
npm run build

# Return to root
cd ..
