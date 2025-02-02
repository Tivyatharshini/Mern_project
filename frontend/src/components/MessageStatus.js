import React from 'react';
import DoneIcon from '@mui/icons-material/Done';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { styled } from '@mui/material/styles';

const StatusIcon = styled('span')(({ theme, seen }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  marginLeft: '4px',
  '& svg': {
    fontSize: '1rem',
    color: seen ? theme.palette.primary.main : theme.palette.text.secondary,
  }
}));

const MessageStatus = ({ sent, delivered, seen }) => {
  if (!sent) return null;

  return (
    <StatusIcon seen={seen}>
      {delivered || seen ? (
        <DoneAllIcon fontSize="inherit" />
      ) : (
        <DoneIcon fontSize="inherit" />
      )}
    </StatusIcon>
  );
};

export default MessageStatus;
