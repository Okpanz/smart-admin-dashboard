# Smart Admin Dashboard

A modern, responsive web dashboard built with React, Vite, and Tailwind CSS for managing the Smart Verify system.

## Prerequisites

- **Node.js**: v18 or higher.
- **npm**: Comes with Node.js.

## Installation

1.  Navigate to the project directory:
    ```bash
    cd smart-admin-dashboard
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Configuration

1.  Create a `.env` file in the root directory if one doesn't exist.
2.  Configure the backend API URL:

    ```env
    VITE_API_URL=http://localhost:7001/api
    ```

    *Note: Ensure this matches the running instance of `smart-verify-server`.*

## Running the Dashboard

### Development Mode
To start the development server:

```bash
npm run dev
```
The application will typically run at `http://localhost:5173`.

### Production Build
To build the application for production:

```bash
npm run build
```
To preview the production build locally:
```bash
npm run preview
```

## Key Features

- **Dashboard Overview**: Visual statistics of enrollments and activities.
- **Enrollment Management**: View, approve, or reject enrollments.
- **Audit Logs**: Track system activities and user actions.
- **Service Management**: Manage departmental services.
- **Staff Management**: Administer system users and roles.

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Icons**: Lucide React
