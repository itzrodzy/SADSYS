// Modal handling
const modals = document.querySelectorAll('.modal');
modals.forEach(modal => {
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => modal.style.display = 'none';
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
});

// Edit item functionality
function editItem(itemId) {
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    
    // Set the form action URL with the correct item ID
    editForm.action = `/update_item/${itemId}`;
    
    // Fetch the item data and populate the form
    fetch(`/get_item/${itemId}`)
        .then(response => response.json())
        .then(item => {
            editForm.querySelector('[name="item_name"]').value = item.item_name;
            editForm.querySelector('[name="category"]').value = item.category;
            editForm.querySelector('[name="supplier"]').value = item.supplier;
            editForm.querySelector('[name="quantity"]').value = item.quantity;
            editForm.querySelector('[name="reorder_level"]').value = item.reorder_level;
            editForm.querySelector('[name="price"]').value = item.price;
        })
        .catch(error => console.error('Error:', error));
    
    editModal.style.display = 'block';
                    <label for="supplier">Supplier:</label>
                    <input type="text" id="supplier" name="supplier" value="${data.supplier}" required>
                </div>
                <div class="form-group">
                    <label for="quantity">Quantity:</label>
                    <input type="number" id="quantity" name="quantity" value="${data.quantity}" required>
                </div>
                <div class="form-group">
                    <label for="reorder_level">Reorder Level:</label>
                    <input type="number" id="reorder_level" name="reorder_level" value="${data.reorder_level}" required>
                </div>
                <div class="form-group">
                    <label for="price">Price:</label>
                    <input type="number" id="price" name="price" value="${data.price}" step="0.01" required>
                </div>
                <button type="submit">Update Item</button>
            `;
            
            modal.style.display = 'block';
        });
}

// Delete item functionality
function deleteItem(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        window.location.href = `/delete_item/${itemId}`;
    }
}