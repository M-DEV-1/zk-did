# Makefile for cleaning up a Next.js app

# Default target
.PHONY: help
help:
	@echo "Makefile commands:"
	@echo "  clean           - Remove .next and cache folders"
	@echo "  deep-clean      - Remove node_modules and lock files"
	@echo "  install         - Run package manager install"
	@echo "  reset           - Deep clean and reinstall dependencies"

# Remove Next.js build and cache folders
.PHONY: clean
clean:
	rm -rf .next .turbo .vercel

# Deep clean: also removes node_modules and lock files
.PHONY: deep-clean
deep-clean: clean
	rm -rf node_modules package-lock.json yarn.lock pnpm-lock.yaml

# Install dependencies
.PHONY: install
install:
	npm install --verbose

# Full reset: deep clean + reinstall
.PHONY: reset
reset: deep-clean install
