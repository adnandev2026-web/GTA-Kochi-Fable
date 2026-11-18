# GTA World — Open World Multiplayer (MERN + MongoDB Atlas + Firebase + Render)

An open-world 3D GTA experience built with **Three.js**, **React**, **Express**, **Node.js**, **MongoDB Atlas (Mongoose)**, **WebSockets (`ws`)**, **Cookie-Parser**, and **Firebase Authentication & Firestore**.

## Playable Cities & Landmarks
- **Kerala Cities**: Kochi, Pookkottumpadam, Trivandrum, Kozhikkode
- **International Famous Cities**: New York, Dubai, London, Tokyo
- Every city includes roads, **Schools** (30 km/h speed zone checks), **Petrol Pumps** (refuel), **Police Stations** (speeding fines), **Toll Plazas** (auto-deducted tolls), **Neighborhood Homes** (spawn right outside your chosen home!), and signature 3D landmarks.

---

## Free-Tier Setup & Hosting Guide

### 1. MongoDB Atlas (Free M0 Cluster)
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/atlas) and create a **Free M0 Sandbox** cluster.
2. Go to **Database Access** → **Add New Database User** (Password authentication, Read and write to any database).
3. Go to **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`).
4. Click **Connect** → **Drivers** → Copy your connection string (`mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/gta-world?retryWrites=true&w=majority`).

### 2. Firebase Console (Free Spark Plan — Google Sign-In)
1. Open [Firebase Console](https://console.firebase.google.com/) and select your project (`golden-axon-z6gf7` or your own project).
2. Go to **Authentication** → **Sign-in method** → Enable **Google**.
3. Go to **Authentication** → **Settings** → **Authorized domains** → Add your Render service domain (e.g., `gta-world.onrender.com`) and `localhost`.
4. Ensure Firestore security rules from `firestore.rules` are deployed.

### 3. Render Web Service (Free Plan)
1. Push this repository to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) → **New +** → **Web Service**.
3. Connect your GitHub repository (or use the included `render.yaml` Blueprint).
4. Configure:
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

### 4. Environment Variables (Set in Render Dashboard)
| Variable | Value / Description |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `MONGODB_URI` | Your MongoDB Atlas `mongodb+srv://...` connection string |
| `COOKIE_SECRET` | A long random secret string for signed cookies |

---

## Local Development
```bash
npm install
npm run dev
```
The Express + Vite + WebSocket server runs on `http://localhost:3000`.
