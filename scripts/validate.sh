#!/bin/bash
# Validation script for CI/CD

set -e

echo "🔍 Starting validation..."

# TypeScript check
echo "📝 Checking TypeScript..."
npm run typecheck

# ESLint
echo "🔍 Running ESLint..."
npm run lint

# Prettier
echo "🎨 Checking code format..."
npm run format:check

# Tests
echo "🧪 Running tests..."
npm run test

# Build
echo "🏗️ Building project..."
npm run build

echo "✅ All validations passed!"