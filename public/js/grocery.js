// connects html elements to js for interractions 
const addForm = document.getElementById('addForm');
const itemsList = document.getElementById('itemsList');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const cancelEdit = document.getElementById('cancelEdit');
const filterButtons = document.querySelectorAll('.filter');
const clearCompletedBtn = document.getElementById('clearCompleted');
const clearAllBtn = document.getElementById('clearAll');
const sidebarToggle = document.querySelector('.sidebar-toggle');
const sidebar = document.querySelector('.sidebar');

let editItemId = null;
let currentFilter = 'all';

// Edit form inputs
editForm.editName = document.getElementById('editName');
editForm.editQuantity = document.getElementById('editQuantity');
editForm.editCategory = document.getElementById('editCategory');
editForm.editPrice = document.getElementById('editPrice');

// Load groceries
async function loadGroceries(filter = 'all') {
  const res = await fetch(`/groceries?filter=${filter}`, { credentials: 'include' });
  const groceries = await res.json();

  itemsList.innerHTML = '';
  groceries.forEach(item => {
    const li = document.createElement('li');
    li.dataset.id = item._id;
    li.innerHTML = `
      <span class="item-name ${item.completed ? 'completed' : ''}">${item.name}</span>
      <span class="item-qty">(${item.quantity} ${item.category})</span>
      <span class="item-price">UGX ${Number(item.price).toLocaleString()}</span>
      <button class="complete-btn">${item.completed ? 'Undo' : 'Complete'}</button>
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
    `;
    itemsList.appendChild(li);
  });

  updateStats(groceries);
}


// Add grocery
addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = Object.fromEntries(new FormData(addForm).entries());
  formData.price = parseFloat(formData.price);
  formData.quantity = parseInt(formData.quantity);

  const res = await fetch('/groceries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(formData)
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data.message || 'Failed to add item');
    return;
  }

  addForm.reset();
  await loadGroceries(currentFilter);
});


// Edit, Delete, Complete
itemsList.addEventListener('click', async (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.classList.contains('delete-btn')) {
    await fetch(`/groceries/${id}`, { method: 'DELETE', credentials: 'include' });
    await loadGroceries(currentFilter);
  }

  if (e.target.classList.contains('complete-btn')) {
    await fetch(`/groceries/toggle/${id}`, { method: 'PUT', credentials: 'include' });
    await loadGroceries(currentFilter);
  }

  if (e.target.classList.contains('edit-btn')) {
    editItemId = id;
    const name = li.querySelector('.item-name').textContent.trim();
    const [qty, category] = li.querySelector('.item-qty').textContent.replace(/[()]/g, '').split(' ');
    const priceText = li.querySelector('.item-price').textContent.replace('UGX', '').replace(/,/g, '');
    editForm.editName.value = name;
    editForm.editQuantity.value = qty;
    editForm.editCategory.value = category;
    editForm.editPrice.value = parseFloat(priceText);
    editModal.classList.remove('hidden');
  }
});


// Save edited item
editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(editForm).entries());
  data.price = parseFloat(data.price);
  data.quantity = parseInt(data.quantity);

  await fetch(`/groceries/edit/${editItemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  editModal.classList.add('hidden');
  await loadGroceries(currentFilter);
});

cancelEdit.addEventListener('click', () => {
  editModal.classList.add('hidden');
});


// Filters
filterButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    currentFilter = btn.dataset.filter;
    await loadGroceries(currentFilter);
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});


// Statistics Calculation
function updateStats(items) {
  const total = items.length;
  const completed = items.filter(i => i.completed);
  const incomplete = items.filter(i => !i.completed);

  const totalPrice = items.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);
  const completedPrice = completed.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);
  const incompletePrice = incomplete.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statCompleted').textContent = completed.length;
  document.getElementById('statIncomplete').textContent = incomplete.length;
  document.getElementById('statTotalPrice').textContent = `UGX ${totalPrice.toLocaleString()}`;
  document.getElementById('statCompletedPrice').textContent = `UGX ${completedPrice.toLocaleString()}`;
  document.getElementById('statIncompletePrice').textContent = `UGX ${incompletePrice.toLocaleString()}`;
}


// Bulk actions
clearCompletedBtn.addEventListener('click', async () => {
  const res = await fetch('/groceries?filter=completed', { credentials: 'include' });
  const completedItems = await res.json();
  for (const item of completedItems) {
    await fetch(`/groceries/${item._id}`, { method: 'DELETE', credentials: 'include' });
  }
  await loadGroceries(currentFilter);
});

clearAllBtn.addEventListener('click', async () => {
  await fetch('/groceries', { method: 'DELETE', credentials: 'include' });
  await loadGroceries(currentFilter);
});

// Theme toggle with localStorage
const toggleSwitch = document.querySelector('.theme-switch input');
const body = document.body;

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
  body.classList.add('dark-theme');
  toggleSwitch.checked = true;
}

toggleSwitch.addEventListener('change', () => {
  if (toggleSwitch.checked) {
    body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    body.classList.remove('dark-theme');
    localStorage.setItem('theme', 'light');
  }
});

// Load on start
loadGroceries();
