from flask import Flask
from flask_mysqldb import MySQL
import os

app = Flask(__name__)

# MySQL config
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'val_motogear'

# Initialize MySQL
mysql = MySQL(app)

def insert_sample_products():
    with app.app_context():
        # Create a cursor
        cursor = mysql.connection.cursor()
        
        # Helmets
        print("Adding Helmets...")
        cursor.execute('''
        INSERT INTO products (name, brand, quantity, price, category, description) VALUES
        ('X-14 Racing Helmet', 'Shoei', 10, 55000.00, 'Helmets', 'Premium racing helmet with advanced aerodynamics and ventilation'),
        ('RF-1400 Street Helmet', 'Shoei', 8, 38000.00, 'Helmets', 'High-performance street helmet with noise reduction technology'),
        ('Pista GP RR Helmet', 'AGV', 5, 62000.00, 'Helmets', 'MotoGP level racing helmet with carbon fiber shell'),
        ('K6 Helmet', 'AGV', 12, 29000.00, 'Helmets', 'Lightweight sport helmet with excellent ventilation'),
        ('Corsa R Helmet', 'Bell', 7, 45000.00, 'Helmets', 'Track-ready helmet with anti-fog face shield')
        ''')
        
        # Jackets
        print("Adding Jackets...")
        cursor.execute('''
        INSERT INTO products (name, brand, quantity, price, category, description) VALUES
        ('Missile Racing Leather Jacket', 'Alpinestars', 6, 48000.00, 'Jackets', 'Full grain leather with CE certified armor and aerodynamic hump'),
        ('GP Plus R V3 Jacket', 'Alpinestars', 8, 32000.00, 'Jackets', 'Premium leather jacket with advanced protection for sport riding'),
        ('Supersport Leather Jacket', 'Dainese', 4, 52000.00, 'Jackets', 'Italian-designed sport riding jacket with cowhide leather'),
        ('Quantum Air Jacket', 'Dainese', 10, 28000.00, 'Jackets', 'Lightweight mesh jacket with removable windproof liner'),
        ('D-Air Racing Jacket', 'Dainese', 3, 150000.00, 'Jackets', 'Professional airbag jacket used in MotoGP')
        ''')
        
        # Gloves
        print("Adding Gloves...")
        cursor.execute('''
        INSERT INTO products (name, brand, quantity, price, category, description) VALUES
        ('GP Pro R3 Gloves', 'Alpinestars', 15, 12500.00, 'Gloves', 'Race-grade gloves with knuckle protection and palm sliders'),
        ('SP-8 V3 Gloves', 'Alpinestars', 20, 7500.00, 'Gloves', 'Sport riding gloves with touchscreen compatibility'),
        ('4-Stroke 2 Gloves', 'Dainese', 12, 9800.00, 'Gloves', 'Leather gloves with carbon fiber protection'),
        ('Steel Pro Gloves', 'Dainese', 18, 6500.00, 'Gloves', 'Short cuff leather gloves for street riding'),
        ('Race Pro IN Gloves', 'RS Taichi', 10, 11000.00, 'Gloves', 'Racing gloves with integrated wrist protection')
        ''')
        
        # Boots
        print("Adding Boots...")
        cursor.execute('''
        INSERT INTO products (name, brand, quantity, price, category, description) VALUES
        ('Supertech R Boots', 'Alpinestars', 8, 38000.00, 'Boots', 'Top-tier racing boots with advanced ankle protection system'),
        ('SMX Plus V2 Boots', 'Alpinestars', 10, 29000.00, 'Boots', 'Performance riding boots with TPU protection'),
        ('Torque 3 Out Boots', 'Dainese', 6, 32000.00, 'Boots', 'Race boots with D-Axial system and replaceable sliders'),
        ('Nexus 2 Boots', 'Dainese', 12, 18500.00, 'Boots', 'Sport touring boots with waterproof membrane'),
        ('TracTech Evo III Boots', 'RST', 7, 22000.00, 'Boots', 'Race boots with anti-twist ankle support')
        ''')
        
        # Accessories
        print("Adding Accessories...")
        cursor.execute('''
        INSERT INTO products (name, brand, quantity, price, category, description) VALUES
        ('Race Hump Backpack', 'Dainese', 15, 12000.00, 'Accessories', 'Aerodynamic backpack for sport riding'),
        ('RX7-V Tear-offs', 'Arai', 30, 2500.00, 'Accessories', 'Pack of 10 tear-offs for Arai RX7-V visors'),
        ('Hydration Pack', 'Ogio', 20, 3800.00, 'Accessories', 'Hydration system for long rides with 2-liter capacity'),
        ('Knee Sliders', 'Alpinestars', 40, 2200.00, 'Accessories', 'Replaceable knee sliders for racing leathers'),
        ('Chain Cleaner Kit', 'Motul', 25, 1500.00, 'Accessories', 'Complete chain cleaning and maintenance kit')
        ''')
        
        # Add some sample orders to populate the Recent Activity
        print("Adding sample orders...")
        cursor.execute('''
        INSERT INTO orders (product, category, sales_channel, instruction, items, status) VALUES
        ('X-14 Racing Helmet', 'Helmets', 'Online', 'Express shipping requested', 1, 'Pending'),
        ('Missile Racing Leather Jacket', 'Jackets', 'In-Store', 'Size M needed', 1, 'Processing'),
        ('GP Pro R3 Gloves', 'Gloves', 'Online', 'Black color preferred', 2, 'Shipped'),
        ('Supertech R Boots', 'Boots', 'Wholesaler', 'Bulk order for store', 5, 'Delivered'),
        ('Hydration Pack', 'Accessories', 'Online', 'Include stickers', 3, 'Pending')
        ''')
        
        # Commit changes
        mysql.connection.commit()
        
        # Close cursor
        cursor.close()
        
        print("Sample data inserted successfully!")

if __name__ == "__main__":
    insert_sample_products()
