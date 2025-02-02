import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { IconButton } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';
import axios from 'axios';
// ... (keep your existing imports)

function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const { currentUser } = useAuth();
  const socketRef = useRef();

  useEffect(() => {
    // Connect to Socket.io server
    socketRef.current = io('http://localhost:5000');
    
    // Listen for messages
    socketRef.current.on('message', (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
    });

    // Load contacts
    loadContacts();

    return () => socketRef.current.disconnect();
  }, []);

  const loadContacts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users/contacts', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setContacts(response.data);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !selectedChat) return;

    const newMessage = {
      sender: currentUser.id,
      receiver: selectedChat.id,
      content: message,
      timestamp: new Date().toISOString()
    };

    socketRef.current.emit('sendMessage', newMessage);
    setMessages(prev => [...prev, newMessage]);
    setMessage('');
  };

  // ... (keep your existing render code)
}

export default ChatApp;