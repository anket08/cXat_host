import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Plus, Link, Zap, User, Crosshair, Settings, ShieldCheck, Activity, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Lobby = ({ user, onJoinRoom, onLogout }) => {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');
    const [loading, setLoading] = useState(false);

    const STORAGE_KEY = `cxat_recent_rooms_${user?.username || 'guest'}`;

    const [recentRooms, setRecentRooms] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });

    const addRecentRoom = (id) => {
        if (!id) return;
        setRecentRooms(prev => {
            const updated = [id, ...prev.filter(r => r !== id)].slice(0, 10);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const handleCreateRoom = async () => {
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:8080/chat/room');
            if (res.data && res.data.id) {
                addRecentRoom(res.data.id);
                onJoinRoom(res.data.id);
                navigate(`/chat/${res.data.id}`);
            }
        } catch (err) {
            console.error("Terminal Error:", err);
            alert("Connection Failed. Check if server is running on port 8080.");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!roomId.trim()) {
            alert("Please enter a valid Frequency ID");
            return;
        }
        try {
            const res = await axios.get(`http://localhost:8080/chat/room/${roomId.trim()}/exists`);
            if (res.data === true) {
                addRecentRoom(roomId.trim());
                onJoinRoom(roomId.trim());
                navigate(`/chat/${roomId.trim()}`);
            } else {
                alert("Room does not exist");
            }
        } catch (err) {
            alert("Server error");
        }
    };

    return (
        <div style={{ minHeight: '100vh', paddingTop: '100px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Animated Ambient Background */}
            <div style={{ position: 'absolute', inset: 0, zIndex: -1, background: 'var(--bg-base)', overflow: 'hidden' }}>
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                        x: ['0%', '5%', '0%'],
                        y: ['0%', '5%', '0%']
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(0, 242, 255, 0.15) 0%, transparent 60%)', borderRadius: '50%', willChange: 'transform, opacity' }}
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2],
                        x: ['0%', '-5%', '0%'],
                        y: ['0%', '-5%', '0%']
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                    style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(112, 0, 255, 0.12) 0%, transparent 60%)', borderRadius: '50%', willChange: 'transform, opacity' }}
                />
                <motion.div
                    animate={{
                        opacity: [0.1, 0.2, 0.1],
                        x: ['-5%', '5%', '-5%']
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
                    style={{ position: 'absolute', top: '30%', right: '20%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(0, 168, 255, 0.1) 0%, transparent 70%)', borderRadius: '50%', willChange: 'transform, opacity' }}
                />
            </div>

            <div style={{ display: 'flex', flex: 1, width: '100%', zIndex: 10 }}>
                {/* Sidebar */}
                {/* Sidebar */}
                <aside style={{
                    width: '320px',
                    margin: '0 0 2rem 2rem',
                    borderRadius: '24px',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100vh - 180px)',
                    position: 'sticky',
                    top: '100px',
                    background: 'rgba(13, 17, 23, 0.3)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    willChange: 'transform' // Hardware acceleration to decoupled from background paints
                }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px' }}><Activity size={20} color="var(--accent-secondary)" /> Recent Channels</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '8px', scrollbarWidth: 'none', transform: 'translateZ(0)' }}>
                        {recentRooms.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>No recent activity.</p>
                        ) : (
                            recentRooms.map(id => (
                                <button
                                    key={id}
                                    onClick={() => { addRecentRoom(id); onJoinRoom(id); navigate(`/chat/${id}`); }}
                                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px 18px', borderRadius: '16px', color: 'var(--text-main)', textAlign: 'left', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(210, 168, 255, 0.3)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                                >
                                    <span style={{ fontSize: '1rem', letterSpacing: '0.5px' }}><span style={{ color: 'var(--accent-secondary)', opacity: 0.8 }}>#</span> {id}</span>
                                    <ChevronRight size={16} color="var(--text-muted)" style={{ transition: 'transform 0.3s ease' }} />
                                </button>
                            ))
                        )}
                    </div>
                </aside>

                <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 5% 4rem 5%' }}>

                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '0.5rem', letterSpacing: '-1px' }} className="gradient-text">Command Center</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: '500' }}>Select an operation to begin secure communication.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', width: '100%', maxWidth: '1100px', alignItems: 'stretch' }}>

                        {/* Create Room Card */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                            style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', background: 'rgba(22, 27, 34, 0.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(48, 54, 61, 0.8)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden', height: '100%' }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.background = 'rgba(48, 54, 61, 0.6)'; e.currentTarget.style.borderColor = 'rgba(121, 192, 255, 0.4)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.4), 0 0 30px rgba(121, 192, 255, 0.1)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(22, 27, 34, 0.5)'; e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.8)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
                        >
                            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(121,192,255,0.15), rgba(121,192,255,0.05))', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid rgba(121,192,255,0.2)', boxShadow: 'inset 0 0 15px rgba(121,192,255,0.05)' }}>
                                <Plus size={32} />
                            </div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1rem', color: '#e6edf3' }}>New Channel</h3>
                            <p style={{ color: '#8b949e', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2.5rem', flex: 1 }}>
                                Initialize a new end-to-end encrypted communication channel. Secure coordinates will be generated automatically.
                            </p>
                            <button onClick={handleCreateRoom} disabled={loading} style={{ width: '100%', padding: '14px', background: 'rgba(121, 192, 255, 0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(121, 192, 255, 0.3)', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s ease', marginTop: 'auto' }}
                                onMouseOver={(e) => { e.currentTarget.style.background = 'var(--accent-primary)'; e.currentTarget.style.color = '#000'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(121, 192, 255, 0.3)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(121, 192, 255, 0.1)'; e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                {loading ? 'INITIALIZING...' : <>CREATE <Crosshair size={18} /></>}
                            </button>
                        </motion.div>

                        {/* Join Room Card */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                            style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', background: 'rgba(22, 27, 34, 0.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(48, 54, 61, 0.8)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden', height: '100%' }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.background = 'rgba(48, 54, 61, 0.6)'; e.currentTarget.style.borderColor = 'rgba(210, 168, 255, 0.4)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.4), 0 0 30px rgba(210, 168, 255, 0.1)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(22, 27, 34, 0.5)'; e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.8)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
                        >
                            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(210,168,255,0.15), rgba(210,168,255,0.05))', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid rgba(210,168,255,0.2)', boxShadow: 'inset 0 0 15px rgba(210,168,255,0.05)' }}>
                                <Link size={32} />
                            </div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1rem', color: '#e6edf3' }}>Join Channel</h3>
                            <p style={{ color: '#8b949e', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem', flex: 1 }}>
                                Enter existing channel coordinates to intercept transmissions and join the secure network.
                            </p>
                            <input
                                placeholder="Enter Room ID"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                                style={{ width: '100%', background: 'rgba(13, 17, 23, 0.6)', border: '1px solid rgba(48, 54, 61, 0.8)', borderRadius: '14px', padding: '14px', color: '#e6edf3', textAlign: 'center', fontSize: '1rem', letterSpacing: '1px', outline: 'none', marginBottom: '12px', transition: 'all 0.2s ease', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2)' }}
                                onFocus={e => { e.target.style.borderColor = 'var(--accent-secondary)'; e.target.style.background = 'rgba(13, 17, 23, 0.9)'; }}
                                onBlur={e => { e.target.style.borderColor = 'rgba(48, 54, 61, 0.8)'; e.target.style.background = 'rgba(13, 17, 23, 0.6)'; }}
                            />
                            <button onClick={handleJoinRoom} style={{ width: '100%', padding: '14px', background: 'rgba(210,168,255,0.1)', color: 'var(--accent-secondary)', border: '1px solid rgba(210,168,255,0.3)', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s ease', marginTop: 'auto' }}
                                onMouseOver={(e) => { e.currentTarget.style.background = 'var(--accent-secondary)'; e.currentTarget.style.color = '#000'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(210, 168, 255, 0.3)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(210,168,255,0.1)'; e.currentTarget.style.color = 'var(--accent-secondary)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                CONNECT
                            </button>
                        </motion.div>

                        {/* Profile Card */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} onClick={() => navigate('/profile')}
                            style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', background: 'rgba(22, 27, 34, 0.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '20px', border: '1px solid rgba(48, 54, 61, 0.8)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden', height: '100%' }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.background = 'rgba(48, 54, 61, 0.6)'; e.currentTarget.style.boxShadow = '0 16px 32px rgba(0,0,0,0.4)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.8)'; e.currentTarget.style.background = 'rgba(22, 27, 34, 0.5)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
                        >
                            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', color: '#c9d1d9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <User size={32} />
                            </div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1rem', color: '#e6edf3' }}>Operator Profile</h3>
                            <p style={{ color: '#8b949e', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2.5rem', flex: 1 }}>
                                Access your identity logs, communication stats, and personalize your configuration settings.
                            </p>
                            <div style={{ marginTop: 'auto', padding: '12px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: '8px', color: '#c9d1d9', fontSize: '0.9rem', fontWeight: '600', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s ease', width: '100%', justifyContent: 'center' }}
                                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#c9d1d9'; }}
                            >
                                CONFIGURE <Settings size={16} />
                            </div>
                        </motion.div>

                    </div>
                </main>
            </div>

            {/* Footer */}
            <footer style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'transparent', zIndex: 10 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px' }}><ShieldCheck size={14} color="#3fb950" style={{ filter: 'drop-shadow(0 0 5px rgba(63, 185, 80, 0.5))' }} /> AES-256 ACTIVE</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px' }}><Activity size={14} color="var(--accent-primary)" style={{ filter: 'drop-shadow(0 0 5px rgba(0, 242, 255, 0.5))' }} /> SYSTEM NOMINAL</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>v2.0.0</div>
            </footer>
        </div>
    );
};

export default Lobby;