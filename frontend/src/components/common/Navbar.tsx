import React, { useState } from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Avatar, Box, Badge,
  Menu, MenuItem, ListItemIcon, Divider, Chip
} from '@mui/material';
import {
  Menu as MenuIcon, Notifications, Logout, Person, Lock, Psychology
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';

interface Props {
  onMenuToggle: () => void;
  drawerWidth: number;
}

const Navbar: React.FC<Props> = ({ onMenuToggle, drawerWidth }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) =>
    name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'MC';

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
        ml: { xs: 0, md: `${drawerWidth}px` },
        background: 'rgba(10, 22, 40, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        zIndex: theme => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuToggle}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box display="flex" alignItems="center" gap={1}>
            <Psychology sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                background: 'linear-gradient(135deg, #00BCD4, #7C3AED)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              MindCare
            </Typography>
            {user?.role === 'psychologist' && (
              <Chip
                label="Psychologist"
                size="small"
                sx={{
                  background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: 22,
                }}
              />
            )}
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1.5}>
          <ThemeToggle />
          <IconButton
            sx={{
              color: 'text.primary',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onClick={() => navigate(user?.role === 'psychologist' ? '/psych/notifications' : '/notifications')}
          >
            <Badge badgeContent={0} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
            <Avatar
              sx={{
                width: 38,
                height: 38,
                background: 'linear-gradient(135deg, #00BCD4, #7C3AED)',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: '2px solid rgba(0,188,212,0.4)',
              }}
            >
              {getInitials(user?.name || '')}
            </Avatar>
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 220,
              background: 'rgba(17, 34, 64, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 3,
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box px={2} py={1.5}>
            <Typography fontWeight={700}>{user?.name}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <MenuItem
            onClick={() => { handleMenuClose(); navigate(user?.role === 'psychologist' ? '/psych/profile' : '/profile'); }}
          >
            <ListItemIcon><Person fontSize="small" /></ListItemIcon>
            Edit Profile
          </MenuItem>
          <MenuItem
            onClick={() => { handleMenuClose(); navigate(user?.role === 'psychologist' ? '/psych/profile' : '/profile'); }}
          >
            <ListItemIcon><Lock fontSize="small" /></ListItemIcon>
            Change Password
          </MenuItem>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon><Logout fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
            Sign Out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
