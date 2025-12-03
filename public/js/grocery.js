const addForm = document.getElementById('addForm');
const itemsList = document.getElementById('itemsList');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const cancelEdit = document.getElementById('cancelEdit');
const filterButtons = document.querySelectorAll('.filter');
const clearCompletedBtn = document.getElementById('clearCompleted');
const clearAllBtn = document.getElementById('clearAll');

let editItemId = null;
let currentFilter = 'all'; 

editForm.editName = document.getElementById('editName');
editForm.editQuantity = document.getElementById('editQuantity');
editForm.editCategory = document.getElementById('editCategory');
editForm.editPrice = document.getElementById('editPrice');

// FORMAT MONEY WITH COMMAS
function formatMoney(amount) {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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
      <span class="item-price">Price: SHS ${formatMoney(item.price)}</span>
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
    console.error('Add failed:', data.message || data.error);
    alert(data.message || 'Failed to add item');
    return;
  }

  addForm.reset();
  loadGroceries(currentFilter);
});

// Edit, Delete, Complete
itemsList.addEventListener('click', async (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.classList.contains('delete-btn')) {
    await fetch(`/groceries/${id}`, { method: 'DELETE', credentials: 'include' });
    loadGroceries(currentFilter);
  }

  if (e.target.classList.contains('complete-btn')) {
    await fetch(`/groceries/toggle/${id}`, { method: 'PUT', credentials: 'include' });
    loadGroceries(currentFilter);
  }

  if (e.target.classList.contains('edit-btn')) {
    editItemId = id;
    const name = li.querySelector('.item-name').textContent.trim();
    const [qty, category] = li.querySelector('.item-qty').textContent.replace(/[()]/g, '').split(' ');
    const priceText = li.querySelector('.item-price').textContent.replace('Price: SHS', '');
    editForm.editName.value = name;
    editForm.editQuantity.value = qty;
    editForm.editCategory.value = category;
    editForm.editPrice.value = parseFloat(priceText.replace(/,/g, ''));
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
  loadGroceries(currentFilter);
});

cancelEdit.addEventListener('click', () => {
  editModal.classList.add('hidden');
});

// Filters
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    loadGroceries(currentFilter);
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Stats
function updateStats(items) {
  const total = items.length;
  const completed = items.filter(i => i.completed);
  const remaining = items.filter(i => !i.completed);

  const totalCount = total;
  const completedCount = completed.length;
  const remainingCount = remaining.length;

  const totalPrice = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const completedPrice = completed.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const remainingPrice = remaining.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  document.getElementById('statTotal').textContent = totalCount;
  document.getElementById('statCompleted').textContent = completedCount;
  document.getElementById('statRemaining').textContent = remainingCount;
  document.getElementById('statTotalPrice').textContent = `SHS ${formatMoney(totalPrice)}`;
  document.getElementById('statCompletedPrice').textContent = `SHS ${formatMoney(completedPrice)}`;
  document.getElementById('statRemainingPrice').textContent = `SHS ${formatMoney(remainingPrice)}`;
}

// Bulk actions
clearCompletedBtn.addEventListener('click', async () => {
  const res = await fetch('/groceries?filter=completed', { credentials: 'include' });
  const completedItems = await res.json();
  for (const item of completedItems) {
    await fetch(`/groceries/${item._id}`, { method: 'DELETE', credentials: 'include' });
  }
  loadGroceries(currentFilter);
});

clearAllBtn.addEventListener('click', async () => {
  await fetch('/groceries', { method: 'DELETE', credentials: 'include' });
  loadGroceries(currentFilter);
});

// Load on start
loadGroceries();

// Theme toggle
const themeToggleCheckbox = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggleCheckbox.checked = savedTheme === 'dark';
themeToggleCheckbox.addEventListener('change', () => {
  const newTheme = themeToggleCheckbox.checked ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});
