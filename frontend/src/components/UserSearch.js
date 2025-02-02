import React, { useState, useEffect } from 'react';
import { Button, List, ListItem, ListItemText } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const UserSearch = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/user'); 
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleAddContact = async (contactId) => {
    try {
      await axios.post('http://localhost:5001/api/user/add-contact', {
        userId: user.id,
        contactId
      });
      alert('Contact added successfully!');
    } catch (error) {
      console.error('Error adding contact:', error);
    }
  };

  return (
    <div>
      <List>
        {users.map((user) => (
          <ListItem key={user._id} button>
            <ListItemText primary={user.name} secondary={user.email} />
            <Button onClick={() => handleAddContact(user._id)} variant="outlined">Add</Button>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default UserSearch;
