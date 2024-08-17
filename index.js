// Function to fetch and display expenses
const fetchExpenses = async () => {
  const token = localStorage.getItem('authToken'); // Retrieve the token

  try {
    const response = await fetch('http://localhost:3000/api/expenses', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}` // Include the token in the request header
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch expenses: ${response.statusText}`);
    }

    const expenses = await response.json();
    updateExpenseUI(expenses); // Update the UI with fetched data

  } catch (error) {
    console.error('Error fetching expenses:', error);
    document.getElementById('status').textContent = 'Error fetching expenses';
  }
};

// Function to update UI with expenses data
const updateExpenseUI = (expenses) => {
  const transactionList = document.getElementById('transactionList');
  transactionList.innerHTML = '';

  if (expenses.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No expenses available.';
    transactionList.appendChild(li);
    return;
  }

  expenses.forEach(expense => {
    const li = document.createElement('li');
    li.textContent = `Amount: $${expense.amount} | Date: ${expense.date} | Category: ${expense.category}`;
    transactionList.appendChild(li);
  });
};

// Function to update total income, expenses, and balance
const updateTotal = () => {
  const incomeTotal = transactions
    .filter(trx => trx.type === "income")
    .reduce((total, trx) => total + trx.amount, 0);

  const expenseTotal = transactions
    .filter(trx => trx.type === "expense")
    .reduce((total, trx) => total + trx.amount, 0);

  const balanceTotal = incomeTotal - expenseTotal;

  balance.textContent = formatter.format(balanceTotal).substring(1);
  income.textContent = formatter.format(incomeTotal);
  expense.textContent = formatter.format(expenseTotal * -1);
};

// Function to render the transaction list
const renderList = () => {
  list.innerHTML = "";
  status.textContent = "";

  if (transactions.length === 0) {
    status.textContent = "No transactions.";
    return;
  }

  transactions.forEach(({ id, name, amount, date, type }) => {
    const sign = type === "income" ? 1 : -1;

    const li = document.createElement("li");

    li.innerHTML = `
      <div class="name">
        <h4>${name}</h4>
        <p>${new Date(date).toLocaleDateString()}</p>
      </div>
      <div class="amount ${type}">
        <span>${formatter.format(amount * sign)}</span>
      </div>
      <div class="action">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" onclick="deleteTransaction(${id})">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    `;

    list.appendChild(li);
  });
};

// Function to delete a transaction
const deleteTransaction = (id) => {
  const index = transactions.findIndex(trx => trx.id === id);
  if (index !== -1) {
    transactions.splice(index, 1);
    updateTotal();
    saveTransactions();
    renderList();
  }
};

// Function to add a new transaction
const addTransaction = (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const amount = parseFloat(formData.get("amount"));
  const date = new Date(formData.get("date"));

  if (isNaN(amount) || !date.getTime()) {
    document.getElementById('status').textContent = 'Invalid transaction data.';
    return;
  }

  transactions.push({
    id: transactions.length + 1,
    name: formData.get("name"),
    amount,
    date,
    type: formData.get("type") === "on" ? "income" : "expense",
  });

  e.target.reset();
  updateTotal();
  saveTransactions();
  renderList();
};

// Function to save transactions to local storage
const saveTransactions = () => {
  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  localStorage.setItem("transactions", JSON.stringify(transactions));
};

// Initialize variables
const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "KSH",
  signDisplay: "always",
});
const list = document.getElementById("transactionList");
const form = document.getElementById("transactionForm");
const status = document.getElementById("status");
const balance = document.getElementById("balance");
const income = document.getElementById("income");
const expense = document.getElementById("expense");

// Event listeners
form.addEventListener("submit", addTransaction);
document.addEventListener('DOMContentLoaded', () => {
  fetchExpenses(); // Fetch expenses when the page loads
  renderList();
  updateTotal();
});
