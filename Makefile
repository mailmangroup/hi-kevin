.PHONY: help install dev build lint clean

# Default target
help:
	@echo "Kevin - AI Marketing Co-pilot"
	@echo ""
	@echo "Available commands:"
	@echo "  make install    - Install all dependencies"
	@echo "  make dev        - Run development server"
	@echo "  make build      - Build for production"
	@echo "  make lint       - Run ESLint"
	@echo "  make clean      - Remove build artifacts and dependencies"
	@echo ""

# Install dependencies
install:
	npm install

# Run development server
dev:
	@echo "Checking for process on port 3000..."
	@if lsof -t -i:3000 > /dev/null 2>&1; then \
		echo "Port 3000 is in use, killing process..."; \
		lsof -t -i:3000 | xargs kill -9; \
	else \
		echo "Port 3000 is available"; \
	fi
	npm run dev

# Build for production
build:
	npm run build

# Run linter
lint:
	npm run lint

# Clean build artifacts and node_modules
clean:
	rm -rf .next
	rm -rf node_modules
	rm -rf out
