# Addwise - Full Stack Authentication System

A comprehensive full-stack application built with React, Node.js, Express, and MongoDB Atlas, featuring advanced user authentication, role-based access control, and secure management features.

## 🚀 Features

### Authentication & Security
- **JWT-based Authentication** with secure token management
- **Password Hashing** using bcryptjs
- **Account Protection** with login attempt limiting and account locking
- **Role-based Access Control** (User, Admin, Super Admin)
- **Protected Routes** with automatic redirection
- **Form Validation** with comprehensive error handling

### User Management
- **User Registration** with detailed profile information
- **User Login/Logout** with secure session management
- **Profile Management** with editable user information
- **Password Change** functionality
- **Account Status** management (Active/Inactive)

### Admin Features
- **User Management Dashboard** for admins and super admins
- **User Search and Filtering** capabilities
- **Bulk User Operations** (activate, deactivate, delete)
- **Role Management** with permission-based access
- **System Analytics** and statistics

### UI/UX
- **Modern, Responsive Design** using Tailwind CSS
- **Beautiful Animations** and smooth transitions
- **Mobile-First Approach** with responsive navigation
- **Toast Notifications** for user feedback
- **Loading States** and error handling

## 🛠️ Tech Stack

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation and protected routes
- **Tailwind CSS** for styling and responsive design
- **React Hook Form** with Yup validation
- **Axios** for API communication
- **React Toastify** for notifications
- **React Icons** for beautiful icons

### Backend
- **Node.js** with Express.js framework
- **MongoDB Atlas** for cloud database
- **Mongoose** for database modeling and validation
- **JWT** for authentication tokens
- **bcryptjs** for password hashing
- **Express Validator** for input validation
- **Helmet** for security headers
- **CORS** for cross-origin requests
- **Rate Limiting** for API protection

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MongoDB Atlas** account (for database)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd addwise-fullstack-app
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/addwise_db?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important:** Replace the `MONGODB_URI` with your actual MongoDB Atlas connection string and set a strong `JWT_SECRET`.

### 4. Database Setup

1. Create a MongoDB Atlas account at [mongodb.com](https://mongodb.com)
2. Create a new cluster
3. Get your connection string
4. Replace the `MONGODB_URI` in your `.env` file

### 5. Running the Application

#### Development Mode (Recommended)

```bash
# Run both frontend and backend concurrently
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:3000`

#### Separate Mode

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

### 6. Production Build

```bash
# Build the frontend
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
addwise-fullstack-app/
├── server/                 # Backend code
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   └── index.js           # Server entry point
├── client/                # Frontend code
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── App.js         # Main app component
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

## 🔐 Authentication Flow

1. **Registration**: Users can register with email, password, and optional profile information
2. **Login**: Users authenticate with email and password
3. **Token Management**: JWT tokens are stored in localStorage and automatically included in API requests
4. **Protected Routes**: Routes are protected based on authentication status and user roles
5. **Logout**: Tokens are cleared and user is redirected to home page

## 👥 User Roles

### User (Default)
- Access to personal dashboard
- Profile management
- Basic system features

### Admin
- All user permissions
- User management (view, edit, activate/deactivate)
- Cannot manage other admins or super admins
- Access to admin dashboard

### Super Admin
- All admin permissions
- Full system control
- Can manage all users including other admins
- Can create new users with any role
- Access to super admin dashboard

## 🔒 Security Features

- **Password Requirements**: Minimum 6 characters with uppercase, lowercase, and number
- **Account Locking**: Accounts are locked after 5 failed login attempts for 2 hours
- **JWT Expiration**: Tokens expire after 24 hours
- **Input Validation**: Comprehensive validation on both frontend and backend
- **Rate Limiting**: API endpoints are rate-limited to prevent abuse
- **CORS Protection**: Configured for secure cross-origin requests
- **Security Headers**: Helmet.js provides additional security headers

## 🎨 UI Components

The application includes a comprehensive set of reusable components:

- **Navigation**: Responsive navbar with role-based menu items
- **Forms**: Validated forms with error handling and loading states
- **Cards**: Information display cards with hover effects
- **Modals**: Confirmation and information modals
- **Tables**: Data tables with sorting and filtering
- **Notifications**: Toast notifications for user feedback

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🚀 Deployment

### Backend Deployment (Heroku)

1. Create a Heroku account
2. Install Heroku CLI
3. Create a new Heroku app
4. Set environment variables in Heroku dashboard
5. Deploy using Git

```bash
heroku create your-app-name
git push heroku main
```

### Frontend Deployment (Netlify/Vercel)

1. Build the frontend: `npm run build`
2. Deploy the `build` folder to your preferred hosting service

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the console for error messages
2. Verify your environment variables are set correctly
3. Ensure MongoDB Atlas is accessible
4. Check that all dependencies are installed

## 🔄 Future Enhancements

- [ ] Email verification system
- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] Advanced user analytics
- [ ] File upload capabilities
- [ ] Real-time notifications
- [ ] API documentation
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] CI/CD pipeline

## 📊 Performance

The application is optimized for:
- Fast loading times
- Efficient database queries
- Minimal bundle size
- Smooth user interactions
- Mobile performance

---

**Built with ❤️ for Addwise Company** 