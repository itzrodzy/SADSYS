from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

app = Flask(__name__)
# Set a single secret key for the application
app.config['SECRET_KEY'] = 'valmotor_secret_key_2025'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///inventory.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# User model for authentication
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # admin, manager, staff
    full_name = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    address = db.Column(db.String(200), nullable=False)
    profile_picture = db.Column(db.String(100), nullable=False)

class InventoryItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # parts, accessories, helmet, gear
    supplier = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    reorder_level = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(200), nullable=False)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)

class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('inventory_item.id'))
    item = db.relationship('InventoryItem', backref=db.backref('sales', lazy=True))
    quantity = db.Column(db.Integer, nullable=False)
    sale_price = db.Column(db.Float, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_contact = db.Column(db.String(20), nullable=False)
    sale_date = db.Column(db.DateTime, default=datetime.utcnow)

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('supplier.id'))
    supplier = db.relationship('Supplier', backref=db.backref('orders', lazy=True))
    expected_delivery = db.Column(db.DateTime, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    order_date = db.Column(db.DateTime, default=datetime.utcnow)

class Supplier(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    contact = db.Column(db.String(20), nullable=False)
    address = db.Column(db.String(200), nullable=False)

class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)  # sales, inventory
    data = db.Column(db.JSON, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    user = db.relationship('User', backref=db.backref('reports', lazy=True))

@login_manager.user_loader
def load_user(id):
    return User.query.get(int(id))

# Authentication Routes
@app.route('/')
@login_required
def index():
    return redirect(url_for('dashboard'))

@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    # Clear any existing flash messages for GET requests
    if request.method == 'GET':
        session.pop('_flashes', None)  # Clear any existing flash messages
        flash('Enter your email to receive password reset instructions.', 'default')  # Show default message
        return render_template('forgot_password.html')
    
    # Process forgot password form submission
    if request.method == 'POST':
        email = request.form.get('email')
        
        # Check if email exists in the database
        user = User.query.filter_by(email=email).first()
        if user:
            # In a real application, you would generate a token and send an email
            # For this demo, we'll just show a success message
            flash('Password reset instructions have been sent to your email!', 'success')
        else:
            # Email not found
            flash('No account found with that email address.', 'error')
        
        return render_template('forgot_password.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    # Clear any existing flash messages for GET requests
    if request.method == 'GET':
        session.pop('_flashes', None)  # Clear any existing flash messages
        flash('Please log in to access this page.', 'default')  # Show default message
        return render_template('login.html')
    
    # Process login form submission
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        print(f"Login attempt - Username: {username}")
        
        # Special case for admin login
        if username == 'admin' and password == '1234':
            print("Admin credentials match, finding admin user")
            # Find the admin user
            admin_user = User.query.filter_by(username='admin').first()
            
            # If admin user doesn't exist, create it
            if not admin_user:
                print("Admin user not found, creating...")
                admin_user = User(
                    username='admin',
                    email='admin@valmotor.com',
                    password_hash=generate_password_hash('1234'),
                    role='admin',
                    full_name='Admin User',
                    phone_number='1234567890',
                    address='123 Admin Street',
                    profile_picture='default.png'
                )
                db.session.add(admin_user)
                db.session.commit()
            else:
                # Update admin password to ensure it's correct
                print("Found admin user, updating password hash")
                admin_user.password_hash = generate_password_hash('1234')
                db.session.commit()
            
            # Login the admin user
            login_user(admin_user)
            flash('Admin login successful!', 'success')
            return redirect(url_for('dashboard'))
        
        # Normal user login flow
        user = User.query.filter_by(username=username).first()
        print(f"User found: {user is not None}")
        
        if user:
            # Check password
            password_correct = check_password_hash(user.password_hash, password)
            print(f"Password check result: {password_correct}")
            
            if password_correct:
                # Login successful - show success message
                flash('Login successful!', 'success')
                login_user(user)
                return redirect(url_for('dashboard'))
        
        # Login failed - show error message
        flash('Invalid username or password', 'error')
        return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        full_name = request.form.get('full_name')
        phone_number = request.form.get('phone_number')
        address = request.form.get('address')
        
        # Set default profile picture if none provided
        profile_picture = 'default.png'
        
        # Form validation
        if User.query.filter_by(username=username).first():
            flash('Username already exists')
            return redirect(url_for('signup'))
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered')
            return redirect(url_for('signup'))
        
        # Create new user with all required fields
        new_user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            role='staff',
            full_name=full_name,
            phone_number=phone_number,
            address=address,
            profile_picture=profile_picture
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        flash('Account created successfully! Please login.')
        return redirect(url_for('login'))
    
    return render_template('signup.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

# Admin Tools
@app.route('/reset_admin_password')
def reset_admin_password():
    # Get admin user
    admin = User.query.filter_by(username='admin').first()
    
    if admin:
        # Reset password to '1234'
        admin.password_hash = generate_password_hash('1234')
        db.session.commit()
        return 'Admin password reset to 1234. <a href="/login">Go to login</a>'
    else:
        return 'Admin user not found'

# Dashboard Routes
@app.route('/dashboard')
@login_required
def dashboard():
    total_items = InventoryItem.query.count()
    low_stock = InventoryItem.query.filter(InventoryItem.quantity <= InventoryItem.reorder_level).count()
    total_sales = Sale.query.count()
    total_orders = Order.query.count()
    
    return render_template('dashboard_new.html', 
                         total_items=total_items,
                         low_stock=low_stock,
                         total_sales=total_sales,
                         total_orders=total_orders)

# Inventory Routes
@app.route('/inventory')
@login_required
def inventory():
    items = InventoryItem.query.all()
    return render_template('in_stock.html', items=items)

@app.route('/orders')
@login_required
def orders():
    orders_list = Order.query.all()
    return render_template('orders.html', orders=orders_list)

@app.route('/inventory/add', methods=['GET', 'POST'])
@login_required
def add_inventory():
    if request.method == 'POST':
        item = InventoryItem(
            item_name=request.form.get('item_name'),
            category=request.form.get('category'),
            supplier=request.form.get('supplier'),
            quantity=int(request.form.get('quantity')),
            reorder_level=int(request.form.get('reorder_level')),
            price=float(request.form.get('price')),
            description=request.form.get('description')
        )
        db.session.add(item)
        db.session.commit()
        flash('Item added successfully!')
        return redirect(url_for('index'))

@app.route('/update_item/<int:item_id>', methods=['POST'])
@login_required
def update_item(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    if request.method == 'POST':
        item.quantity = int(request.form.get('quantity'))
        item.reorder_level = int(request.form.get('reorder_level'))
        item.price = float(request.form.get('price'))
        db.session.commit()
        flash('Item updated successfully!')
        return redirect(url_for('index'))

@app.route('/delete_inventory/<int:item_id>')
@login_required
def delete_inventory(item_id):
    item = InventoryItem.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    flash('Item deleted successfully!')
    return redirect(url_for('index'))

if __name__ == '__main__':
    with app.app_context():
        # Create tables if they don't exist
        db.create_all()
        
        # Check if admin user already exists
        admin_exists = User.query.filter_by(username='admin').first()
        
        if not admin_exists:
            # Create default admin user with password 1234
            admin = User(
                username='admin',
                email='admin@valmotor.com',
                password_hash=generate_password_hash('1234'),
                role='admin',
                full_name='Admin User',
                phone_number='1234567890',
                address='123 Admin Street',
                profile_picture='default.png'
            )
            db.session.add(admin)
            db.session.commit()
            print("Default admin user created. Username: admin, Password: 1234")
        else:
            print("Admin user already exists. Username: admin")
    
    app.run(debug=True)
