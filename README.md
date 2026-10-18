# ✈️ TravelUp Global

> **Next-Generation Global Travel Platform**  
> **Course Project:** Markup & Scripting Languages Lab  
> **Department:** Computer Science & Engineering (CSE), Dhaka International University (DIU)  
> **Submitted To:** Sajib Bhattacharjee, Lecturer, Department of CSE  
> **Project Team:**  
> 1. **Md. Tanvir Parvaj** (Roll: 39)  
> 2. **Md. Toufick Hasan** (Roll: 34)  
> 3. **Fahima Suborna** (Roll: 36)  
> **Domain:** `travelupglobal.com`  
> **Database:** Hostinger MySQL (`srv1954.hstgr.io`)  

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Usage in Course |
|---|---|---|
| **Markup Language** | **HTML5** | Semantic tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`), Form Validations |
| **Presentation** | **CSS3** | Modern Flexbox, CSS Grid, CSS Variables (Dark/Light Mode), Keyframe Animations, Media Queries |
| **Client Scripting** | **JavaScript (ES6+)** | DOM Manipulation, Asynchronous Fetch API, LocalStorage, Leaflet.js Interactive Maps |
| **Server Scripting** | **Node.js & Express** | REST API Architecture, JWT Authentication, bcrypt password hashing |
| **Database** | **MySQL (Hostinger)** | Relational 3NF Schema (`users`, `destinations`, `packages`, `bookings`, `reviews`, `travel_alerts`) |

---

## 🚀 How to Run the Project

### 1. Start the Server
```bash
cd server
npm start
```
Server runs at: **`http://localhost:5000`**

### 2. Open in Browser
Open `http://localhost:5000` or open `client/index.html` in your web browser.

---

## 🔑 Demo Credentials (Stored in Hostinger DB)
- **Admin Account:**
  - Email: `admin@travelupglobal.com`
  - Password: `password` (or register a new user in 2 seconds via the UI!)
- **Customer Account:**
  - Email: `user@travelupglobal.com`

---

## 🌟 Key Implemented Features
1. **Interactive Search & Multi-Filter:** Filter by Beach, Mountain, City, Adventure and Sort by Price/Rating without page reload.
2. **Interactive Leaflet Map:** Custom GPS pins on destinations (Cox's Bazar, Sajek, Bali, Dubai, Swiss Alps, etc.) with booking popups.
3. **Smart Budget Planner:** Calculates itemized expense breakdown (Hotel, Food, Sightseeing, Emergency fund) based on user's custom budget and travel duration.
4. **Bilingual Support:** 1-click toggle between **বাংলা 🇧🇩** and **English 🌐**.
5. **Currency Switcher:** Switch between **BDT (৳)** and **USD ($)** with live price adjustments.
6. **Dark / Light Theme:** Instant toggle between sleek dark mode and bright light mode.
7. **JWT Authentication:** Secure user registration, login, and token storage in `localStorage`.
8. **Booking Modal:** Step-by-step reservation with unique booking reference (e.g. `TUG-2026-XXXX`) and group travel code generator.
9. **Emergency Travel Alerts Banner:** Real-time safety advisories served dynamically from Hostinger MySQL.
