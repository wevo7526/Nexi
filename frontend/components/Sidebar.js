import React from 'react';
import { styled } from '@mui/material/styles';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import BookIcon from '@mui/icons-material/Book';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import FolderIcon from '@mui/icons-material/Folder';
import SearchIcon from '@mui/icons-material/Search';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import GroupsIcon from '@mui/icons-material/Groups';
import { useRouter } from 'next/router';

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
  const router = useRouter();

  const mainMenuItems = [
    { text: 'Insights', icon: <BookIcon fontSize="small" />, path: '/insights' },
    { text: 'Reports', icon: <AssessmentIcon fontSize="small" />, path: '/reports' },
    { text: 'Documents', icon: <FolderIcon fontSize="small" />, path: '/documents' },
    { text: 'Research', icon: <SearchIcon fontSize="small" />, path: '/market-research' },
  ];

  const featureMenuItems = [
    { text: 'Business', icon: <BusinessIcon fontSize="small" />, path: '/consultant' },
    { text: 'Wealth', icon: <AccountBalanceIcon fontSize="small" />, path: '/wealthmanager' },
    { text: 'Team', icon: <GroupsIcon fontSize="small" />, path: '/multiagent' },
  ];

  const handleNavigation = (path) => {
    router.push(path);
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
      {/* Logo Section */}
      <Box
        sx={{
          mt: 4,
          p: 1.5,
          textAlign: 'center',
        }}
      >
        <img
          src="/Nexi.png"
          alt="Nexi Logo"
          style={{
            maxWidth: '80%',
            height: 'auto',
          }}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Main Menu Section */}
      <Box sx={{ flex: 1, px: 2, py: 1 }}>
        <List>
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
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      <Divider />

      {/* Features Section */}
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
              }}
            />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
}
