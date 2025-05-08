from flask import Flask, request, jsonify, session, render_template, redirect
from flask_mysqldb import MySQL
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
import json

app = Flask(__name__)
app.secret_key = 'your_secret_key'
CORS(app)

# MySQL config
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'val_motogear'

# Create the database if it doesn't exist
import MySQLdb
try:
    # Connect without database name first
    connection = MySQLdb.connect(
        host=app.config['MYSQL_HOST'],
        user=app.config['MYSQL_USER'],
        passwd=app.config['MYSQL_PASSWORD']
    )
    cursor = connection.cursor()
    cursor.execute('CREATE DATABASE IF NOT EXISTS val_motogear')
    cursor.close()
    connection.close()
    print("Database created successfully or already exists")
except Exception as e:
    print(f"Error creating database: {e}")

# Initialize MySQL connection after ensuring database exists
mysql = MySQL(app)

# Initialize database tables if they don't exist
def init_db():
    cursor = mysql.connection.cursor()
    
    # Create products table if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(255) NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        price DECIMAL(10,2),
        category VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    ''')
    
    # Check if description column exists in products table and add it if it doesn't
    cursor.execute("SHOW COLUMNS FROM products LIKE 'description'")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE products ADD COLUMN description TEXT AFTER category")
        print("Added description column to products table")
        
    # Check if created_at column exists in products table and add it if it doesn't
    cursor.execute("SHOW COLUMNS FROM products LIKE 'created_at'")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE products ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
        print("Added created_at column to products table")
        
    # Check if updated_at column exists in products table and add it if it doesn't
    cursor.execute("SHOW COLUMNS FROM products LIKE 'updated_at'")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE products ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
        print("Added updated_at column to products table")
    
    # Create inventory table if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        location VARCHAR(255),
        status VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
    ''')
    
    # Create sales table if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        customer VARCHAR(255),
        payment_method VARCHAR(100),
        channel VARCHAR(100),
        subtotal DECIMAL(10,2) NOT NULL,
        tax DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create sale_items table if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sale_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    )
    ''')
    
    # Create orders table with more fields if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL DEFAULT (CURRENT_DATE),
        product VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        sales_channel VARCHAR(100),
        instruction TEXT,
        items INT NOT NULL DEFAULT 1,
        status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
    ''')
    
    mysql.connection.commit()
    cursor.close()

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    cursor = mysql.connection.cursor()
    cursor.execute("INSERT INTO users (first_name, last_name, email, username, phone, address, password) VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (data['first_name'], data['last_name'], data['email'], data['username'], data['phone'], data['address'], generate_password_hash(data['password'])))
    mysql.connection.commit()
    return jsonify({'message': 'User registered successfully'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT * FROM users WHERE username=%s", (data['username'],))
    user = cursor.fetchone()
    if user and check_password_hash(user[7], data['password']):
        session['user_id'] = user[0]
        return jsonify({'message': 'Login successful'})
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT COUNT(*) FROM orders")
    sales = cursor.fetchone()[0]
    revenue, profit, cost = 30000, 30000, 30000
    cursor.execute("SELECT * FROM orders LIMIT 10")
    orders = cursor.fetchall()
    
    # Get recent activity (combined from inventory, orders, and sales)
    cursor.execute("""
        (SELECT 'Inventory' as type, CONCAT('New inventory: ', p.name) as description, i.updated_at as date
         FROM inventory i
         JOIN products p ON i.product_id = p.id
         ORDER BY i.updated_at DESC
         LIMIT 5)
        UNION
        (SELECT 'Order' as type, CONCAT('New order #', id, ' from ', customer_name) as description, date as date
         FROM orders
         ORDER BY date DESC
         LIMIT 5)
        UNION
        (SELECT 'Sale' as type, CONCAT('New sale #', id, ' to ', customer) as description, date as date
         FROM sales
         ORDER BY date DESC
         LIMIT 5)
        ORDER BY date DESC
        LIMIT 10
    """)
    
    recent_activity = [{
        'type': item[0],
        'description': item[1],
        'date': item[2].strftime('%Y-%m-%d %H:%M:%S') if item[2] else None
    } for item in cursor.fetchall()]
    
    return jsonify({
        'sales': sales,
        'revenue': revenue,
        'profit': profit,
        'cost': cost,
        'orders': [
            {
                'id': o[0], 'product': o[1], 'category': o[2], 'sales_channel': o[3],
                'instruction': o[4], 'items': o[5], 'status': o[6]
            } for o in orders
        ],
        'recent_activity': recent_activity
    })

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/signup')
def signup_page():
    return render_template('signup.html')

@app.route('/')
def index():
    return redirect('/dashboard')

@app.route('/dashboard')
def dashboard_page():
    return render_template('dashboard.html')

@app.route('/api/products', methods=['GET'])
def get_products():
    cursor = mysql.connection.cursor()
    
    # Get query parameters for filtering
    category = request.args.get('category')
    search_term = request.args.get('search')
    low_stock = request.args.get('low_stock')
    
    # Base query
    query = "SELECT * FROM products"
    params = []
    
    # Build WHERE clause based on parameters
    conditions = []
    
    if category:
        conditions.append("category = %s")
        params.append(category)
        
    if search_term:
        conditions.append("(name LIKE %s OR brand LIKE %s)")
        params.append(f'%{search_term}%')
        params.append(f'%{search_term}%')
        
    if low_stock and low_stock.lower() == 'true':
        conditions.append("quantity <= 5")
    
    # Add conditions to query if any exist
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    
    # Execute the final query
    cursor.execute(query, tuple(params))
    
    products = cursor.fetchall()
    return jsonify({
        'products': [
            {
                'id': p[0], 'name': p[1], 'brand': p[2], 'quantity': p[3],
                'price': float(p[4]) if p[4] else 0, 'category': p[5],
                'description': p[6] if len(p) > 6 else None
            } for p in products
        ]
    })

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
    product = cursor.fetchone()
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    return jsonify({
        'id': product[0],
        'name': product[1],
        'brand': product[2],
        'quantity': product[3],
        'price': float(product[4]) if product[4] else 0,
        'category': product[5],
        'description': product[6] if len(product) > 6 else None
    })

@app.route('/api/products', methods=['POST'])
def add_product():
    data = request.json
    cursor = mysql.connection.cursor()
    
    # Get fields with defaults if not provided
    name = data.get('name')
    brand = data.get('brand')
    quantity = data.get('quantity', 0)
    price = data.get('price', 0)
    category = data.get('category')
    description = data.get('description', '')
    
    cursor.execute("INSERT INTO products (name, brand, quantity, price, category, description) VALUES (%s, %s, %s, %s, %s, %s)",
        (name, brand, quantity, price, category, description))
    mysql.connection.commit()
    product_id = cursor.lastrowid
    
    return jsonify({'message': 'Product added successfully', 'product_id': product_id})

@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    data = request.json
    cursor = mysql.connection.cursor()
    
    # Check if product exists
    cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
    if not cursor.fetchone():
        return jsonify({'error': 'Product not found'}), 404
    
    # Get fields with defaults if not provided
    name = data.get('name')
    brand = data.get('brand')
    quantity = data.get('quantity')
    price = data.get('price')
    category = data.get('category')
    description = data.get('description', '')
    
    cursor.execute("UPDATE products SET name = %s, brand = %s, quantity = %s, price = %s, category = %s, description = %s WHERE id = %s",
        (name, brand, quantity, price, category, description, product_id))
    mysql.connection.commit()
    
    return jsonify({'message': 'Product updated successfully'})

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    cursor = mysql.connection.cursor()
    
    # Check if product exists
    cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
    if not cursor.fetchone():
        return jsonify({'error': 'Product not found'}), 404
    
    cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
    mysql.connection.commit()
    
    return jsonify({'message': 'Product deleted successfully'})

# Inventory API Endpoints
@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    cursor = mysql.connection.cursor()
    
    # Get query parameters for filtering
    low_stock = request.args.get('low_stock')
    status = request.args.get('status')
    category = request.args.get('category')
    location = request.args.get('location')
    
    # Base query
    query = """
        SELECT i.id, p.name, p.category, i.quantity, i.status, i.location, i.updated_at, i.product_id 
        FROM inventory i
        JOIN products p ON i.product_id = p.id
    """
    
    # Add WHERE conditions based on parameters
    conditions = []
    params = []
    
    if low_stock and low_stock.lower() == 'true':
        conditions.append("i.status = 'Low Stock' OR i.quantity <= 5")
        
    if status:
        conditions.append("i.status = %s")
        params.append(status)
        
    if category:
        conditions.append("p.category = %s")
        params.append(category)
        
    if location:
        conditions.append("i.location = %s")
        params.append(location)
    
    # Add conditions to query if any exist
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    
    # Execute query
    cursor.execute(query, tuple(params))
    inventory = cursor.fetchall()
    
    return jsonify({
        'inventory': [
            {
                'id': i[0],
                'product_name': i[1],
                'category': i[2],
                'quantity': i[3],
                'status': i[4],
                'location': i[5],
                'last_updated': i[6].strftime('%Y-%m-%d %H:%M:%S') if i[6] else None,
                'product_id': i[7]
            } for i in inventory
        ]
    })

@app.route('/api/inventory', methods=['POST'])
def add_inventory():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        cursor = mysql.connection.cursor()
        
        # Validate required fields
        if 'product_id' not in data or not data['product_id']:
            return jsonify({'error': 'Product ID is required'}), 400
            
        # Get values with defaults
        product_id = data.get('product_id')
        quantity = data.get('quantity', 0)
        location = data.get('location', '')
        status = data.get('status', 'In Stock')
        notes = data.get('notes', '')
        
        # Verify product exists
        cursor.execute("SELECT id FROM products WHERE id = %s", (product_id,))
        if not cursor.fetchone():
            return jsonify({'error': f'Product with ID {product_id} not found'}), 404
        
        # Insert into inventory
        cursor.execute("INSERT INTO inventory (product_id, quantity, location, status, notes) VALUES (%s, %s, %s, %s, %s)",
            (product_id, quantity, location, status, notes))
        mysql.connection.commit()
        inventory_id = cursor.lastrowid
        
        return jsonify({
            'success': True,
            'message': 'Inventory added successfully', 
            'inventory_id': inventory_id
        })
    except Exception as e:
        # Log the error for debugging
        app.logger.error(f"Error adding inventory: {str(e)}")
        return jsonify({'error': f'Failed to add inventory: {str(e)}'}), 500

# Get a single inventory item
@app.route('/api/inventory/<int:inventory_id>', methods=['GET'])
def get_inventory_item(inventory_id):
    cursor = mysql.connection.cursor()
    cursor.execute("""SELECT i.id, i.product_id, p.name, p.category, i.quantity, i.status, i.location, i.notes, i.updated_at 
                   FROM inventory i 
                   JOIN products p ON i.product_id = p.id 
                   WHERE i.id = %s""", (inventory_id,))
    item = cursor.fetchone()
    
    if not item:
        return jsonify({'error': 'Inventory item not found'}), 404
    
    return jsonify({
        'id': item[0],
        'product_id': item[1], 
        'product_name': item[2],
        'category': item[3],
        'quantity': item[4],
        'status': item[5],
        'location': item[6],
        'notes': item[7],
        'last_updated': item[8].strftime('%Y-%m-%d %H:%M:%S') if item[8] else None
    })

# Delete an inventory item
@app.route('/api/inventory/<int:inventory_id>', methods=['DELETE'])
def delete_inventory(inventory_id):
    cursor = mysql.connection.cursor()
    cursor.execute("DELETE FROM inventory WHERE id = %s", (inventory_id,))
    mysql.connection.commit()
    if cursor.rowcount == 0:
        return jsonify({'error': 'Inventory item not found'}), 404
    return jsonify({'message': 'Inventory item deleted successfully'})

# Sales API Endpoints
@app.route('/api/sales', methods=['GET'])
def get_sales():
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT * FROM sales ORDER BY date DESC")
    sales = cursor.fetchall()
    
    # Format and return sales data
    formatted_sales = []
    for sale in sales:
        sale_id = sale[0]
        
        # Get the sale items with location information
        cursor.execute("""\
            SELECT si.product_id, p.name, si.quantity, si.price, i.location
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            LEFT JOIN inventory i ON si.product_id = i.product_id
            WHERE si.sale_id = %s
            GROUP BY si.product_id, p.name, si.quantity, si.price, i.location
        """, (sale_id,))
        items = cursor.fetchall()
        
        formatted_sales.append({
            'id': sale_id,
            'date': sale[1].strftime('%Y-%m-%d') if sale[1] else None,
            'customer': sale[2],
            'payment_method': sale[3],
            'channel': sale[4],
            'subtotal': float(sale[5]),
            'tax': float(sale[6]),
            'total': float(sale[7]),
            'notes': sale[8],
            'created_at': sale[9].strftime('%Y-%m-%d %H:%M:%S') if sale[9] else None,
            'items': [
                {
                    'product_id': item[0],
                    'product_name': item[1],
                    'quantity': item[2],
                    'price': float(item[3]),
                    'location': item[4] if len(item) > 4 and item[4] else 'Main Storage'
                } for item in items
            ]
        })
    
    return jsonify({'sales': formatted_sales})

@app.route('/api/sales', methods=['POST'])
def add_sale():
    data = request.json
    cursor = mysql.connection.cursor()
    
    # Extract sale data
    date = data.get('date')
    customer = data.get('customer', '')
    payment_method = data.get('payment_method')
    channel = data.get('channel')
    subtotal = data.get('subtotal')
    tax = data.get('tax')
    total = data.get('total')
    notes = data.get('notes', '')
    items = data.get('items', [])
    
    # Insert sale record
    cursor.execute("""\
        INSERT INTO sales (date, customer, payment_method, channel, subtotal, tax, total, notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (date, customer, payment_method, channel, subtotal, tax, total, notes))
    mysql.connection.commit()
    sale_id = cursor.lastrowid
    
    # Insert sale items
    for item in items:
        product_id = item.get('product_id')
        quantity = item.get('quantity')
        price = item.get('price')
        
        cursor.execute("""\
            INSERT INTO sale_items (sale_id, product_id, quantity, price)
            VALUES (%s, %s, %s, %s)
        """, (sale_id, product_id, quantity, price))
        
        # Update product quantity
        cursor.execute("""\
            UPDATE products 
            SET quantity = quantity - %s
            WHERE id = %s
        """, (quantity, product_id))
    
    mysql.connection.commit()
    
    return jsonify({'message': 'Sale recorded successfully', 'sale_id': sale_id})

# Orders API Endpoints
@app.route('/api/orders', methods=['GET'])
def get_orders():
    cursor = mysql.connection.cursor()
    
    # Get query parameters for filtering
    status = request.args.get('status')
    
    if status:
        cursor.execute("SELECT * FROM orders WHERE status = %s ORDER BY date DESC", (status,))
    else:
        cursor.execute("SELECT * FROM orders ORDER BY date DESC")
        
    orders = cursor.fetchall()
    return jsonify({
        'orders': [
            {
                'id': o[0],
                'date': o[1].strftime('%Y-%m-%d') if o[1] else None,
                'product': o[2],
                'category': o[3],
                'sales_channel': o[4],
                'instruction': o[5],
                'items': o[6],
                'status': o[7],
                'created_at': o[8].strftime('%Y-%m-%d %H:%M:%S') if o[8] else None
            } for o in orders
        ]
    })

@app.route('/api/orders', methods=['POST'])
def add_order():
    data = request.json
    cursor = mysql.connection.cursor()
    
    # Get fields with defaults if not provided
    date = data.get('date')
    product = data.get('product')
    category = data.get('category')
    sales_channel = data.get('sales_channel')
    instruction = data.get('instruction', '')
    items = data.get('items', 1)
    status = data.get('status', 'Pending')
    
    cursor.execute("""\
        INSERT INTO orders (date, product, category, sales_channel, instruction, items, status)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (date, product, category, sales_channel, instruction, items, status))
    mysql.connection.commit()
    order_id = cursor.lastrowid
    
    return jsonify({'message': 'Order created successfully', 'order_id': order_id})

# Get a single order
@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
    order = cursor.fetchone()
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Format order data for response
    return jsonify({
        'id': order[0],
        'date': order[1].strftime('%Y-%m-%d') if order[1] else None,
        'product': order[2],
        'category': order[3],
        'sales_channel': order[4],
        'instruction': order[5],
        'items': order[6],
        'status': order[7],
        'created_at': order[8].strftime('%Y-%m-%d %H:%M:%S') if order[8] else None
    })

@app.route('/api/orders/<int:order_id>', methods=['PUT'])
def update_order(order_id):
    data = request.json
    cursor = mysql.connection.cursor()
    
    # Check if order exists
    cursor.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
    if not cursor.fetchone():
        return jsonify({'error': 'Order not found'}), 404
    
    # Get fields to update
    date = data.get('date')
    product = data.get('product')
    category = data.get('category')
    sales_channel = data.get('sales_channel')
    instruction = data.get('instruction')
    items = data.get('items')
    status = data.get('status')
    
    cursor.execute("""\
        UPDATE orders 
        SET date = %s, product = %s, category = %s, sales_channel = %s, 
            instruction = %s, items = %s, status = %s
        WHERE id = %s
    """, (date, product, category, sales_channel, instruction, items, status, order_id))
    mysql.connection.commit()
    
    return jsonify({'message': 'Order updated successfully'})

@app.route('/api/orders/delete/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    cursor = mysql.connection.cursor()
    
    # Check if order exists
    cursor.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
    if not cursor.fetchone():
        return jsonify({'error': 'Order not found'}), 404
    
    cursor.execute("DELETE FROM orders WHERE id = %s", (order_id,))
    mysql.connection.commit()
    
    return jsonify({'message': 'Order deleted successfully'})

@app.route('/api/sales/delete/<int:sale_id>', methods=['DELETE'])
def delete_sale(sale_id):
    cursor = mysql.connection.cursor()
    
    # Check if sale exists
    cursor.execute("SELECT * FROM sales WHERE id = %s", (sale_id,))
    if not cursor.fetchone():
        return jsonify({'error': 'Sale not found'}), 404
    
    # First delete any related sale items
    cursor.execute("DELETE FROM sale_items WHERE sale_id = %s", (sale_id,))
    
    # Then delete the sale record
    cursor.execute("DELETE FROM sales WHERE id = %s", (sale_id,))
    mysql.connection.commit()
    
    return jsonify({'message': 'Sale deleted successfully'})

if __name__ == '__main__':
    # Initialize database tables
    with app.app_context():
        try:
            init_db()
            print("Database tables initialized successfully")
        except Exception as e:
            print(f"Error initializing database tables: {e}")
    app.run(debug=True)
