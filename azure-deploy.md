# Azure Deployment Guide

## Architecture

| Component | Azure Service |
|---|---|
| Backend API | Azure App Service (Linux, .NET 8) |
| Frontend | Azure Static Web Apps |
| Database | SQLite (stored in `/home/documentai.db` — App Service persistent storage) |
| File Uploads | `/home/uploads/documents/` (App Service persistent storage) |

---

## Prerequisites

- Azure account with active subscription
- [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli) installed
- GitHub repository with this code
- OpenAI API key

---

## Step 1 — Create Azure Resources

```bash
# Login
az login

# Set variables
RESOURCE_GROUP="rg-docai"
LOCATION="eastus"
APP_SERVICE_PLAN="plan-docai"
BACKEND_APP="docai-api-$(date +%s)"   # must be globally unique
STATIC_APP="docai-frontend"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create App Service Plan (Linux, B1)
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

# Create Web App for backend
az webapp create \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "DOTNETCORE:8.0"
```

---

## Step 2 — Configure Backend App Settings

```bash
# Set OpenAI API key
az webapp config appsettings set \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings \
    OPENAI_API_KEY="sk-your-key-here" \
    ASPNETCORE_ENVIRONMENT="Production"

# Enable persistent storage for SQLite and uploads
az webapp config appsettings set \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --settings WEBSITES_ENABLE_APP_SERVICE_STORAGE=true
```

---

## Step 3 — Deploy Backend

### Option A: Deploy from GitHub Actions (recommended)

Create `.github/workflows/backend.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'

      - name: Build and publish
        run: |
          cd backend/DocumentIntelligenceAPI
          dotnet publish -c Release -o publish

      - name: Deploy to Azure
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ secrets.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_PUBLISH_PROFILE }}
          package: backend/DocumentIntelligenceAPI/publish
```

Add these secrets to your GitHub repo:
- `AZURE_WEBAPP_NAME` — your app name (e.g., `docai-api-123456`)
- `AZURE_PUBLISH_PROFILE` — download from Azure Portal → App Service → Get publish profile

### Option B: Deploy manually with Azure CLI

```bash
cd backend/DocumentIntelligenceAPI
dotnet publish -c Release -o publish

# Zip and deploy
cd publish
zip -r ../app.zip .
cd ..

az webapp deploy \
  --name $BACKEND_APP \
  --resource-group $RESOURCE_GROUP \
  --src-path app.zip \
  --type zip
```

---

## Step 4 — Deploy Frontend (Azure Static Web Apps)

### Option A: GitHub Actions (recommended)

```bash
# Create Static Web App (connects to GitHub automatically)
az staticwebapp create \
  --name $STATIC_APP \
  --resource-group $RESOURCE_GROUP \
  --source https://github.com/YOUR_ORG/YOUR_REPO \
  --location "eastus2" \
  --branch main \
  --app-location "frontend" \
  --output-location "dist" \
  --login-with-github
```

Set the API URL in Static Web App application settings:
```bash
az staticwebapp appsettings set \
  --name $STATIC_APP \
  --resource-group $RESOURCE_GROUP \
  --setting-names VITE_API_URL="https://$BACKEND_APP.azurewebsites.net"
```

Add a `staticwebapp.config.json` to the frontend root:
```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/api/*"]
  },
  "globalHeaders": {
    "Cache-Control": "no-store"
  }
}
```

### Option B: Manual deploy

```bash
cd frontend

# Set production API URL
echo "VITE_API_URL=https://$BACKEND_APP.azurewebsites.net" > .env.production

npm run build

# Install Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Deploy
swa deploy ./dist \
  --deployment-token $(az staticwebapp secrets list --name $STATIC_APP --resource-group $RESOURCE_GROUP --query properties.apiKey -o tsv)
```

---

## Step 5 — Configure CORS on Backend

After deploying, update CORS to allow the Static Web App URL:

In `backend/DocumentIntelligenceAPI/Program.cs`, the CORS policy already allows any origin. For production, restrict it:

```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("https://your-static-app.azurestaticapps.net")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

Or set via environment variable and update dynamically.

---

## Database Notes

SQLite is stored at `/home/documentai.db` in production. This uses Azure App Service's persistent storage (mounted at `/home`).

**Important:** The App Service restarts won't lose data because `/home` is persisted. However, if you scale to multiple instances, SQLite will not be shared between instances. For multi-instance production, migrate to Azure SQL Database.

---

## File Uploads in Production

Files are stored at `/home/uploads/documents/`. These persist across restarts via App Service storage.

Ensure your App Service has sufficient storage (B1 plan includes 10 GB).

---

## Environment Variables Summary

### Backend (App Service)
| Name | Value |
|---|---|
| `OPENAI_API_KEY` | `sk-...` |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `WEBSITES_ENABLE_APP_SERVICE_STORAGE` | `true` |

### Frontend (Static Web Apps)
| Name | Value |
|---|---|
| `VITE_API_URL` | `https://<your-backend>.azurewebsites.net` |

---

## Estimated Monthly Cost (B1 plan)

| Service | Cost |
|---|---|
| App Service (B1, Linux) | ~$13/month |
| Static Web Apps (Free tier) | $0 |
| OpenAI API | Pay-per-use |
| **Total (excl. OpenAI)** | **~$13/month** |

---

## Health Check

After deployment, verify:

```bash
# Backend health
curl https://$BACKEND_APP.azurewebsites.net/swagger

# Test login
curl -X POST https://$BACKEND_APP.azurewebsites.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```
