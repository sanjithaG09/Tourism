# 🧭 Velora — Redefining the Way You Roam

> A full-stack web travel companion that helps tourists discover places, optimize routes, stay safe, and track their adventures — all in one app.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Pages & Routes](#pages--routes)
- [Team](#team)

---

## Overview

Velora solves a real problem for tourists: the need to juggle multiple apps for navigation, food discovery, accommodation, and safety. It brings all of that into a single, clean interface — from discovering trending destinations to planning optimized multi-stop routes and triggering an SOS alert in an emergency.

---

## Features

### 🗺️ Tourist Place Discovery

- Search any city to get top-rated tourist attractions via Google Places API
- Trending destination cards on the home screen
- Each place shows name, rating, distance, and category

### 🔁 Route Optimization

- Select multiple places and generate the shortest visiting order
- Uses the Nearest Neighbour TSP algorithm with Google Distance Matrix API
- Shows step-by-step route with real distances and travel times between stops

### 🚨 SOS Emergency Assistance

- Pulsing SOS button with a 5-second countdown and cancel option
- Sends an instant alert email with the user's name, timestamp, and live Google Maps location link
- Fetches real nearby hospitals, police stations, and fire brigades using GPS + Google Places API
- All 8 Indian national emergency numbers (112, 100, 101, 102…) listed as one-tap call links
- Safety tips for travellers

### 📊 Travel Analytics

- Total trips planned, total distance covered, cities explored
- Top 5 cities bar chart
- Monthly activity chart (last 6 months)
- 6 unlockable travel milestones (First Trip, Explorer, Globetrotter, etc.)

### 👤 User Auth & Profile

- Register / Login with email + password
- Google & GitHub OAuth via Firebase
- Forgot password → email reset link flow
- Reset password page (token + email from URL)
- Change password (for logged-in users)
- Login security alert email on every new sign-in
- JWT-based session management

### 💾 Trip Management

- Save, view, update, delete, and duplicate trips
- Filter saved trips by city or date range
- Each trip detail view includes live weather forecast for that city
- In-app notifications for trip saves and new reviews

### ⭐ Reviews

- Add star ratings (1–5) and comments to any trip
- Average rating calculated automatically
- Notification sent to trip owner when someone reviews their trip

### 🔔 Notifications

- Bell notifications for: trip saved, new review received
- Mark individual or all notifications as read
- Cron job runs in background to process scheduled notifications

---

## Tech Stack

### Frontend

| Tool                         | Purpose                     |
| ---------------------------- | --------------------------- |
| React 19 + Vite              | UI framework and build tool |
| React Router v7              | Client-side routing         |
| Firebase (Auth)              | Google & GitHub OAuth       |
| Axios                        | HTTP client                 |
| CSS-in-JS (inline `<style>`) | Scoped per-page styling     |

### Backend

| Tool                 | Purpose                                  |
| -------------------- | ---------------------------------------- |
| Node.js + Express 5  | REST API server                          |
| MongoDB + Mongoose   | Database and ODM                         |
| JSON Web Token (JWT) | Auth tokens                              |
| bcryptjs             | Password hashing                         |
| Nodemailer           | Transactional email (alerts, reset, SOS) |
| node-cron            | Background notification job              |
| Morgan               | Request logging                          |

### External APIs

| API                        | Used For                                       |
| -------------------------- | ---------------------------------------------- |
| Google Places API          | Tourist attractions, nearby emergency services |
| Google Distance Matrix API | Travel time & distance between places          |
| Google Directions API      | Route path calculation                         |
| OpenWeatherMap API         | 5-step weather forecast per city               |

### Algorithm

- **Nearest Neighbour TSP (Greedy)** — optimizes the visiting order of selected tourist places to minimize total travel distance

---

## Project Structure

```
Velora-main/
│
├── config/
│   └── db.js                  # MongoDB connection
│
├── controllers/
│   ├── authController.js      # Register, login, password flows, email alerts
│   ├── placeController.js     # Google Places, weather, route optimization
│   ├── tripController.js      # Trip CRUD + duplicate
│   ├── sosController.js       # Nearby emergency services + SOS email
│   ├── ReviewController.js    # Trip reviews
│   ├── NotificationController.js
│   └── AnalyticsController.js # Per-user + admin analytics
│
├── middleware/
│   ├── auth.js                # JWT verification
│   └── adminOnly.js           # Admin role guard
│
├── models/
│   ├── User.js
│   ├── trip.js
│   ├── Review.js
│   └── Notification.js
│
├── routes/
│   ├── authRoutes.js
│   ├── tripRoutes.js
│   ├── placeRoutes.js
│   ├── routeRoutes.js
│   ├── sosRoutes.js
│   ├── reviewRoutes.js
│   ├── notificationRoutes.js
│   ├── analyticRoutes.js
│   └── alertRoutes.js
│
├── services/
│   ├── googleApi.js           # Google Places + Distance Matrix helpers
│   └── weatherApi.js          # OpenWeatherMap helper
│
├── jobs/
│   └── notificationJob.js     # Cron-based notification processor
│
├── utils/
│   └── tsp.js                 # TSP algorithm utility
│
├── setup.js                   # ✨ Interactive setup — creates your .env files
├── .env.example               # Reference for all backend env variables
├── server.js                  # Entry point
├── package.json
│
└── travel-frontend/           # React + Vite frontend
    ├── .env.example           # Reference for frontend env variables
    └── src/
        ├── pages/
        │   ├── Home.jsx
        │   ├── Login.jsx
        │   ├── trip.jsx
        │   ├── profile.jsx
        │   ├── changepassword.jsx
        │   ├── ResetPassword.jsx
        │   ├── Emergency.jsx
        │   └── Analytics.jsx
        ├── App.jsx
        ├── api.js
        └── firebase.js
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or [Atlas free tier](https://cloud.mongodb.com))
- Google Cloud project with Places API, Distance Matrix API, and Directions API enabled
- OpenWeatherMap API key (free tier)
- Gmail account with an App Password set up for Nodemailer
- Firebase project for Google/GitHub OAuth

### 1. Clone the repository

```bash
git clone https://github.com/your-username/velora.git
cd velora
```

### 2. Install dependencies

```bash
# Backend
npm install

# Frontend
cd travel-frontend && npm install && cd ..
```

### 3. Configure environment variables

> **Recommended — Interactive setup script**
>
> Run the setup wizard from the project root. It will ask you for each value one at a time, explain where to get it, and automatically write both `.env` files for you:
>
> ```bash
> node setup.js
> ```
>
> The script creates:
>
> - `.env` — backend secrets (MongoDB, Google API, email, JWT, etc.)
> - `travel-frontend/.env` — frontend API URL
>
> You can re-run `node setup.js` at any time to update your config.

If you prefer to configure manually, see the [Environment Variables](#environment-variables) section below.

### 4. Start the project

Open two terminals:

```bash
# Terminal 1 — Backend (from project root)
node server.js
# or with auto-reload:
npx nodemon server.js
```

```bash
# Terminal 2 — Frontend
cd travel-frontend
npm run dev
```

| Service     | URL                   |
| ----------- | --------------------- |
| Backend API | http://localhost:3000 |
| Frontend    | http://localhost:5173 |

---

## Environment Variables

The easiest way to set these up is by running `node setup.js` from the project root — it will guide you through each value interactively.

If you'd rather configure manually, create a `.env` file in the project root and a `travel-frontend/.env` file using the templates below. Reference files are also available as `.env.example` and `travel-frontend/.env.example`.

### Backend `.env`

```env
# Server
PORT=3000
FRONTEND_URL=http://localhost:5173

# MongoDB
# Get a free cluster at: https://cloud.mongodb.com
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/velora

# JWT — any long random string
JWT_SECRET=your_super_secret_jwt_key

# Google Cloud API Key
# Enable: Places API, Distance Matrix API, Directions API
# Console: https://console.cloud.google.com → APIs & Services → Credentials
GOOGLE_API_KEY=your_google_cloud_api_key

# OpenWeatherMap — free signup at https://openweathermap.org/api
OPENWEATHER_API_KEY=your_openweathermap_api_key

# Gmail (Nodemailer)
# IMPORTANT: Use an App Password, NOT your real Gmail password
# Setup: myaccount.google.com → Security → 2-Step Verification → App Passwords
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

### Frontend `travel-frontend/.env`

```env
# URL of your running backend
VITE_API_URL=http://localhost:3000
```

### Where to get each key

| Variable              | Where to get it                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| `MONGO_URI`           | [cloud.mongodb.com](https://cloud.mongodb.com) → New Project → Free cluster → Connect                         |
| `JWT_SECRET`          | Any random string — `node setup.js` generates one automatically                                               |
| `GOOGLE_API_KEY`      | [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → Create API key |
| `OPENWEATHER_API_KEY` | [openweathermap.org/api](https://openweathermap.org/api) → Sign up → My API Keys                              |
| `EMAIL_USER`          | Your Gmail address                                                                                            |
| `EMAIL_PASS`          | Google Account → Security → App Passwords → Generate for "Mail"                                               |

> **Note on Firebase:** Firebase config is currently hardcoded in `travel-frontend/src/firebase.js`. If you fork this project and deploy it, replace those values with your own Firebase project credentials from the [Firebase Console](https://console.firebase.google.com).

---

## API Reference

### Auth

| Method | Endpoint               | Auth | Description                 |
| ------ | ---------------------- | ---- | --------------------------- |
| POST   | `/api/register`        | —    | Create account              |
| POST   | `/api/login`           | —    | Login, returns JWT          |
| POST   | `/api/forgot-password` | —    | Send reset email            |
| POST   | `/api/reset-password`  | —    | Set new password via token  |
| POST   | `/api/change-password` | ✅   | Change password (logged in) |
| GET    | `/api/verify-token`    | ✅   | Validate JWT                |

### Places & Routes

| Method | Endpoint              | Auth | Description                          |
| ------ | --------------------- | ---- | ------------------------------------ |
| GET    | `/api/places/:city`   | —    | Tourist attractions for a city       |
| GET    | `/api/weather/:city`  | —    | 5-step weather forecast              |
| POST   | `/api/route/optimize` | —    | Optimized route from selected places |

### Trips

| Method | Endpoint                  | Auth | Description                                       |
| ------ | ------------------------- | ---- | ------------------------------------------------- |
| POST   | `/api/save-trip`          | ✅   | Save a new trip                                   |
| GET    | `/api/trips`              | ✅   | Get all trips (supports `?city=` `?from=` `?to=`) |
| GET    | `/api/trip/:id`           | ✅   | Single trip with live weather                     |
| PUT    | `/api/trip/:id`           | ✅   | Update trip                                       |
| DELETE | `/api/trip/:id`           | ✅   | Delete trip                                       |
| POST   | `/api/trip/:id/duplicate` | ✅   | Duplicate a trip                                  |

### SOS / Emergency

| Method | Endpoint                    | Auth | Description                             |
| ------ | --------------------------- | ---- | --------------------------------------- |
| GET    | `/api/sos/nearby?lat=&lng=` | ✅   | Nearby hospitals, police, fire brigades |
| POST   | `/api/sos/alert`            | ✅   | Send SOS alert email with location      |

### Reviews

| Method | Endpoint                    | Auth | Description                  |
| ------ | --------------------------- | ---- | ---------------------------- |
| POST   | `/api/trip/:tripId/review`  | ✅   | Add review to a trip         |
| GET    | `/api/trip/:tripId/reviews` | ✅   | Get reviews + average rating |
| DELETE | `/api/review/:id`           | ✅   | Delete own review            |

### Notifications

| Method | Endpoint                      | Auth | Description                      |
| ------ | ----------------------------- | ---- | -------------------------------- |
| GET    | `/api/notifications`          | ✅   | Get notifications + unread count |
| PUT    | `/api/notification/:id/read`  | ✅   | Mark one as read                 |
| PUT    | `/api/notifications/read-all` | ✅   | Mark all as read                 |

### Analytics

| Method | Endpoint                | Auth     | Description                                           |
| ------ | ----------------------- | -------- | ----------------------------------------------------- |
| GET    | `/api/analytics/me`     | ✅       | Personal stats (trips, distance, top cities, monthly) |
| GET    | `/api/analytics/global` | ✅ Admin | Platform-wide stats                                   |

---

## Pages & Routes

| URL               | Page           | Description                                      |
| ----------------- | -------------- | ------------------------------------------------ |
| `/`               | Home           | Landing page, trending destinations search       |
| `/login`          | Login          | Login, register, forgot password                 |
| `/reset-password` | Reset Password | Set new password via email link                  |
| `/trips`          | Trip Planner   | Search, select places, optimize route, save trip |
| `/profile`        | Profile        | View/edit profile, saved trips                   |
| `/emergency`      | Emergency      | SOS button, nearby services, national helplines  |
| `/analytics`      | Analytics      | Trip stats, charts, milestones                   |

---

## Team

- **Shreya Kumari**
- **E.V. Sai Chathurya**
- **Gunuganti Sanjitha**
- **A. Sai Poojitha**
- **P. Sindhu Priya**

---

> Built with ❤️ — _Redefining the way you roam._
