import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Save, Lock, FileText, CheckCircle, AtSign, Settings, Mail, ArrowRight, Copy } from 'lucide-react';
import axios from 'axios';

const ProfileDashboard = () => {
    // We already have Navbar globally via App.jsx
    const [user, setUser] = useState({ username: 'Operator', id: '000', bio: '', gender: 'Unspecified' });
    const [formData, setFormData] = useState({
        username: '',
        bio: '',
        gender: ''
    });
    const [saveStatus, setSaveStatus] = useState(null); // 'saving', 'success', 'error'

    // Password Reset Flow State
    const [resetStep, setResetStep] = useState(0); // 0: Hidden, 1: Email, 2: Code, 3: New Password
    const [resetData, setResetData] = useState({ email: '', code: '', newPassword: '' });
    const [resetLoading, setResetLoading] = useState(false);
    const [resetError, setResetError] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');

    // OTP Popup State
    const [showOtpPopup, setShowOtpPopup] = useState(false);
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [otpCopied, setOtpCopied] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('cxat_user');
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            setFormData({
                username: parsed.username || '',
                bio: parsed.bio || 'Available',
                gender: parsed.gender || 'n'
            });
            setResetData((prev) => ({ ...prev, email: parsed.email || '' }));
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleResetChange = (e) => {
        setResetData({ ...resetData, [e.target.name]: e.target.value });
        setResetError('');
        setResetSuccess('');
    };

    const handleSave = (e) => {
        e.preventDefault();
        setSaveStatus('saving');

        setTimeout(() => {
            const updatedUser = { ...user, ...formData };
            setUser(updatedUser);
            localStorage.setItem('cxat_user', JSON.stringify(updatedUser));
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 2000);
        }, 1000);
    };

    const minLoadTime = (startTime) => {
        const elapsed = Date.now() - startTime;
        return new Promise(resolve => setTimeout(resolve, Math.max(0, 1500 - elapsed)));
    };

    const isValidOtp = (otp) => /^\d{6}$/.test(otp);

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setResetLoading(true);
        const startTime = Date.now();
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot?email=${resetData.email}`);
            await minLoadTime(startTime);
            if (response.data?.otp && isValidOtp(response.data.otp)) {
                setGeneratedOtp(response.data.otp);
                setShowOtpPopup(true);
                setResetSuccess("Reset code generated successfully.");
                setResetStep(2);
            } else {
                setResetError(response.data?.otp || 'Email not found. Please check and try again.');
            }
        } catch (err) {
            await minLoadTime(startTime);
            if (!err.response) {
                setResetError('Server waking up... Try again in 60s.');
                axios.get(`${import.meta.env.VITE_API_URL}/auth/health`).catch(() => { });
            } else {
                setResetError(err.response?.data || 'Failed to send code.');
            }
        } finally {
            setResetLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setResetLoading(true);
        const startTime = Date.now();
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/verify?email=${resetData.email}&code=${resetData.code}`);
            await minLoadTime(startTime);
            if (response.data === 'Verified') {
                setResetSuccess("Code verified OK. Now set new password.");
                setResetStep(3);
            } else {
                setResetError(response.data || 'Invalid or expired code.');
            }
        } catch (err) {
            await minLoadTime(startTime);
            if (!err.response) {
                setResetError('Server waking up... Try again in 60s.');
                axios.get(`${import.meta.env.VITE_API_URL}/auth/health`).catch(() => { });
            } else {
                setResetError(err.response?.data || 'Invalid code.');
            }
        } finally {
            setResetLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetLoading(true);
        const startTime = Date.now();
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset?email=${resetData.email}&code=${resetData.code}&password=${resetData.newPassword}`);
            await minLoadTime(startTime);
            if (response.data === 'Password updated') {
                setResetSuccess("Password updated successfully!");
                setTimeout(() => {
                    setResetStep(0);
                    setResetData({ email: user.email || '', code: '', newPassword: '' });
                }, 2500);
            } else {
                setResetError(response.data || 'Password update failed.');
            }
        } catch (err) {
            await minLoadTime(startTime);
            if (!err.response) {
                setResetError('Server waking up... Try again in 60s.');
                axios.get(`${import.meta.env.VITE_API_URL}/auth/health`).catch(() => { });
            } else {
                setResetError(err.response?.data || 'Password update failed.');
            }
        } finally {
            setResetLoading(false);
        }
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
                                <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '600' }}>EMAIL ADDRESS</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input type="email" value={user?.email || ''} readOnly disabled
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '14px 14px 14px 46px', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.95rem', outline: 'none', cursor: 'not-allowed' }}
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

                            <div style={{ gridColumn: 'span 2', height: '1px', background: 'var(--glass-border)', margin: '1rem 0' }}></div>

                            {/* Internal Save Changes Button */}
                            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
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

                    {/* Security & Password Reset Section */}
                    <motion.div variants={itemVariants} className="glass-panel" style={{ padding: '3rem', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)' }}>
                            <Shield size={22} color="var(--accent-secondary)" />
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0 }}>Security</h2>
                        </div>

                        {resetStep === 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '8px' }}>Account Password</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Request a reset code to securely change your password.</p>
                                </div>
                                <motion.button type="button" onClick={() => setResetStep(1)}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--outline-glow)', color: 'var(--text-main)', padding: '12px 24px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Change Password
                                </motion.button>
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {resetStep > 0 && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid var(--outline-glow)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: 'var(--accent-secondary)' }}>Secure Password Reset</h3>
                                            <button onClick={() => { setResetStep(0); setResetError(''); setResetSuccess(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>Cancel</button>
                                        </div>

                                        {resetSuccess && (
                                            <div style={{ background: 'rgba(75, 255, 120, 0.1)', border: '1px solid rgba(75, 255, 120, 0.2)', color: 'var(--success)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: '600' }}>{resetSuccess}</div>
                                        )}
                                        {resetError && (
                                            <div style={{ background: 'rgba(255, 75, 75, 0.1)', border: '1px solid rgba(255, 75, 75, 0.2)', color: 'var(--error)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: '600' }}>{resetError}</div>
                                        )}

                                        {resetStep === 1 && (
                                            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                <div style={{ position: 'relative' }}>
                                                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                    <input name="email" type="email" placeholder="Confirm your Email" value={resetData.email} onChange={handleResetChange} required
                                                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '14px 14px 14px 46px', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                                                    />
                                                </div>
                                                <motion.button type="submit" disabled={resetLoading} style={{ background: 'var(--accent-secondary)', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' }}>
                                                    {resetLoading ? 'Sending...' : 'Send Reset Code'}
                                                </motion.button>
                                            </form>
                                        )}

                                        {resetStep === 2 && (
                                            <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                <div style={{ position: 'relative' }}>
                                                    <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                    <input name="code" type="text" placeholder="Enter 6-digit Code" value={resetData.code} onChange={handleResetChange} required
                                                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '14px 14px 14px 46px', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none', letterSpacing: '2px' }}
                                                    />
                                                </div>
                                                <motion.button type="submit" disabled={resetLoading} style={{ background: 'var(--accent-secondary)', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' }}>
                                                    {resetLoading ? 'Verifying...' : 'Verify Code'}
                                                </motion.button>
                                            </form>
                                        )}

                                        {resetStep === 3 && (
                                            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                <div style={{ position: 'relative' }}>
                                                    <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                    <input name="newPassword" type="password" placeholder="Enter New Password" value={resetData.newPassword} onChange={handleResetChange} required
                                                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '14px 14px 14px 46px', borderRadius: '10px', color: '#fff', fontSize: '0.95rem', outline: 'none' }}
                                                    />
                                                </div>
                                                <motion.button type="submit" disabled={resetLoading} style={{ background: 'var(--accent-secondary)', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' }}>
                                                    {resetLoading ? 'Updating...' : 'Set New Password'}
                                                </motion.button>
                                            </form>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            </div>

            {/* OTP Popup Modal */}
            <AnimatePresence>
                {showOtpPopup && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                        onClick={() => setShowOtpPopup(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            style={{ background: 'var(--bg-base)', border: '1px solid var(--glass-border)', padding: '2.5rem 2rem', borderRadius: '20px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '50%', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 0 20px rgba(210, 168, 255, 0.1)' }}>
                                <Mail size={28} color="var(--accent-secondary)" />
                            </div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Reset Code</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                Your secure password reset code from <strong style={{ color: 'var(--text-main)' }}>CXAT System</strong>.
                            </p>

                            <div style={{ background: 'rgba(210, 168, 255, 0.05)', border: '1px dashed rgba(210, 168, 255, 0.3)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', width: '100%' }}>
                                <span style={{ fontSize: '2.5rem', letterSpacing: '8px', fontWeight: '900', fontFamily: 'monospace', color: 'var(--text-main)', display: 'block', marginLeft: '8px' }}>
                                    {generatedOtp}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                <motion.button
                                    onClick={() => {
                                        navigator.clipboard.writeText(generatedOtp).then(() => {
                                            setOtpCopied(true);
                                            setTimeout(() => setOtpCopied(false), 2000);
                                        }).catch(() => { });
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{ flex: 1, padding: '14px', background: otpCopied ? 'rgba(75, 255, 120, 0.15)' : 'rgba(255,255,255,0.05)', color: otpCopied ? 'var(--success)' : 'var(--text-main)', border: otpCopied ? '1px solid rgba(75, 255, 120, 0.3)' : '1px solid var(--glass-border)', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.3s ease' }}
                                >
                                    {otpCopied ? '✓ Copied!' : 'Copy OTP'}
                                </motion.button>
                                <motion.button
                                    onClick={() => {
                                        navigator.clipboard.writeText(generatedOtp).catch(() => { });
                                        setShowOtpPopup(false);
                                        setOtpCopied(false);
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{ flex: 1, padding: '14px', background: 'var(--text-main)', color: 'var(--bg-base)', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 14px 0 rgba(255,255,255,0.1)' }}
                                >
                                    Copy & Close
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfileDashboard;
