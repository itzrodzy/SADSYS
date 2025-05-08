import mysql.connector
from werkzeug.security import generate_password_hash
import sys

# Admin credentials
admin_email = "admin@valmotogear.com"
admin_username = "admin"
admin_password = "admin123"
admin_first_name = "Admin"
admin_last_name = "User"
admin_phone = "1234567890"
admin_address = "Val Motogear HQ"

def create_admin_user():
    try:
        # Connect to database
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="val_motogear"
        )
        
        cursor = connection.cursor()
        
        # Check if admin user already exists
        cursor.execute("SELECT * FROM users WHERE username = %s", (admin_username,))
        if cursor.fetchone():
            print("Admin user already exists!")
            return
        
        # Insert admin user with is_admin flag set to 1
        hashed_password = generate_password_hash(admin_password)
        cursor.execute("""
            INSERT INTO users 
            (first_name, last_name, email, username, phone, address, password, is_admin) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, 1)
        """, (
            admin_first_name, 
            admin_last_name, 
            admin_email, 
            admin_username, 
            admin_phone, 
            admin_address, 
            hashed_password
        ))
        
        connection.commit()
        print("Admin user created successfully!")
        print(f"Username: {admin_username}")
        print(f"Password: {admin_password}")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
    finally:
        if connection:
            connection.close()

if __name__ == "__main__":
    create_admin_user()
