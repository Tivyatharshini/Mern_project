// frontend/src/components/Register.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';

// Keep all your styled components here...

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/login');
      } else {
        setError(data.message || 'Sign up failed');
      }
    } catch (error) {
      setError('Failed to connect to server');
    }
  };

  return (
    <Container>
      <LoginForm onSubmit={handleSubmit}>
        <h2 style={{ color: '#e9edef', textAlign: 'center', marginBottom: '24px' }}>
          Create Account
        </h2>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <Button type="submit">Sign Up</Button>
        
        <StyledLink to="/login">
          Already have an account? Login
        </StyledLink>
      </LoginForm>
    </Container>
  );
}

export default Register;