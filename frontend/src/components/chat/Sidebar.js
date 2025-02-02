import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  Badge
} from '@mui/material';
import { MoreVert as MoreVertIcon, Search as SearchIcon, ExitToApp as LogoutIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import ViewContact from './ViewContact';

function Sidebar({ selectedChat, setSelectedChat, onlineUsers }) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewProfileDialog, setViewProfileDialog] = useState(false);
  const { user, logout, setUser } = useAuth();

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getLastMessage = (contact) => {
    return contact.status || "Click to start chatting";
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRight: 1, borderColor: 'divider' }}>
      <Box sx={{ p: 2, backgroundColor: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setViewProfileDialog(true)}>
          <Avatar src={user?.profilePic} />
          <Typography sx={{ ml: 2 }}>{user?.name}</Typography>
        </Box>
        <IconButton onClick={handleMenuOpen}>
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            handleMenuClose();
            setViewProfileDialog(true);
          }}>
            Profile
          </MenuItem>
          <MenuItem onClick={() => {
            handleMenuClose();
            logout();
          }}>
            Logout
          </MenuItem>
        </Menu>
      </Box>

      <Box sx={{ p: 2, backgroundColor: '#fff' }}>
        <TextField
          fullWidth
          placeholder="Search contacts"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
          }}
          size="small"
        />
      </Box>

      <List sx={{ flex: 1, overflow: 'auto' }}>
        {filteredUsers.map((chatUser) => (
          <ListItem
            key={chatUser._id}
            button
            selected={selectedChat?._id === chatUser._id}
            onClick={() => setSelectedChat(chatUser)}
          >
            <ListItemAvatar>
              <Badge
                color="success"
                variant="dot"
                invisible={!onlineUsers.has(chatUser._id)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                sx={{
                  '& .MuiBadge-badge': {
                    border: '2px solid white'
                  }
                }}
              >
                <Avatar src={chatUser.profilePic} />
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary={chatUser.name}
              secondary={getLastMessage(chatUser)}
              secondaryTypographyProps={{
                noWrap: true,
                style: { maxWidth: '200px' }
              }}
            />
          </ListItem>
        ))}
      </List>

      <ViewContact
        open={viewProfileDialog}
        handleClose={() => setViewProfileDialog(false)}
        contact={user}
        isOwnProfile={true}
        handleProfileUpdate={handleProfileUpdate}
      />
    </Box>
  );
}

export default Sidebar;
