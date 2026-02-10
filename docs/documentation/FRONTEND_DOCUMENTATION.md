# PC Store Manager - Frontend Documentation

## Project Overview

A modern Angular 20 frontend for a PC Store management system featuring authentication, a dashboard, and a multi-step registration flow. Built with a purple minimalist design theme.

---

## Components Created

### 1. **Dashboard Component**
**Location:** `src/app/dashboard/`

#### Files:
- `dashboard.ts` - Component logic
- `dashboard.html` - Template
- `dashboard.css` - Styling

#### Features:
- **Stats Grid**: Displays 4 key metrics with icons
  - Total Products
  - Total Sales
  - Active Orders
  - Customers
  
- **Recent Activity Panel**: Shows timestamped activity logs
  - Order received
  - Product restocked
  - Customer reviews
  - Payment processed

- **Quick Actions Panel**: Fast navigation to main features
  - Add Product
  - View Orders
  - View Reports
  - Settings

#### Mock Data Structure:
```typescript
stats = [
  { title: string, value: number | string, icon: string, color: string }
]

activities = [
  { id: number, description: string, timestamp: string, type: string }
]
```

#### Integration Points:
Replace mock data in `loadDashboardData()` method with actual API calls:
```typescript
// Example:
this.stats = await this.apiService.getStats();
this.activities = await this.apiService.getActivities();
```

---

### 2. **Login Component**
**Location:** `src/app/auth/login/`

#### Files:
- `login.ts` - Component logic
- `login.html` - Template
- `login.css` - Styling

#### Features:
- Simple, clean login form
- Username and password fields
- Error message display
- Navigation to registration
- Loading state on submit
- Auto-redirect to dashboard on success

#### Key Methods:
```typescript
login(): void
// Validates form and sends credentials to backend
// Redirects to dashboard on success

goToRegister(): void
// Navigates to registration page
```

#### Integration:
Current implementation simulates API call with 1-second delay. Replace with:
```typescript
this.authService.login(this.username, this.password)
  .subscribe({
    next: (token) => this.router.navigate(['/dashboard']),
    error: (err) => this.errorMessage = err.message
  });
```

---

### 3. **Registration Component** ⭐ Multiple Steps
**Location:** `src/app/auth/register/`

#### Files:
- `register.ts` - Component logic with state management
- `register.html` - Multi-step template
- `register.css` - Styling

#### Step-by-Step Flow:

**Step 1: Role Selection**
- Choose between Admin or Worker roles
- Visual card-based selection
- Validation: Role must be selected

**Step 2: Credentials**
- Username (min 3 characters)
- Password (min 6 characters)
- Confirm password (must match)
- Validation: All fields required, password match

**Step 3: Personal Information**
- Full Name (required)
- Email Address (email validation)
- Validation: Standard email format check

**Step 4: Review & Confirm**
- Display summary of all entered information
- Terms of Service notice
- Submit button

#### Progress Bar Implementation:
```typescript
get progressPercentage(): number {
  return ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
}
```
- Dynamic width calculation
- Smooth CSS transitions
- Step indicators with checkmarks

#### Form Data Structure:
```typescript
formData: RegistrationData = {
  role: string,
  username: string,
  password: string,
  confirmPassword: string,
  email: string,
  fullName: string
}
```

#### Key Methods:
```typescript
nextStep(): void
// Validates current step before advancing

prevStep(): void
// Moves to previous step

validateStep(step: number): boolean
// Step-specific validation

selectRole(role: string): void
// Sets selected role

submitRegistration(): void
// Final submission with redirect to dashboard

isValidEmail(email: string): boolean
// Email format validation
```

---

## Routing Configuration

**Location:** `src/app/app.routes.ts`

```typescript
const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  }
];
```

**Flow:**
- Default route → Login page
- New users → Registration (4 steps)
- After auth → Dashboard
- Navbar only shows on dashboard

---

## Navigation & Layout

**Location:** `src/app/app.ts` and `src/app/app.html`

#### Features:
- Conditional navbar rendering (hidden on login/register)
- Navigation menu with links:
  - Dashboard
  - Products
  - Orders
  - Analytics
  - Settings

- Responsive mobile menu with hamburger toggle
- Purple color scheme `#7c3aed`

#### App Component Logic:
```typescript
showNavbar: boolean
// Tracks current route to show/hide navbar

toggleNav(): void
// Opens/closes mobile menu

navigate(path: string): void
// Navigates and closes mobile menu
```

---

## Styling Approach

### CSS Architecture:
- **Pure CSS** (no frameworks like Tailwind for stability)
- **CSS Variables** for theming
- **Responsive Design** with media queries
- **Smooth Transitions** for better UX

### Color Scheme:
```css
--primary: #7c3aed (Purple)
--primary-dark: #6d28d9
--background: #fafbfc (Light Gray)
--text-primary: #0f172a (Dark)
--text-secondary: #64748b (Gray)
--border: #e2e8f0 (Light Border)
--error: #dc2626 (Red)
```

### Files:
- `src/styles.css` - Global styles
- `src/app/app.css` - Navigation styling
- `src/app/dashboard/dashboard.css` - Dashboard styling
- `src/app/auth/login/login.css` - Login styling
- `src/app/auth/register/register.css` - Registration styling

---

## File Structure

```
src/
├── app/
│   ├── app.ts                    # Root component
│   ├── app.html                  # Root template (layout wrapper)
│   ├── app.css                   # Navigation styles
│   ├── app.routes.ts             # Route configuration
│   │
│   ├── dashboard/
│   │   ├── dashboard.ts
│   │   ├── dashboard.html
│   │   └── dashboard.css
│   │
│   ├── auth/
│   │   ├── login/
│   │   │   ├── login.ts
│   │   │   ├── login.html
│   │   │   └── login.css
│   │   │
│   │   └── register/
│   │       ├── register.ts
│   │       ├── register.html
│   │       └── register.css
│   │
│   └── main.ts
│
├── styles.css                    # Global styles
└── index.html
```

---

## Key Features

### 🎨 Design System
- **Purple Theme**: Primary color `#7c3aed` consistently applied
- **Minimalist Cards**: Clean white cards with subtle borders
- **No Heavy Shadows**: Light shadows only for depth
- **Responsive**: Fully responsive from mobile to desktop

### 🔐 Authentication Flow
1. User lands on login page
2. Can register using 4-step form
3. Role-based registration (Admin/Worker)
4. After successful login → Dashboard access
5. Navigation appears only when authenticated

### 📊 Dashboard Features
- Real-time stats display
- Activity timeline
- Quick action buttons for common tasks
- Extensible for more panels/widgets

### ✅ Form Validation
- **Step 1**: Role required
- **Step 2**: Username (3+ chars), password (6+ chars), match confirmation
- **Step 3**: Full name required, valid email format
- Real-time error messages

### 📱 Responsive Design
- **Desktop**: Full layout with sidebar navigation
- **Tablet**: Adjusted grid columns
- **Mobile**: Hamburger menu, stacked layouts

---

## How to Extend

### Adding a New Page/Feature:
1. Create new component: `src/app/features/my-feature/`
2. Add files: `my-feature.ts`, `my-feature.html`, `my-feature.css`
3. Import in `app.routes.ts` and add route
4. Add navigation link in `app.html` if needed

### Connecting to Backend:
1. Create a service: `src/app/services/api.service.ts`
2. Use HttpClient to make requests
3. Replace mock data with API calls in components
4. Add error handling and loading states

### Customizing Theme:
- All colors defined in component CSS files
- Search for `#7c3aed` (purple) to change primary color
- Update background gradients in `css` files

---

## Current State Note

### Mock Data:
- Login accepts any credentials (demo mode)
- Dashboard shows sample statistics
- Registration doesn't actually create accounts yet

### To Enable Backend Integration:
1. Create backend API endpoint
2. Implement authentication service
3. Add JWT token storage
4. Implement route guards
5. Update components to use real API calls

---

## Performance Notes

- ✅ Lightweight (no heavy dependencies)
- ✅ Fast load times (pure CSS, minimal JS)
- ✅ Smooth animations (CSS transitions)
- ✅ Responsive images (emoji icons for demo)

---

## Browser Support

- Chrome/Chromium (Latest)
- Firefox (Latest)
- Safari (Latest)
- Edge (Latest)

---

## Dependencies Used

```json
{
  "@angular/common": "^20.3.0",
  "@angular/core": "^20.3.0",
  "@angular/forms": "^20.3.0",
  "@angular/platform-browser": "^20.3.0",
  "@angular/router": "^20.3.0",
  "rxjs": "~7.8.0"
}
```

---

## Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm build
```

Visit `http://localhost:4200` to see the application.

---

## Future Enhancements

- [ ] Backend API integration
- [ ] Authentication tokens (JWT)
- [ ] Real database data
- [ ] Charts/graphs on dashboard
- [ ] User profile page
- [ ] Settings management
- [ ] Dark mode toggle
- [ ] Internationalization (i18n)
- [ ] Advanced search filters
- [ ] Export/import features

---

## Support & Troubleshooting

**CSS not loading?**
- Clear browser cache
- Restart dev server

**Forms not validating?**
- Check browser console for errors
- Verify FormsModule is imported

**Navigation not working?**
- Ensure routes are configured in `app.routes.ts`
- Check Router injection in components

---

**Version:** 1.0.0  
**Created:** February 2026  
**Framework:** Angular 20 with Pure CSS
