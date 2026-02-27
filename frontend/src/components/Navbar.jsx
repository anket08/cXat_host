import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, PawPrint } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const hiddenRoutes = ['/', '/login'];
    const isChat = location.pathname.startsWith('/chat');

    // Hide navbar on landing, login, and chat (chat has its own header)
    if (hiddenRoutes.includes(location.pathname) || isChat || !user) {
        return null;
    }

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="global-navbar"
        >
            <div className="navbar-container">
                <div
                    className="nav-brand"
                    onClick={() => navigate('/lobby')}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                    <motion.div
                        animate={{
                            filter: [
                                "drop-shadow(0px 0px 0px rgba(0,255,255,0))",
                                "drop-shadow(2px 0px 0px rgba(0,255,255,0.8)) drop-shadow(-2px 0px 0px rgba(255,0,255,0.8))",
                                "drop-shadow(-2px 0px 0px rgba(0,255,255,0.8)) drop-shadow(2px 0px 0px rgba(255,0,255,0.8))",
                                "drop-shadow(3px -1px 0px rgba(0,255,255,0.8)) drop-shadow(-3px 1px 0px rgba(255,0,255,0.8))",
                                "drop-shadow(0px 0px 0px rgba(0,255,255,0))"
                            ]
                        }}
                        transition={{
                            duration: 0.2,
                            repeat: Infinity,
                            repeatType: "mirror",
                            repeatDelay: Math.random() * 2 + 1 // random delay between 1-3 seconds
                        }}
                    >
                        <PawPrint size={24} color="#79c0ff" />
                    </motion.div>
                    <span className="nav-title">cXat</span>
                </div>

                <div className="nav-actions">
                    <button className="nav-profile-btn" onClick={() => navigate('/profile')}>
                        <div className="nav-avatar">
                            {user.username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="nav-username">{user.username}</span>
                    </button>
                    <button className="nav-logout-btn" onClick={onLogout}>
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
