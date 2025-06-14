# Admin Dashboard Setup Guide

## Overview
JOOTA JUNCTION now includes a comprehensive admin dashboard with full CRUD operations for products, order management, and user management. The admin system uses size-based inventory tracking and Indian currency (INR).

## Features

### 🔐 Admin Authentication
- **Multiple Login Methods**: Admin can login through:
  - Regular sign-in page (automatically redirects to admin dashboard)
  - Dedicated admin login page (`/admin/login`)
- Secure admin login with JWT tokens
- Admin-specific middleware protection
- Session management with localStorage
- **Automatic Role Detection**: System automatically detects admin role and redirects appropriately

### 📊 Dashboard Overview
- Real-time statistics (total users, products, orders, revenue)
- Recent orders with status tracking
- Low stock alerts for size-based inventory
- Indian currency formatting (₹)

### 👟 Product Management
- **Add Products**: Create new products with size-based inventory
- **Edit Products**: Update product details, prices, and descriptions
- **Inventory Management**: Manage stock levels for each shoe size
- **Delete Products**: Remove products from the store
- **Size-based Stock**: Track inventory per size (e.g., Size 7: 5 units, Size 8: 10 units)

### 📦 Order Management
- View all orders with customer details
- Update order status (pending, processing, shipped, delivered, cancelled)
- Order tracking and history
- Revenue calculation in Indian Rupees

### 👥 User Management
- View all registered users
- Update user roles (user/admin)
- Delete users
- User activity tracking

## Setup Instructions

### 1. Database Setup
The Product schema has been updated to support size-based inventory:

```javascript
sizes: [{
  size: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 }
}]
```

### 2. Create Admin User
Run the admin seeder to create the initial admin account:

```bash
cd server
npm run seed:admin
```

**Default Admin Credentials:**
- Email: `admin@jootajunction.com`
- Password: `admin123`

### 3. Start the Application
```bash
# Backend
cd server && npm run dev

# Frontend  
npm run dev
```

## Admin Login Methods

### Method 1: Regular Sign-In Page (Recommended)
1. Navigate to the main store
2. Click "Sign In" in the header
3. Enter admin credentials:
   - Email: `admin@jootajunction.com`
   - Password: `admin123`
4. System automatically detects admin role
5. Shows success message: "Admin login successful! Redirecting to admin dashboard..."
6. Automatically redirects to `/admin/dashboard`

### Method 2: Dedicated Admin Login
1. Navigate directly to `/admin/login`
2. Enter admin credentials
3. Redirects to admin dashboard

### Method 3: Header Navigation (After Login)
1. Login as admin using any method above
2. "Admin" button appears in the store header
3. Click to access admin dashboard

## Admin Routes

### Backend API Routes
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/products` - Get all products
- `POST /api/admin/products` - Create new product
- `PUT /api/admin/products/:id` - Update product
- `PUT /api/admin/products/:id/inventory` - Update size-based inventory
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role
- `DELETE /api/admin/users/:id` - Delete user

### Frontend Routes
- `/admin/login` - Admin login page
- `/admin/dashboard` - Main admin dashboard
- `/admin/products` - Product management
- `/admin/orders` - Order management
- `/admin/users` - User management

## Usage Guide

### Accessing Admin Dashboard
**Option 1: Regular Sign-In (Recommended)**
1. Go to the main store
2. Click "Sign In" in the header
3. Enter admin credentials
4. Automatic redirect to admin dashboard

**Option 2: Direct Admin Login**
1. Navigate to `/admin/login`
2. Login with admin credentials
3. Redirected to admin dashboard

### Adding Products
1. Go to the "Products" tab
2. Fill in the product form:
   - Name, Brand, Price (in ₹)
   - Category, Description
   - Image URL
   - Sizes (comma-separated, e.g., "7,8,9,10")
3. Click "Add Product"
4. Use the inventory management modal to set stock levels for each size

### Managing Inventory
1. Click the package icon (📦) next to any product
2. Use the +/- buttons to adjust stock for each size
3. Changes are saved automatically to MongoDB

### Managing Orders
1. Go to the "Orders" tab
2. View all orders with customer details
3. Use the dropdown to update order status
4. Click "View" to see order details

### Navigation
- **From Store**: Admins see an "Admin" button in the header
- **From Dashboard**: Use the "View Store" button to return to the main store
- **Mobile**: Admin button appears in the mobile menu

## Currency and Localization

### Indian Currency (INR)
- All prices displayed in Indian Rupees (₹)
- Price ranges updated for Indian market:
  - Under ₹2,000
  - ₹2,000 - ₹5,000
  - ₹5,000 - ₹10,000
  - ₹10,000 - ₹15,000
  - Over ₹15,000

### Formatting
- Currency formatted using `Intl.NumberFormat('en-IN')`
- No decimal places for cleaner display
- Proper Indian numbering system

## Security Features

### Admin Middleware
```javascript
const adminProtect = async (req, res, next) => {
  // Verifies JWT token and admin role
  // Protects all admin routes
}
```

### Authentication Flow
1. **Regular Login**: Admin credentials work on regular sign-in page
2. **Role Detection**: System checks user role after login
3. **Token Storage**: Both regular and admin tokens stored for compatibility
4. **Automatic Redirect**: Admin users redirected to dashboard
5. **Session Sync**: AdminContext syncs with AuthContext for consistent state

## Troubleshooting

### Common Issues
1. **Admin login fails**: Ensure admin user exists (run seeder)
2. **No redirect to admin dashboard**: Check browser console for errors
3. **Inventory not updating**: Check MongoDB connection
4. **Currency not displaying**: Verify browser supports Intl.NumberFormat
5. **Size selector not working**: Check product schema matches frontend types

### Database Issues
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify Product schema includes size-based inventory

### Frontend Issues
- Clear localStorage if authentication problems
- Check browser console for errors
- Ensure all dependencies are installed

### Admin Login Issues
- Verify admin user exists in database
- Check that admin user has `role: 'admin'` in database
- Ensure JWT_SECRET is set in environment variables
- Clear browser localStorage and try again

## API Examples

### Create Product with Sizes
```javascript
POST /api/admin/products
{
  "name": "Nike Air Max",
  "brand": "Nike",
  "price": 8999,
  "category": "Running",
  "description": "Comfortable running shoes",
  "images": ["https://example.com/shoe.jpg"],
  "sizes": [7, 8, 9, 10, 11]
}
```

### Update Inventory
```javascript
PUT /api/admin/products/:id/inventory
{
  "size": 8,
  "stock": 15
}
```

### Update Order Status
```javascript
PUT /api/admin/orders/:id/status
{
  "status": "shipped"
}
```

## Testing Admin Login

### Test Regular Sign-In Method
1. Start the application
2. Go to main store
3. Click "Sign In"
4. Enter: `admin@jootajunction.com` / `admin123`
5. Should see success message and redirect to admin dashboard

### Test Direct Admin Login
1. Navigate to `/admin/login`
2. Enter admin credentials
3. Should redirect to admin dashboard

### Test Admin Navigation
1. Login as admin
2. Return to main store
3. Should see "Admin" button in header
4. Click to access dashboard

## Support
For issues or questions about the admin dashboard, check the console logs and ensure all setup steps have been completed correctly. The admin login now works seamlessly through the regular sign-in page with automatic role detection and redirection. 