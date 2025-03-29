import React from 'react';
import { styled } from '@mui/material/styles';
import MuiDrawer, { drawerClasses } from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import BusinessIcon from '@mui/icons-material/Business';
import SearchIcon from '@mui/icons-material/Search';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupsIcon from '@mui/icons-material/Groups';
import HistoryIcon from '@mui/icons-material/History';
import DescriptionIcon from '@mui/icons-material/Description';
import { useRouter } from 'next/router';
import Typography from '@mui/material/Typography';

const drawerWidth = 280;

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

  const menuItems = [
    {
      section: 'Core Features',
      items: [
        { 
          text: 'Company Analysis', 
          icon: <BusinessIcon fontSize="small" />, 
          path: '/consultant',
          description: 'AI-powered insights'
        },
        { 
          text: 'Market Research', 
          icon: <SearchIcon fontSize="small" />, 
          path: '/market-research',
          description: 'Deep market analysis'
        },
        { 
          text: 'Reports', 
          icon: <DescriptionIcon fontSize="small" />, 
          path: '/reports',
          description: 'Generate and manage reports'
        }
      ]
    },
    {
      section: 'Analysis Tools',
      items: [
        { 
          text: 'Market Trends', 
          icon: <TrendingUpIcon fontSize="small" />, 
          path: '/market-trends',
          description: 'Real-time trend analysis'
        },
        { 
          text: 'Competitor Analysis', 
          icon: <AnalyticsIcon fontSize="small" />, 
          path: '/competitor-analysis',
          description: 'Competitor insights'
        },
        { 
          text: 'Team Collaboration', 
          icon: <GroupsIcon fontSize="small" />, 
          path: '/multiagent',
          description: 'Collaborative analysis'
        }
      ]
    }
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
          p: 1.5,
          textAlign: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider'
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

      {/* Menu Sections */}
      <Box sx={{ py: 1 }}>
        {menuItems.map((section, index) => (
          <React.Fragment key={section.section}>
            <Box sx={{ px: 2, py: 0.5 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {section.section}
              </Typography>
            </Box>
            <List sx={{ py: 0 }}>
              {section.items.map((item) => (
                <ListItem 
                  button 
                  key={item.text} 
                  onClick={() => handleNavigation(item.path)}
                  selected={router.pathname === item.path}
                  sx={{
                    py: 0.75,
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    secondary={item.description}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                    }}
                  />
                </ListItem>
              ))}
            </List>
            {index < menuItems.length - 1 && <Divider sx={{ my: 1 }} />}
          </React.Fragment>
        ))}
      </Box>

      {/* History Section - Fixed at bottom */}
      <Box sx={{ mt: 'auto', p: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        <ListItem 
          button 
          onClick={() => handleNavigation('/history')}
          selected={router.pathname === '/history'}
          sx={{
            borderRadius: 1,
            '&:hover': {
              backgroundColor: 'action.hover',
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Analysis History"
            secondary="View past analyses"
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
            secondaryTypographyProps={{
              fontSize: '0.75rem',
              color: 'text.secondary',
            }}
          />
        </ListItem>
      </Box>
    </Drawer>
  );
}
