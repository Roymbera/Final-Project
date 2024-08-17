document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const authMsg = document.getElementById('auth-msg');

        try {
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Handle successful login
                authMsg.textContent = 'Login successful!';
                // Redirect to index.html
                window.location.href = 'index.html';
            } else {
                // Handle errors from the server
                authMsg.textContent = data.message || 'Login failed. Please try again.';
            }
        } catch (err) {
            // Handle network or other errors
            authMsg.textContent = 'An error occurred. Please try again.';
        }
    });
});
