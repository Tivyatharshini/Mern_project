import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Menu,
  MenuItem,
  Popover,
  Paper,
  Avatar
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiEmotionsIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  Videocam as VideoIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

function ChatWindow({ selectedChat }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachmentAnchorEl, setAttachmentAnchorEl] = useState(null);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  // Fetch messages when chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchMessages();
    }
  }, [selectedChat]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5001/api/messages/${selectedChat._id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5001/api/messages/upload',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Get file type
      const fileType = file.type.startsWith('image/') ? 'image' :
                      file.type.startsWith('video/') ? 'video' : 'document';

      // Send message with file
      await sendMessage(file.name, fileType, response.data.url);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      setAttachmentAnchorEl(null);
    }
  };

  const sendMessage = async (content, type = 'text', fileUrl = null) => {
    if (!content || !selectedChat) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5001/api/messages',
        {
          content,
          receiver: selectedChat._id,
          type,
          fileUrl
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const newMessage = response.data;
      setMessages(prev => [...prev, newMessage]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage.trim());
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji.native);
    setEmojiAnchorEl(null);
  };

  if (!selectedChat) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: '#f0f2f5'
      }}>
        <Typography>Select a chat to start messaging</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#efeae2',
      backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`
    }}>
      {/* Chat Header */}
      <Box sx={{ 
        p: 2, 
        bgcolor: '#f0f2f5', 
        borderBottom: 1, 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Avatar src={selectedChat.profilePic} alt={selectedChat.name} />
        <Box sx={{ ml: 2 }}>
          <Typography variant="subtitle1">{selectedChat.name}</Typography>
          <Typography variant="caption" color="textSecondary">
            {isTyping ? 'typing...' : selectedChat.status}
          </Typography>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box sx={{ 
        flex: 1, 
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              alignSelf: message.sender === user._id ? 'flex-end' : 'flex-start',
              maxWidth: '70%',
              mb: 1
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 1,
                bgcolor: message.sender === user._id ? '#dcf8c6' : '#fff',
                borderRadius: 2
              }}
            >
              {message.type === 'text' && (
                <Typography>{message.content}</Typography>
              )}
              {message.type === 'image' && (
                <Box
                  component="img"
                  src={`http://localhost:5001${message.fileUrl}`}
                  alt="Image"
                  sx={{ maxWidth: '100%', borderRadius: 1 }}
                />
              )}
              {message.type === 'video' && (
                <Box
                  component="video"
                  controls
                  sx={{ maxWidth: '100%', borderRadius: 1 }}
                >
                  <source src={`http://localhost:5001${message.fileUrl}`} type="video/mp4" />
                </Box>
              )}
              {message.type === 'document' && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DocumentIcon sx={{ mr: 1 }} />
                  <Typography>{message.content}</Typography>
                </Box>
              )}
              <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                {new Date(message.createdAt).toLocaleTimeString()}
              </Typography>
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{ 
        p: 2, 
        bgcolor: '#f0f2f5', 
        display: 'flex', 
        alignItems: 'center',
        gap: 1
      }}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        <IconButton onClick={(e) => setAttachmentAnchorEl(e.currentTarget)}>
          <AttachFileIcon />
        </IconButton>

        <Menu
          anchorEl={attachmentAnchorEl}
          open={Boolean(attachmentAnchorEl)}
          onClose={() => setAttachmentAnchorEl(null)}
        >
          <MenuItem onClick={() => {
            fileInputRef.current.accept = 'image/*';
            fileInputRef.current.click();
          }}>
            <ImageIcon sx={{ mr: 1 }} /> Image
          </MenuItem>
          <MenuItem onClick={() => {
            fileInputRef.current.accept = 'video/*';
            fileInputRef.current.click();
          }}>
            <VideoIcon sx={{ mr: 1 }} /> Video
          </MenuItem>
          <MenuItem onClick={() => {
            fileInputRef.current.accept = '.pdf,.doc,.docx,.txt';
            fileInputRef.current.click();
          }}>
            <DocumentIcon sx={{ mr: 1 }} /> Document
          </MenuItem>
        </Menu>

        <IconButton onClick={(e) => setEmojiAnchorEl(e.currentTarget)}>
          <EmojiEmotionsIcon />
        </IconButton>

        <Popover
          open={Boolean(emojiAnchorEl)}
          anchorEl={emojiAnchorEl}
          onClose={() => setEmojiAnchorEl(null)}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
        >
          <Picker data={data} onEmojiSelect={handleEmojiSelect} />
        </Popover>

        <TextField
          fullWidth
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message"
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#fff',
              borderRadius: 5
            }
          }}
        />

        {uploading ? (
          <CircularProgress size={24} />
        ) : (
          <IconButton 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            sx={{
              bgcolor: '#00a884',
              color: 'white',
              '&:hover': { bgcolor: '#00967d' },
              '&.Mui-disabled': { bgcolor: '#f0f2f5' }
            }}
          >
            <SendIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}

export default ChatWindow;
