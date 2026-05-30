# Deployment Walkthrough: Vercel + Render

Congratulations! The database changes are committed and successfully pushed to your GitHub repository at `https://github.com/prakash-2409/Confido-AI.git`. 

Follow the guide below to deploy the backend/ML services on Render and the frontend on Vercel.

---

## 🏗️ Step 1: Deploy Backend & ML Service on Render

Render will use the Blueprint file ([render.yaml](file:///c:/Users/hp/Desktop/Projects/Confido%20AI/Confido-AI/render.yaml)) in your repo to automatically configure both services.

1. Go to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** in the top right and select **Blueprint**.
3. Connect your GitHub repository **`prakash-2409/Confido-AI`**.
4. Name your Blueprint Group (e.g. `confido-ai-stack`).
5. Render will automatically detect the configuration for:
   - **`career-ai-backend`** (Node/Express backend)
   - **`career-ai-ml`** (Python/FastAPI ML service)
6. Under the environment variables section on Render, set:
   - `MONGODB_URI`: Your production MongoDB connection string (e.g. from MongoDB Atlas).
   - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`: Random 32+ character secrets.

> [!TIP]
> Once deployed, copy your backend's live URL (e.g., `https://career-ai-backend.onrender.com`) and your ML service's live URL (e.g., `https://career-ai-ml.onrender.com`). You will use these in the next steps!

---

## 🎨 Step 2: Deploy Frontend on Vercel

Vercel is optimized for Next.js and will handle the React frontend.

1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Import the **`prakash-2409/Confido-AI`** repository.
3. In the project setup configuration:
   - **Root Directory**: Select `frontend` (crucial!).
   - **Framework Preset**: Next.js.
4. Expand **Environment Variables** and add:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend-url.onrender.com/api/v1` (use your actual Render backend URL).
5. Click **Deploy**.

---

## 🔗 Step 3: Link Backend to Frontend & ML Service

Now update your Render backend environment variables to accept requests from your Vercel frontend:
1. Go to `career-ai-backend` on Render.
2. Under **Environment**, update or add:
   - `CORS_ORIGIN`: `https://your-vercel-domain.vercel.app`
   - `FRONTEND_URL`: `https://your-vercel-domain.vercel.app`
   - `ML_SERVICE_URL`: `https://career-ai-ml.onrender.com`
3. Click save. Render will automatically redeploy with the correct origins allowed!
