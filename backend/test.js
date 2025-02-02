const axios = require('axios');

const api = axios.create({
    baseURL: 'http://localhost:5001/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

async function testEndpoints() {
    try {
        console.log('Testing /api/test endpoint...');
        const testResponse = await api.get('/test');
        console.log('Test response:', testResponse.data);

        console.log('\nTesting /api/auth/test endpoint...');
        const authTestResponse = await api.get('/auth/test');
        console.log('Auth test response:', authTestResponse.data);

        console.log('\nTesting registration...');
        const registerResponse = await api.post('/auth/register', {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        });
        console.log('Register response:', registerResponse.data);
    } catch (error) {
        console.error('Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
    }
}

testEndpoints();
