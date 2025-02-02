import React, { useEffect, useState } from 'react';
import { TextField, Button, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const AboutStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/user/status/${user.id}`);
        setStatus(response.data.status);
      } catch (error) {
        console.error('Error fetching status:', error);
      }
    };

    fetchStatus();
  }, [user.id]);

  const handleUpdateStatus = async () => {
    try {
      await axios.put('http://localhost:5001/api/user/status', {
        userId: user.id,
        status: status
      });
      alert('Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div>
      <Typography variant="h6">Update Your About Status</Typography>
      <TextField
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        placeholder="Type your status"
        fullWidth
        multiline
        rows={4}
      />
      <Button onClick={handleUpdateStatus} variant="contained">Update Status</Button>
    </div>
  );
};

export default AboutStatus;
