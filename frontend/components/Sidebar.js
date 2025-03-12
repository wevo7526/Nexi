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
  const menuItems = [
    { text: 'Knowledge', icon: <BookIcon fontSize="small" /> },
    { text: 'Reports', icon: <AssessmentIcon fontSize="small" /> },
    { text: 'Documents', icon: <FolderIcon fontSize="small" /> }, // New Documents Tab
    { text: 'Research', icon: <SearchIcon fontSize="small" /> }, // New Research Tab
  ];

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

      <Divider />

      {/* Main Menu Section */}
      <Box
        sx={{
          overflow: 'auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          px: 2,
          py: 1,
        }}
      >
        <List>
          {/* Render each menu item dynamically */}
          {menuItems.map((item) => (
            <ListItem button key={item.text}>
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

      {/* Keep History at the Bottom */}
      <Box
        sx={{
          mt: "auto",
          px: 2,
          py: 1,
        }}
      >
        <List>
          <ListItem button>
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

      {/* Bottom Section for Account */}
      <Stack
        direction="row"
        sx={{
          p: 2,
          gap: 1,
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
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
