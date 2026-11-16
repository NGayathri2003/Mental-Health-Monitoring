import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { ThemeModeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// User Pages
import UserDashboard from './pages/user/Dashboard';
import TextJournalPage from './pages/user/TextJournalPage';
import VoiceJournalPage from './pages/user/VoiceJournalPage';
import JournalHistoryPage from './pages/user/JournalHistoryPage';
import ProfilePage from './pages/user/ProfilePage';

// Psychologist Pages
import PsychDashboard from './pages/psychologist/PsychDashboard';
import PatientList from './pages/psychologist/PatientList';
import PatientDetail from './pages/psychologist/PatientDetail';
import NotificationsPage from './pages/psychologist/NotificationsPage';
import PsychProfilePage from './pages/psychologist/PsychProfilePage';
import PsychReportsPage from './pages/psychologist/PsychReportsPage';

const DRAWER_WIDTH = 260;

function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      <Navbar onMenuToggle={() => setMobileOpen(o => !o)} drawerWidth={DRAWER_WIDTH} />
      <Sidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        width={DRAWER_WIDTH}
        variant="temporary"
      />
      <Sidebar
        open
        onClose={() => {}}
        width={DRAWER_WIDTH}
        variant="permanent"
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { xs: 0, md: `${DRAWER_WIDTH}px` },
          minHeight: '100vh',
          boxSizing: 'border-box',
          overflowX: 'hidden',
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeModeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* User Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute role="user">
                <AppLayout><UserDashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/journal/text" element={
              <ProtectedRoute role="user">
                <AppLayout><TextJournalPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/journal/voice" element={
              <ProtectedRoute role="user">
                <AppLayout><VoiceJournalPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute role="user">
                <AppLayout><JournalHistoryPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute role="user">
                <AppLayout><ProfilePage /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Psychologist Routes */}
            <Route path="/psych/dashboard" element={
              <ProtectedRoute role="psychologist">
                <AppLayout><PsychDashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/psych/patients" element={
              <ProtectedRoute role="psychologist">
                <AppLayout><PatientList /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/psych/patients/:id" element={
              <ProtectedRoute role="psychologist">
                <AppLayout><PatientDetail /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/psych/reports" element={
              <ProtectedRoute role="psychologist">
                <AppLayout><PsychReportsPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/psych/notifications" element={
              <ProtectedRoute role="psychologist">
                <AppLayout><NotificationsPage /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/psych/profile" element={
              <ProtectedRoute role="psychologist">
                <AppLayout><PsychProfilePage /></AppLayout>
              </ProtectedRoute>
            } />

            {/* Redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeModeProvider>
  );
}

export default App;
