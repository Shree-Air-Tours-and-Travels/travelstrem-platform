Step 1: Prerequisites
Before touching Vercel, ensure:
1. Backend API is live on Render at https://travelstrem-api.onrender.com (or your custom domain)
2. Render FRONTENDS env var includes the Vercel URL you'll create (e.g. https://trevio.vercel.app)
3. GitHub repo is pushed and accessible from Vercel
Step 2: Create Vercel Project for Trevio
1. Go to vercel.com/new (https://vercel.com/new)
2. Import your GitHub repo (travelstrem-platform)
3. Configure these settings:
Setting
Project Name
Framework Preset
Root Directory
Install Command
Build Command
Output Directory
Step 3: Set Trevio Vercel Environment Variables
In Vercel Dashboard → Trevio Project → Settings → Environment Variables, add these for Production:
REACT_APP_PORTAL_ENV=production
REACT_APP_BACKEND_URL=https://travelstrem-api.onrender.com
REACT_APP_API_URL=https://travelstrem-api.onrender.com/api
REACT_APP_AUTH_APP_URL=https://auth.travelstrem.com
REACT_APP_SUPPORT_PHONE=+919057635580
REACT_APP_WHATSAPP_GROUP_URL=https://chat.whatsapp.com/travelstrem
REACT_APP_WHATSAPP_PHONE=919057635580
REACT_APP_DEFAULT_TOUR_IMAGE=https://res.cloudinary.com/dofxshf3z/image/upload/v1779131576/tour-img01_tljj0m.jpg
REACT_APP_SUPPORT_EMAIL=support@travelstrem.com
Replace https://travelstrem-api.onrender.com with your actual Render backend URL if different.
Step 4: Deploy
Click Deploy in Vercel. First deploy will take ~2-3 minutes (pnpm install + CRA build).
After deploy, you'll get a URL like https://trevio-xxxxx.vercel.app.
Step 5: Update Render Backend
In Render Dashboard → your backend service → Environment → add/update:
FRONTENDS=https://trevio.vercel.app,https://trevista.vercel.app,https://dashboard.vercel.app,https://auth.vercel.app
AUTH_COOKIE_DOMAIN=.vercel.app
If using custom domains later, update these to https://trevio.travelstrem.com etc.
Step 6: Add Custom Domain (Optional)
1. Vercel → Trevio Project → Settings → Domains
2. Add trevio.travelstrem.com
3. Add DNS records at your domain registrar:
Type	Name
CNAME	trevio
4. After DNS propagates, Vercel auto-provisions SSL
Step 7: Verify
1. Open https://trevio.vercel.app (or your custom domain)
2. Trip listings should load (API calls go to Render backend)
3. Check browser console for CORS errors — if blocked, update Render FRONTENDS
Quick Reference: All Vercel Settings for Trevio
Project Name:    trevio
Framework:       Create React App
Root Directory:  /
Install:         pnpm install --frozen-lockfile
Build:           pnpm --filter @apps/trevio build
Output:          apps/trevio-remote/build
Env Vars (Production):
  REACT_APP_PORTAL_ENV=production
  REACT_APP_BACKEND_URL=https://travelstrem-api.onrender.com
  REACT_APP_API_URL=https://travelstrem-api.onrender.com/api
  REACT_APP_AUTH_APP_URL=https://auth.travelstrem.com
  REACT_APP_SUPPORT_PHONE=+919057635580
  REACT_APP_WHATSAPP_GROUP_URL=https://chat.whatsapp.com/travelstrem
  REACT_APP_WHATSAPP_PHONE=919057635580
  REACT_APP_DEFAULT_TOUR_IMAGE=https://res.cloudinary.com/dofxshf3z/image/upload/v1779131576/tour-img01_tljj0m.jpg
  REACT_APP_SUPPORT_EMAIL=support@travelstrem.com