# CerviCare Dev Server

This simple Node/Express dev server serves the static site and provides minimal auth/profile endpoints used by `index.html` for signup/login/profile.

Run locally:

```bash
npm install
npm start
# then open http://localhost:3000 in your browser
```

Notes about storage:
- By default this dev server attempts to use SQLite (`cervicare.sqlite`) via `better-sqlite3` for user storage. If the native module is not available (common on Windows without build tools), the server falls back to a simple JSON file `db.json` for development.

To enable persistent SQLite storage with `better-sqlite3` on Windows, install the Visual Studio Build Tools with the C++ workload and then add `better-sqlite3` back into `package.json` and run `npm install`.

APIs:
- POST `/api/auth/signup` { email, password }
- POST `/api/auth/login` { email, password } -> { token, user }
- GET `/api/profile` (requires `Authorization: Bearer <token>`)

Notes:
- This is a simple development server storing users in `db.json`. Do not use in production.
Cervical Cancer Awareness Website

This is my first web development project, created for the Smart India Hackathon 2025 under the theme of Cervical Cancer Awareness. The website helps users learn about cervical cancer, find nearby hospitals, and check a vaccination calendar for timely prevention. It was built as part of my college team submission from Galgotias University.

Features:
• Find nearest hospital for vaccination or screening  
• View vaccination calendar and reminders  
• Informative section about cervical cancer prevention  
• Responsive and user-friendly design  

Tech Stack:
• HTML5  
• CSS3  
• JavaScript  
• Google Maps API  

Live Website:
https://srivastavsanidhya2206.github.io/cervical-cancer-awareness/

Achievement:
Selected among the top 24 teams out of 57 in the Smart India Hackathon 2025 (College Level) round at Galgotias University, recognized for creativity and real-world impact.

Author:
Sanidhya Srivastava  
Email: srivastavsanidhya2206@gmail.com
