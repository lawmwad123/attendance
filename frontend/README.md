# 🎨 School Attendance Management System - Frontend

A modern React.js web dashboard for the multi-tenant school attendance management system. Built with TypeScript, Redux Toolkit, TanStack Query, and Tailwind CSS.

## 🌟 Features

### 🎨 **Modern UI/UX**
- **Clean Design**: Modern, responsive interface with TailwindCSS
- **Smooth Animations**: Fade-in effects and smooth transitions
- **Mobile Responsive**: Works perfectly on all device sizes
- **Accessibility**: WCAG compliant with proper ARIA labels

### 🏢 **Multi-Tenant Support**
- **Subdomain Detection**: Automatic tenant detection from subdomains
- **Header-based Tenancy**: Support for X-Tenant-ID header
- **Dynamic Branding**: School-specific branding and settings

### 🔐 **Authentication & Authorization**
- **JWT-based Auth**: Secure token-based authentication
- **Role-based Access**: Different interfaces for Admin, Teacher, Parent, Security
- **Protected Routes**: Automatic redirection for unauthorized access
- **Session Management**: Persistent login with localStorage

### 📊 **Dashboard Features**
- **Real-time Stats**: Live attendance statistics and metrics
- **Quick Actions**: Easy access to common tasks
- **Responsive Layout**: Collapsible sidebar with mobile support
- **Notifications**: Real-time alerts and updates

## 🛠️ Technology Stack

### **Core Framework**
- **React 18**: Latest React with concurrent features
- **TypeScript**: Full type safety and better developer experience
- **Vite**: Fast build tool and development server

### **State Management**
- **Redux Toolkit**: Modern Redux with less boilerplate
- **TanStack Query**: Powerful data fetching and caching
- **React Router**: Client-side routing with protected routes

### **Styling & UI**
- **Tailwind CSS**: Utility-first CSS framework
- **Custom Design System**: Consistent colors, typography, and components
- **Lucide React**: Beautiful, customizable icon library
- **CSS Animations**: Smooth transitions and loading states

### **Developer Experience**
- **ESLint**: Code linting and formatting
- **TypeScript**: Static type checking
- **Hot Reload**: Instant development feedback

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running (see backend README)

### Installation

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Create .env file
echo "VITE_API_BASE_URL=http://localhost:8000" > .env
echo "VITE_DEFAULT_TENANT=demo" >> .env
```

4. **Start development server**
```bash
npm run dev
```

5. **Open in browser**
```
http://localhost:5173
```

### Demo Access
- **URL**: http://localhost:5173?tenant=demo
- **Email**: admin@demo-school.com
- **Password**: admin123

## 📱 Usage

### Multi-Tenant Access

#### Method 1: Query Parameter (Development)
```
http://localhost:5173?tenant=demo
```

#### Method 2: Header (API Testing)
Add header: `X-Tenant-ID: demo`

#### Method 3: Subdomain (Production)
```
https://demo.your-domain.com
```

### Navigation

The dashboard includes the following sections:

- **🏠 Dashboard**: Overview and quick stats
- **👥 Users**: Manage teachers, parents, and staff
- **🎓 Students**: Student profiles and information
- **✅ Attendance**: Track and manage attendance
- **🛡️ Gate Pass**: Entry/exit permissions
- **📊 Analytics**: Reports and insights
- **⚙️ Settings**: School and system configuration

### User Roles

#### 👨‍💼 **School Admin**
- Full access to all features
- User management
- School settings
- Analytics and reports

#### 👩‍🏫 **Teacher**
- Student management
- Attendance tracking
- Gate pass requests
- Class-specific analytics

#### 👨‍👩‍👧‍👦 **Parent**
- View child's attendance
- Approve gate pass requests
- Receive notifications
- Limited analytics

#### 🛡️ **Security Guard**
- Gate pass verification
- Entry/exit tracking
- Security alerts
- Basic reporting

## 🏗️ Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   └── layouts/       # Layout components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and API client
│   ├── pages/             # Page components
│   ├── store/             # Redux store and slices
│   │   └── slices/       # Redux slices
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # App entry point
│   └── index.css         # Global styles
├── package.json          # Dependencies and scripts
├── tailwind.config.js    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000

# App Environment
VITE_APP_ENV=development

# Default Tenant (for development)
VITE_DEFAULT_TENANT=demo
```

### Tailwind CSS

The project uses a custom design system built on Tailwind CSS:

```css
/* Custom color palette */
- primary: Blue (primary actions, links)
- secondary: Gray (text, borders, backgrounds)
- success: Green (positive actions, success states)
- warning: Amber (warnings, pending states)
- danger: Red (errors, destructive actions)
```

## 🚦 Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## 📱 Responsive Design

The application is fully responsive with breakpoints:

- **Mobile**: < 768px (Collapsible sidebar, stacked layout)
- **Tablet**: 768px - 1024px (Responsive grid, compact navigation)
- **Desktop**: > 1024px (Full sidebar, optimal layout)

## 🔌 API Integration

### Authentication Flow
1. User submits login credentials
2. Frontend sends request to `/api/v1/auth/login`
3. Backend returns JWT token and user data
4. Token stored in localStorage
5. Token included in all subsequent requests

### Multi-Tenant Headers
```javascript
// Automatic tenant detection and header injection
headers: {
  'Authorization': `Bearer ${token}`,
  'X-Tenant-ID': 'demo',
  'Content-Type': 'application/json'
}
```

### Error Handling
- **401 Unauthorized**: Automatic logout and redirect to login
- **403 Forbidden**: Error message with proper user feedback
- **500 Server Error**: Retry mechanism with exponential backoff

## 🧪 Testing

```bash
# Run unit tests (when implemented)
npm run test

# Run E2E tests (when implemented)
npm run test:e2e

# Coverage report
npm run test:coverage
```

## 📦 Building for Production

```bash
# Create production build
npm run build

# Files will be generated in dist/
# Deploy dist/ folder to your hosting provider
```

### Production Optimization
- **Code Splitting**: Automatic route-based code splitting
- **Tree Shaking**: Removes unused code
- **Asset Optimization**: Optimized images and fonts
- **Gzip Compression**: Smaller bundle sizes

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify
```bash
# Build and deploy
npm run build
# Drag dist/ folder to Netlify
```

### Traditional Hosting
```bash
# Build the project
npm run build

# Upload dist/ folder to your web server
```

## 🔮 Future Enhancements

### Phase 2 (Planned)
- [ ] Real-time notifications with WebSockets
- [ ] Advanced search and filtering
- [ ] Bulk operations for attendance
- [ ] Export functionality (PDF, Excel)
- [ ] Dark mode support

### Phase 3 (Future)
- [ ] PWA support with offline functionality
- [ ] Advanced analytics with charts
- [ ] Custom dashboard widgets
- [ ] Multi-language support (i18n)
- [ ] Advanced role-based permissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for educational institutions worldwide**
