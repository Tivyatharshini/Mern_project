import React, { useEffect, useState } from 'react';
import { TextField, Button, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import AboutStatus from './AboutStatus'; 

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5001/api/messages/history/${user.id}`);
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user.id]);

  const handleSendMessage = async () => {
    if (!message.trim() && !file) return;
    const formData = new FormData();
    formData.append('sender', user.id);
    formData.append('message', message);
    if (file) {
      formData.append('attachments', file);
    }

    try {
      await axios.post('http://localhost:5001/api/messages/send', formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      });
      setMessage(''); // Clear the input field
      setFile(null); // Clear the file input
      // Fetch messages again to update the chat
      const response = await axios.get(`http://localhost:5001/api/messages/history/${user.id}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div>
      <h2>Chat</h2>
      <AboutStatus /> 
      {loading ? <CircularProgress /> : (
        <List>
          {messages.map((msg) => (
            <ListItem key={msg._id}>
              <ListItemText primary={msg.message} secondary={new Date(msg.timestamp).toLocaleString()} />
            </ListItem>
          ))}
        </List>
      )}
      <TextField
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message"
        fullWidth
      />
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        accept="*"
      />
      <Button onClick={handleSendMessage} variant="contained">Send</Button>
    </div>
  );
};

export default Chat;
