import React from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Divider, Avatar, Chip
} from '@mui/material';
import {
  Dashboard, Book, Mic, History, Person, Psychology,
  People, Assessment, Notifications, BarChart, Home
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
  width: number;
  variant?: 'permanent' | 'temporary';
}

const userNav = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { label: 'Text Journal', icon: <Book />, path: '/journal/text' },
  { label: 'Voice Journal', icon: <Mic />, path: '/journal/voice' },
  { label: 'Journal History', icon: <History />, path: '/history' },
  { label: 'Profile', icon: <Person />, path: '/profile' },
];

const psychNav = [
  { label: 'Dashboard', icon: <Home />, path: '/psych/dashboard' },
  { label: 'Patients', icon: <People />, path: '/psych/patients' },
  { label: 'Reports', icon: <Assessment />, path: '/psych/reports' },
  { label: 'Notifications', icon: <Notifications />, path: '/psych/notifications' },
  { label: 'Profile', icon: <Person />, path: '/psych/profile' },
];

const Sidebar: React.FC<Props> = ({ open, onClose, width, variant = 'permanent' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = user?.role === 'psychologist' ? psychNav : userNav;
  const getInitials = (name: string) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'MC';

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0A1628 0%, #112240 100%)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #00BCD4, #7C3AED)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0,188,212,0.3)',
          }}
        >
          <Psychology sx={{ color: '#fff', fontSize: 24 }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, color: '#fff' }}>
            MindCare
          </Typography>
          <Typography variant="caption" color="primary.main" fontWeight={600}>
            AI Mental Health
          </Typography>
        </Box>
      </Box>

      {/* User Card */}
      <Box sx={{ px: 2, py: 2.5, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar
            sx={{
              width: 44,
              height: 44,
              background: 'linear-gradient(135deg, #00BCD4, #7C3AED)',
              fontSize: '0.9rem',
              fontWeight: 700,
              border: '2px solid rgba(0,188,212,0.3)',
            }}
          >
            {getInitials(user?.name || '')}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>
              {user?.name || 'User'}
            </Typography>
            <Chip
              label={user?.role === 'psychologist' ? 'Psychologist' : 'Patient'}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.6rem',
                fontWeight: 700,
                background: user?.role === 'psychologist'
                  ? 'linear-gradient(135deg, #7C3AED, #4F46E5)'
                  : 'linear-gradient(135deg, #00BCD4, #0891B2)',
                color: '#fff',
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, px: 1.5, pt: 2 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => { navigate(item.path); onClose(); }}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  py: 1.2,
                  position: 'relative',
                  overflow: 'hidden',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(0,188,212,0.2), rgba(124,58,237,0.15))'
                    : 'transparent',
                  border: isActive
                    ? '1px solid rgba(0,188,212,0.25)'
                    : '1px solid transparent',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {isActive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: '60%',
                      borderRadius: '0 3px 3px 0',
                      background: 'linear-gradient(180deg, #00BCD4, #7C3AED)',
                    }}
                  />
                )}
                <ListItemIcon
                  sx={{
                    minWidth: 38,
                    color: isActive ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.9rem',
                    color: isActive ? 'primary.main' : 'text.primary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <Typography variant="caption" color="text.disabled" display="block" textAlign="center">
          MindCare v1.0 • AI-Powered
        </Typography>
      </Box>
    </Box>
  );

  if (variant === 'temporary') {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width, boxSizing: 'border-box', border: 'none' },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: 'none', md: 'block' },
        width: width,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width, boxSizing: 'border-box', border: 'none' },
      }}
      open
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
