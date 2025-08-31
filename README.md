# 🍳 RacikResep - Recipe Management & Cost Analysis System

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/racikresep)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 📖 Description

**RacikResep** is a comprehensive recipe management and cost analysis system designed specifically for food businesses, restaurants, and culinary entrepreneurs. The application helps users manage ingredients, create recipes, calculate costs, and optimize pricing strategies to maximize profitability.

Built with modern web technologies and a focus on user experience, RacikResep provides an intuitive interface for managing all aspects of recipe development, from ingredient sourcing to final pricing decisions.

## ✨ Features

### 🥘 **Recipe Management**
- **Recipe Creation & Editing**: Build detailed recipes with multiple ingredients
- **Ingredient Quantities**: Precise measurement tracking with conversion factors
- **Recipe Categories**: Organize recipes by type, cuisine, or custom categories
- **Recipe Search & Filtering**: Quick access to recipes with advanced search
- **Recipe Export**: Export recipes in various formats for sharing

### 🥬 **Ingredient Management**
- **Ingredient Database**: Comprehensive ingredient catalog with pricing
- **SKU System**: Automatic and manual SKU generation for inventory tracking
- **Price History**: Track ingredient price changes over time
- **Unit Conversions**: Handle different measurement units seamlessly
- **Bulk Operations**: Import/export ingredients, bulk category changes, deletions

### 💰 **Cost Analysis & Pricing**
- **COGS Calculation**: Automatic cost of goods sold computation
- **Profit Margin Analysis**: Calculate optimal pricing strategies
- **Selling Price Simulation**: Test different pricing scenarios
- **Shopping Calculator**: Optimize ingredient purchases
- **Decimal Formatting**: Customizable currency and number formatting

### 🏪 **Business Management**
- **Business Profile**: Manage business information and branding
- **Sales Channels**: Track different sales channels with commission rates
- **Category Management**: Organize ingredients and recipes by categories
- **Unit Management**: Custom measurement units for your business needs

### 🎨 **User Experience**
- **Dark/Light Mode**: Beautiful theme switching with system preference detection
- **Responsive Design**: Mobile-first design that works on all devices
- **Modern UI/UX**: Clean, intuitive interface built with Radix UI
- **Real-time Updates**: Instant feedback and data synchronization
- **Toast Notifications**: User-friendly feedback for all operations

### 🔐 **Security & Authentication**
- **User Authentication**: Secure login system with NextAuth.js
- **Business Isolation**: Multi-tenant architecture for data security
- **Role-based Access**: User permission management
- **Data Validation**: Comprehensive input validation and sanitization

### 📊 **Analytics & Reporting**
- **Dashboard Analytics**: Business overview with key metrics
- **Activity Logging**: Track all system activities and changes
- **Data Export**: Export data in CSV and Excel formats
- **Performance Metrics**: Monitor business performance over time

## 🚀 Version 1.0.0 - Release Notes

### 🎯 **Major Features**
- Complete recipe and ingredient management system
- Advanced cost analysis and pricing tools
- Comprehensive business management features
- Modern, responsive user interface
- Dark/Light theme system
- Bulk operations for data management

### 🔧 **Technical Improvements**
- Built with Next.js 15 and React 19
- TypeScript for type safety
- Radix UI components for accessibility
- Tailwind CSS for modern styling
- Prisma ORM for database management
- SQLite database for easy deployment

### 📱 **User Experience**
- Mobile-first responsive design
- Intuitive navigation and workflows
- Real-time data updates
- Comprehensive error handling
- Accessibility compliance

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 15.5.0** - React framework with App Router
- **React 19.1.0** - Latest React with concurrent features
- **TypeScript 5.0** - Type-safe JavaScript development
- **Tailwind CSS 4.0** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Radix Icons** - Beautiful, consistent iconography

### **Backend & Database**
- **Next.js API Routes** - Serverless API endpoints
- **Prisma 6.14.0** - Modern database ORM
- **SQLite** - Lightweight, file-based database
- **NextAuth.js 4.24.11** - Authentication solution

### **Development Tools**
- **ESLint** - Code quality and consistency
- **Turbopack** - Fast bundler for development
- **PostCSS** - CSS processing and optimization
- **TypeScript** - Static type checking

### **Additional Libraries**
- **React Hot Toast** - Toast notifications
- **Recharts** - Data visualization
- **Date-fns** - Date manipulation
- **UUID** - Unique identifier generation
- **XLSX** - Excel file handling
- **jsPDF** - PDF generation

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js 18.17** or higher
- **npm** or **yarn** package manager
- **Git** for version control

## 🚀 Getting Started

### 1. **Clone the Repository**
```bash
git clone https://github.com/yourusername/racikresep.git
cd racikresep
```

### 2. **Install Dependencies**
```bash
npm install
# or
yarn install
```

### 3. **Environment Setup**
Create a `.env.local` file in the root directory:
```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Business Settings
NEXT_PUBLIC_APP_NAME="RacikResep"
```

### 4. **Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Open Prisma Studio
npx prisma studio
```

### 5. **Start Development Server**
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
racikresep/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard page
│   │   ├── ingredients/       # Ingredients management
│   │   ├── recipes/           # Recipe management
│   │   ├── settings/          # Application settings
│   │   └── simulation/        # Pricing simulation
│   ├── components/            # Reusable components
│   │   ├── ui/               # Base UI components
│   │   ├── forms/            # Form components
│   │   ├── layout/           # Layout components
│   │   └── ingredients/      # Ingredient-specific components
│   ├── contexts/              # React contexts
│   ├── lib/                   # Utility functions
│   └── types/                 # TypeScript type definitions
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
└── docs/                      # Documentation
```

## 🔧 Available Scripts

- **`npm run dev`** - Start development server with Turbopack
- **`npm run build`** - Build production application
- **`npm run start`** - Start production server
- **`npm run lint`** - Run ESLint for code quality

## 🌟 Key Features in Detail

### **Recipe Management System**
- Create recipes with unlimited ingredients
- Automatic cost calculation based on ingredient prices
- Recipe categorization and tagging
- Export recipes in multiple formats
- Recipe search and filtering

### **Ingredient Cost Tracking**
- Real-time price updates
- Historical price tracking
- Bulk import/export functionality
- SKU generation and management
- Unit conversion handling

### **Business Intelligence**
- Dashboard with key performance indicators
- Cost analysis and profit margin calculations
- Pricing simulation tools
- Sales channel management
- Activity logging and audit trails

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the amazing React framework
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for the utility-first CSS framework
- **Prisma Team** for the modern database ORM
- **Vercel** for hosting and deployment solutions

## 📞 Support

- **Documentation**: [Wiki](https://github.com/yourusername/racikresep/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/racikresep/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/racikresep/discussions)
- **Email**: support@racikresep.com

---

**Made with ❤️ for the culinary community**

*RacikResep v1.0.0 - Empowering food businesses with smart recipe management*
