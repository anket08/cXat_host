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

// ── Fetch TURN credentials from Metered.ca ───────────────────────────────────
async function fetchIceServers() {
    try {
        const resp = await fetch(
            'https://cxatapp.metered.live/api/v1/turn/credentials?apiKey=656779e16120614c9be51394769a7e8c13d5'
        );
        const data = await resp.json();
        // Metered API returns array directly, but handle {iceServers:[]} too
        const turnServers = Array.isArray(data) ? data : (data.iceServers || []);
        console.log('[cXat] TURN fetched:', turnServers.length, 'servers', JSON.stringify(turnServers.map(s => s.urls || s.url)));
        return {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                ...turnServers,
            ],
        };
    } catch (e) {
        console.error('[cXat] TURN fetch failed:', e);
        return { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
    }
}

/*
 * ═══════════════════════════════════════════════════════════════════
 * SIMPLIFIED WEBRTC FLOW:
 *   HOST creates meeting → waits
 *   JOINER joins → sends OFFER directly
 *   HOST receives offer → sends ANSWER
 *   Done. No "user-joined" signal. No PC recreation. No race conditions.
 * ═══════════════════════════════════════════════════════════════════
 */
const VideoCall = ({ user }) => {
    const { meetingCode: paramCode } = useParams();
    const navigate = useNavigate();

    const [sessionId] = useState(
        () => (user?.id || 'anon') + '-' + Math.random().toString(36).slice(2, 8)
    );
    const userId = user?.id || user?.username || 'unknown';

    // State
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

    // Refs
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const pcRef = useRef(null);
    const stompRef = useRef(null);
    const timerRef = useRef(null);
    const pollRef = useRef(null);
    const iceQueue = useRef([]);
    const iceConfigRef = useRef(null);

    // Helpers
    const showToast = useCallback((m) => { setToast(m); setTimeout(() => setToast(''), 3000); }, []);
    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const copyCode = () => { navigator.clipboard.writeText(meetingCode); setCopied(true); showToast('Code copied!'); setTimeout(() => setCopied(false), 2000); };
    const safePlay = (el, isRemote = false) => {
        if (!el) return;
        if (isRemote) {
            el.volume = 1; // explicitly set volume
            el.muted = false; // ensure remote audio is NOT muted
            el.autoplay = true;
            el.controls = false;
        }
        el.setAttribute('playsinline', 'true');
        el.pause();
        el.play().catch(e => { if (e.name !== 'AbortError') console.error('[cXat] play:', e); });
    };

    // Participant polling
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
    const startPolling = useCallback((code) => { clearInterval(pollRef.current); fetchParticipants(code); pollRef.current = setInterval(() => fetchParticipants(code), 5000); }, [fetchParticipants]);
    const stopPolling = () => { clearInterval(pollRef.current); pollRef.current = null; };

    // Get camera + mic
    const startLocalStream = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) { localVideoRef.current.srcObject = stream; safePlay(localVideoRef.current); }
            console.log('[cXat] Local stream:', stream.getTracks().map(t => `${t.kind}:${t.enabled}`).join(', '));
            return stream;
        } catch (err) {
            console.error('[cXat] getUserMedia:', err);
            setError('Camera/Mic access denied.');
            return null;
        }
    }, []);

    // ── Build PeerConnection ─────────────────────────────────────────
    const buildPC = useCallback(async (stompClient, code) => {
        // Close old PC
        if (pcRef.current) {
            pcRef.current.ontrack = null;
            pcRef.current.onicecandidate = null;
            pcRef.current.oniceconnectionstatechange = null;
            pcRef.current.close();
        }
        iceQueue.current = [];

        // Get TURN config (cached)
        if (!iceConfigRef.current) iceConfigRef.current = await fetchIceServers();

        const pc = new RTCPeerConnection({
            ...iceConfigRef.current,
            bundlePolicy: 'max-bundle',
            iceTransportPolicy: 'all',
            rtcpMuxPolicy: 'require',
            sdpSemantics: 'unified-plan', // Better stability in Chrome
            iceCandidatePoolSize: 10,     // Faster connection (used by Meet/Zoom)
        });
        pcRef.current = pc;
        console.log('[cXat] PC created, servers:', iceConfigRef.current.iceServers.length);

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => {
                pc.addTrack(t, localStreamRef.current);
                console.log('[cXat] +track:', t.kind);
            });
        }

        // Remote track (using native streams to ensure reliable playback)
        pc.ontrack = (ev) => {
            console.log('[cXat] remote track:', ev.track.kind, 'enabled:', ev.track.enabled);
            if (!ev.streams || !ev.streams[0]) return;

            const remoteStream = ev.streams[0];
            console.log('[cXat] remote stream tracks:', remoteStream.getTracks().map(t => `${t.kind}:${t.enabled}`).join(', '));

            if (remoteVideoRef.current) {
                // Direct assignment as requested for stability
                if (remoteVideoRef.current.srcObject !== remoteStream) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
                remoteVideoRef.current.autoplay = true;
                remoteVideoRef.current.playsInline = true;
                remoteVideoRef.current.muted = false;

                remoteVideoRef.current.play().catch(e => {
                    if (e.name !== 'AbortError') console.error('[cXat] remote stream play error:', e);
                });

                setRemoteHasStream(true);
            }
        };

        // ICE candidate → send via STOMP
        let iceRestartCount = 0;
        pc.onicecandidate = (ev) => {
            if (!stompClient?.connected) return;

            if (ev.candidate) {
                console.log('[cXat] → ICE:', ev.candidate.candidate?.split(' ').slice(0, 8).join(' '));
                stompClient.send('/app/signal', {}, JSON.stringify({
                    type: 'ice-candidate', senderId: sessionId,
                    meetingCode: code, data: ev.candidate, // Send raw object
                }));
            } else {
                // End of candidates
                console.log('[cXat] → ICE gathering complete');
                stompClient.send('/app/signal', {}, JSON.stringify({
                    type: 'ice-complete', senderId: sessionId,
                    meetingCode: code
                }));
            }
        };

        // ICE state — limit restart attempts to prevent loops
        pc.oniceconnectionstatechange = () => {
            const s = pc.iceConnectionState;
            console.log('[cXat] ICE:', s);
            setIceStatus(s);
            if (s === 'connected' || s === 'completed') {
                showToast('Connected! ✅');
            }
            if (s === 'failed') {
                console.warn('[cXat] ICE failed — check connectivity or TURN servers');
            }
            if (s === 'disconnected') {
                console.warn('[cXat] ICE disconnected — peer may have dropped');
                setRemoteHasStream(false);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = null;
                }
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('[cXat] Connection state:', pc.connectionState);
        };

        return pc;
    }, [sessionId, showToast]);

    // Drain ICE queue
    const drainQ = async (pc) => {
        const n = iceQueue.current.length;
        while (iceQueue.current.length) {
            try { await pc.addIceCandidate(iceQueue.current.shift()); } catch (_) { }
        }
        if (n > 0) console.log('[cXat] drained', n, 'queued ICE');
    };

    // ── STOMP signaling (simplified — no user-joined) ────────────────
    const connectSignaling = useCallback((code) => {
        return new Promise((resolve) => {
            // Use WSS for production
            let wsUrl = `${API}/ws`;
            if (window.location.protocol === 'https:' && wsUrl.startsWith('http://')) {
                wsUrl = wsUrl.replace('http://', 'https://');
            }

            const socket = new SockJS(wsUrl);
            const client = Stomp.over(socket);

            // WebSocket Keep-Alive configurations to prevent Render timeouts
            client.heartbeat.outgoing = 20000;
            client.heartbeat.incoming = 20000;
            client.reconnect_delay = 5000;
            client.debug = null;
            stompRef.current = client;

            client.connect({}, () => {
                console.log('[cXat] STOMP connected');

                client.subscribe(`/topic/signal/${code}`, async (msg) => {
                    const sig = JSON.parse(msg.body);
                    if (sig.senderId === sessionId) return;

                    console.log(`[cXat] ← ${sig.type} from ...${sig.senderId?.slice(-6)}`);

                    const pc = pcRef.current;
                    if (!pc) { console.warn('[cXat] no PC!'); return; }

                    // Safe parse: STOMP might stringify the 'data' field even if it's an object in Java
                    const parseData = (d) => typeof d === 'string' ? JSON.parse(d) : d;

                    try {
                        if (sig.type === 'offer') {
                            const offerData = parseData(sig.data);
                            console.log('[cXat] got offer, signalingState:', pc.signalingState);

                            // Perfect Negotiation: Polite vs Impolite peer to fix Glare (simultaneous offers)
                            const offerCollision = pc.signalingState !== 'stable';
                            const polite = sessionId < sig.senderId;

                            if (offerCollision && !polite) {
                                console.warn('[cXat] offer collision: I am impolite, ignoring remote offer.');
                                return;
                            }

                            if (offerCollision && polite) {
                                console.log('[cXat] offer collision: I am polite, rolling back my offer to accept new offer.');
                                await pc.setLocalDescription({ type: 'rollback' });
                            }

                            await pc.setRemoteDescription(new RTCSessionDescription(offerData));
                            await drainQ(pc);
                            const ans = await pc.createAnswer();
                            await pc.setLocalDescription(ans);

                            // Delayed drain just in case ICE arrived between descriptions
                            setTimeout(() => drainQ(pc), 100);

                            client.send('/app/signal', {}, JSON.stringify({
                                type: 'answer', senderId: sessionId,
                                meetingCode: code, data: ans, // Send raw object
                            }));
                            console.log('[cXat] answer sent ✅');

                        } else if (sig.type === 'answer') {
                            const ansData = parseData(sig.data);
                            console.log('[cXat] got answer, signalingState:', pc.signalingState);
                            if (pc.signalingState !== 'have-local-offer') {
                                console.warn('[cXat] skip answer (wrong state)');
                                return;
                            }
                            await pc.setRemoteDescription(new RTCSessionDescription(ansData));
                            await drainQ(pc);
                            setTimeout(() => drainQ(pc), 100);
                            console.log('[cXat] answer applied ✅');

                        } else if (sig.type === 'ice-candidate') {
                            const candData = parseData(sig.data);
                            const cand = new RTCIceCandidate(candData);
                            if (pc.remoteDescription) {
                                await pc.addIceCandidate(cand);
                                console.log('[cXat] ← ICE:', cand.type, cand.protocol, cand.address);
                            } else {
                                iceQueue.current.push(cand);
                                console.log('[cXat] queued ICE, total:', iceQueue.current.length);
                            }
                        }
                    } catch (err) {
                        console.error('[cXat] signal error:', err);
                    }
                });

                console.log('[cXat] subscribed /topic/signal/' + code);
                resolve(client);
            }, (err) => {
                console.error('[cXat] STOMP error:', err);
                setError('Signaling failed.');
                resolve(null);
            });
        });
    }, [sessionId, showToast]);

    // ── CREATE meeting (HOST) ────────────────────────────────────────
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
            // HOST just waits — JOINER will send the offer
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

    // ── JOIN meeting (JOINER — sends offer directly) ─────────────────
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
            const pc = await buildPC(stomp, c);

            // JOINER creates and sends offer directly — no "user-joined" signal needed
            console.log('[cXat] creating offer...');
            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            await pc.setLocalDescription(offer);
            stomp.send('/app/signal', {}, JSON.stringify({
                type: 'offer', senderId: sessionId,
                meetingCode: c, data: offer, // Send raw object
            }));
            console.log('[cXat] offer sent ✅');

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

    useEffect(() => { if (paramCode && phase === 'joining') handleJoin(paramCode); }, [paramCode]);

    // ── End call ─────────────────────────────────────────────────────
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

    const toggleMic = () => { const t = localStreamRef.current?.getAudioTracks(); if (t?.length) { t[0].enabled = !t[0].enabled; setIsMuted(!t[0].enabled); } };
    const toggleCam = () => { const t = localStreamRef.current?.getVideoTracks(); if (t?.length) { t[0].enabled = !t[0].enabled; setIsCamOff(!t[0].enabled); } };

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

    // ══════════════════════════════════════════════ RENDER ═══════════

    if (phase === 'ended') {
        return (
            <div className="vc-page"><div className="vc-ambient" />
                <div className="vc-lobby">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="vc-lobby-card">
                        <div className="vc-lobby-icon" style={{ background: 'rgba(248,81,73,0.1)', borderColor: 'rgba(248,81,73,0.25)' }}><PhoneOff size={36} color="var(--error)" /></div>
                        <h2 className="vc-lobby-title" style={{ background: 'linear-gradient(135deg,var(--error),#ff9999)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Call Ended</h2>
                        <p className="vc-lobby-subtitle">Duration: {fmt(callSeconds)}</p>
                        <button className="vc-btn-create" onClick={() => { setPhase('lobby'); setCallSeconds(0); setMeetingCode(''); }}><Zap size={18} /> NEW MEETING</button>
                        <div style={{ height: 12 }} />
                        <button className="vc-btn-join" onClick={() => navigate('/lobby')}><ChevronLeft size={18} /> BACK TO LOBBY</button>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (phase === 'lobby' || phase === 'joining') {
        return (
            <div className="vc-page"><div className="vc-ambient" />
                <div className="vc-lobby">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="vc-lobby-card">
                        <div className="vc-lobby-icon"><Video size={36} /></div>
                        <h2 className="vc-lobby-title">Video Call</h2>
                        <p className="vc-lobby-subtitle">Start or join a meeting</p>
                        {error && <div style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.3)', borderRadius: 12, padding: 12, color: 'var(--error)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem' }}>{error}</div>}
                        <button className="vc-btn-create" onClick={handleCreate}><Zap size={18} /> CREATE MEETING</button>
                        <div className="vc-lobby-divider">OR</div>
                        <input className="vc-lobby-input" placeholder="Enter meeting code" value={joinInput} onChange={e => setJoinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleJoin()} />
                        <button className="vc-btn-join" onClick={() => handleJoin()}><MonitorUp size={18} /> JOIN MEETING</button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ── In-call ──────────────────────────────────────────────────────
    return (
        <div className="vc-page"><div className="vc-ambient" />
            <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="vc-toast"><Check size={16} /> {toast}</motion.div>}</AnimatePresence>

            <AnimatePresence>
                {showParticipants && (
                    <motion.div initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }}
                        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 280, background: 'rgba(22,27,34,0.97)', backdropFilter: 'blur(12px)', borderLeft: '1px solid var(--glass-border)', zIndex: 100, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}><Users size={16} style={{ marginRight: 8 }} /> Participants ({participants.length})</h3>
                            <button onClick={() => setShowParticipants(false)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        {participants.map((p, i) => {
                            const me = p.userId === userId;
                            const name = me ? (user?.username || p.userId) : p.userId;
                            return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent-primary),var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{name.charAt(0).toUpperCase()}</div>
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
                    <div className="vc-meeting-code"><span>{meetingCode}</span><button className="vc-copy-btn" onClick={copyCode}>{copied ? <Check size={14} /> : <Copy size={14} />}</button></div>
                </div>
                <div className="vc-header-right">
                    <button onClick={() => setShowParticipants(!showParticipants)} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}><Users size={16} /> {participants.length}</button>
                    <div className="vc-timer"><div className="vc-timer-dot" style={{ background: (iceStatus === 'connected' || iceStatus === 'completed') ? '#3fb950' : 'var(--error)' }} />{fmt(callSeconds)}</div>
                </div>
            </div>

            <div className="vc-videos">
                {remoteHasStream ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <video ref={remoteVideoRef} autoPlay playsInline className="vc-remote-video" />
                        <div className="vc-local-label" style={{ bottom: 16, left: 16, fontSize: '0.85rem', padding: '5px 14px' }}>{participants.find(p => p.userId !== userId)?.userId || 'Peer'}</div>
                    </div>
                ) : (
                    <div className="vc-remote-placeholder">
                        <div className="vc-remote-placeholder-icon"><Users size={42} /></div>
                        <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Waiting for others...</p>
                        <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>Code: <strong style={{ color: 'var(--accent-tertiary)', letterSpacing: 2 }}>{meetingCode}</strong></p>
                    </div>
                )}
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="vc-local-wrapper">
                    <video ref={localVideoRef} autoPlay muted playsInline className="vc-local-video" />
                    <div className="vc-local-label">{user?.username || 'You'}</div>
                </motion.div>
            </div>

            <div className="vc-controls">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="vc-controls-bar">
                    <button className={`vc-ctrl-btn ${isMuted ? 'muted' : 'active'}`} onClick={toggleMic}>{isMuted ? <MicOff size={22} /> : <Mic size={22} />}</button>
                    <button className={`vc-ctrl-btn ${isCamOff ? 'muted' : 'active'}`} onClick={toggleCam}>{isCamOff ? <VideoOff size={22} /> : <Video size={22} />}</button>
                    <button className="vc-ctrl-btn end-call" onClick={handleEndCall}><PhoneOff size={22} /></button>
                    <button className="vc-ctrl-btn active" onClick={copyCode}>{copied ? <Check size={22} /> : <Copy size={22} />}</button>
                </motion.div>
            </div>
        </div>
    );
};

export default VideoCall;
