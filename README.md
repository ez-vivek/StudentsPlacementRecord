
# Student Placement Record

This is a full-stack web application designed to manage student placement records. It provides a platform for students to view job openings and for admins to manage student applications and job postings.

## Features

- **User Authentication:** Secure login for students and admins.
- **Dashboard:** Separate dashboards for students and admins to view relevant information.
- **Job Postings:** Admins can create, update, and delete job postings.
- **Job Applications:** Students can apply for jobs and track their application status.
- **Student Management:** Admins can manage student records and track their placement status.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Shadcn UI
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Supabase

## Project Structure

```
.
├── client/         # Frontend React application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Application pages
│   │   ├── App.tsx     # Main application component
│   │   └── main.tsx    # Entry point for the React app
├── server/         # Backend Express application
│   ├── app.ts      # Express app configuration
│   ├── routes.ts   # API routes
│   └── index-dev.ts  # Development server entry point
├── shared/         # Shared code between frontend and backend
│   └── schema.ts   # Database schema
├── drizzle.config.ts # Drizzle ORM configuration
├── package.json      # Project dependencies and scripts
└── README.md         # This file
```

## Getting Started

### Prerequisites

- Node.js (v20.x or later)
- npm
- Supabase account for database and authentication

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ez-vivek/StudentsPlacementRecord
   cd StudentsPlacementRecord
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the root of the project and add the following environment variables:

   ```
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
   DATABASE_URL=<your-supabase-postgres-connection-string>
   ```

### Database Setup

1. **Set up the database schema:**
   The `db-setup.sql` file contains the initial database schema. You can run this file in your Supabase SQL editor.

2. **Push database schema changes:**
   Whenever you make changes to the schema in `shared/schema.ts`, run the following command to push the changes to the database:
   ```bash
   npm run db:push
   ```

### Running the Application

- **Development:**
  ```bash
  npm run dev
  ```
  This will start the backend server and the frontend development server concurrently.

- **Production Build:**
  ```bash
  npm run build
  ```
  This will build the frontend and backend for production.

- **Start in Production:**
  ```bash
  npm run start
  ```
  This will start the application in production mode.

## Available Scripts

- `dev`: Starts the development server.
- `build`: Builds the application for production.
- `start`: Starts the production server.
- `check`: Runs TypeScript type checking.
- `db:push`: Pushes database schema changes to the database.
