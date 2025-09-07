# 원라벨 컬러메이커 Makefile
# Cross-platform development tasks

.PHONY: help install dev build test lint format validate clean setup commit

# Default target
help:
	@echo "Available commands:"
	@echo "  make install   - Install dependencies"
	@echo "  make dev       - Start development server"
	@echo "  make build     - Build production bundle"
	@echo "  make test      - Run tests"
	@echo "  make lint      - Run linting"
	@echo "  make format    - Format code"
	@echo "  make validate  - Run all checks"
	@echo "  make clean     - Clean build artifacts"
	@echo "  make setup     - Initial project setup"
	@echo "  make commit    - Interactive commit helper"

# Install dependencies
install:
	npm ci

# Development server
dev:
	npm run dev

# Production build
build:
	npm run build

# Run tests
test:
	npm run test

# Run linting
lint:
	npm run lint

# Format code
format:
	npm run format

# Run all validation checks
validate:
	npm run typecheck
	npm run lint
	npm run format:check
	npm run test

# Clean build artifacts
clean:
	rm -rf dist/
	rm -rf node_modules/
	rm -rf coverage/
	rm -rf .cache/
	rm -f *.log

# Initial setup
setup:
	npm install
	npm run validate
	@echo "✅ Setup complete! Run 'make dev' to start development."

# Interactive commit helper
commit:
	@echo "Select commit type:"
	@echo "1) feat     - New feature"
	@echo "2) fix      - Bug fix"
	@echo "3) docs     - Documentation"
	@echo "4) refactor - Code refactoring"
	@echo "5) test     - Tests"
	@echo "6) chore    - Maintenance"
	@read -p "Enter choice (1-6): " choice; \
	read -p "Enter scope (optional): " scope; \
	read -p "Enter commit message: " msg; \
	if [ -n "$$scope" ]; then \
		git commit -m "$$(case $$choice in \
			1) echo "feat($$scope): $$msg";; \
			2) echo "fix($$scope): $$msg";; \
			3) echo "docs($$scope): $$msg";; \
			4) echo "refactor($$scope): $$msg";; \
			5) echo "test($$scope): $$msg";; \
			6) echo "chore($$scope): $$msg";; \
		esac)"; \
	else \
		git commit -m "$$(case $$choice in \
			1) echo "feat: $$msg";; \
			2) echo "fix: $$msg";; \
			3) echo "docs: $$msg";; \
			4) echo "refactor: $$msg";; \
			5) echo "test: $$msg";; \
			6) echo "chore: $$msg";; \
		esac)"; \
	fi