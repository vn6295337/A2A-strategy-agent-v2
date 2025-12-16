# Makefile for A2A Strategy Agent

# Variables
PYTHON := python3
PIP := pip3
VENV := .venv
TEST_DIR := tests
SRC_DIR := src

# Default target
.PHONY: help
help:
	@echo "A2A Strategy Agent - Makefile Commands"
	@echo ""
	@echo "Usage:"
	@echo "  make install           Install dependencies"
	@echo "  make test              Run tests"
	@echo "  make ui                Run the Streamlit UI"
	@echo "  make clean             Clean generated files"
	@echo "  make docs              Generate documentation"
	@echo "  make lint              Run code linting"
	@echo "  make format            Format code with black"
	@echo "  make help              Show this help message"

# Install dependencies
.PHONY: install
install:
	$(PIP) install -r requirements.txt

# Run tests
.PHONY: test
test:
	$(PYTHON) -m pytest $(TEST_DIR) -v

# Run the Streamlit UI
.PHONY: ui
ui:
	streamlit run app.py

# Clean generated files
.PHONY: clean
clean:
	rm -rf *.log
	rm -rf data/logs/
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete

# Lint code
.PHONY: lint
lint:
	flake8 $(SRC_DIR) $(TEST_DIR)
	pylint $(SRC_DIR) $(TEST_DIR)

# Format code
.PHONY: format
format:
	black $(SRC_DIR) $(TEST_DIR)

# Generate documentation
.PHONY: docs
docs:
	@echo "Documentation is available in the docs/ directory"

# Setup development environment
.PHONY: setup-dev
setup-dev:
	$(PYTHON) -m venv $(VENV)
	. $(VENV)/bin/activate && $(PIP) install -r requirements.txt
	@echo "Development environment setup complete. Activate with: source $(VENV)/bin/activate"

# Run with coverage
.PHONY: coverage
coverage:
	$(PYTHON) -m pytest $(TEST_DIR) --cov=$(SRC_DIR) --cov-report=html

# Run specific test
.PHONY: test-unit
test-unit:
	$(PYTHON) -m pytest $(TEST_DIR)/graph_test.py -v

.PHONY: test-integration
test-integration:
	$(PYTHON) -m pytest $(TEST_DIR)/test_mcp_comprehensive.py -v

.PHONY: test-ui
test-ui:
	$(PYTHON) -m pytest $(TEST_DIR)/test_streamlit.py -v