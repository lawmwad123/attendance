# 🏫 Attendly Website Structure

## Overview

The Attendly website is a comprehensive landing page and registration system for the School Attendance Management System. It provides a modern, user-friendly interface for schools to learn about, register for, and access the platform.

## 🏗️ Architecture

### Multi-Tenant System
- **Subdomain-based tenancy**: Each school gets their own subdomain (e.g., `school1.attendly.com`)
- **Header-based tenancy**: API clients can use `X-Tenant-ID` header
- **Row-level isolation**: Complete data separation between schools

### Technology Stack
- **Frontend**: React.js + TypeScript + Vite
- **Styling**: TailwindCSS
- **State Management**: Redux Toolkit
- **API Client**: Axios with TanStack Query
- **Routing**: React Router DOM
- **UI Components**: Lucide React icons + custom components

## 📄 Page Structure

### 1. Landing Page (`/`)
**File**: `src/pages/LandingPage.tsx`

**Features**:
- Hero section with compelling headline and CTAs
- Key features showcase (6 main features)
- Pricing plans (Free Trial, Standard, Enterprise)
- Call-to-action sections
- Footer with links and contact info

**Navigation**:
- About, Contact, Login, Register School

### 2. School Registration (`/register`)
**File**: `src/pages/RegisterPage.tsx`

**Features**:
- Comprehensive school information form
- Admin account creation
- Real-time slug availability checking
- Form validation and error handling
- Auto-generation of school URL from name

**Form Sections**:
- School Information (name, slug, contact details, address)
- Administrator Account (personal details, credentials)
- Settings (timezone, school hours)

### 3. Login Page (`/login`)
**File**: `src/pages/LoginPage.tsx`

**Features**:
- Multi-tenant login with school URL input
- Email and password authentication
- Demo credentials for testing
- Link to registration page

**Multi-Tenant Support**:
- School URL input (e.g., "demo" for demo.attendly.com)
- Automatic tenant context setting
- Integration with existing auth system

### 4. About Page (`/about`)
**File**: `src/pages/AboutPage.tsx`

**Features**:
- Company mission and values
- What we do section
- Core values (Security, User-Centered Design, Reliability)
- Call-to-action section

### 5. Contact Page (`/contact`)
**File**: `src/pages/ContactPage.tsx`

**Features**:
- Contact form with validation
- Contact information (email, phone, address)
- FAQ section
- Call-to-action section

## 🔐 Authentication Flow

### Registration Flow
1. User visits landing page
2. Clicks "Register Your School"
3. Fills out comprehensive registration form
4. System creates school and admin account
5. Redirects to login page

### Login Flow
1. User enters school URL (slug)
2. User enters email and password
3. System sets tenant context
4. Authenticates with backend
5. Redirects to dashboard

### Multi-Tenant Access
- **Development**: Uses query parameter `?tenant=demo`
- **Production**: Uses subdomain `demo.attendly.com`
- **API**: Uses `X-Tenant-ID` header

## 🎨 Design System

### Color Palette
- **Primary**: Indigo (#4F46E5)
- **Secondary**: Gray scale
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Danger**: Red (#EF4444)

### Typography
- **Headings**: Bold, large text
- **Body**: Regular weight, readable
- **UI Elements**: Medium weight

### Components
- **Cards**: White background, subtle shadow, rounded corners
- **Buttons**: Primary (indigo), Secondary (gray), Outline (bordered)
- **Forms**: Clean inputs with focus states
- **Navigation**: Consistent header across all pages

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile-First Approach
- All pages are mobile-responsive
- Touch-friendly interface
- Optimized navigation for mobile devices

## 🔧 Configuration

### Environment Variables
```env
VITE_API_BASE_URL=http://localhost:8000
```

### API Integration
- Base URL configuration
- Automatic tenant header injection
- Error handling and retry logic
- Authentication token management

## 🚀 Deployment

### Build Process
```bash
npm run build
```

### Static Assets
- Optimized for CDN deployment
- Compressed images and assets
- SEO-friendly structure

### Hosting Recommendations
- **Vercel**: Excellent for React apps
- **Netlify**: Great for static sites
- **AWS S3 + CloudFront**: Enterprise solution

## 📊 Analytics & SEO

### SEO Features
- Meta tags for all pages
- Structured data markup
- Clean URLs and navigation
- Fast loading times

### Analytics Integration
- Google Analytics ready
- Conversion tracking
- User behavior analysis

## 🔒 Security Considerations

### Frontend Security
- Input validation and sanitization
- XSS prevention
- CSRF protection
- Secure authentication flow

### Data Protection
- No sensitive data stored in localStorage
- Secure token handling
- HTTPS enforcement

## 🧪 Testing

### Manual Testing Checklist
- [ ] Landing page loads correctly
- [ ] Registration form validation works
- [ ] Login with different tenants
- [ ] Responsive design on all devices
- [ ] Navigation between pages
- [ ] Form submissions work
- [ ] Error handling displays properly

### Automated Testing
- Unit tests for components
- Integration tests for forms
- E2E tests for user flows

## 📈 Future Enhancements

### Planned Features
- **Blog/Resources**: Content marketing
- **Pricing Calculator**: Interactive pricing tool
- **Live Chat**: Customer support integration
- **Demo Video**: Product walkthrough
- **Testimonials**: Customer success stories
- **Multi-language**: Internationalization

### Technical Improvements
- **Performance**: Code splitting and lazy loading
- **Accessibility**: WCAG compliance
- **PWA**: Progressive Web App features
- **Analytics**: Advanced tracking and insights

## 📞 Support

For technical support or questions about the website:
- **Email**: hello@attendly.com
- **Documentation**: This file and inline comments
- **Issues**: GitHub issues repository

---

*Last updated: December 2024*
