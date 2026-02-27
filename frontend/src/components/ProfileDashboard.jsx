import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Save, Lock, FileText, CheckCircle, AtSign, Settings } from 'lucide-react';

const ProfileDashboard = () => {
    // We already have Navbar globally via App.jsx
    const [user, setUser] = useState({ username: 'Operator', id: '000', bio: '', gender: 'Unspecified' });
    const [formData, setFormData] = useState({
        username: '',
        bio: '',
        gender: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'success', 'error'

    useEffect(() => {
        const storedUser = localStorage.getItem('cxat_user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            setFormData({
                username: parsed.username || '',
                bio: parsed.bio || 'Available',
                gender: parsed.gender || 'n',
                newPassword: '',
                confirmPassword: ''
            });
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = (e) => {
        e.preventDefault();
        setSaveStatus('saving');

        setTimeout(() => {
            if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
                setSaveStatus('error');
                alert("Passwords do not match!");
                setSaveStatus(null);
                return;
            }

            const updatedUser = { ...user, ...formData };
            setUser(updatedUser);
            localStorage.setItem('cxat_user', JSON.stringify(updatedUser));
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 2000);
        }, 1000);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div style={{ minHeight: '100vh', paddingTop: '100px', paddingBottom: '50px', position: 'relative' }}>
            {/* Background */}
            <div style={{ position: 'absolute', inset: 0, zIndex: -1, background: 'var(--bg-base)' }}></div>

            <div style={{ position: 'relative', zIndex: 10, maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
                <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Identity Card */}
                    <motion.div variants={itemVariants} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '3rem', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(0, 242, 255, 0.3)' }}>
                                <span style={{ fontSize: '3rem', fontWeight: '800', color: '#fff' }}>{user.username?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--bg-base)', borderRadius: '50%', padding: '4px' }}>
                                <div style={{ width: '20px', height: '20px', background: 'var(--success)', borderRadius: '50%' }}></div>
                            </div>
                        </div>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', letterSpacing: '-1px' }}>{user.username}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '12px' }}>
                                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: {user.id}</span>
                                <span style={{ background: 'rgba(0, 242, 255, 0.1)', color: 'var(--accent-primary)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>Active Operator</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Settings Form */}
                    <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '3rem', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <Settings size={22} color="var(--accent-primary)" />
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0 }}>Configuration</h2>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '600' }}>DISPLAY NAME</label>
                                <div style={{ position: 'relative' }}>
                                    <AtSign size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input type="text" name="username" value={formData.username} onChange={handleChange}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '14px 14px 14px 46px', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s' }}
                                        onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                                        onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'rgba(255,255,255,0.02)'; }}
                                    />
                                </div>
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '600' }}>BIO</label>
                                <div style={{ position: 'relative' }}>
                                    <FileText size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }} />
                                    <textarea name="bio" value={formData.bio} onChange={handleChange} rows="3"
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '14px 14px 14px 46px', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none', resize: 'none', fontFamily: 'inherit', transition: 'all 0.3s' }}
                                        onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                                        onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'rgba(255,255,255,0.02)'; }}
                                    />
                                </div>
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '600' }}>IDENTITY</label>
                                <select name="gender" value={formData.gender} onChange={handleChange}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '14px', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none', cursor: 'pointer', appearance: 'none' }}
                                >
                                    <option value="m" style={{ background: '#111' }}>Male</option>
                                    <option value="f" style={{ background: '#111' }}>Female</option>
                                    <option value="n" style={{ background: '#111' }}>Non-Binary</option>
                                    <option value="x" style={{ background: '#111' }}>Prefer not to say</option>
                                </select>
                            </div>

                            <div style={{ gridColumn: 'span 2', height: '1px', background: 'var(--glass-border)', margin: '1rem 0' }}></div>

                            <div>
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '600' }}>NEW PASSWORD</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} placeholder="••••••••"
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '14px 14px 14px 46px', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s' }}
                                        onFocus={e => { e.target.style.borderColor = 'var(--accent-secondary)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                                        onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'rgba(255,255,255,0.02)'; }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '600' }}>CONFIRM PASSWORD</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••"
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '14px 14px 14px 46px', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s' }}
                                        onFocus={e => { e.target.style.borderColor = 'var(--accent-secondary)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                                        onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'rgba(255,255,255,0.02)'; }}
                                    />
                                </div>
                            </div>

                            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <motion.button type="submit"
                                    whileHover={{ scale: 1.02, boxShadow: '0 8px 25px rgba(255,255,255,0.2)' }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{
                                        background: saveStatus === 'success' ? 'var(--success)' : 'var(--text-main)',
                                        color: saveStatus === 'success' ? '#000' : 'var(--bg-base)',
                                        border: 'none', padding: '14px 32px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s ease'
                                    }}
                                >
                                    {saveStatus === 'success' ? <><CheckCircle size={18} /> UPDATED</> : <><Save size={18} /> SAVE CHANGES</>}
                                </motion.button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default ProfileDashboard;
