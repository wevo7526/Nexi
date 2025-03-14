import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';

const NavbarContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  backgroundColor: theme.palette.background.default,
  padding: '16px 32px',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  borderBottom: '1px solid',
  borderColor: theme.palette.divider,
}));

const NavbarItem = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  fontFamily: 'Roboto, sans-serif',
  fontWeight: 500,
  cursor: 'pointer',
  padding: '8px 16px',
  borderRadius: '4px',
  color: theme.palette.text.primary,
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'translateY(-1px)',
  },
}));

export default function Navbar() {
  const router = useRouter();

  const handleNavigation = (path) => {
    router.push(path);
  };

  return (
    <NavbarContainer>
      <Stack direction="row" spacing={2}>
        <NavbarItem onClick={() => handleNavigation('/consultant')}>Consultant</NavbarItem>
        <NavbarItem onClick={() => handleNavigation('/wealthmanager')}>Wealth Manager</NavbarItem>
        <NavbarItem onClick={() => handleNavigation('/multiagent')}>Team</NavbarItem>
      </Stack>
    </NavbarContainer>
  );
}