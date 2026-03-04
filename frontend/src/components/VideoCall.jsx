import React, { useState, useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Video, VideoOff, Mic, MicOff, PhoneOff, Copy, Check,
    ChevronLeft, Users, Clock, Zap, MonitorUp
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import './VideoCall.css';

const API = import.meta.env.VITE_API_URL;

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

const VideoCall = ({ user }) => {
    const { meetingCode: paramCode } = useParams();
    const navigate = useNavigate();

    // ── State ──────────────────────────────────────────
    const [phase, setPhase] = useState(paramCode ? 'joining' : 'lobby'); // lobby | joining | incall | ended
    const [meetingCode, setMeetingCode] = useState(paramCode || '');
    const [joinInput, setJoinInput] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isCamOff, setIsCamOff] = useState(false);
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState('');
    const [participants, setParticipants] = useState([]);
    const [callSeconds, setCallSeconds] = useState(0);
    const [error, setError] = useState('');

    // ── Refs ───────────────────────────────────────────
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const stompRef = useRef(null);
    const timerRef = useRef(null);

    // ── Helpers ────────────────────────────────────────
    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const formatTimer = (sec) => {
        const m = String(Math.floor(sec / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    const copyCode = () => {
        navigator.clipboard.writeText(meetingCode);
        setCopied(true);
        showToast('Meeting code copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Get media stream ──────────────────────────────
    const startLocalStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            return stream;
        } catch (err) {
            console.error('Media error:', err);
            setError('Camera/Microphone access denied. Please allow permissions and try again.');
            return null;
        }
    }, []);

    // ── WebRTC peer connection ────────────────────────
    const createPeerConnection = useCallback((stompClient, code) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        // Handle remote stream
        pc.ontrack = (event) => {
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        // ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && stompClient?.connected) {
                stompClient.send('/app/signal', {}, JSON.stringify({
                    type: 'ice-candidate',
                    senderId: user.id,
                    meetingCode: code,
                    data: JSON.stringify(event.candidate),
                }));
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
                showToast('Peer disconnected');
            }
        };

        return pc;
    }, [user.id]);

    // ── STOMP signaling ───────────────────────────────
    const connectSignaling = useCallback((code) => {
        return new Promise((resolve) => {
            const socket = new SockJS(`${API}/ws`);
            const client = Stomp.over(socket);
            client.debug = null;
            stompRef.current = client;

            client.connect({}, () => {
                // Subscribe to signaling topic
                client.subscribe(`/topic/signal/${code}`, async (msg) => {
                    const signal = JSON.parse(msg.body);

                    // Ignore own signals
                    if (String(signal.senderId) === String(user.id)) return;

                    const pc = peerConnectionRef.current;
                    if (!pc) return;

                    try {
                        if (signal.type === 'offer') {
                            await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(signal.data)));
                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);
                            client.send('/app/signal', {}, JSON.stringify({
                                type: 'answer',
                                senderId: user.id,
                                meetingCode: code,
                                data: JSON.stringify(answer),
                            }));
                        } else if (signal.type === 'answer') {
                            await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(signal.data)));
                        } else if (signal.type === 'ice-candidate') {
                            await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(signal.data)));
                        } else if (signal.type === 'user-joined') {
                            // New user joined; create and send an offer
                            showToast('A participant joined!');
                            const offer = await pc.createOffer();
                            await pc.setLocalDescription(offer);
                            client.send('/app/signal', {}, JSON.stringify({
                                type: 'offer',
                                senderId: user.id,
                                meetingCode: code,
                                data: JSON.stringify(offer),
                            }));
                            fetchParticipants(code);
                        }
                    } catch (err) {
                        console.error('Signal handling error:', err);
                    }
                });

                resolve(client);
            }, (err) => {
                console.error('STOMP error:', err);
                setError('Failed to connect to signaling server.');
                resolve(null);
            });
        });
    }, [user.id]);

    const fetchParticipants = async (code) => {
        try {
            const res = await axios.get(`${API}/meeting/participants/${code}`);
            if (Array.isArray(res.data)) {
                setParticipants(res.data.filter(p => !p.leftAt));
            }
        } catch (e) { /* ignore */ }
    };

    // ── Create Meeting ────────────────────────────────
    const handleCreate = async () => {
        setError('');
        const stream = await startLocalStream();
        if (!stream) return;

        try {
            const res = await axios.post(`${API}/meeting/create?hostId=${user.id}`);
            const code = res.data.meetingCode;
            setMeetingCode(code);

            // Join the meeting
            await axios.post(`${API}/meeting/join?meetingCode=${code}&userId=${user.id}`);

            // Connect signaling + create peer connection
            const stompClient = await connectSignaling(code);
            createPeerConnection(stompClient, code);

            setPhase('incall');
            showToast('Meeting created! Share the code.');
            fetchParticipants(code);

            // Start timer
            timerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);

            // Navigate to meeting URL
            navigate(`/meeting/${code}`, { replace: true });
        } catch (err) {
            console.error('Create meeting error:', err);
            setError('Failed to create meeting. Is the server running?');
        }
    };

    // ── Join Meeting ──────────────────────────────────
    const handleJoin = async (code) => {
        setError('');
        const meetCode = code || joinInput.trim();
        if (!meetCode) {
            setError('Please enter a meeting code.');
            return;
        }

        const stream = await startLocalStream();
        if (!stream) return;

        try {
            const res = await axios.post(`${API}/meeting/join?meetingCode=${meetCode}&userId=${user.id}`);
            if (res.data === 'Meeting not found') {
                setError('Meeting not found. Check the code and try again.');
                return;
            }
            if (res.data === 'Meeting ended') {
                setError('This meeting has already ended.');
                return;
            }

            setMeetingCode(meetCode);

            // Connect signaling + create peer connection
            const stompClient = await connectSignaling(meetCode);
            const pc = createPeerConnection(stompClient, meetCode);

            // Notify others that we joined
            if (stompClient?.connected) {
                stompClient.send('/app/signal', {}, JSON.stringify({
                    type: 'user-joined',
                    senderId: user.id,
                    meetingCode: meetCode,
                    data: '',
                }));
            }

            setPhase('incall');
            showToast('Joined meeting!');
            fetchParticipants(meetCode);

            timerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
            navigate(`/meeting/${meetCode}`, { replace: true });
        } catch (err) {
            console.error('Join error:', err);
            setError('Failed to join meeting.');
        }
    };

    // ── Auto-join if URL has meeting code ─────────────
    useEffect(() => {
        if (paramCode && phase === 'joining') {
            handleJoin(paramCode);
        }
    }, [paramCode]);

    // ── Leave / End ───────────────────────────────────
    const handleEndCall = async () => {
        // Stop local media
        localStreamRef.current?.getTracks().forEach(t => t.stop());

        // Close peer connection
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;

        // Disconnect STOMP
        if (stompRef.current?.connected) stompRef.current.disconnect();

        // Leave meeting via API
        try {
            await axios.post(`${API}/meeting/leave?meetingCode=${meetingCode}&userId=${user.id}`);
        } catch (e) { /* ignore */ }

        clearInterval(timerRef.current);
        setPhase('ended');
    };

    // ── Media toggles ─────────────────────────────────
    const toggleMic = () => {
        const tracks = localStreamRef.current?.getAudioTracks();
        if (tracks?.length) {
            tracks[0].enabled = !tracks[0].enabled;
            setIsMuted(!tracks[0].enabled);
        }
    };

    const toggleCam = () => {
        const tracks = localStreamRef.current?.getVideoTracks();
        if (tracks?.length) {
            tracks[0].enabled = !tracks[0].enabled;
            setIsCamOff(!tracks[0].enabled);
        }
    };

    // ── Cleanup on unmount ────────────────────────────
    useEffect(() => {
        return () => {
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            peerConnectionRef.current?.close();
            if (stompRef.current?.connected) stompRef.current.disconnect();
            clearInterval(timerRef.current);
        };
    }, []);

    // ══════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════

    // ── Call ended screen ─────────────────────────────
    if (phase === 'ended') {
        return (
            <div className="vc-page">
                <div className="vc-ambient">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(248,81,73,0.12) 0%, transparent 60%)', borderRadius: '50%' }}
                    />
                </div>
                <div className="vc-lobby">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="vc-lobby-card"
                    >
                        <div className="vc-lobby-icon" style={{ background: 'linear-gradient(135deg, rgba(248,81,73,0.15), rgba(248,81,73,0.05))', borderColor: 'rgba(248,81,73,0.25)' }}>
                            <PhoneOff size={36} color="var(--error)" />
                        </div>
                        <h2 className="vc-lobby-title" style={{ background: 'linear-gradient(135deg, var(--error), var(--accent-secondary))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                            Call Ended
                        </h2>
                        <p className="vc-lobby-subtitle">
                            Duration: {formatTimer(callSeconds)}
                        </p>
                        <button className="vc-btn-create" onClick={() => { setPhase('lobby'); setCallSeconds(0); setMeetingCode(''); }}>
                            <Zap size={18} /> NEW MEETING
                        </button>
                        <div style={{ height: 12 }} />
                        <button className="vc-btn-join" onClick={() => navigate('/lobby')}>
                            <ChevronLeft size={18} /> BACK TO LOBBY
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ── Pre-join lobby ────────────────────────────────
    if (phase === 'lobby' || phase === 'joining') {
        return (
            <div className="vc-page">
                {/* Ambient */}
                <div className="vc-ambient">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], x: ['0%', '5%', '0%'], y: ['0%', '5%', '0%'] }}
                        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(63,185,80,0.15) 0%, transparent 60%)', borderRadius: '50%' }}
                    />
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                        style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(121,192,255,0.12) 0%, transparent 60%)', borderRadius: '50%' }}
                    />
                </div>

                <div className="vc-lobby">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="vc-lobby-card"
                    >
                        <div className="vc-lobby-icon">
                            <Video size={36} />
                        </div>
                        <h2 className="vc-lobby-title">Video Call</h2>
                        <p className="vc-lobby-subtitle">Start a new meeting or join an existing one.</p>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: '12px', padding: '12px', color: 'var(--error)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem' }}
                            >
                                {error}
                            </motion.div>
                        )}

                        <button className="vc-btn-create" onClick={handleCreate}>
                            <Zap size={18} /> CREATE MEETING
                        </button>

                        <div className="vc-lobby-divider">OR</div>

                        <input
                            className="vc-lobby-input"
                            placeholder="Enter meeting code"
                            value={joinInput}
                            onChange={(e) => setJoinInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                        />
                        <button className="vc-btn-join" onClick={() => handleJoin()}>
                            <MonitorUp size={18} /> JOIN MEETING
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ── In-call view ──────────────────────────────────
    return (
        <div className="vc-page">
            {/* Ambient */}
            <div className="vc-ambient">
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(13,17,23,0) 0%, var(--bg-base) 100%)' }} />
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="vc-toast"
                    >
                        <Check size={16} /> {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="vc-header">
                <div className="vc-header-left">
                    <button className="vc-back-btn" onClick={handleEndCall}>
                        <ChevronLeft size={20} />
                    </button>
                    <div className="vc-meeting-code">
                        <span>{meetingCode}</span>
                        <button className="vc-copy-btn" onClick={copyCode}>
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                    </div>
                </div>
                <div className="vc-header-right">
                    <div className="vc-participants-badge">
                        <Users size={16} /> {participants.length}
                    </div>
                    <div className="vc-timer">
                        <div className="vc-timer-dot" />
                        {formatTimer(callSeconds)}
                    </div>
                </div>
            </div>

            {/* Videos */}
            <div className="vc-videos">
                {/* Remote video */}
                {remoteVideoRef.current?.srcObject ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="vc-remote-video"
                    />
                ) : (
                    <div className="vc-remote-placeholder">
                        <div className="vc-remote-placeholder-icon">
                            <Users size={42} />
                        </div>
                        <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Waiting for others to join...</p>
                        <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Share the meeting code: <strong style={{ color: 'var(--accent-tertiary)', letterSpacing: '2px' }}>{meetingCode}</strong></p>
                    </div>
                )}

                {/* Hidden remote video element (always present for ref attachment) */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="vc-remote-video"
                    style={{ display: remoteVideoRef.current?.srcObject ? 'block' : 'none', position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                />

                {/* Local PiP */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="vc-local-wrapper"
                >
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="vc-local-video"
                    />
                    <div className="vc-local-label">You</div>
                </motion.div>
            </div>

            {/* Controls */}
            <div className="vc-controls">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="vc-controls-bar"
                >
                    <button
                        className={`vc-ctrl-btn ${isMuted ? 'muted' : 'active'}`}
                        onClick={toggleMic}
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                    </button>

                    <button
                        className={`vc-ctrl-btn ${isCamOff ? 'muted' : 'active'}`}
                        onClick={toggleCam}
                        title={isCamOff ? 'Turn camera on' : 'Turn camera off'}
                    >
                        {isCamOff ? <VideoOff size={22} /> : <Video size={22} />}
                    </button>

                    <button
                        className="vc-ctrl-btn end-call"
                        onClick={handleEndCall}
                        title="End call"
                    >
                        <PhoneOff size={22} />
                    </button>

                    <button
                        className="vc-ctrl-btn active"
                        onClick={copyCode}
                        title="Copy meeting code"
                    >
                        {copied ? <Check size={22} /> : <Copy size={22} />}
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default VideoCall;
