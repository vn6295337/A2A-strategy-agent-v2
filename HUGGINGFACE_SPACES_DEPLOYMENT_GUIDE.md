# 🚀 Hugging Face Spaces Deployment Guide

## 🎯 Quick Start

### 1. Create a New Space

1. Go to [Hugging Face Spaces](https://huggingface.co/spaces)
2. Click **"Create new Space"**
3. Select **"Static"** as the space type
4. Choose **"Public"** or **"Private"** visibility
5. Click **"Create"**

### 2. Connect Your Repository

1. In your new space, go to **"Settings"** tab
2. Under **"Repository"**, connect to this GitHub repository:
   ```
   https://github.com/vn6295337/A2A-strategy-agent
   ```
3. Enable **"Auto-deploy from GitHub"**

### 3. Configure Environment Variables

1. Go to **"Settings"** → **"Variables and secrets"**
2. Add the following environment variables:
   ```
   DEPLOYMENT_MODE=hf_spaces
   PORT=8000
   ```

### 4. Set Up Startup Command

1. Go to **"Settings"** → **"Advanced settings and resources"**
2. Set the **"Startup command"** to:
   ```bash
   python scripts/unified_api.py
   ```

### 5. Configure Hardware

1. Go to **"Settings"** → **"Advanced settings and resources"**
2. Select **"CPU (basic)"** hardware
3. Set **"Sleep after"** to **"30 minutes"** (or your preference)

### 6. Deploy!

1. Click **"Save"** to apply all settings
2. Wait for the space to build (usually < 2 minutes)
3. Your A2A Strategy Agent will be live!

## 🔧 Configuration Details

### Required Files

The following files are essential for HF Spaces deployment:

- `requirements/huggingface.txt` - Optimized dependencies
- `scripts/unified_api.py` - Main API server
- `.env.example` - Environment variable template
- `README.md` - Documentation

### API Endpoints

Your deployed space will expose these endpoints:

- `GET /` - API information
- `GET /health` - Health check
- `POST /analyze` - Start analysis workflow
- `GET /workflow/{id}/status` - Get workflow status
- `GET /workflow/{id}/result` - Get workflow result

### Example API Usage

```bash
# Start analysis
curl -X POST https://your-space-name.hf.space/analyze \
  -H "Content-Type: application/json" \
  -d '{"name":"Tesla"}'

# Check status
curl https://your-space-name.hf.space/workflow/tesla_abc123/status

# Get result
curl https://your-space-name.hf.space/workflow/tesla_abc123/result
```

## 🛠️ Customization Options

### 1. Add Real API Integration

To enable real SWOT analysis (instead of mock data):

1. Add these secrets in HF Spaces settings:
   ```
   GROQ_API_KEY=your_groq_api_key
   TAVILY_API_KEY=your_tavily_api_key
   LANGCHAIN_API_KEY=your_langchain_api_key
   ```

2. Modify `scripts/unified_api.py` to use full-featured mode

### 2. Frontend Integration

To add the React frontend to your space:

1. Build the frontend:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. Copy the `dist/` folder to your space
3. Configure the space to serve static files

### 3. Performance Tuning

For better performance in HF Spaces:

- **Enable caching:** Add caching headers for static assets
- **Compression:** Enable gzip compression
- **Rate limiting:** Add rate limiting to prevent abuse

## 📊 Monitoring

### Health Check

```bash
curl https://your-space-name.hf.space/health
```

Expected response:
```json
{"status":"healthy","mode":"hf_spaces"}
```

### Logs

View logs in your HF Spaces dashboard under **"Logs"** tab to:
- Monitor API requests
- Debug issues
- Check performance

## 🔄 Updating Your Space

### Automatic Updates

With **"Auto-deploy from GitHub"** enabled:
- Push changes to your GitHub repository
- HF Spaces automatically rebuilds and redeploys
- No manual intervention needed

### Manual Updates

1. Go to your space settings
2. Click **"Rebuild"**
3. Wait for deployment to complete

## 🚨 Troubleshooting

### Common Issues

#### 1. Space won't start
- **Check:** Ensure `DEPLOYMENT_MODE=hf_spaces` is set
- **Fix:** Add the environment variable in settings

#### 2. API returns 500 errors
- **Check:** View logs for error details
- **Fix:** Ensure all dependencies are installed

#### 3. Slow response times
- **Check:** Monitor CPU/memory usage
- **Fix:** Upgrade to better hardware if needed

#### 4. CORS errors
- **Check:** Ensure CORS middleware is enabled
- **Fix:** Verify `allow_origins=["*"]` in API code

### Debugging Commands

```bash
# Check if API is running
curl https://your-space-name.hf.space/health

# Test analysis workflow
curl -X POST https://your-space-name.hf.space/analyze \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Company"}'

# View detailed logs
# (Available in HF Spaces dashboard)
```

## 🎓 Best Practices

### 1. Security
- Keep API keys in HF Spaces secrets
- Never commit secrets to GitHub
- Use HTTPS for all endpoints

### 2. Performance
- Enable compression for API responses
- Implement caching where possible
- Monitor resource usage

### 3. Reliability
- Add proper error handling
- Implement retry logic for failed requests
- Monitor uptime and set alerts

### 4. User Experience
- Add clear documentation
- Provide example API calls
- Include error messages in responses

## 📚 Resources

- [Hugging Face Spaces Documentation](https://huggingface.co/docs/hub/spaces)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [A2A Strategy Agent GitHub](https://github.com/vn6295337/A2A-strategy-agent)

## 🎉 Success!

Your A2A Strategy Agent is now deployed on Hugging Face Spaces! 🎊

**Next steps:**
1. Share your space URL with users
2. Monitor performance and usage
3. Collect feedback for improvements
4. Consider adding real API integrations

**Need help?** Check the [GitHub issues](https://github.com/vn6295337/A2A-strategy-agent/issues) or create a new one!
