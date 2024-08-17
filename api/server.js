const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'expense_database'
});

db.connect(err => {
    if (err) {
        console.log("Error connecting to MySQL:", err);
        return;
    }
    console.log("Connected to MySQL");

    const usersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(100) NOT NULL UNIQUE,
            username VARCHAR(50) NOT NULL,
            password VARCHAR(255) NOT NULL
        )
    `;
    const expensesTable = `
        CREATE TABLE IF NOT EXISTS expenses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            amount DECIMAL(10, 2) NOT NULL,
            date DATE NOT NULL,
            category VARCHAR(255) NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `;
    db.query(usersTable, err => {
        if (err) {
            console.log("Error creating users table:", err);
            return;
        }
        console.log("Users table is ready");

        db.query(expensesTable, err => {
            if (err) {
                console.log("Error creating expenses table:", err);
                return;
            }
            console.log("Expenses table is ready");
        });
    });
});

const sessions = {};

const authenticateUser = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token || !sessions[token]) return res.status(401).json({ message: 'Invalid session' });

    req.user_id = sessions[token];
    next();
};

app.post('/api/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if (!email || !username || !password) {
            return res.status(400).json("Missing required fields");
        }

        const checkUserQuery = 'SELECT * FROM users WHERE email = ?';

        db.query(checkUserQuery, [email], (err, data) => {
            if (err) return res.status(500).json("Internal Server Error");
            if (data.length > 0) return res.status(409).json("User already exists");

            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(password, salt);

            const insertUserQuery = 'INSERT INTO users (email, username, password) VALUES (?, ?, ?)';
            const values = [email, username, hashedPassword];

            db.query(insertUserQuery, values, err => {
                if (err) return res.status(400).json("Something went wrong");
                res.status(201).json("User created successfully");
            });
        });
    } catch (err) {
        res.status(500).json("Internal Server Error");
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const checkUserQuery = 'SELECT * FROM users WHERE email = ?';

        db.query(checkUserQuery, [email], (err, data) => {
            if (err) return res.status(500).json("Internal Server Error");
            if (data.length === 0) return res.status(404).json("User not found");

            const isPasswordValid = bcrypt.compareSync(password, data[0].password);
            if (!isPasswordValid) return res.status(400).json("Invalid Email or Password");

            const sessionId = Date.now().toString();
            sessions[sessionId] = data[0].id;

            res.status(200).json({ sessionId });
        });
    } catch (err) {
        res.status(500).json("Internal Server Error");
    }
});

app.get('/api/expenses', authenticateUser, (req, res) => {
    const { user_id } = req;

    const selectExpensesSql = 'SELECT * FROM expenses WHERE user_id = ?';

    db.query(selectExpensesSql, [user_id], (err, results) => {
        if (err) {
            console.error('Error retrieving expenses:', err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        res.status(200).json(results);
    });
});

app.post('/api/expenses', authenticateUser, (req, res) => {
    const { user_id } = req;
    const { amount, date, category } = req.body;

    if (!user_id) {
        return res.status(401).json({ error: 'User ID not found' });
    }

    console.log('Adding expense with:', { user_id, amount, date, category });
    console.log('Active sessions:', sessions);

    const insertExpenseSql = 'INSERT INTO expenses (user_id, amount, date, category) VALUES (?, ?, ?, ?)';
    db.query(insertExpenseSql, [user_id, amount, date, category], (err) => {
        if (err) {
            console.error('Error adding expense:', err.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.status(200).json({ message: 'Expense added successfully' });
    });
});

app.listen(3000, () => {
    console.log('Server is running on PORT 3000...');
});
