# Public Deployment Guide — Disaster-Resistant Emergency Communication Network

This guide details how to obtain a **publicly accessible HTTPS link** for your project.

The code is already pushed to GitHub at:
**[https://github.com/sara-choudhary/disaster_management_v2](https://github.com/sara-choudhary/disaster_management_v2)**

---

## Method 1: Render.com (Recommended — 100% Free & Permanent HTTPS Link)

Render allows you to deploy the entire application (both frontend and backend together) on a single free service with a permanent URL like `https://disaster-emergency-network.onrender.com`.

### Steps:
1. Go to [https://render.com](https://render.com) and click **Get Started for Free** (Sign in with your GitHub account).
2. Click the blue **New +** button in the top right, then select **Web Service**.
3. Choose **Build and deploy from a Git repository**, then select your repository: **`sara-choudhary/disaster_management_v2`**.
4. Configure the service settings:
   - **Name:** `disaster-emergency-network` (or any name you prefer)
   - **Region:** Any (e.g., Singapore or Oregon)
   - **Branch:** `main`
   - **Root Directory:** *(leave blank)*
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r backend/requirements.txt && cd frontend && npm install && npm run build
     ```
   - **Start Command:**
     ```bash
     cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type:** `Free` ($0/month)
5. Click **Deploy Web Service**.
6. In ~2–3 minutes, Render will build and launch your application. Your public URL will appear at the top of the dashboard:
   ```
   https://disaster-emergency-network.onrender.com
   ```
   - Opening this link loads the **React Frontend**.
   - Appending `/docs` opens the **Interactive Swagger API Documentation**.

---

## Method 2: Instant Public URL from Your Terminal (Zero-Signup Local Tunnel)

If you need a public URL immediately to share with a professor or team member without waiting for a cloud build:

1. **Start the backend (which now also serves the built frontend):**
   ```bash
   cd /Users/sara/Desktop/disaster_management_v2
   PYTHONPATH=backend backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
2. **In a second terminal window, run localtunnel:**
   ```bash
   npx localtunnel --port 8000
   ```
3. Terminal will output an instant public link:
   ```
   your url is: https://bright-pandas-sing.loca.lt
   ```
   Anyone with this link can open your project directly from anywhere in the world.

---

## Method 3: Vercel (Frontend) + Render (Backend)

If you prefer hosting the React frontend on Vercel's edge network:

1. Go to [https://vercel.com](https://vercel.com) and click **Add New Project**.
2. Import `sara-choudhary/disaster_management_v2`.
3. In settings:
   - **Root Directory:** select `frontend`
   - **Framework:** `Vite`
   - **Environment Variable:** Add `VITE_API_BASE_URL` with your deployed backend URL.
4. Click **Deploy**. Vercel will assign a URL like `https://disaster-management-v2.vercel.app`.
