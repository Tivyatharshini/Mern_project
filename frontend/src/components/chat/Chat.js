import React, { useState, useEffect } from 'react';
import { Box, Grid, TextField, Button, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { io } from 'socket.io-client';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

function Chat() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
    });

    newSocket.on('user:online', ({ userId }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    newSocket.on('user:offline', ({ userId }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

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
        headers: {'Content-Type': 'multipart/form-data'},
        onUploadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          setUploadProgress(Math.round((loaded * 100) / total));
        }
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
    <Box sx={{ height: '100vh', backgroundColor: '#f0f2f5' }}>
      <Grid container sx={{ height: '100%' }}>
        <Grid item xs={4}>
          <Sidebar
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            onlineUsers={onlineUsers}
          />
        </Grid>
        <Grid item xs={8}>
          <ChatWindow
            selectedChat={selectedChat}
            socket={socket}
          />
          <div>
            <h2>Chat</h2>
            {loading ? <CircularProgress /> : (
              <List>
                {messages.map((msg) => (
                  <ListItem key={msg._id} className={msg.sender === user.id ? 'sent' : 'received'}>
                    <ListItemText primary={msg.message} secondary={new Date(msg.timestamp).toLocaleString()} />
                    {msg.attachments.length > 0 && msg.attachments.map((attachment, index) => (
                      <a key={index} href={attachment} download>Download File</a>
                    ))}
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
            {uploadProgress > 0 && <div>Uploading: {uploadProgress}%</div>}
          </div>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Chat;
