# VAL MotorGear Inventory Management System

A modern web-based inventory management system designed specifically for VAL MotorGear Shop to streamline their inventory tracking and management processes.

## Features

- User Authentication (Admin, Manager, Staff roles)
- Real-time Inventory Tracking
- Add/Edit/Delete Inventory Items
- Category-based Organization (Parts, Accessories, Helmet, Gear)
- Reorder Level Alerts
- Supplier Management
- Price Management
- Responsive Design

## Installation

1. Install Python 3.8 or higher
2. Install required packages:
   ```
   pip install -r requirements.txt
   ```
3. Initialize the database:
   ```
   python app.py
   ```

## Usage

1. Run the application:
   ```
   python app.py
   ```
2. Open your web browser and navigate to `http://localhost:5000`
3. Login with your credentials
4. Use the dashboard to manage inventory items

## Database Structure

- Users (Authentication)
  - id
  - username
  - password_hash
  - role

- Inventory Items
  - id
  - item_name
  - category
  - supplier
  - quantity
  - reorder_level
  - price
  - last_updated

## Security Features

- Password hashing
- Role-based access control
- Secure session management
- Input validation

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.
