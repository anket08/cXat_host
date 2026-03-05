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
const METERED_API_KEY = '656779e16120614c9be51394769a7e8c13d5';

// ── Fetch TURN credentials from Metered.ca ───────────────────────────────────
async function fetchIceServers() {
    const stun = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ];
    try {
        const resp = await fetch(
            `https://cxatapp.metered.live/api/v1/turn/credentials?apiKey=${METERED_API_KEY}`
        );
        const turnServers = await resp.json();
        console.log('[cXat] ✅ TURN credentials fetched:', turnServers.length, 'servers');
        return { iceServers: [...stun, ...turnServers] };
    } catch (e) {
        console.error('[cXat] TURN fetch failed, STUN only:', e);
        return { iceServers: stun };
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// VideoCall Component
// ══════════════════════════════════════════════════════════════════════════════
const VideoCall = ({ user }) => {
    const { meetingCode: paramCode } = useParams();
    const navigate = useNavigate();

    // Unique session ID per tab (prevents filtering own signals on same-account tabs)
    const [sessionId] = useState(
        () => (user?.id || 'anon') + '-' + Math.random().toString(36).slice(2, 8)
    );
    const userId = user?.id || user?.username || 'unknown';

    // ── State ─────────────────────────────────────────────────────────
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
    const [iceStatus, setIceStatus] = useState('new');

    // ── Refs ──────────────────────────────────────────────────────────
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const pcRef = useRef(null);
    const stompRef = useRef(null);
    const timerRef = useRef(null);
    const pollRef = useRef(null);
    const iceQueue = useRef([]);
    const offerLock = useRef(false);
    const iceConfigRef = useRef(null);

    // ── Helpers ───────────────────────────────────────────────────────
    const showToast = useCallback((msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    }, []);

    const fmt = (s) => {
        const m = String(Math.floor(s / 60)).padStart(2, '0');
        const ss = String(s % 60).padStart(2, '0');
        return `${m}:${ss}`;
    };

    const copyCode = () => {
        navigator.clipboard.writeText(meetingCode);
        setCopied(true);
        showToast('Code copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const safePlay = (el) => {
        if (!el) return;
        el.pause();
        el.play().catch(e => { if (e.name !== 'AbortError') console.error('[cXat] play:', e); });
    };

    // ── Participant polling ───────────────────────────────────────────
    const fetchParticipants = useCallback(async (code) => {
        try {
            const r = await axios.get(`${API}/meeting/participants/${code}`);
            if (Array.isArray(r.data)) {
                const active = r.data.filter(p => !p.leftAt);
                const unique = active.filter((p, i, a) => a.findIndex(x => x.userId === p.userId) === i);
                setParticipants(unique);
            }
        } catch (_) { }
    }, []);

    const startPolling = useCallback((code) => {
        stopPolling();
        fetchParticipants(code);
        pollRef.current = setInterval(() => fetchParticipants(code), 5000);
    }, [fetchParticipants]);

    const stopPolling = () => { clearInterval(pollRef.current); pollRef.current = null; };

    // ── Local media ──────────────────────────────────────────────────
    const startLocalStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                safePlay(localVideoRef.current);
            }
            console.log('[cXat] Local stream:', stream.getTracks().map(t => t.kind).join(', '));
            return stream;
        } catch (err) {
            console.error('[cXat] getUserMedia:', err);
            setError('Camera/Mic access denied. Allow permissions and reload.');
            return null;
        }
    }, []);

    // ── RTCPeerConnection builder (async — fetches TURN first time) ──
    const buildPC = useCallback(async (stompClient, code) => {
        // Tear down old
        if (pcRef.current) {
            pcRef.current.ontrack = null;
            pcRef.current.onicecandidate = null;
            pcRef.current.oniceconnectionstatechange = null;
            pcRef.current.close();
            pcRef.current = null;
        }
        iceQueue.current = [];
        offerLock.current = false;

        // Get TURN config (cached after first call)
        if (!iceConfigRef.current) {
            iceConfigRef.current = await fetchIceServers();
        }
        const config = iceConfigRef.current;

        const pc = new RTCPeerConnection(config);
        pcRef.current = pc;
        console.log('[cXat] PC created, iceServers:', config.iceServers.length);

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => {
                pc.addTrack(t, localStreamRef.current);
                console.log('[cXat] +track:', t.kind);
            });
        }

        // Remote tracks
        pc.ontrack = (ev) => {
            console.log('[cXat] ontrack:', ev.track.kind);
            if (!ev.streams?.[0]) return;
            const s = ev.streams[0];
            if (remoteVideoRef.current) {
                if (remoteVideoRef.current.srcObject?.id !== s.id) {
                    remoteVideoRef.current.srcObject = s;
                }
                safePlay(remoteVideoRef.current);
                setRemoteHasStream(true);
            }
        };

        // ICE candidates — log type for debugging
        pc.onicecandidate = (ev) => {
            if (ev.candidate) {
                const c = ev.candidate;
                console.log(`[cXat] candidate: type=${c.type} proto=${c.protocol} ${c.address}:${c.port}`);
                if (stompClient?.connected) {
                    stompClient.send('/app/signal', {}, JSON.stringify({
                        type: 'ice-candidate', senderId: sessionId,
                        meetingCode: code, data: JSON.stringify(ev.candidate),
                    }));
                }
            }
        };

        // ICE state
        pc.oniceconnectionstatechange = () => {
            const st = pc.iceConnectionState;
            console.log('[cXat] ICE:', st);
            setIceStatus(st);
            if (st === 'connected' || st === 'completed') {
                showToast('Connected! ✅');
                offerLock.current = false;
            }
            if (st === 'failed') { console.warn('[cXat] ICE failed → restart'); pc.restartIce(); }
            if (st === 'disconnected') {
                setTimeout(() => {
                    if (pcRef.current?.iceConnectionState === 'disconnected') pcRef.current.restartIce();
                }, 4000);
            }
        };

        return pc;
    }, [sessionId, showToast]);

    // ── Drain ICE queue ──────────────────────────────────────────────
    const drainQ = async (pc) => {
        while (iceQueue.current.length) {
            try { await pc.addIceCandidate(iceQueue.current.shift()); } catch (_) { }
        }
    };

    // ── STOMP signaling ──────────────────────────────────────────────
    const connectSignaling = useCallback((code) => {
        return new Promise((resolve) => {
            const socket = new SockJS(`${API}/ws`);
            const client = Stomp.over(socket);
            client.debug = null;
            stompRef.current = client;

            client.connect({}, () => {
                console.log('[cXat] STOMP connected');
                client.subscribe(`/topic/signal/${code}`, async (msg) => {
                    const sig = JSON.parse(msg.body);
                    if (sig.senderId === sessionId) return; // ignore own

                    const pc = pcRef.current;
                    if (!pc) return;

                    try {
                        if (sig.type === 'offer') {
                            if (pc.signalingState !== 'stable') {
                                console.warn('[cXat] skip offer, state:', pc.signalingState);
                                return;
                            }
                            console.log('[cXat] offer → answer');
                            await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(sig.data)));
                            await drainQ(pc);
                            const ans = await pc.createAnswer();
                            await pc.setLocalDescription(ans);
                            client.send('/app/signal', {}, JSON.stringify({
                                type: 'answer', senderId: sessionId,
                                meetingCode: code, data: JSON.stringify(ans),
                            }));

                        } else if (sig.type === 'answer') {
                            if (pc.signalingState !== 'have-local-offer') {
                                console.warn('[cXat] skip answer, state:', pc.signalingState);
                                return;
                            }
                            console.log('[cXat] got answer');
                            await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(sig.data)));
                            await drainQ(pc);

                        } else if (sig.type === 'ice-candidate') {
                            const cand = new RTCIceCandidate(JSON.parse(sig.data));
                            if (pc.remoteDescription) await pc.addIceCandidate(cand);
                            else iceQueue.current.push(cand);

                        } else if (sig.type === 'user-joined') {
                            if (offerLock.current) return;
                            offerLock.current = true;
                            console.log('[cXat] user-joined → fresh PC + offer');
                            showToast('Participant joined!');

                            const freshPc = await buildPC(client, code);
                            await new Promise(r => setTimeout(r, 300));

                            const offer = await freshPc.createOffer();
                            await freshPc.setLocalDescription(offer);
                            client.send('/app/signal', {}, JSON.stringify({
                                type: 'offer', senderId: sessionId,
                                meetingCode: code, data: JSON.stringify(offer),
                            }));
                            console.log('[cXat] offer sent');
                            fetchParticipants(code);
                        }
                    } catch (err) {
                        console.error('[cXat] signal err:', err);
                        offerLock.current = false;
                    }
                });
                console.log('[cXat] subscribed /topic/signal/' + code);
                resolve(client);
            }, (err) => {
                console.error('[cXat] STOMP err:', err);
                setError('Signaling server failed.');
                resolve(null);
            });
        });
    }, [sessionId, buildPC, showToast, fetchParticipants]);

    // ── Create ────────────────────────────────────────────────────────
    const handleCreate = async () => {
        setError('');
        const stream = await startLocalStream();
        if (!stream) return;
        try {
            const r = await axios.post(`${API}/meeting/create?hostId=${userId}`);
            const code = r.data.meetingCode;
            setMeetingCode(code);
            await axios.post(`${API}/meeting/join?meetingCode=${code}&userId=${userId}`);
            const stomp = await connectSignaling(code);
            await buildPC(stomp, code);
            setPhase('incall');
            startPolling(code);
            showToast('Meeting created!');
            timerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
            navigate(`/meeting/${code}`, { replace: true });
        } catch (e) {
            console.error('[cXat] create:', e);
            setError('Failed to create meeting.');
        }
    };

    // ── Join ──────────────────────────────────────────────────────────
    const handleJoin = async (code) => {
        setError('');
        const c = code || joinInput.trim();
        if (!c) { setError('Enter a meeting code.'); return; }
        const stream = await startLocalStream();
        if (!stream) return;
        try {
            const r = await axios.post(`${API}/meeting/join?meetingCode=${c}&userId=${userId}`);
            if (r.data === 'Meeting not found') { setError('Meeting not found.'); return; }
            if (r.data === 'Meeting ended') { setError('Meeting ended.'); return; }
            setMeetingCode(c);
            const stomp = await connectSignaling(c);
            await buildPC(stomp, c);

            // Small delay so subscription is ready on both sides
            await new Promise(r => setTimeout(r, 200));

            if (stomp?.connected) {
                stomp.send('/app/signal', {}, JSON.stringify({
                    type: 'user-joined', senderId: sessionId,
                    meetingCode: c, data: '',
                }));
                console.log('[cXat] user-joined sent');
            }
            setPhase('incall');
            startPolling(c);
            showToast('Joined!');
            timerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
            navigate(`/meeting/${c}`, { replace: true });
        } catch (e) {
            console.error('[cXat] join:', e);
            setError('Failed to join.');
        }
    };

    // Auto-join from URL
    useEffect(() => {
        if (paramCode && phase === 'joining') handleJoin(paramCode);
    }, [paramCode]);

    // ── End call ──────────────────────────────────────────────────────
    const handleEndCall = async () => {
        clearInterval(timerRef.current); timerRef.current = null;
        stopPolling();
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        if (pcRef.current) {
            pcRef.current.ontrack = null;
            pcRef.current.onicecandidate = null;
            pcRef.current.oniceconnectionstatechange = null;
            pcRef.current.close(); pcRef.current = null;
        }
        if (stompRef.current?.connected) stompRef.current.disconnect();
        try { await axios.post(`${API}/meeting/leave?meetingCode=${meetingCode}&userId=${userId}`); } catch (_) { }
        setRemoteHasStream(false);
        setPhase('ended');
    };

    // ── Toggles ───────────────────────────────────────────────────────
    const toggleMic = () => {
        const t = localStreamRef.current?.getAudioTracks();
        if (t?.length) { t[0].enabled = !t[0].enabled; setIsMuted(!t[0].enabled); }
    };
    const toggleCam = () => {
        const t = localStreamRef.current?.getVideoTracks();
        if (t?.length) { t[0].enabled = !t[0].enabled; setIsCamOff(!t[0].enabled); }
    };

    // ── Cleanup ───────────────────────────────────────────────────────
    useEffect(() => () => {
        clearInterval(timerRef.current); stopPolling();
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        pcRef.current?.close();
        if (stompRef.current?.connected) stompRef.current.disconnect();
    }, []);

    useEffect(() => {
        if (phase === 'incall' && localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
            safePlay(localVideoRef.current);
        }
    }, [phase]);

    // ══════════════════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════════════════

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
                        <p className="vc-lobby-subtitle">Duration: {fmt(callSeconds)}</p>
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

    if (phase === 'lobby' || phase === 'joining') {
        return (
            <div className="vc-page">
                <div className="vc-ambient" />
                <div className="vc-lobby">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="vc-lobby-card">
                        <div className="vc-lobby-icon"><Video size={36} /></div>
                        <h2 className="vc-lobby-title">Video Call</h2>
                        <p className="vc-lobby-subtitle">Start or join a meeting</p>
                        {error && (
                            <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 12, padding: 12, color: 'var(--error)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>
                                {error}
                            </div>
                        )}
                        <button className="vc-btn-create" onClick={handleCreate}><Zap size={18} /> CREATE MEETING</button>
                        <div className="vc-lobby-divider">OR</div>
                        <input className="vc-lobby-input" placeholder="Enter meeting code" value={joinInput}
                            onChange={e => setJoinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleJoin()} />
                        <button className="vc-btn-join" onClick={() => handleJoin()}><MonitorUp size={18} /> JOIN MEETING</button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ── In-call ───────────────────────────────────────────────────────
    return (
        <div className="vc-page">
            <div className="vc-ambient" />

            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="vc-toast">
                        <Check size={16} /> {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showParticipants && (
                    <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }}
                        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 280, background: 'rgba(22,27,34,0.97)', backdropFilter: 'blur(12px)', borderLeft: '1px solid var(--glass-border)', zIndex: 100, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                                <Users size={16} style={{ marginRight: 8 }} /> Participants ({participants.length})
                            </h3>
                            <button onClick={() => setShowParticipants(false)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        {participants.map((p, i) => {
                            const me = p.userId === userId;
                            const name = me ? (user?.username || p.userId) : p.userId;
                            return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                                        {name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{name} {me && <span style={{ color: '#8b949e' }}>(You)</span>}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#3fb950' }}>● Active</div>
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="vc-header">
                <div className="vc-header-left">
                    <button className="vc-back-btn" onClick={handleEndCall}><ChevronLeft size={20} /></button>
                    <div className="vc-meeting-code">
                        <span>{meetingCode}</span>
                        <button className="vc-copy-btn" onClick={copyCode}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>
                    </div>
                </div>
                <div className="vc-header-right">
                    <button onClick={() => setShowParticipants(!showParticipants)}
                        style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>
                        <Users size={16} /> {participants.length}
                    </button>
                    <div className="vc-timer">
                        <div className="vc-timer-dot" style={{ background: (iceStatus === 'connected' || iceStatus === 'completed') ? '#3fb950' : 'var(--error)' }} />
                        {fmt(callSeconds)}
                    </div>
                </div>
            </div>

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
                        <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Waiting for others...</p>
                        <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>
                            Code: <strong style={{ color: 'var(--accent-tertiary)', letterSpacing: 2 }}>{meetingCode}</strong>
                        </p>
                    </div>
                )}

                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="vc-local-wrapper">
                    <video ref={localVideoRef} autoPlay muted playsInline className="vc-local-video" />
                    <div className="vc-local-label">{user?.username || 'You'}</div>
                </motion.div>
            </div>

            <div className="vc-controls">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="vc-controls-bar">
                    <button className={`vc-ctrl-btn ${isMuted ? 'muted' : 'active'}`} onClick={toggleMic} title={isMuted ? 'Unmute' : 'Mute'}>
                        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
                    </button>
                    <button className={`vc-ctrl-btn ${isCamOff ? 'muted' : 'active'}`} onClick={toggleCam} title={isCamOff ? 'Cam on' : 'Cam off'}>
                        {isCamOff ? <VideoOff size={22} /> : <Video size={22} />}
                    </button>
                    <button className="vc-ctrl-btn end-call" onClick={handleEndCall} title="End"><PhoneOff size={22} /></button>
                    <button className="vc-ctrl-btn active" onClick={copyCode} title="Copy code">
                        {copied ? <Check size={22} /> : <Copy size={22} />}
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default VideoCall;
