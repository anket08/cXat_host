import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Chat from './components/Chat';
import Lobby from './components/Lobby';
import LandingPage from './components/LandingPage';
import ProfileDashboard from './components/ProfileDashboard';
import Navbar from './components/Navbar';

// Protected Route Component
const ProtectedRoute = ({ children, user }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('cxat_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeRoom, setActiveRoom] = useState(() => {
    const savedRoom = localStorage.getItem('cxat_active_room');
    return (savedRoom && savedRoom !== 'null' && savedRoom !== 'undefined') ? savedRoom : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('cxat_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cxat_user');
    }
  }, [user]);

  useEffect(() => {
    if (activeRoom) {
      localStorage.setItem('cxat_active_room', activeRoom);
    } else {
      localStorage.removeItem('cxat_active_room');
    }
  }, [activeRoom]);

  const handleLogout = () => {
    setUser(null);
    setActiveRoom(null);
    localStorage.removeItem('cxat_user');
    localStorage.removeItem('cxat_active_room');
  };

  return (
    <Router>
      {/* Background elements can be added here or in index.css */}
      <div className="app-container">
        {/* The Navbar determines whether to show itself based on useLocation internally */}
        <Navbar user={user} onLogout={handleLogout} />

        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route path="/login" element={
            user ? <Navigate to="/lobby" replace /> : <Login onLogin={setUser} />
          } />

          <Route path="/lobby" element={
            <ProtectedRoute user={user}>
              <Lobby
                user={user}
                onJoinRoom={(roomId) => setActiveRoom(roomId)}
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } />

          <Route path="/chat/:roomId" element={
            <ProtectedRoute user={user}>
              <Chat
                user={user}
                activeRoom={activeRoom}
                onLeaveRoom={() => setActiveRoom(null)}
              />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute user={user}>
              <ProfileDashboard />
            </ProtectedRoute>
          } />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
