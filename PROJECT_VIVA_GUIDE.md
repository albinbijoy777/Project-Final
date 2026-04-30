# FixBee Project Viva Guide

## 1. Project Title
FixBee: A real-time home service booking and worker dispatch platform.

## 2. One-line Explanation
FixBee is a role-based web application where customers can book home services, admins can manage operations, and workers can receive assignments, update job status, and maintain their service coverage areas in real time.

## 3. What Problem This Project Solves
Traditional home service coordination is often manual:
- users call or message for service
- admins assign workers manually
- workers do not get structured updates
- users do not know booking status live

FixBee solves this by putting users, workers, and admins into one connected system with:
- online booking
- role-based dashboards
- live status updates
- worker assignment
- notifications
- reviews
- worker approval workflow

## 4. Similar Real-world Apps
FixBee is similar in workflow to:
- Urban Company: service booking, worker dispatch, role-based operations
- TaskRabbit: customer-to-worker matching
- Housejoy and similar service apps: home maintenance booking and technician routing

Why someone would use FixBee:
- faster booking flow
- live updates instead of manual follow-up
- centralized control for admin
- structured worker onboarding
- booking history and service transparency

## 5. Target Users
FixBee has 3 main roles:

### User
- browses services
- books a service
- tracks booking progress
- requests reschedule
- cancels bookings
- reviews completed services

### Worker
- gets approved by admin before activation
- manages service area and availability
- views assigned jobs
- updates booking status
- requests reschedule when needed

### Admin
- manages people, workers, and services
- approves worker applications
- assigns workers to bookings
- changes booking status
- monitors platform activity

## 6. Main Technologies Used

### Frontend
- React 19
- React Router
- Vite
- Framer Motion
- Lucide React
- Recharts

### Backend / BaaS
- Supabase

### Database
- PostgreSQL through Supabase

### Authentication
- Supabase Auth

### Real-time Updates
- Supabase Realtime channels using Postgres table subscriptions

## 7. Why React Was Used
React is good for this project because:
- the app has many dynamic UI states
- multiple dashboards need reusable components
- role-based pages are easier to organize
- form handling and real-time state updates are smoother
- context API helps share auth/profile data globally

## 8. Why Vite Was Used
Vite was used because:
- fast development server
- faster builds than older bundlers
- simple setup for React
- good support for environment variables

## 9. Why Supabase Was Used
Supabase is one of the most important choices in this project.

Reasons:
- it provides authentication out of the box
- it gives PostgreSQL instead of a custom backend server
- it supports real-time table subscriptions
- it supports row-level security
- it allows SQL functions and triggers
- it gives storage support for profile avatars and service media

Why Supabase is a strong fit here:
- this project needs auth, database, notifications, storage, and real-time sync
- building all of that manually with Node.js, Express, JWT, WebSockets, and PostgreSQL would take much more time
- Supabase reduced backend complexity without losing production-style features

## 10. Why Not a Traditional Backend Server?
This app currently does not use a separate Express or Django backend.

Instead:
- React handles the frontend
- Supabase handles auth, database, storage, and real-time events

Advantage:
- fewer moving parts
- faster development
- easier deployment
- secure DB rules through RLS

Tradeoff:
- business logic must be split between frontend code and SQL functions
- very complex enterprise workflows may later need a dedicated backend

## 11. High-level Architecture

### Frontend Layer
React pages and components render dashboards and forms.

### Service Layer
`src/services/auth.js` and `src/services/platformService.js` talk to Supabase.

### Data Layer
Supabase PostgreSQL stores all operational data:
- profiles
- services
- bookings
- notifications
- reviews

### Real-time Layer
The app listens to database changes using `subscribeToTable()`.
When data changes in Supabase, dashboards update automatically.

## 12. Folder Structure

### `src/pages`
Contains page-level screens.

Examples:
- `src/pages/auth` for login and signup
- `src/pages/user` for customer dashboard pages
- `src/pages/worker` for worker dashboard pages
- `src/pages/admin` for admin dashboard pages

### `src/components`
Reusable UI elements like:
- dashboard layout
- status badge
- notification center
- location fields
- worker coverage fields

### `src/services`
Business and data access logic.

Important files:
- `supabase.js`: Supabase client
- `auth.js`: auth and profile persistence logic
- `platformService.js`: services, bookings, profiles, notifications, reviews, and subscriptions

### `src/context`
Shared global state.

Important files:
- `AuthContext.jsx`
- `ToastContext.jsx`

### `src/data`
Static or semi-static catalog data.

Important files:
- `serviceCatalog.js`
- `indiaLocations.js`

### `database`
SQL setup and patch scripts.

Important files:
- `fixbee_final_reset.sql`
- `fixbee_latest_patch.sql`

## 13. Routing Logic
Routing is handled in `src/App.jsx`.

Main route groups:
- `/user/...`
- `/worker/...`
- `/admin/...`

Security helpers:
- `ProtectedRoute.jsx`: blocks unauthenticated access
- `RoleRoute.jsx`: blocks users from entering dashboards of other roles

Example:
- a user cannot open admin routes
- a worker cannot open user dashboard routes unless their role allows it

## 14. Authentication Flow

### Signup
Handled through:
- `AuthContext.jsx`
- `src/services/auth.js`

Flow:
1. User fills signup form
2. Supabase Auth creates account
3. Matching profile is created or updated in `profiles`
4. User is redirected based on role

### Login
Flow:
1. Email and password are sent to Supabase Auth
2. Session is created
3. Profile is loaded from `profiles`
4. App redirects to correct dashboard

### Logout
Supabase session is cleared and local auth state is reset.

## 15. Why `AuthContext` Was Used
`AuthContext.jsx` keeps session, user, and profile data available across the whole app.

This prevents:
- repeated auth calls in every page
- prop drilling
- inconsistent role handling

It also:
- refreshes the profile
- updates profile state after save
- reacts to auth state change automatically

## 16. Profile System
The `profiles` table is the base identity table for the whole app.

Main fields:
- `id`
- `email`
- `name`
- `role`
- `phone`
- `address`
- `avatar`
- `avatar_url`

New worker workflow fields:
- `worker_application_status`
- `worker_application_note`
- `worker_application_submitted_at`
- `worker_reviewed_at`
- `worker_service_state`
- `worker_service_districts`
- `worker_service_location`
- `worker_service_place_id`
- `worker_service_latitude`
- `worker_service_longitude`
- `is_accepting_jobs`

## 17. Worker Application Workflow
This is one of the important production-style features.

Old behavior:
- anyone could sign up as worker and start using the worker dashboard

New behavior:
1. New worker signs up
2. Account is stored as a normal user profile first
3. Worker coverage details are saved
4. `worker_application_status` becomes `pending`
5. Admin reviews the request
6. Admin approves or rejects
7. If approved, profile role becomes `worker`
8. Worker dashboard becomes active

Why this is better:
- avoids fake or unverified worker access
- gives admin control
- makes the app more realistic for production

## 18. Location Logic
The app now supports structured location handling for:
- user booking location
- worker service coverage area

Supported states:
- Kerala
- Karnataka

District data is stored in:
- `src/data/indiaLocations.js`

### User Booking Location
User selects:
- state
- district
- exact location text

### Worker Coverage
Worker chooses:
- one state
- one or more districts
- base service location
- availability

### Why this logic matters
Admin can assign workers more intelligently because the app knows:
- where the booking is
- where the worker serves

## 19. Why the Google Maps UI Was Adjusted
The app had a Google Maps location input option, but the `.env` file did not contain a working `VITE_GOOGLE_MAPS_API_KEY`.

So the app was updated to:
- remove broken Google Maps branding if no key exists
- keep exact manual location entry working

Production note:
- if a valid Google Maps API key is added later, autocomplete can be enabled again

## 20. Booking System
Bookings are the core transaction in this project.

Table: `bookings`

Important fields:
- `id`
- `user_id`
- `technician_id`
- `service`
- `service_date`
- `service_time`
- `address`
- `status`
- `price`
- `notes`

### Booking statuses
- `pending`
- `assigned`
- `in_progress`
- `completed`
- `cancelled`

### Booking metadata in `notes`
The `notes` field stores JSON-like metadata such as:
- service slug
- requirement details
- urgency
- payment method
- promo code
- discount value
- customer phone
- location details
- timeline history
- reschedule request details

This design keeps the main table simple while still supporting rich booking details.

## 21. Booking Flow
1. User selects a service
2. User enters date, time, phone, location, and requirements
3. Booking is stored in Supabase
4. Status starts as `pending`
5. Admin assigns a worker
6. Worker marks progress
7. Booking finishes as `completed`
8. User can leave a review

## 22. Worker Assignment Logic
Worker assignment is handled in the admin dashboard.

Important logic:
- approved and available workers are prioritized
- workers whose coverage matches booking state/district are shown first
- assignment writes worker info into booking metadata
- notifications are sent to user and worker

This makes assignment smarter than random manual selection.

## 23. Real-time Features
This is one of the strongest parts of the project.

Real-time behavior is implemented with:
- `subscribeToTable()` in `src/services/platformService.js`

Used for:
- profiles
- bookings
- notifications
- reviews
- services

Example:
- if admin assigns a worker, the worker dashboard updates automatically
- if worker changes job status, the user sees it without refreshing
- if profile changes, the latest profile is loaded again

## 24. Notifications System
Notifications are stored in the `notifications` table.

Purpose:
- tell users about booking events
- tell workers about assignments
- tell stakeholders about status changes

Notification UI:
- `src/components/NotificationCenter.jsx`

Features:
- mark read
- mark all read
- clear all
- live insert updates through real-time subscription

## 25. Service Catalog
Services are stored in:
- `services` table
- enriched by `src/data/serviceCatalog.js`

Examples:
- Electrician
- Plumber
- Carpenter
- Kitchen Cleaning
- Deep Cleaning
- AC Service
- Painting

Why both DB and blueprint data are used:
- DB gives editable operational records
- blueprint file adds rich UI content such as highlights, reviews, FAQs, and media defaults

## 26. Reviews System
The `reviews` table stores customer feedback.

Main use:
- after a completed booking, the user can review the service
- service ratings are recalculated automatically

Why important:
- builds trust
- improves service comparison
- gives feedback loop for platform quality

## 27. Admin Dashboard Purpose
The admin dashboard is the command center.

Admin can:
- see all bookings
- assign workers
- review reschedule requests
- manage services
- manage people
- review worker applications
- view top-level analytics

This is the operational brain of the system.

## 28. Worker Dashboard Purpose
The worker dashboard is execution-focused.

Worker can:
- see assigned jobs
- update status
- request reschedule
- clear their history view
- manage profile, coverage, and availability

## 29. User Dashboard Purpose
The user dashboard is customer-focused.

User can:
- browse services
- create bookings
- see booking activity
- print invoice
- request reschedule
- cancel booking
- review completed service
- edit profile

## 30. Code Logic Behind `platformService.js`
This is the main data logic file.

It handles:
- service listing
- profile listing
- booking creation
- worker assignment
- booking updates
- notifications
- reviews
- real-time subscriptions

Why this file matters:
- it acts like a frontend service layer
- it keeps Supabase queries out of UI components
- it improves code organization and reuse

## 31. Why Service Logic Was Separated from UI
Keeping database logic inside pages would make code messy.

So service files were used to:
- centralize Supabase calls
- reduce duplication
- make pages cleaner
- improve maintainability

## 32. Why Context Was Combined with Services
`AuthContext` manages state.
Service files manage data operations.

This separation is useful because:
- auth state is global
- database operations are reusable
- UI stays simpler

## 33. Database Tables Explained

### `profiles`
Stores person identity, role, worker application, and worker coverage.

### `services`
Stores service catalog records like name, category, price, and active status.

### `bookings`
Stores all service requests and lifecycle states.

### `notifications`
Stores user-facing system messages.

### `reviews`
Stores service feedback and star ratings.

## 34. Database Functions Explained

### `new_uuid()`
Generates UUID values.

### `normalize_role()`
Converts role aliases to standard values like:
- user
- worker
- admin

### `set_updated_at()`
Automatically updates `updated_at` before record update.

### `is_admin()`
Checks whether current authenticated user is an admin.

### `clear_booking_history_for_role_items()`
Hides bookings from a specific role’s view without deleting them fully.

### `cancel_booking_for_current_role()`
Allows allowed users to cancel bookings and also appends timeline and notifications.

### `request_booking_reschedule_for_current_role()`
Creates reschedule requests from user or worker side.

### `approve_booking_reschedule_request()`
Lets admin approve requested new date/time.

### `sync_service_rating_from_reviews()`
Updates service rating and review count from review data.

### `handle_review_stats_change()`
Trigger helper to keep service ratings synced.

### `seed_auth_user()`
Creates demo users for testing and reset.

## 35. Why SQL Functions Were Used
SQL functions were used because some operations are not just simple CRUD.

Examples:
- cancel booking with timeline update
- request reschedule and notify multiple users
- approve reschedule
- sync ratings

Benefits:
- consistent business logic
- less repeated frontend logic
- secure server-side execution through Supabase RPC

## 36. Why Triggers Were Used
Triggers automate repetitive DB work.

Examples:
- auto update `updated_at`
- auto create/update profile when auth user changes
- auto update service stats when reviews change

Why this is useful:
- reduces manual mistakes
- keeps data consistent

## 37. Why Row-Level Security Was Used
RLS is a major security feature.

Examples:
- users can only read their own profile unless admin
- users can only view their own bookings
- workers can only view bookings assigned to them
- admin has elevated access

Why important:
- secure multi-user app
- prevents unauthorized data access
- better than relying only on frontend restrictions

## 38. Why Hidden Flags Were Used Instead of Hard Delete
Bookings have:
- `hidden_for_user`
- `hidden_for_worker`
- `hidden_for_admin`

Reason:
- each role can clear history from their own view
- data is not fully deleted from the database
- helps keep operational records safer

This is closer to soft-delete behavior.

## 39. Media and Storage
Supabase Storage is used for:
- avatar uploads
- service media

Why storage is separate:
- images should not be stored directly in DB rows
- storage is better for file delivery
- policies control who can upload

## 40. Analytics in Admin Overview
Admin analytics include:
- revenue closed
- active users
- worker counts
- service counts
- booking status distribution
- worker performance
- service demand

Charts are built using Recharts.

## 41. Why Lazy Loading Was Used
Pages are imported with `React.lazy()` in `App.jsx`.

Reason:
- load only required routes
- reduce initial bundle work
- improve performance

## 42. Why Framer Motion Was Used
Framer Motion improves UI quality by adding:
- smooth entry transitions
- page movement
- better dashboard feel

This makes the project look more polished in a review.

## 43. Important Reusable Components

### `DashboardLayout.jsx`
Shared dashboard shell for all roles.

### `NotificationCenter.jsx`
Live notification UI.

### `StatusBadge.jsx`
Visual status display.

### `WorkerCoverageFields.jsx`
Reusable coverage area form for signup and profile screens.

### `GoogleMapsLocationInput.jsx`
Optional exact-location input with map-based support when key exists.

## 44. Production-style Features Already Present
- role-based dashboards
- real-time sync
- booking lifecycle
- reschedule workflow
- worker approval workflow
- review system
- notifications
- soft-clear history
- avatar storage
- service management
- analytics
- route protection
- RLS security

## 45. Current Limitations
- no payment gateway integration yet
- no OTP/mobile auth
- no live worker GPS tracking
- Google Maps requires valid API key for autocomplete
- no worker self-accept or reject assignment yet
- no admin audit log
- no advanced SLA or scheduling engine

## 46. Future Scope
- payment gateway like Razorpay or Stripe
- actual map view with markers
- worker travel radius and distance-based assignment
- push notifications
- image upload for booking issue photos
- worker document verification
- OTP login
- service slot availability engine
- invoice PDF generation from backend

## 47. Why This Project Is Good for Viva
This project demonstrates:
- frontend architecture
- backend-as-a-service usage
- SQL design
- authentication
- role-based access
- real-time systems
- production logic
- database security
- reusable components
- business workflow understanding

It is not just a CRUD app. It is a workflow app.

## 48. Strong Viva Answer for “What Is Unique in Your Project?”
You can say:

“Unlike a simple booking app, my project connects customers, workers, and admins in one real-time platform. I implemented role-based dashboards, worker approval before activation, district-based worker coverage, booking status lifecycle, real-time notifications, reschedule approval flow, and row-level security using Supabase.”

## 49. Strong Viva Answer for “Why Supabase?”
You can say:

“I used Supabase because it gave me authentication, PostgreSQL, storage, SQL functions, row-level security, and real-time subscriptions in one platform. That allowed me to build a production-style app faster than creating a custom backend from scratch.”

## 50. Strong Viva Answer for “Why React?”
You can say:

“React was suitable because the app has many dynamic states, multiple roles, reusable dashboards, and frequent UI updates from real-time data. React’s component model and context API made the code modular and maintainable.”

## 51. Strong Viva Answer for “How Is It Real Time?”
You can say:

“The app uses Supabase real-time subscriptions on tables like profiles, bookings, notifications, reviews, and services. When data changes in the database, subscribed dashboards refresh automatically without manual page reload.”

## 52. Strong Viva Answer for “Why Store Booking Metadata in Notes?”
You can say:

“The booking table keeps the essential relational fields directly in columns, while flexible operational details like timeline, urgency, discount, location metadata, and reschedule requests are stored in serialized JSON inside the notes field. This gives flexibility without creating too many extra tables.”

## 53. Strong Viva Answer for “How Do You Secure Role Access?”
You can say:

“I used protected routes in React for UI-level access control and row-level security in Supabase for database-level access control. So even if someone tries to bypass the UI, the database still restricts unauthorized data access.”

## 54. Strong Viva Answer for “How Are Workers Managed?”
You can say:

“A new worker cannot directly enter the worker dashboard. They first submit a worker application with service-state and district coverage. The admin reviews and approves it. Only after approval does the role become worker, and the worker dashboard becomes active.”

## 55. Likely Viva Questions and Short Answers

### Q1. What is FixBee?
A role-based real-time home service platform for users, workers, and admins.

### Q2. What is the main aim of the project?
To digitize service booking, assignment, tracking, and operations management.

### Q3. Which frontend framework did you use?
React with Vite.

### Q4. Which backend did you use?
Supabase as backend-as-a-service.

### Q5. Which database did you use?
PostgreSQL through Supabase.

### Q6. Why not MySQL?
Supabase natively provides PostgreSQL with RLS, realtime, auth, and SQL functions, which suited this project better.

### Q7. How is authentication handled?
By Supabase Auth with profile synchronization in the `profiles` table.

### Q8. How do you separate users, workers, and admins?
By storing role in the profile and using route protection plus RLS.

### Q9. How does real-time update work?
Using Supabase Postgres change subscriptions.

### Q10. What happens when a booking is created?
It is inserted into `bookings`, metadata is stored, status is set to pending, and notifications can be sent.

### Q11. What happens when admin assigns a worker?
The worker ID is stored in booking, booking status becomes assigned, timeline is updated, and both user and worker are notified.

### Q12. How do workers update progress?
Through worker dashboard actions that change booking status in Supabase.

### Q13. How are reviews handled?
Users can review completed bookings, and service ratings update automatically through SQL logic.

### Q14. What is the use of notifications?
To provide live operational updates to users and workers.

### Q15. What security mechanisms are used?
Protected routes, RLS policies, role checks, and authenticated Supabase access.

### Q16. Why did you add worker application approval?
To prevent random worker access and make onboarding realistic and controlled.

### Q17. What is stored in the `notes` column?
Booking metadata such as timeline, urgency, promo details, and structured location data.

### Q18. What is the role of SQL triggers?
To automate repeated database tasks like timestamps and service-rating updates.

### Q19. What is the purpose of `platformService.js`?
It centralizes Supabase operations for services, bookings, profiles, notifications, and reviews.

### Q20. What would you improve next?
Payments, live map integration, worker self-acceptance, OTP auth, and advanced dispatch logic.

## 56. 2-minute Viva Summary
You can speak this in your review:

“FixBee is a real-time home service platform built using React, Vite, and Supabase. It supports three main roles: user, worker, and admin. Users can browse services, create bookings, track progress, and review completed work. Admin controls the platform by managing services, assigning workers, reviewing worker applications, and monitoring bookings. Workers can update job status, manage coverage, and receive live assignments. Supabase handles authentication, PostgreSQL database storage, storage buckets, row-level security, and real-time subscriptions. A major strength of the project is that it is not just a simple CRUD app; it includes role-based routing, booking workflow logic, notifications, reschedule approval, service reviews, and worker approval before activation.”

## 57. Final Point to Remember
If the examiner asks technical questions, always explain in this order:
1. What problem the feature solves
2. Which file or module handles it
3. How data moves from UI to database
4. How security and real-time behavior are maintained

That answer style will make your viva sound very strong.
