  project Structure car-rental-fullstack/
   DriveIndia — Car Rental Portal (Full Stack)

HTML + CSS + JS Frontend connected to a Node.js + Express + MySQL Backend
│
├── frontend/                   ← All HTML/CSS/JS files (open in browser)
│   ├── index.html              ← Home page — public car listings
│   ├── login.html              ← User login + register
│   ├── user-dashboard.html     ← Browse cars, book, view my bookings
│   ├── admin-login.html        ← Admin login
│   ├── admin-dashboard.html    ← Accept / Reject bookings + stats
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js              ← All API calls + UI logic
│
├── backend/                    ← Node.js REST API
│   ├── server.js               ← Express entry point
│   ├── package.json
│   ├── .env.example            ← Copy to .env and fill in your values
│   ├── database.sql            ← Run this once in MySQL to set up DB
│   ├── config/
│   │   └── db.js               ← MySQL connection pool
│   ├── middleware/
│   │   └── auth.js             ← JWT verify + admin guard
│   └── routes/
│       ├── auth.js             ← /api/auth/register, login, admin-login
│       ├── cars.js             ← /api/cars
│       └── bookings.js         ← /api/bookings (user + admin)
│
├── .gitignore
└── README.md
