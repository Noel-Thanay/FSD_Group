# CampusLoop

## Smart Campus Community and Resource Exchange Platform

CampusLoop is a full-stack web application that helps students exchange useful resources and stay connected with important campus services. It combines resource sharing with four additional campus-focused features:

1. Campus announcements
2. Lost and found
3. Campus events calendar
4. Campus help and maintenance requests

The platform reduces student expenses, improves communication, and gives students a simple way to report and track campus issues.

## Run locally

### Prerequisites

- Node.js 20.19 or newer in the 20.x line, 22.12 or newer in the 22.x line, or a later major release
- npm, included with Node.js
- Git, if cloning the repository

### Get the project

```sh
git clone https://github.com/Mahith-Reddy-Gangu/FSD_Group.git
cd FSD_Group
```

### Windows

Double-click `Start-CampusLoop.bat`. It installs dependencies from the committed lockfile the first time, then starts the API and website and opens the website in your browser. Later runs reuse the installed dependencies.

### macOS or Linux

```sh
npm ci
npm run dev:full
```

Open <http://localhost:5173>. Stop the development server with `Ctrl+C`.

### Configure MongoDB Atlas

1. Create a MongoDB Atlas cluster and a database user.
2. In Atlas Network Access, allow the IP address where the API will run. Avoid allowing access from every IP address for a deployed application.
3. Copy `.env.example` to `.env` and replace the placeholders:

   ```dotenv
   MONGODB_URI=mongodb+srv://<database-user>:<url-encoded-password>@<cluster-host>/?retryWrites=true&w=majority
   MONGODB_DB=campusloop
   JWT_SECRET=<a-random-secret-at-least-32-characters-long>
   ADMIN_EMAIL=admin@student.nitw.ac.in
   ADMIN_SETUP_KEY=<a-private-random-value-at-least-24-characters-long>
   PORT=4000
   ```

   Register the `ADMIN_EMAIL` address with the `ADMIN_SETUP_KEY` to create the initial administrator account. The key is required only during administrator registration; do not share it. After registration, sign in through the regular CampusLoop login with that email and the account password; the administrator dashboard and controls appear automatically. To promote an account that was already imported, set its `role` to `admin` in MongoDB Atlas Data Explorer as a trusted database operator.
4. Keep `.env` private; it is excluded from Git. Do not put the Atlas connection string in frontend variables.
5. Start the app as described above. The API exits with a clear error if `MONGODB_URI` or a suitable `JWT_SECRET` is missing.

On the first API start, existing `server/data.json` data is imported into the selected Atlas database if it has not already been initialized. The JSON file is left untouched as a backup. MongoDB becomes the source of truth after import; subsequent edits to the JSON file are not imported. To start with an empty database, move the old JSON file out of `server/` before the first start.

## Troubleshooting and recovery

- **API cannot reach MongoDB:** Check the API terminal output for missing `MONGODB_URI`/`JWT_SECRET`, Atlas IP access rules, database-user permissions, and an invalid connection string. With valid environment variables the API stays available and retries transient connection failures with backoff; the health endpoint remains `503` until database initialization succeeds. Missing required secrets still stop startup rather than using an insecure fallback.
- **Website says it cannot connect:** Confirm the API is listening on port 4000 and open <http://localhost:4000/api/health>. A healthy response includes `"database":"connected"`. The client retries transient read failures, times out slow requests, displays a reconnect action, and preserves form values when a write fails.
- **Atlas becomes unavailable while the app is running:** MongoDB's driver reconnects where possible. Protected API operations return a clear temporary-unavailable response; writes are not queued or reported as successful. Restore Atlas connectivity, then use **Reconnect** or retry the action. Check Atlas cluster status, IP allowlist, and network access.
- **A simultaneous edit returns HTTP 409:** The API rejects stale snapshots to prevent overwriting another user's update. The client reloads the latest campus data; retry the action after it finishes loading.
- **HTTP 400, 401, 403, or 413:** Correct the submitted fields, sign in again if your session expired, request the required role/access, or reduce an image/request body that exceeds the 4 MB JSON limit. Invalid JSON receives HTTP 400.
- **Atlas transaction errors:** The selected MongoDB deployment must support multi-document transactions (MongoDB Atlas replica set/sharded cluster). The API reports transient transaction conflicts as retryable errors; it does not claim that an uncommitted write succeeded.

The `/api/health` endpoint pings MongoDB rather than checking only whether Express is running. The API also closes its HTTP and MongoDB connections on SIGINT/SIGTERM. A client-side error boundary provides a recovery screen for unexpected rendering crashes.

## Problem Statement

Students often purchase items they need only temporarily, miss important campus updates, struggle to recover lost belongings, and do not have a clear way to report infrastructure problems. CampusLoop brings these activities together in one organized platform.

## Objectives

- Allow students to list, search, borrow, and exchange resources.
- Provide a central location for official campus announcements.
- Help students report and recover lost or found items.
- Allow students to discover and register for campus events.
- Make maintenance complaints trackable from submission to resolution.
- Provide administrators with tools to manage users and campus content.

## Main Modules

### 1. Resource Exchange

Students can share books, calculators, notes, electronics, lab equipment, sports equipment, and other useful items.

Features:

- Add, edit, and delete resource listings
- Upload resource images
- Search and filter resources by category
- Send borrow or exchange requests
- Approve or reject requests
- Mark resources as returned
- Rate users after a completed exchange

### 2. Campus Announcements

Students can view important academic, administrative, club, and general campus notices.

Features:

- Admin creates and manages announcements
- Categorize announcements
- Pin important announcements
- Search announcements
- Display publication date and author

### 3. Lost and Found

Students can report lost or found belongings and connect with other students to recover them.

Features:

- Report a lost or found item
- Add item image, description, location, and date
- Search and filter reports
- Contact the person who posted the report
- Mark an item as resolved

### 4. Campus Events Calendar

Students can discover and register for seminars, workshops, club activities, sports events, and cultural programs.

Features:

- Admin or authorized users create events
- Display event date, time, location, and description
- Filter events by category and date
- Register or cancel event registration
- View the list of registered participants

### 5. Campus Help and Maintenance Requests

Students can report problems such as broken lights, damaged furniture, Wi-Fi issues, water problems, or cleanliness concerns.

Features:

- Submit a maintenance request
- Add category, location, description, and image
- Track request status
- Admin assigns or updates requests
- Status flow: Submitted, In Progress, Resolved
- Student can confirm whether the issue was resolved

## User Roles

### Student

- Register and log in
- Manage profile
- Use the resource exchange
- View announcements
- Create lost and found reports
- Browse and register for events
- Submit and track maintenance requests
- Give ratings after resource exchanges

### Administrator

- Manage students and user accounts
- Manage resource categories
- Moderate resource and lost and found listings
- Publish announcements
- Create and manage events
- Review and update maintenance requests
- View dashboard statistics

## Technology Stack

### Frontend

- React.js
- Vite
- GSAP and Framer Motion
- Three.js and Vanta.js

### Backend

- Node.js
- Express.js
- REST API
- JSON Web Tokens for authentication
- bcryptjs for password hashing

### Database and Storage

- MongoDB Atlas via the official MongoDB Node.js driver
- Separate collections for users, listings, events, registrations, requests, offers, clubs, announcements, lost-and-found reports, maintenance requests, and reviews
- The API commits writes in a transaction and checks a shared revision to reject stale simultaneous edits instead of silently overwriting newer data

### Development and Deployment Tools

- Visual Studio Code
- Git and GitHub

## System Architecture

```text
React + Vite Frontend
      |
      | HTTP requests
      v
Express.js REST API
      |
      | MongoDB Node.js driver
      v
MongoDB Atlas
```

## Current implementation notes

- `server/data.json` is only a one-time legacy import source; it is no longer updated by the API.
- The resource exchange UI shows wanted resource requests so students can offer items to people who need them. Resource images are resized client-side and stored as JPEG data URLs in MongoDB; keep uploads small. For larger deployments, move these image bytes to an object-storage service and retain only the resulting URL.
- Announcements support category/search filters and administrator create, edit, pin, and delete controls.
- Lost-and-found supports lost/found filtering, search, contact, report editing, resolution, and owner/admin moderation. Reports accept an image URL or a resized photo uploaded from a computer/phone (including a camera capture on supported phones).
- Events support category/date filters, club membership authorization, registration/cancellation, organizer/admin guest lists, and optional capacity limits.
- Students see only their own maintenance requests. Administrators can view all requests, assign active student accounts, move requests through Submitted → In Progress → Resolved, and review dashboard statistics. Requesters can confirm resolution. Maintenance reports accept an image URL or a resized photo upload/camera capture.
- Club membership requests are approved by an administrator or a current club member. Administrators can review pending requests from the profile's **Campus clubs** section; only approved members can organize that club's events.
- The administrator dashboard provides campus activity counts and student account search/suspension/restoration. Admin access is granted only through the configured registration setup key; administrators can create and remove events and manage campus content.
- The UI retries transient reads, shows a connection warning when the API is unreachable, exposes a retry action on startup failures, clears expired sessions, and refreshes after stale-write conflicts. It preserves the active section in the URL hash on reload, broadcasts key resource/lost-and-found changes to other tabs, and refreshes those shared views periodically while signed in. The server validates request bodies and field limits, enforces role/ownership checks, rejects duplicate active resource requests and reviews, and returns explicit errors for unavailable database operations.
- Maintenance and lost-and-found images currently use validated HTTP(S) URLs rather than Cloudinary uploads. Cloudinary credentials are not configured by this repository.

## Main Pages

- Home page
- Register page
- Login page
- Student dashboard
- Admin dashboard
- Resource listing page
- Resource details page
- Add resource page
- My requests page
- Announcements page
- Lost and found page
- Report lost or found item page
- Events calendar page
- Event details page
- Maintenance requests page
- Submit maintenance request page
- Profile page

## REST API Endpoints

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Resource Exchange

```text
GET    /api/listings
POST   /api/listings
PUT    /api/listings/:id
DELETE /api/listings/:id
PATCH  /api/listings/:id/save
POST   /api/listings/:id/offers
GET    /api/offers/my
PATCH  /api/listings/:id/close
POST   /api/listings/:id/requests
GET    /api/requests/my
PUT    /api/requests/:id/approve
PUT    /api/requests/:id/reject
PUT    /api/requests/:id/cancel
PUT    /api/requests/:id/return
```

### Administration

```text
GET   /api/admin/dashboard
GET   /api/admin/users
PATCH /api/admin/users/:id/status
PUT   /api/maintenance/:id/assign
```

### Announcements

```text
GET    /api/announcements
POST   /api/announcements
PUT    /api/announcements/:id
DELETE /api/announcements/:id
```

### Lost and Found

```text
GET    /api/lost-found
POST   /api/lost-found
GET    /api/lost-found/:id
PUT    /api/lost-found/:id
DELETE /api/lost-found/:id
PUT    /api/lost-found/:id/resolve
```

### Events

```text
GET  /api/events
POST /api/events
DELETE /api/events/:id
POST /api/events/:id/registration
GET  /api/events/:id/guest-list
```

### Maintenance

```text
GET  /api/maintenance
POST /api/maintenance
GET  /api/maintenance/my
PUT  /api/maintenance/:id/status
PUT  /api/maintenance/:id/confirm
```

### Reviews

```text
POST /api/reviews
GET  /api/users/:id/reviews
```

## Recommended Folder Structure

```text
campusloop/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── context/
│   │   └── App.jsx
│   └── package.json
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   └── package.json
└── README.md
```

## Complete Demonstration Flow

1. Register as a student.
2. Add a textbook or calculator to the resource exchange.
3. Log in as another student and send a borrow request.
4. Approve the request from the owner account.
5. View a campus announcement.
6. Report a lost item.
7. Register for a campus event.
8. Submit a broken-facility maintenance request.
9. Log in as an administrator.
10. Update the maintenance request to In Progress and then Resolved.
11. Mark the borrowed resource as returned.

## Security Features

- Passwords are hashed using bcrypt.
- JWT is used for authenticated sessions.
- Role-based access protects administrator routes.
- Users can edit or delete only their own submissions.
- Server-side validation checks all request data.
- Uploaded files are restricted to supported image types.

## Future Enhancements

- College email verification
- In-app messaging
- Email and push notifications
- QR code handover for resource exchanges
- Mobile application
- Analytics for frequently requested resources
- Location-based campus services

## Conclusion

CampusLoop is a complete full-stack campus platform that combines resource exchange, communication, event participation, lost item recovery, and maintenance reporting. It solves practical student problems while demonstrating authentication, CRUD operations, database relationships, file uploads, role-based access, REST APIs, and deployment.