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
    const [registerStep, setRegisterStep] = useState(0); // 0: Enter Details, 1: Enter OTP
    const [registerOtp, setRegisterOtp] = useState('');
    const [formData, setFormData] = useState({ username: passedUsername, password: '', email: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Password Reset State
    const [resetStep, setResetStep] = useState(0); // 0: None, 1: Email, 2: Code, 3: New Password
    const [resetData, setResetData] = useState({ email: '', code: '', newPassword: '' });
    const [successMsg, setSuccessMsg] = useState('');

    // OTP Popup State
    const [showOtpPopup, setShowOtpPopup] = useState(false);
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [otpCopied, setOtpCopied] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccessMsg('');
    };

    const handleResetChange = (e) => {
        setResetData({ ...resetData, [e.target.name]: e.target.value });
        setError('');
        setSuccessMsg('');
    };

    const minLoadTime = (startTime) => {
        const elapsed = Date.now() - startTime;
        const minTime = 1500;
        return new Promise(resolve => setTimeout(resolve, Math.max(0, minTime - elapsed)));
    };

    const isValidOtp = (otp) => /^\d{6}$/.test(otp);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const startTime = Date.now();
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
                username: formData.username,
                password: formData.password
            });
            await minLoadTime(startTime);
            if (response.status === 200 && response.data) {
                onLogin(response.data);
            } else {
                setError(response.data || 'Login failed.');
            }
        } catch (err) {
            await minLoadTime(startTime);
            if (!err.response) {
                setError('Server waking up... Please try again in 60 seconds.');
                axios.get(`${import.meta.env.VITE_API_URL}/auth/health`).catch(() => { });
            } else {
                const data = err.response.data;
                setError(typeof data === 'string' ? data : (data?.message || data?.error || 'Please check your credentials and try again.'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSendRegisterOtp = async (e) => {
        e.preventDefault();

        if (!formData.email.toLowerCase().endsWith("@gmail.com")) {
            setError("Only @gmail.com addresses are allowed for registration.");
            return;
        }

        setLoading(true);
        const startTime = Date.now();
        try {
            // Pre-check: if email already has a registered account
            try {
                const checkRes = await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot?email=${formData.email}`);
                if (checkRes.data?.otp && isValidOtp(checkRes.data.otp)) {
                    await minLoadTime(startTime);
                    setError('This email is already registered. Please sign in instead.');
                    setLoading(false);
                    return;
                }
            } catch (e) { /* email not found = safe to register */ }

            const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/send-otp?email=${formData.email}`);
            await minLoadTime(startTime);
            if (response.data?.otp && isValidOtp(response.data.otp)) {
                setGeneratedOtp(response.data.otp);
                setShowOtpPopup(true);
                setSuccessMsg("Verification OTP generated successfully.");
                setRegisterStep(1);
            } else {
                setError(response.data?.otp || 'Failed to generate OTP.');
            }
        } catch (err) {
            await minLoadTime(startTime);
            if (!err.response) {
                setError('Server waking up... Please try again in 60 seconds.');
                axios.get(`${import.meta.env.VITE_API_URL}/auth/health`).catch(() => { });
            } else {
                const data = err.response.data;
                setError(typeof data === 'string' ? data : (data?.message || data?.error || 'Failed to send OTP.'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        const startTime = Date.now();
        try {
            const verifyResponse = await axios.post(`${import.meta.env.VITE_API_URL}/auth/verify-otp?email=${formData.email}&code=${registerOtp}`);

            if (verifyResponse.data === "Verified") {
                const registerResponse = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
                    username: formData.username,
                    password: formData.password,
                    email: formData.email
                });
                await minLoadTime(startTime);
                onLogin(registerResponse.data);
            } else {
                await minLoadTime(startTime);
                setError(verifyResponse.data || 'Invalid OTP');
                setLoading(false);
            }
        } catch (err) {
            await minLoadTime(startTime);
            if (!err.response) {
                setError('Server waking up... Please try again in 60 seconds.');
                axios.get(`${import.meta.env.VITE_API_URL}/auth/health`).catch(() => { });
            } else {
                const data = err.response.data;
                setError(typeof data === 'string' ? data : (data?.message || data?.error || 'Failed to verify OTP or register. Username or Email might be taken.'));
            }
            setLoading(false);
        }
    };

    // --- Forgot Password Flow Handlers ---

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        const startTime = Date.now();
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot?email=${resetData.email}`);
            await minLoadTime(startTime);
            if (response.data?.otp && isValidOtp(response.data.otp)) {
                setGeneratedOtp(response.data.otp);
                setShowOtpPopup(true);
                setSuccessMsg("Reset code generated successfully.");
                setResetStep(2);
            } else {
                setError(response.data?.otp || 'Email not found. Please check and try again.');
            }
        } catch (err) {
            await minLoadTime(startTime);
            if (!err.response) {
                setError('Server waking up... Please try again in 60 seconds.');
                axios.get(`${import.meta.env.VITE_API_URL}/auth/health`).catch(() => { });
            } else {
                const data = err.response.data;
                setError(typeof data === 'string' ? data : (data?.message || data?.error || 'Failed to send reset code.'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        const startTime = Date.now();
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/verify?email=${resetData.email}&code=${resetData.code}`);
            await minLoadTime(startTime);
            if (response.data === 'Verified') {
                setSuccessMsg("Code verified perfectly.");
                setResetStep(3);
            } else {
                setError(response.data || 'Invalid or expired code.');
            }
        } catch (err) {
            await minLoadTime(startTime);
            if (!err.response) {
                setError('Server waking up... Please try again in 60 seconds.');
                axios.get(`${import.meta.env.VITE_API_URL}/auth/health`).catch(() => { });
            } else {
                const data = err.response.data;
                setError(typeof data === 'string' ? data : (data?.message || data?.error || 'Invalid or expired code.'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        const startTime = Date.now();
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset?email=${resetData.email}&code=${resetData.code}&password=${resetData.newPassword}`);
            await minLoadTime(startTime);
            if (response.data === 'Password updated') {
                setSuccessMsg("Password reset successfully! Please sign in.");
                setResetStep(0);
                setIsRegistering(false);
                setResetData({ email: '', code: '', newPassword: '' });
                setFormData({ ...formData, password: '' });
            } else {
                setError(response.data || 'Failed to reset password.');
            }
        } catch (err) {
            await minLoadTime(startTime);
            if (!err.response) {
                setError('Server waking up... Please try again in 60 seconds.');
                axios.get(`${import.meta.env.VITE_API_URL}/auth/health`).catch(() => { });
            } else {
                const data = err.response.data;
                setError(typeof data === 'string' ? data : (data?.message || data?.error || 'Failed to reset password.'));
            }
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

                {successMsg && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ background: 'rgba(75, 255, 120, 0.1)', border: '1px solid rgba(75, 255, 120, 0.2)', color: 'var(--success)', padding: '12px 16px', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center', fontWeight: '600' }}>
                        {successMsg}
                    </motion.div>
                )}

                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ background: 'rgba(255, 75, 75, 0.1)', border: '1px solid rgba(255, 75, 75, 0.2)', color: 'var(--error)', padding: '12px 16px', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center', fontWeight: '600' }}>
                        {error}
                    </motion.div>
                )}

                {/* Main Content Area */}
                {resetStep === 0 ? (
                    <>
                        {/* --- Standard Login/Register Form --- */}
                        {isRegistering && registerStep === 1 ? (
                            <form onSubmit={handleVerifyAndRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <AnimatePresence mode="wait">
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', textAlign: 'center' }}>Verify Email</h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1rem' }}>We sent an OTP to <br /><strong style={{ color: 'var(--text-main)' }}>{formData.email}</strong></p>

                                        <div className="input-field-group" style={{ position: 'relative' }}>
                                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input name="registerOtp" type="text" placeholder="6-digit OTP" value={registerOtp} onChange={(e) => { setRegisterOtp(e.target.value); setError(''); setSuccessMsg(''); }} required
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '16px 16px 16px 46px', borderRadius: '14px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s ease', letterSpacing: '2px' }}
                                                onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                                                onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'rgba(255,255,255,0.03)'; }}
                                            />
                                        </div>
                                    </motion.div>
                                </AnimatePresence>

                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    style={{ marginTop: '0.5rem', width: '100%', padding: '16px', background: 'var(--text-main)', color: 'var(--bg-base)', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                                    whileHover={{ scale: 1.02, boxShadow: '0 10px 25px rgba(255,255,255,0.2)' }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Verify & Register <ArrowRight size={18} />
                                </motion.button>
                                <button type="button" onClick={() => { setRegisterStep(0); setError(''); setSuccessMsg(''); }} style={{ marginTop: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'center' }}>Back to Email</button>
                            </form>
                        ) : (
                            <form onSubmit={isRegistering ? handleSendRegisterOtp : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

                                {!isRegistering && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
                                        <button type="button" onClick={() => { setResetStep(1); setError(''); setSuccessMsg(''); setResetData({ ...resetData, email: formData.email }); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--text-main)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                                            Forgot Password?
                                        </button>
                                    </div>
                                )}

                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    style={{ marginTop: '0.5rem', width: '100%', padding: '16px', background: 'var(--text-main)', color: 'var(--bg-base)', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.3s ease' }}
                                    whileHover={{ scale: 1.02, boxShadow: '0 10px 25px rgba(255,255,255,0.2)' }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isRegistering ? 'Proceed & Send OTP' : 'Sign In'} <ArrowRight size={18} />
                                </motion.button>
                            </form>
                        )}

                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                                <button
                                    onClick={() => { setIsRegistering(!isRegistering); setRegisterStep(0); setRegisterOtp(''); setError(''); setSuccessMsg(''); setFormData({ username: '', password: '', email: '' }); }}
                                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontWeight: '600', marginLeft: '6px', cursor: 'pointer' }}
                                >
                                    {isRegistering ? 'Sign in' : 'Sign up'}
                                </button>
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        {/* --- Reset Password Flow --- */}
                        <AnimatePresence mode="wait">
                            <motion.div key={`reset-${resetStep}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>

                                {resetStep === 1 && (
                                    <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', textAlign: 'center' }}>Reset Password</h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1rem' }}>Enter your email to receive a recovery code.</p>

                                        <div className="input-field-group" style={{ position: 'relative' }}>
                                            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input name="email" type="email" placeholder="Email Address" value={resetData.email} onChange={handleResetChange} required
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '16px 16px 16px 46px', borderRadius: '14px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s ease' }}
                                                onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                                                onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'rgba(255,255,255,0.03)'; }}
                                            />
                                        </div>
                                        <motion.button type="submit" disabled={loading} style={{ marginTop: '0.5rem', width: '100%', padding: '16px', background: 'var(--text-main)', color: 'var(--bg-base)', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.3s ease' }} whileHover={{ scale: 1.02, boxShadow: '0 10px 25px rgba(255,255,255,0.2)' }} whileTap={{ scale: 0.98 }}>
                                            Send Code
                                        </motion.button>
                                        <button type="button" onClick={() => { setResetStep(0); setError(''); setSuccessMsg(''); }} style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'center' }}>Back to Login</button>
                                    </form>
                                )}

                                {resetStep === 2 && (
                                    <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', textAlign: 'center' }}>Enter Verification Code</h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1rem' }}>We sent a code to <br /><strong style={{ color: 'var(--text-main)' }}>{resetData.email}</strong></p>

                                        <div className="input-field-group" style={{ position: 'relative' }}>
                                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input name="code" type="text" placeholder="6-digit code" value={resetData.code} onChange={handleResetChange} required
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '16px 16px 16px 46px', borderRadius: '14px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s ease', letterSpacing: '2px' }}
                                                onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                                                onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'rgba(255,255,255,0.03)'; }}
                                            />
                                        </div>
                                        <motion.button type="submit" disabled={loading} style={{ marginTop: '0.5rem', width: '100%', padding: '16px', background: 'var(--text-main)', color: 'var(--bg-base)', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.3s ease' }} whileHover={{ scale: 1.02, boxShadow: '0 10px 25px rgba(255,255,255,0.2)' }} whileTap={{ scale: 0.98 }}>
                                            Verify Code
                                        </motion.button>
                                        <button type="button" onClick={() => setResetStep(1)} style={{ marginTop: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'center' }}>Change Email</button>
                                    </form>
                                )}

                                {resetStep === 3 && (
                                    <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem', textAlign: 'center' }}>Create New Password</h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginBottom: '1rem' }}>Enter a strong password for your account.</p>

                                        <div className="input-field-group" style={{ position: 'relative' }}>
                                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                            <input name="newPassword" type="password" placeholder="New Password" value={resetData.newPassword} onChange={handleResetChange} required
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '16px 16px 16px 46px', borderRadius: '14px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: 'all 0.3s ease' }}
                                                onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                                                onBlur={e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.background = 'rgba(255,255,255,0.03)'; }}
                                            />
                                        </div>
                                        <motion.button type="submit" disabled={loading} style={{ marginTop: '0.5rem', width: '100%', padding: '16px', background: 'var(--text-main)', color: 'var(--bg-base)', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.3s ease' }} whileHover={{ scale: 1.02, boxShadow: '0 10px 25px rgba(255,255,255,0.2)' }} whileTap={{ scale: 0.98 }}>
                                            Reset Password
                                        </motion.button>
                                    </form>
                                )}

                            </motion.div>
                        </AnimatePresence>
                    </>
                )}
            </div>

            {/* Simulated Email Popup */}
            <AnimatePresence>
                {showOtpPopup && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setShowOtpPopup(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            style={{ background: 'var(--bg-base)', border: '1px solid var(--glass-border)', padding: '2.5rem 2rem', borderRadius: '20px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative', margin: '0 20px' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '50%', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 0 20px rgba(121, 192, 255, 0.1)' }}>
                                <Mail size={28} color="var(--accent-primary)" />
                            </div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Incoming Mail</h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                You have received a new secure code from the <strong style={{ color: 'var(--text-main)' }}>CXAT System</strong>.
                            </p>

                            <div style={{ background: 'rgba(121, 192, 255, 0.05)', border: '1px dashed rgba(121, 192, 255, 0.3)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'inline-block', width: '100%' }}>
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
        </motion.div>
    );
};

export default Login;