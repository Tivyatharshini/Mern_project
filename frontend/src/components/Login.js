// frontend/src/components/Login.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styled from 'styled-components';

const Container = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #111b21;
`;

const LoginForm = styled.form`
  background-color: #202c33;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin: 8px 0;
  border: 1px solid #2f3b43;
  border-radius: 4px;
  background-color: #2a3942;
  color: #e9edef;
  &::placeholder {
    color: #8696a0;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #00a884;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 16px;
  &:hover {
    background-color: #008f72;
  }
`;

const StyledLink = styled(Link)`
  color: #00a884;
  text-decoration: none;
  display: block;
  text-align: center;
  margin-top: 16px;
  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  margin-top: 8px;
  text-align: center;
`;

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Here you would typically make an API call to your backend
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data);
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Failed to connect to server');
    }
  };

  return (
    <Container>
      <LoginForm onSubmit={handleSubmit}>
        <h2 style={{ color: '#e9edef', textAlign: 'center', marginBottom: '24px' }}>
          Login to WhatsApp
        </h2>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
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
        
        <Button type="submit">Login</Button>
        
        <StyledLink to="/signup">
          Don't have an account? Sign up
        </StyledLink>
      </LoginForm>
    </Container>
  );
}

export default Login;