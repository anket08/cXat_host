import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Atom } from 'react-loading-indicators';
import { User, Lock, Mail, ArrowRight, ChevronLeft, PawPrint } from 'lucide-react';

const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const passedUsername = location.state?.username || '';

    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({ username: passedUsername, password: '', email: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const minLoadTime = (startTime) => {
        const elapsed = Date.now() - startTime;
        const minTime = 1500; // reduced artificial delay to feel snappier
        return new Promise(resolve => setTimeout(resolve, Math.max(0, minTime - elapsed)));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const startTime = Date.now();
        try {
            const response = await axios.post('http://localhost:8080/auth/login', {
                username: formData.username,
                password: formData.password
            });
            await minLoadTime(startTime);
            if (response.status === 200) {
                try {
                    const userResponse = await axios.get(`http://localhost:8080/auth/user/${formData.username}`);
                    onLogin(userResponse.data);
                } catch (fetchError) {
                    onLogin({ username: formData.username, id: Date.now() });
                }
            } else {
                setError(response.data);
            }
        } catch (err) {
            await minLoadTime(startTime);
            setError('Please check your credentials and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        const startTime = Date.now();
        try {
            const res = await axios.post('http://localhost:8080/auth/register', {
                username: formData.username,
                password: formData.password,
                email: formData.email,
                role: 'USER'
            });
            await minLoadTime(startTime);
            onLogin(res.data);
        } catch (err) {
            await minLoadTime(startTime);
            setError('Registration failed. Username or Email might be taken.');
        } finally {
            setLoading(false);
        }
    };

    const pageVariants = {
        initial: { opacity: 0, scale: 0.98 },
        animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
        exit: { opacity: 0, transition: { duration: 0.3 } }
    };

    if (loading) {
        return (
            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
                style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-base)' }}>
                <Atom color="var(--accent-primary)" size="medium" />
                <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ color: 'var(--text-main)', letterSpacing: '2px', fontSize: '0.85rem', fontWeight: '600', marginTop: '2rem' }}>
                    Authenticating...
                </motion.p>
            </motion.div>
        );
    }

    return (
        <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit"
            style={{ width: '100vw', height: '100vh', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
        >
            {/* Background */}
            <div style={{ position: 'absolute', inset: 0, zIndex: -1, background: 'var(--bg-base)' }}></div>

            <div className="glass-panel" style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px', padding: '3rem 2.5rem', margin: '0 20px', display: 'flex', flexDirection: 'column' }}>

                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', marginBottom: '2.5rem', alignSelf: 'flex-start', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-main)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <ChevronLeft size={16} /> Back
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div
                        style={{ margin: '0 auto 1.5rem', display: 'flex', justifyContent: 'center' }}
                    >
                        <motion.div
                            animate={{
                                filter: [
                                    "drop-shadow(0px 0px 0px rgba(0,255,255,0))",
                                    "drop-shadow(3px 0px 0px rgba(0,255,255,0.8)) drop-shadow(-3px 0px 0px rgba(255,0,255,0.8))",
                                    "drop-shadow(-3px 0px 0px rgba(0,255,255,0.8)) drop-shadow(3px 0px 0px rgba(255,0,255,0.8))",
                                    "drop-shadow(4px -2px 0px rgba(0,255,255,0.8)) drop-shadow(-4px 2px 0px rgba(255,0,255,0.8))",
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
                            <PawPrint size={48} color="#79c0ff" />
                        </motion.div>
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '0.5rem' }}>
                        {isRegistering ? 'Create an account' : 'Welcome back'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {isRegistering ? 'Enter your details to get started.' : 'Sign in to your sophisticated workspace.'}
                    </p>
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ background: 'rgba(255, 75, 75, 0.1)', border: '1px solid rgba(255, 75, 75, 0.2)', color: 'var(--error)', padding: '12px 16px', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center', fontWeight: '600' }}>
                        {error}
                    </motion.div>
                )}

                <form onSubmit={isRegistering ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <AnimatePresence mode="wait">
                        <motion.div key={isRegistering ? 'reg' : 'log'} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            {isRegistering && (
                                <div className="input-field-group" style={{ position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '16px 16px 16px 46px', borderRadius: '14px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s ease' }}
                                        onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                                        onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'rgba(255,255,255,0.03)'; }}
                                    />
                                </div>
                            )}

                            <div className="input-field-group" style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input name="username" type="text" placeholder="Username" value={formData.username} onChange={handleChange} required
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '16px 16px 16px 46px', borderRadius: '14px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s ease' }}
                                    onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'rgba(255,255,255,0.03)'; }}
                                />
                            </div>

                            <div className="input-field-group" style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} required
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '16px 16px 16px 46px', borderRadius: '14px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s ease' }}
                                    onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                                    onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'rgba(255,255,255,0.03)'; }}
                                />
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <motion.button
                        type="submit"
                        disabled={loading}
                        style={{ marginTop: '1rem', width: '100%', padding: '16px', background: 'var(--text-main)', color: 'var(--bg-base)', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                        whileHover={{ scale: 1.02, boxShadow: '0 10px 25px rgba(255,255,255,0.2)' }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isRegistering ? 'Create Account' : 'Sign In'} <ArrowRight size={18} />
                    </motion.button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                        <button
                            onClick={() => { setIsRegistering(!isRegistering); setError(''); setFormData({ username: '', password: '', email: '' }); }}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: '600', marginLeft: '6px', cursor: 'pointer' }}
                        >
                            {isRegistering ? 'Sign in' : 'Sign up'}
                        </button>
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default Login;