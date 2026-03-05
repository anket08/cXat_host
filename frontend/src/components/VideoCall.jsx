import React, { useState, useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Video, VideoOff, Mic, MicOff, PhoneOff, Copy, Check,
    ChevronLeft, Users, Zap, MonitorUp, X
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import './VideoCall.css';

const API = import.meta.env.VITE_API_URL;

// ── ICE servers: multiple STUN + TURN with TCP fallbacks ─────────────────────
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:80?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
        { urls: 'turn:numb.viagenie.ca', username: 'webrtc@live.com', credential: 'muazkh' },
    ],
    iceCandidatePoolSize: 20,
};

const VideoCall = ({ user }) => {
    const { meetingCode: paramCode } = useParams();
    const navigate = useNavigate();

    // Each browser tab gets a unique sessionId for signal dedup
    // (prevents filtering out own signals on multi-tab same account)
    const [sessionId] = useState(() =>
        (user?.id || 'anon') + '-' + Math.random().toString(36).slice(2, 8)
    );
    const userId = user?.id || user?.username || 'unknown';

    // ── State ─────────────────────────────────────────────────────────────────
    const [phase, setPhase] = useState(paramCode ? 'joining' : 'lobby');
    const [meetingCode, setMeetingCode] = useState(paramCode || '');
    const [joinInput, setJoinInput] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isCamOff, setIsCamOff] = useState(false);
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState('');
    const [participants, setParticipants] = useState([]);
    const [callSeconds, setCallSeconds] = useState(0);
    const [error, setError] = useState('');
    const [remoteHasStream, setRemoteHasStream] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [iceStatus, setIceStatus] = useState('');   // visual indicator

    // ── Refs ───────────────────────────────────────────────────────────────────
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const pcRef = useRef(null);    // RTCPeerConnection
    const stompRef = useRef(null);    // STOMP client
    const timerRef = useRef(null);    // call timer
    const pollRef = useRef(null);    // participant polling
    const iceQueue = useRef([]);      // ICE candidates queued before remoteDesc
    const offerLock = useRef(false);   // prevent double-offer

    // ── Utils ─────────────────────────────────────────────────────────────────
    const showToast = useCallback((msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    }, []);

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

    // Safe play: pause first to avoid AbortError when srcObject is swapped
    const safePlay = (el) => {
        if (!el) return;
        el.pause();
        el.play().catch(e => { if (e.name !== 'AbortError') console.error('[cXat] play():', e); });
    };

    // ── Participants polling ───────────────────────────────────────────────────
    const fetchParticipants = useCallback(async (code) => {
        try {
            const res = await axios.get(`${API}/meeting/participants/${code}`);
            if (Array.isArray(res.data)) {
                const active = res.data.filter(p => !p.leftAt);
                const unique = active.filter(
                    (p, i, arr) => arr.findIndex(x => x.userId === p.userId) === i
                );
                setParticipants(unique);
            }
        } catch (_) { }
    }, []);

    const startPolling = useCallback((code) => {
        stopPolling();
        fetchParticipants(code);
        pollRef.current = setInterval(() => fetchParticipants(code), 5000);
    }, [fetchParticipants]);

    const stopPolling = () => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };

    // ── Local media ───────────────────────────────────────────────────────────
    const startLocalStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                safePlay(localVideoRef.current);
            }
            console.log('[cXat] Local stream started, tracks:', stream.getTracks().map(t => t.kind));
            return stream;
        } catch (err) {
            console.error('[cXat] getUserMedia failed:', err);
            setError('Camera/Microphone access denied. Please allow permissions and reload.');
            return null;
        }
    }, []);

    // ── Build RTCPeerConnection ────────────────────────────────────────────────
    const buildPC = useCallback((stompClient, code) => {
        // Tear down existing connection
        if (pcRef.current) {
            pcRef.current.ontrack = null;
            pcRef.current.onicecandidate = null;
            pcRef.current.oniceconnectionstatechange = null;
            pcRef.current.close();
            pcRef.current = null;
        }
        iceQueue.current = [];
        offerLock.current = false;

        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;
        console.log('[cXat] PeerConnection created');

        // Add ALL local tracks (both video AND audio)
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
                console.log('[cXat] Added local track:', track.kind);
            });
        }

        // Remote track → attach to video element
        pc.ontrack = (event) => {
            console.log('[cXat] ontrack:', event.track.kind, event.streams.length, 'streams');
            if (!event.streams?.[0]) return;
            const stream = event.streams[0];
            if (remoteVideoRef.current) {
                if (remoteVideoRef.current.srcObject?.id !== stream.id) {
                    remoteVideoRef.current.srcObject = stream;
                    console.log('[cXat] Remote srcObject set, audio tracks:',
                        stream.getAudioTracks().length, 'video:', stream.getVideoTracks().length);
                }
                safePlay(remoteVideoRef.current);
                setRemoteHasStream(true);
            }
        };

        // ICE candidate → send to peer
        pc.onicecandidate = (event) => {
            if (event.candidate && stompClient?.connected) {
                stompClient.send('/app/signal', {}, JSON.stringify({
                    type: 'ice-candidate',
                    senderId: sessionId,
                    meetingCode: code,
                    data: JSON.stringify(event.candidate),
                }));
            }
        };

        // ICE state monitor with auto-restart
        pc.oniceconnectionstatechange = () => {
            const state = pc.iceConnectionState;
            console.log('[cXat] ICE state:', state);
            setIceStatus(state);
            if (state === 'connected' || state === 'completed') {
                showToast('Connected! ✅');
                offerLock.current = false;
            }
            if (state === 'failed') {
                console.warn('[cXat] ICE failed → restartIce');
                pc.restartIce();
            }
            if (state === 'disconnected') {
                console.warn('[cXat] ICE disconnected → waiting 4s then restartIce');
                setTimeout(() => {
                    if (pcRef.current?.iceConnectionState === 'disconnected') {
                        pcRef.current.restartIce();
                    }
                }, 4000);
            }
        };

        return pc;
    }, [sessionId, showToast]);

    // ── Drain queued ICE candidates after remoteDescription is set ────────────
    const drainQueue = async (pc) => {
        while (iceQueue.current.length > 0) {
            const c = iceQueue.current.shift();
            try { await pc.addIceCandidate(c); } catch (_) { }
        }
    };

    // ── STOMP signaling connection ─────────────────────────────────────────────
    const connectSignaling = useCallback((code) => {
        return new Promise((resolve) => {
            const socket = new SockJS(`${API}/ws`);
            const client = Stomp.over(socket);
            client.debug = null;
            stompRef.current = client;

            client.connect({}, () => {
                console.log('[cXat] WebSocket connected');

                client.subscribe(`/topic/signal/${code}`, async (msg) => {
                    const signal = JSON.parse(msg.body);
                    if (signal.senderId === sessionId) return;   // ignore own

                    const pc = pcRef.current;
                    if (!pc) return;

                    try {
                        // ── OFFER ─────────────────────────
                        if (signal.type === 'offer') {
                            if (pc.signalingState !== 'stable') {
                                console.warn('[cXat] Ignoring offer — state:', pc.signalingState);
                                return;
                            }
                            console.log('[cXat] Received offer → answering');
                            await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(signal.data)));
                            await drainQueue(pc);
                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);
                            client.send('/app/signal', {}, JSON.stringify({
                                type: 'answer',
                                senderId: sessionId,
                                meetingCode: code,
                                data: JSON.stringify(answer),
                            }));
                            console.log('[cXat] Answer sent');

                            // ── ANSWER ────────────────────────
                        } else if (signal.type === 'answer') {
                            if (pc.signalingState !== 'have-local-offer') {
                                console.warn('[cXat] Ignoring answer — state:', pc.signalingState);
                                return;
                            }
                            console.log('[cXat] Received answer');
                            await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(signal.data)));
                            await drainQueue(pc);

                            // ── ICE CANDIDATE ─────────────────
                        } else if (signal.type === 'ice-candidate') {
                            const candidate = new RTCIceCandidate(JSON.parse(signal.data));
                            if (pc.remoteDescription) {
                                await pc.addIceCandidate(candidate);
                            } else {
                                iceQueue.current.push(candidate);
                            }

                            // ── USER JOINED ───────────────────
                        } else if (signal.type === 'user-joined') {
                            if (offerLock.current) {
                                console.warn('[cXat] Offer already in progress, skipping');
                                return;
                            }
                            offerLock.current = true;
                            console.log('[cXat] user-joined → fresh PC + offer');
                            showToast('A participant joined!');

                            // Fresh PC so ICE state is clean
                            const freshPc = buildPC(client, code);

                            // Small delay to ensure both sides are subscribed
                            await new Promise(r => setTimeout(r, 300));

                            const offer = await freshPc.createOffer();
                            await freshPc.setLocalDescription(offer);
                            client.send('/app/signal', {}, JSON.stringify({
                                type: 'offer',
                                senderId: sessionId,
                                meetingCode: code,
                                data: JSON.stringify(offer),
                            }));
                            console.log('[cXat] Offer sent to joining peer');
                            fetchParticipants(code);
                        }
                    } catch (err) {
                        console.error('[cXat] Signal handler error:', err);
                        offerLock.current = false;
                    }
                });

                console.log('[cXat] Subscribed /topic/signal/' + code);
                resolve(client);
            }, (err) => {
                console.error('[cXat] STOMP connect error:', err);
                setError('Signaling server connection failed.');
                resolve(null);
            });
        });
    }, [sessionId, buildPC, showToast, fetchParticipants]);

    // ── Create meeting ─────────────────────────────────────────────────────────
    const handleCreate = async () => {
        setError('');
        const stream = await startLocalStream();
        if (!stream) return;
        try {
            const res = await axios.post(`${API}/meeting/create?hostId=${userId}`);
            const code = res.data.meetingCode;
            setMeetingCode(code);
            await axios.post(`${API}/meeting/join?meetingCode=${code}&userId=${userId}`);
            const stompClient = await connectSignaling(code);
            buildPC(stompClient, code);
            setPhase('incall');
            startPolling(code);
            showToast('Meeting created! Share the code.');
            timerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
            navigate(`/meeting/${code}`, { replace: true });
        } catch (err) {
            console.error('[cXat] Create error:', err);
            setError('Failed to create meeting. Is the backend running?');
        }
    };

    // ── Join meeting ───────────────────────────────────────────────────────────
    const handleJoin = async (code) => {
        setError('');
        const meetCode = code || joinInput.trim();
        if (!meetCode) { setError('Please enter a meeting code.'); return; }

        const stream = await startLocalStream();
        if (!stream) return;

        try {
            const res = await axios.post(
                `${API}/meeting/join?meetingCode=${meetCode}&userId=${userId}`
            );
            if (res.data === 'Meeting not found') { setError('Meeting not found.'); return; }
            if (res.data === 'Meeting ended') { setError('This meeting has already ended.'); return; }

            setMeetingCode(meetCode);
            const stompClient = await connectSignaling(meetCode);
            buildPC(stompClient, meetCode);

            // Wait a tick so the subscription is active before host receives user-joined
            await new Promise(r => setTimeout(r, 200));

            if (stompClient?.connected) {
                stompClient.send('/app/signal', {}, JSON.stringify({
                    type: 'user-joined',
                    senderId: sessionId,
                    meetingCode: meetCode,
                    data: '',
                }));
                console.log('[cXat] user-joined signal sent');
            }

            setPhase('incall');
            startPolling(meetCode);
            showToast('Joined meeting!');
            timerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
            navigate(`/meeting/${meetCode}`, { replace: true });
        } catch (err) {
            console.error('[cXat] Join error:', err);
            setError('Failed to join meeting.');
        }
    };

    // ── Auto-join from URL ─────────────────────────────────────────────────────
    useEffect(() => {
        if (paramCode && phase === 'joining') handleJoin(paramCode);
    }, [paramCode]);

    // ── End call ───────────────────────────────────────────────────────────────
    const handleEndCall = async () => {
        clearInterval(timerRef.current); timerRef.current = null;
        stopPolling();
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        if (pcRef.current) {
            pcRef.current.ontrack = null;
            pcRef.current.onicecandidate = null;
            pcRef.current.oniceconnectionstatechange = null;
            pcRef.current.close();
            pcRef.current = null;
        }
        if (stompRef.current?.connected) stompRef.current.disconnect();
        try {
            await axios.post(`${API}/meeting/leave?meetingCode=${meetingCode}&userId=${userId}`);
        } catch (_) { }
        setRemoteHasStream(false);
        setPhase('ended');
    };

    // ── Mic / cam toggles ─────────────────────────────────────────────────────
    const toggleMic = () => {
        const tracks = localStreamRef.current?.getAudioTracks();
        if (tracks?.length) { tracks[0].enabled = !tracks[0].enabled; setIsMuted(!tracks[0].enabled); }
    };
    const toggleCam = () => {
        const tracks = localStreamRef.current?.getVideoTracks();
        if (tracks?.length) { tracks[0].enabled = !tracks[0].enabled; setIsCamOff(!tracks[0].enabled); }
    };

    // ── Cleanup on component unmount ──────────────────────────────────────────
    useEffect(() => {
        return () => {
            clearInterval(timerRef.current);
            stopPolling();
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            pcRef.current?.close();
            if (stompRef.current?.connected) stompRef.current.disconnect();
        };
    }, []);

    // ── Re-attach local stream when phase becomes incall ──────────────────────
    useEffect(() => {
        if (phase === 'incall' && localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
            safePlay(localVideoRef.current);
        }
    }, [phase]);

    // ══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════════════════════════

    // ── Call ended ────────────────────────────────────────────────────────────
    if (phase === 'ended') {
        return (
            <div className="vc-page">
                <div className="vc-ambient" />
                <div className="vc-lobby">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="vc-lobby-card">
                        <div className="vc-lobby-icon" style={{ background: 'rgba(248,81,73,0.1)', borderColor: 'rgba(248,81,73,0.25)' }}>
                            <PhoneOff size={36} color="var(--error)" />
                        </div>
                        <h2 className="vc-lobby-title" style={{ background: 'linear-gradient(135deg,var(--error),#ff9999)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
                            Call Ended
                        </h2>
                        <p className="vc-lobby-subtitle">Duration: {formatTimer(callSeconds)}</p>
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

    // ── Pre-join lobby ─────────────────────────────────────────────────────────
    if (phase === 'lobby' || phase === 'joining') {
        return (
            <div className="vc-page">
                <div className="vc-ambient" />
                <div className="vc-lobby">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="vc-lobby-card">
                        <div className="vc-lobby-icon"><Video size={36} /></div>
                        <h2 className="vc-lobby-title">Video Call</h2>
                        <p className="vc-lobby-subtitle">Start a new meeting or join an existing one.</p>
                        {error && (
                            <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 12, padding: 12, color: 'var(--error)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
                                {error}
                            </div>
                        )}
                        <button className="vc-btn-create" onClick={handleCreate}><Zap size={18} /> CREATE MEETING</button>
                        <div className="vc-lobby-divider">OR</div>
                        <input
                            className="vc-lobby-input"
                            placeholder="Enter meeting code"
                            value={joinInput}
                            onChange={(e) => setJoinInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                        />
                        <button className="vc-btn-join" onClick={() => handleJoin()}><MonitorUp size={18} /> JOIN MEETING</button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ── In-call ────────────────────────────────────────────────────────────────
    return (
        <div className="vc-page">
            <div className="vc-ambient" />

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="vc-toast">
                        <Check size={16} /> {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Participants panel */}
            <AnimatePresence>
                {showParticipants && (
                    <motion.div
                        initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }}
                        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 280, background: 'rgba(22,27,34,0.97)', backdropFilter: 'blur(12px)', borderLeft: '1px solid var(--glass-border)', zIndex: 100, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                                <Users size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                                Participants ({participants.length})
                            </h3>
                            <button onClick={() => setShowParticipants(false)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}>
                                <X size={18} />
                            </button>
                        </div>
                        {participants.map((p, i) => {
                            const isMe = p.userId === userId;
                            const display = isMe ? (user?.username || p.userId) : p.userId;
                            return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                                        {display.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                                            {display} {isMe && <span style={{ color: '#8b949e', fontWeight: 400 }}>(You)</span>}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#3fb950' }}>● Active</div>
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="vc-header">
                <div className="vc-header-left">
                    <button className="vc-back-btn" onClick={handleEndCall}><ChevronLeft size={20} /></button>
                    <div className="vc-meeting-code">
                        <span>{meetingCode}</span>
                        <button className="vc-copy-btn" onClick={copyCode}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>
                    </div>
                </div>
                <div className="vc-header-right">
                    <button
                        onClick={() => { setShowParticipants(!showParticipants); }}
                        style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                        <Users size={16} /> {participants.length}
                    </button>
                    <div className="vc-timer">
                        <div className="vc-timer-dot" style={{ background: iceStatus === 'connected' || iceStatus === 'completed' ? '#3fb950' : 'var(--error)' }} />
                        {formatTimer(callSeconds)}
                    </div>
                </div>
            </div>

            {/* Video area */}
            <div className="vc-videos">
                {remoteHasStream ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <video ref={remoteVideoRef} autoPlay playsInline className="vc-remote-video" />
                        <div className="vc-local-label" style={{ bottom: 16, left: 16, fontSize: '0.85rem', padding: '5px 14px' }}>
                            {participants.find(p => p.userId !== userId)?.userId || 'Peer'}
                        </div>
                    </div>
                ) : (
                    <div className="vc-remote-placeholder">
                        <div className="vc-remote-placeholder-icon"><Users size={42} /></div>
                        <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Waiting for others to join...</p>
                        <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>
                            Code: <strong style={{ color: 'var(--accent-tertiary)', letterSpacing: 2 }}>{meetingCode}</strong>
                        </p>
                    </div>
                )}

                {/* Local PiP */}
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="vc-local-wrapper">
                    <video ref={localVideoRef} autoPlay muted playsInline className="vc-local-video" />
                    <div className="vc-local-label">{user?.username || 'You'}</div>
                </motion.div>
            </div>

            {/* Controls */}
            <div className="vc-controls">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="vc-controls-bar">
                    <button className={`vc-ctrl-btn ${isMuted ? 'muted' : 'active'}`} onClick={toggleMic} title={isMuted ? 'Unmute' : 'Mute'}>
                        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                    </button>
                    <button className={`vc-ctrl-btn ${isCamOff ? 'muted' : 'active'}`} onClick={toggleCam} title={isCamOff ? 'Camera on' : 'Camera off'}>
                        {isCamOff ? <VideoOff size={22} /> : <Video size={22} />}
                    </button>
                    <button className="vc-ctrl-btn end-call" onClick={handleEndCall} title="End call">
                        <PhoneOff size={22} />
                    </button>
                    <button className="vc-ctrl-btn active" onClick={copyCode} title="Copy code">
                        {copied ? <Check size={22} /> : <Copy size={22} />}
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default VideoCall;
