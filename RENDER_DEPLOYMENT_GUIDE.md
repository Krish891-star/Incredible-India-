# Deploying to Render

This guide will walk you through deploying your PWA application to Render.

## Prerequisites

1. A GitHub repository with your code (push the changes from this branch)
2. A Render account (sign up at [https://render.com](https://render.com))

## Steps to Deploy

### 1. Push Your Code
First, ensure all changes are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 2. Connect to Render
1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click "New +" and select "Web Service"
3. Connect your GitHub account if prompted

### 3. Select Your Repository
1. Choose your repository from the list
2. Select the branch you want to deploy (usually `main`)

### 4. Configure the Web Service
- **Environment**: Select "Docker" (since we have a Dockerfile)
- **Region**: Select your preferred region (e.g., Oregon, Frankfurt)
- **Plan**: Choose Free, Starter, or Pro (Free plan is sufficient for basic usage)

### 5. Set Environment Variables
Add the following environment variables in the Render dashboard:

#### Required Variables:
- `VITE_SUPABASE_PROJECT_ID`: Your Supabase project ID
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
- `VITE_SUPABASE_URL`: Your Supabase URL (e.g., https://xyz.supabase.co)
- `VITE_SUPER_ADMIN_EMAIL`: Your admin email

#### Optional Variables:
- `SENDGRID_API_KEY`: SendGrid API key (for email functionality)
- `SENDGRID_FROM_ADDRESS`: SendGrid sender email address

### 6. Review and Create
- **Name**: Render will auto-generate a name, or you can customize it
- **Branch**: Confirm the correct branch is selected
- Click "Create Web Service"

### 7. Monitor Deployment
- Render will automatically build and deploy your application
- You can monitor the build logs in the Render dashboard
- Once complete, your application will be available at the provided URL

## Important Notes

1. **Build Process**: The Dockerfile will automatically run `npm run build` and serve the static files using `serve`

2. **PWA Features**: Your PWA functionality will work out of the box with proper caching and offline support

3. **Supabase Integration**: Ensure your Supabase project allows requests from your Render URL domain

4. **Custom Domain**: You can add a custom domain later in the Render dashboard

## Troubleshooting

### If deployment fails:
1. Check the build logs in the Render dashboard
2. Ensure all required environment variables are set
3. Verify that your Supabase configuration allows requests from the Render domain

### If PWA features don't work:
1. Verify that your manifest.json is properly generated (check `/manifest.webmanifest` endpoint)
2. Ensure service worker is registered (check browser dev tools -> Application tab)

## Scaling

- Free tier: 750 hours/month, 1GB RAM, 1 web service
- Starter tier: $7/month, 1GB RAM, 1 web service  
- Pro tier: $14/month, 3GB RAM, multiple web services

## Security

- Never commit actual API keys to your repository
- Use Render's environment variable system for sensitive data
- Regularly rotate your API keys