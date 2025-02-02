import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Box,
  Typography,
  TextField,
  IconButton
} from '@mui/material';
import { Edit as EditIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

function ViewContact({ open, handleClose, contact, isOwnProfile = false, handleProfileUpdate }) {
  const [editing, setEditing] = useState(false);
  const [about, setAbout] = useState(contact?.about || '');
  const { user, setUser } = useAuth();

  useEffect(() => {
    setAbout(contact?.about || '');
  }, [contact]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/users/profile',
        { about },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (isOwnProfile) {
        setUser(response.data);
        if (handleProfileUpdate) {
          handleProfileUpdate(response.data);
        }
      }
      setEditing(false);
    } catch (error) {
      console.error('Error updating about:', error);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Contact Info</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={contact?.profilePic}
            alt={contact?.name}
            sx={{ width: 100, height: 100, mb: 2 }}
          />
          <Typography variant="h6">{contact?.name}</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            About
          </Typography>
          {isOwnProfile && editing ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                fullWidth
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                size="small"
                sx={{ mr: 1 }}
              />
              <IconButton size="small" onClick={handleSave} color="primary">
                <CheckIcon />
              </IconButton>
              <IconButton size="small" onClick={() => setEditing(false)} color="error">
                <CloseIcon />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography>{contact?.about}</Typography>
              {isOwnProfile && (
                <IconButton size="small" onClick={() => setEditing(true)} sx={{ ml: 1 }}>
                  <EditIcon />
                </IconButton>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ViewContact;
