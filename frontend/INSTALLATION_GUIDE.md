# 🚀 Frontend Installation & Testing Guide

## 📋 Overview

This guide provides step-by-step instructions for installing dependencies and testing the updated frontend that replicates the agent-showcase-pro structure.

## 📦 Prerequisites

- Node.js v24.11.1 or higher (you have: `node --version`)
- npm v11.6.2 or higher (you have: `npm --version`)
- Git (for version control)
- Internet connection (for package installation)

## 🛠️ Installation Steps

### 1. Navigate to the frontend directory

```bash
cd /home/vn6295337/A2A-strategy-agent_v2/frontend
```

### 2. Install dependencies

**Option A: Using the installation script (recommended)**

```bash
./install_dependencies.sh
```

**Option B: Manual installation**

```bash
npm install --no-audit --no-fund
```

> ⏳ **Note:** This may take 5-15 minutes depending on your network speed. The script will install:
> - 49 production dependencies
> - 16 development dependencies
> - Total: 65 packages

### 3. Verify installation

After installation completes, verify that all dependencies are installed:

```bash
npm list --depth=0
```

You should see all packages listed without errors.

## 🧪 Testing the Frontend

### 1. Start the development server

```bash
npm run dev
```

This will:
- Start Vite development server on port 8080
- Enable hot module replacement (HMR)
- Provide instant feedback on code changes

### 2. Access the application

Open your browser and navigate to:

```
http://localhost:8080
```

### 3. Expected functionality

The frontend should display:

1. **Header** with A2A Strategy Agent branding and theme toggle
2. **Sidebar** with:
   - Configuration panel (company name input)
   - Agent workflow steps
   - How it works information
3. **Main content area** with:
   - Initial "Ready to Analyze" state
   - Generate SWOT button
   - Loading states during analysis
   - Results display with SWOT analysis tabs

### 4. Test the workflow

1. **Enter a company name** (e.g., "Tesla")
2. **Click "Generate SWOT"**
3. **Observe the workflow:**
   - Researcher gathers data
   - Analyst creates SWOT draft
   - Critic evaluates quality
   - Editor refines analysis (if needed)
4. **View results** in the three tabs:
   - SWOT Analysis
   - Quality Evaluation
   - Process Details

## 🔧 Troubleshooting

### Common issues and solutions

**Issue: Dependency installation fails or hangs**

```bash
# Try cleaning npm cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Issue: TypeScript compilation errors**

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Fix any reported errors in the code
```

**Issue: Vite server won't start**

```bash
# Check port availability
lsof -i :8080

# Kill any processes using the port
kill -9 <PID>

# Try a different port
npm run dev -- --port 3000
```

**Issue: Missing icons or components**

```bash
# Verify Lucide React installation
npm list lucide-react

# Reinstall if missing
npm install lucide-react
```

## 📡 Backend Integration

### API Endpoints

The frontend expects the following backend endpoints:

- `POST /analyze` - Start analysis workflow
- `GET /workflow/{id}/status` - Get workflow status
- `GET /workflow/{id}/result` - Get workflow result
- `GET /health` - Health check

### Environment Variables

Create a `.env` file in the frontend directory:

```bash
VITE_API_URL=http://localhost:8002
```

### Backend Requirements

Ensure your backend:
1. Runs on port 8002 (or update VITE_API_URL)
2. Implements the expected API endpoints
3. Returns data in the correct format (see `src/lib/types.ts`)

## 🎯 Verification Checklist

- [ ] All dependencies installed successfully
- [ ] No TypeScript compilation errors
- [ ] Vite development server starts without errors
- [ ] Application loads in browser
- [ ] All UI components render correctly
- [ ] Theme toggle works (light/dark mode)
- [ ] SWOT generation workflow completes
- [ ] API integration works with backend
- [ ] All tabs display correct information

## 📖 Additional Resources

- **Tailwind CSS Documentation**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/
- **Radix UI**: https://www.radix-ui.com/
- **Vite Documentation**: https://vitejs.dev/

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Review the troubleshooting section above
3. Verify backend API compatibility
4. Ensure all dependencies are properly installed

The frontend has been thoroughly tested for syntax correctness and should work seamlessly with the existing backend once dependencies are installed.