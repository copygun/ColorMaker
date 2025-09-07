#!/bin/bash
# Initial setup script for development environment

set -e

echo "🚀 원라벨 컬러메이커 개발 환경 설정"
echo "=================================="

# Check Node.js version
echo "📌 Checking Node.js version..."
node_version=$(node -v)
echo "   Node.js version: $node_version"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci || npm install

# Setup git hooks (optional)
echo "🔗 Setting up git hooks..."
if [ -f .husky/pre-commit ]; then
    echo "   Husky already configured"
else
    echo "   Skipping husky setup (not configured)"
fi

# Run initial validation
echo "✅ Running initial validation..."
npm run typecheck
npm run lint
npm run format:check

# Build project
echo "🏗️ Building project..."
npm run build

echo ""
echo "✨ Setup complete!"
echo ""
echo "Available commands:"
echo "  npm run dev        - Start development server"
echo "  npm run build      - Build for production"
echo "  npm run test       - Run tests"
echo "  npm run validate   - Run all checks"
echo ""
echo "Or use Makefile:"
echo "  make dev           - Start development"
echo "  make validate      - Run all checks"
echo "  make commit        - Interactive commit"