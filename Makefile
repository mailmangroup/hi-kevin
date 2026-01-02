.PHONY: help install dev build start lint clean

# Default target
help:
	@echo "Kevin - AI Marketing Co-pilot"
	@echo ""
	@echo "Available commands:"
	@echo "  make install    - Install all dependencies"
	@echo "  make dev        - Run development server"
	@echo "  make build      - Build for production"
	@echo "  make start      - Start production server"
	@echo "  make lint       - Run ESLint"
	@echo "  make clean      - Remove build artifacts and dependencies"
	@echo ""

# Install dependencies
install:
	npm install

# Run development server
dev:
	@echo "Checking for process on port 3000..."
	@-lsof -t -i:3000 | xargs kill -9 2>/dev/null || true
	npm run dev

# Build for production
build:
	npm run build

# Start production server (requires build first)
start:
	npm run start

# Run linter
lint:
	npm run lint

# Clean build artifacts and node_modules
clean:
	rm -rf .next
	rm -rf node_modules
	rm -rf out
