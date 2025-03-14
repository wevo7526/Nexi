import React from 'react';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import BookIcon from '@mui/icons-material/Book';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import FolderIcon from '@mui/icons-material/Folder'; // Icon for Documents
import SearchIcon from '@mui/icons-material/Search'; // Icon for Research
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import GroupsIcon from '@mui/icons-material/Groups';
import { useRouter } from 'next/router'; // Import useRouter from Next.js

const drawerWidth = 240;

const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: 'border-box',
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: 'border-box',
  },
});

export default function SideMenu() {
  const router = useRouter(); // Initialize the router

  const mainMenuItems = [
    { text: 'Knowledge', icon: <BookIcon fontSize="small" />, path: '/knowledge' },
    { text: 'Reports', icon: <AssessmentIcon fontSize="small" />, path: '/reports' },
    { text: 'Documents', icon: <FolderIcon fontSize="small" />, path: '/documents' }, // New Documents Tab
    { text: 'Research', icon: <SearchIcon fontSize="small" />, path: '/research' }, // New Research Tab
  ];

  const featureMenuItems = [
    { text: 'Consultant', icon: <BusinessIcon fontSize="small" />, path: '/consultant' },
    { text: 'Wealth Manager', icon: <AccountBalanceIcon fontSize="small" />, path: '/wealthmanager' },
    { text: 'Team', icon: <GroupsIcon fontSize="small" />, path: '/multiagent' },
  ];

  const handleNavigation = (path) => {
    router.push(path); // Navigate to the specified path
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        [`& .${drawerClasses.paper}`]: {
          backgroundColor: 'background.paper',
        },
      }}
    >
      {/* Top Section for Logo */}
      <Box
        sx={{
          mt: 4,
          p: 1.5,
          textAlign: 'center',
          fontFamily: 'Roboto, sans-serif',
        }}
      >
        {/* Display the Nexi logo */}
        <img
          src="/Nexi.png" // Path to your logo in the public directory
          alt="Nexi Logo"
          style={{
            maxWidth: '80%', // Adjust to keep the logo responsive
            height: 'auto',
          }}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Main Menu Section */}
      <Box
        sx={{
          flex: 1,
          px: 2,
          py: 1,
        }}
      >
        <List>
          {/* Render each menu item dynamically */}
          {mainMenuItems.map((item) => (
            <ListItem 
              button 
              key={item.text} 
              onClick={() => handleNavigation(item.path)}
              selected={router.pathname === item.path}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontFamily: 'Roboto, sans-serif',
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      <Divider />

      {/* Features Section (Former Navbar Items) */}
      <Box sx={{ px: 2, py: 1 }}>
        <List>
          {featureMenuItems.map((item) => (
            <ListItem 
              button 
              key={item.text} 
              onClick={() => handleNavigation(item.path)}
              selected={router.pathname === item.path}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontFamily: 'Roboto, sans-serif',
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      <Divider />

      {/* History Section */}
      <Box sx={{ px: 2, py: 1 }}>
        <List>
          <ListItem 
            button 
            onClick={() => handleNavigation('/history')}
            selected={router.pathname === '/history'}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <HistoryIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="History"
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontFamily: 'Roboto, sans-serif',
              }}
            />
          </ListItem>
        </List>
      </Box>

      <Divider />

      {/* Bottom Section for Account */}
      <Stack
        direction="row"
        sx={{
          p: 2,
          gap: 1,
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
          mt: 'auto',
        }}
      >
        <Avatar
          alt="Account"
          src="/static/images/avatar/7.jpg"
          sx={{ width: 36, height: 36 }}
        />
        <Box sx={{ mr: 'auto' }}>
          <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: '16px' }}>
            Account
          </Typography>
        </Box>
      </Stack>
    </Drawer>
  );
}
