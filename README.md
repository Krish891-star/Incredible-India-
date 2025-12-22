# Incredible India Tourism Platform

## Project Overview

This is a comprehensive tourism platform for India that connects tourists with hotels, tour guides, and attractions. The platform features role-based access control with four user types: Tourists, Hotel Managers, Tour Guides, and Administrators.

## Backup System

This platform includes a robust JSON backup system that ensures user registration data is never lost, even when the primary Supabase database is temporarily unavailable. The backup system provides:

- Automatic backup of all user registration data
- Seamless fallback mechanism when Supabase is down
- Administrative dashboard for monitoring and managing backups
- Data export functionality for offline storage
- Real-time data display for immediate visibility

For detailed information about the backup system, see [BACKUP_SYSTEM.md](BACKUP_SYSTEM.md).

## Key Features

## Key Features

### For Hotel Managers
- **Complete Hotel Registration**: Register hotels with detailed information including:
  - Basic information (name, type, contact details)
  - Location details with map coordinates
  - Amenities selection
  - Room types and pricing
  - Photo gallery
  - **Nearby Attractions Linking**: Connect hotels to nearby monuments and tourist attractions
  - OTP verification for contact information

- **Admin Approval Workflow**: All hotels require admin approval before going live
- **Instant Visibility**: Once approved, hotels appear immediately in:
  - Hotel listings
  - Search results
  - Interactive map views

### For Tourists
- **Easy Discovery**: Find hotels near monuments and attractions
- **Interactive Maps**: View exact locations on free OpenStreetMap-based maps
- **Distance & Travel Time**: Calculate distance and vehicle-based travel time to attractions
- **Comparison Tools**: Compare prices and availability across different hotels
- **Booking System**: Simple and secure hotel booking process

### For Administrators
- **Approval Dashboard**: Review and approve/reject hotel and guide registrations
- **User Management**: Manage all platform users and their roles
- **Content Oversight**: Ensure quality and accuracy of listings

### Technical Features
- **Strict RBAC**: Role-based access control ensures appropriate permissions for each user type
- **Real-time Updates**: All changes reflect instantly on the frontend
- **Secure Authentication**: Email-only authentication system
- **Production Ready**: Fast, secure, and scalable architecture

## Technologies Used

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Puter.js (Cloud infrastructure)
- Google Maps API / OpenStreetMap

## How to Run

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```