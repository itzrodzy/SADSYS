"""
Fix for the "Unauthorized access" error in Val Motogear app.

This script will modify the login_required decorator in your app.py file
to redirect to the login page instead of returning a JSON error.

To apply the fix, run:
python fix_login.py
"""

import re

# Read the app.py file
with open('app.py', 'r') as file:
    content = file.read()

# Pattern to match the login_required decorator function
pattern = r"def login_required\(f\):\s+@wraps\(f\)\s+def decorated_function\(\*args, \*\*kwargs\):\s+if 'user_id' not in session:\s+return jsonify\(\{'message': 'Unauthorized access'\}\), 401\s+return f\(\*args, \*\*kwargs\)\s+return decorated_function"

# Replacement with correct redirect to login page
replacement = """def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return decorated_function"""

# Replace all occurrences
new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Write the modified content back to app.py
with open('app.py', 'w') as file:
    file.write(new_content)

print("Fixed login_required decorator in app.py")
print("The decorator now redirects to the login page when users are not authenticated.")
