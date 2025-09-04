# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**RacikResep** is a comprehensive recipe management and cost analysis system built for food businesses, restaurants, and culinary entrepreneurs. It helps manage ingredients, create recipes, calculate costs, and optimize pricing strategies.

## Technology Stack

- **Framework**: Next.js 15.5.0 with App Router
- **Runtime**: React 19.1.0
- **Language**: TypeScript 5.0
- **Database**: SQLite with Prisma ORM 6.15.0
- **Authentication**: NextAuth.js 4.24.11
- **Styling**: Tailwind CSS 4.0
- **UI Components**: Radix UI primitives
- **Build Tool**: Turbopack (for dev and build)

## Development Commands

### Core Development
```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### Database Management
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Apply database schema changes to SQLite
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (destructive)
npx prisma db push --force-reset

# Run database seeds (if available)
npx prisma db seed
```

### Testing Database Setup
```bash
# Create .env.local for development
echo 'DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="RacikResep"' > .env.local
```

## Architecture Overview

### Database Schema Architecture
The application uses a comprehensive multi-tenant architecture with business isolation:

- **User Management**: Users belong to a Business with role-based access
- **Business Entities**: Each business has isolated data for ingredients, recipes, categories, units
- **Recipe System**: Complex recipe management with sub-recipes, cost calculations, and multiple pricing channels
- **Price Management**: Comprehensive price history tracking for both ingredients and recipes
- **Sales Channels**: Multi-channel pricing with commission calculations
- **Settings**: Customizable SKU generation and decimal formatting per business

### Application Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (REST endpoints)
│   │   ├── auth/          # Authentication endpoints
│   │   ├── ingredients/   # Ingredient management
│   │   ├── recipes/       # Recipe management
│   │   ├── business/      # Business profile
│   │   └── settings/      # Application settings
│   ├── dashboard/         # Main dashboard
│   ├── ingredients/       # Ingredient management UI
│   ├── recipes/           # Recipe management UI
│   └── settings/          # Settings UI
├── components/            # Reusable React components
│   ├── ui/               # Base UI components (Radix-based)
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── [domain]/         # Domain-specific components
├── lib/                   # Utility functions and configurations
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Database client
│   └── utils.ts          # General utilities
└── types/                 # TypeScript definitions
```

### Key Architectural Patterns

1. **Multi-tenant SaaS Architecture**: Each business has isolated data through `businessId` foreign keys
2. **API-first Design**: All data operations go through API routes in `/src/app/api/`
3. **Component Composition**: Heavy use of Radix UI primitives with custom styling
4. **Price History Tracking**: Comprehensive audit trails for all price changes
5. **Complex Cost Calculations**: COGS calculations with labor, operational, and packaging costs

### Data Flow Patterns

- **Authentication Flow**: NextAuth.js with credentials provider → JWT sessions → business context
- **CRUD Operations**: Form submissions → API routes → Prisma operations → Database
- **Real-time Updates**: Toast notifications for user feedback
- **Bulk Operations**: Specialized endpoints for bulk ingredient/recipe operations

## Development Guidelines

### Database Operations
- Always include `businessId` in queries for data isolation
- Use Prisma transactions for complex operations involving multiple tables
- Price updates should always create history records
- SKU generation follows customizable patterns per business

### API Development
- API routes follow RESTful conventions
- Use proper HTTP status codes (200, 201, 400, 404, 500)
- Include proper error handling with descriptive messages
- Validate all inputs using TypeScript and runtime validation

### Component Development
- Use Radix UI primitives as the foundation for all UI components
- Follow the established component structure in `/src/components/ui/`
- Implement proper loading states and error boundaries
- Use Tailwind CSS utility classes with the custom design system

### Authentication Context
- All authenticated routes require session validation
- Business context is available through session.user.business
- Protected API routes should verify user belongs to the business

## Key Business Logic

### Cost Calculation System
The application calculates costs at multiple levels:
- **Ingredient Cost Per Unit**: Based on purchase price and package size
- **Recipe COGS**: Sum of all ingredient costs + labor + operational + packaging
- **Multi-channel Pricing**: Different prices per sales channel with commission calculations

### SKU Management
- Automatic SKU generation with customizable prefixes and numbering
- Supports both ingredients and recipes
- Business-specific configuration for format and numbering

### Price History Tracking
- All price changes are tracked with timestamps, old/new values, and percentage changes
- Supports both ingredient and recipe price history
- Channel-specific price history for multi-channel sales

## Common Development Tasks

### Adding New Business Entities
1. Update Prisma schema with businessId relationships
2. Create API routes with proper business isolation
3. Add form components with validation
4. Update relevant UI pages

### Implementing New Pricing Features
1. Extend relevant price history models
2. Update cost calculation logic in API routes
3. Add UI components for price management
4. Ensure proper audit trail creation

### Database Schema Changes
1. Modify `prisma/schema.prisma`
2. Run `npx prisma db push` for development
3. Update TypeScript types if needed
4. Test with `npx prisma studio`

## Environment Setup

The application requires these environment variables:
- `DATABASE_URL`: SQLite database path
- `NEXTAUTH_SECRET`: JWT signing secret
- `NEXTAUTH_URL`: Application URL for NextAuth callbacks
- `NEXT_PUBLIC_APP_NAME`: Application name for branding

## Database Backup and Migration

For production deployments:
```bash
# Backup SQLite database
cp prisma/dev.db prisma/backup-$(date +%Y%m%d).db

# For production migrations, use proper migration files
npx prisma migrate dev --name descriptive_migration_name
```

## Performance Considerations

- Database queries include proper indexes on businessId and frequently queried fields
- Use Prisma's `include` selectively to avoid over-fetching
- Implement proper pagination for large datasets
- Use React's loading states for better UX during API calls
