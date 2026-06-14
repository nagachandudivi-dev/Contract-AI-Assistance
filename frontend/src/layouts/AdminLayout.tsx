import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, IconButton
} from '@mui/material';
import {
  Dashboard, Upload, Description, Chat, CompareArrows, History,
  Analytics, Menu as MenuIcon
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard',         icon: <Dashboard />,      path: '/dashboard' },
  { label: 'Upload Documents',  icon: <Upload />,          path: '/upload' },
  { label: 'Documents',         icon: <Description />,     path: '/documents' },
  { label: 'AI Assistant',      icon: <Chat />,            path: '/chat' },
  { label: 'Compare Documents', icon: <CompareArrows />,   path: '/compare' },
  { label: 'Question History',  icon: <History />,         path: '/history' },
  { label: 'Analytics',         icon: <Analytics />,       path: '/analytics' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawer = (
    <Box>
      <Box sx={{ p: 2, background: 'linear-gradient(135deg, #0A2F6B 0%, #1a4a9e 100%)', color: 'white' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Contract AI</Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>Assistance</Typography>
      </Box>
      <List>
        {navItems.map(item => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path || location.pathname.startsWith(item.path + '/')}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              sx={{
                '&.Mui-selected': { bgcolor: 'rgba(10,47,107,0.1)', borderRight: '3px solid #0A2F6B' },
                '&.Mui-selected .MuiListItemIcon-root': { color: '#0A2F6B' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { style: { fontSize: '0.875rem' } } }} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: t => t.zIndex.drawer + 1, bgcolor: 'white', color: 'text.primary', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
        <Toolbar>
          <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 1, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ color: '#0A2F6B', fontWeight: 700 }}>
            Contract AI Assistance
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{ width: DRAWER_WIDTH, flexShrink: 0, display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', top: 64 } }}>
        {drawer}
      </Drawer>
      <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, ml: { sm: `${DRAWER_WIDTH}px` }, minHeight: '100vh', bgcolor: 'background.default' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
