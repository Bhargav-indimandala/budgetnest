# Deployment Guide — 100% Free

BudgetNest deploys on three free tiers:

- **Database:** MongoDB Atlas (free M0 cluster)
- **Backend:** Render (free web service)
- **Frontend:** Vercel (free hobby plan)

Total cost: **$0**. Note: Render's free tier spins down after inactivity, so
the first request after idling can take 30–60s to wake up.

---

## 1. MongoDB Atlas (Database)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a new **free M0 cluster** (any provider/region close to you).
3. Under **Database Access**, create a database user with a username/password
   (save these — you'll need them for the connection string).
4. Under **Network Access**, click **Add IP Address** → **Allow Access From
   Anywhere** (`0.0.0.0/0`). This is required because Render's IPs are dynamic
   on the free tier.
5. Click **Connect** → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/budgetnest?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with your database user's credentials,
   and make sure the database name (`budgetnest`) is included in the path.

---

## 2. Backend on Render

1. Push this project to a GitHub repository.
2. Go to https://render.com, sign up/sign in with GitHub.
3. Click **New +** → **Web Service** → connect your repo.
4. Render will detect `render.yaml` at the repo root and pre-fill settings.
   If configuring manually instead, use:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. Add these Environment Variables in the Render dashboard:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `MONGO_URI` | your Atlas connection string from step 1 |
   | `JWT_SECRET` | any long random string (Render can auto-generate this) |
   | `JWT_EXPIRE` | `30d` |
   | `CLIENT_URL` | your Vercel URL, e.g. `https://budgetnest.vercel.app` (set this after step 3 below, then redeploy) |

6. Click **Create Web Service**. Wait for the build to finish. Note the
   service URL, e.g. `https://budgetnest-api.onrender.com`.
7. Confirm it's alive: open `https://budgetnest-api.onrender.com/api/health`
   in your browser — you should see a JSON success message.

---

## 3. Frontend on Vercel

1. Go to https://vercel.com, sign up/sign in with GitHub.
2. Click **Add New** → **Project** → import the same repository.
3. Configure the project:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variable:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://budgetnest-api.onrender.com/api` (your Render URL from step 2, with `/api` appended) |

5. Click **Deploy**. Vercel will build and give you a live URL, e.g.
   `https://budgetnest.vercel.app`.
6. Go back to Render and set `CLIENT_URL` to this Vercel URL, then trigger a
   manual redeploy so CORS allows requests from your frontend.

---

## 4. Seed Demo Data (optional)

To populate the database with a demo user and sample expenses/budgets/assets:

```bash
cd server
npm install
# Make sure server/.env has a valid MONGO_URI first
npm run seed
```

This creates a demo login (check the console output of `seed.js` for the
exact credentials printed after seeding).

---

## 5. Local Development

```bash
# From the repo root
npm run install:all   # installs root, server, and client dependencies

# Copy env examples and fill in real values
cp server/.env.example server/.env
cp client/.env.example client/.env

npm run dev            # runs backend (5000) and frontend (5173) concurrently
```

Visit `http://localhost:5173`.

---

## Troubleshooting

- **CORS errors in production:** double-check `CLIENT_URL` on Render exactly
  matches your Vercel domain (no trailing slash), then redeploy the backend.
- **401 errors right after login:** confirm `JWT_SECRET` is set on Render and
  hasn't changed since the token was issued.
- **Render service "sleeping":** free services spin down after ~15 minutes of
  inactivity. The first request wakes it up but can take up to a minute —
  this is expected on the free tier.
- **MongoDB connection timeout:** verify Network Access in Atlas allows
  `0.0.0.0/0`, and that the username/password in `MONGO_URI` don't contain
  unescaped special characters (URL-encode them if they do).
