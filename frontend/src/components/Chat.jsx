import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import axios from 'axios';
import { Send, Hash, ChevronLeft, User as UserIcon, Check, CheckCheck, Radio } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Chat = ({ user, activeRoom: propActiveRoom, onLeaveRoom }) => {
    const { roomId: paramRoomId } = useParams();
    const navigate = useNavigate();
    const activeRoom = propActiveRoom || paramRoomId;

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);

    const stompClientRef = useRef(null);
    const subscriptionRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Format time helper
    const formatTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    useEffect(() => {
        if (!activeRoom) return;

        // Cleanup function for previous connection
        const cleanup = () => {
            if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
            if (stompClientRef.current && stompClientRef.current.connected) {
                stompClientRef.current.disconnect();
            }
        };

        const socket = new SockJS('http://localhost:8080/ws');
        const client = Stomp.over(socket);
        client.debug = null; // Disable debug logs for cleaner console
        stompClientRef.current = client;

        client.connect({}, () => {
            setIsConnected(true);

            // Subscribe to Messages
            subscriptionRef.current = client.subscribe(`/topic/messages/${activeRoom}`, (msg) => {
                const message = JSON.parse(msg.body);
                setMessages(prev => {
                    if (prev.some(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });

                if (String(message.senderId) !== String(user.id)) {
                    client.send("/app/read", {}, JSON.stringify({ roomId: activeRoom, userId: user.id }));
                }
            });

            client.subscribe(`/topic/read/${activeRoom}`, (msg) => {
                setMessages(prev => prev.map(m => ({ ...m, read: true })));
            });

            fetchHistory(activeRoom);

        }, () => setIsConnected(false));

        return cleanup;
    }, [activeRoom, user.id]);

    const fetchHistory = async (id) => {
        try {
            const res = await axios.get(`http://localhost:8080/chat/messages/${id}`);
            if (Array.isArray(res.data)) {
                setMessages(res.data);

                const hasUnreadFromOthers = res.data.some(m => !m.read && String(m.senderId) !== String(user.id));
                if (hasUnreadFromOthers && stompClientRef.current?.connected) {
                    stompClientRef.current.send("/app/read", {}, JSON.stringify({ roomId: activeRoom, userId: user.id }));
                }
            }
        } catch (err) { console.error(err); }
    };

    const sendMessage = () => {
        if (!input.trim() || !isConnected) return;
        const payload = { roomId: activeRoom, senderId: user.username, content: input.trim() };
        stompClientRef.current.send("/app/chat", {}, JSON.stringify(payload));
        setInput("");
    };

    return (
        <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', zIndex: 999 }}>

            {/* Background Details */}
            <div className="chat-background-pattern"></div>
            <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 50%, transparent 0%, var(--bg-base) 100%)' }}></div>

            {/* Chat Header */}
            <header style={{
                position: 'relative',
                zIndex: 10,
                height: '75px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 2rem',
                margin: '1.5rem 5%', /* Makes it float instead of touching edges */
                borderRadius: '30px', /* Rounded corners for glassmorphism */
                background: 'rgba(13, 17, 23, 0.15)', /* More translucent background */
                backdropFilter: 'blur(35px)', /* Stronger blur */
                WebkitBackdropFilter: 'blur(35px)',
                border: '1px solid rgba(255, 255, 255, 0.08)', /* Subtle bright edge */
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' /* Soft floating shadow */
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => { if (onLeaveRoom) onLeaveRoom(); navigate('/lobby'); }}
                        style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-main)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--glass-highlight)'}
                        onMouseOut={e => e.currentTarget.style.background = 'var(--glass-bg)'}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: '800' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(0,242,255,0.1), rgba(0,242,255,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', border: '1px solid rgba(0,242,255,0.2)' }}>
                                <Hash size={18} />
                            </div>
                            Channel {activeRoom}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>{user.username}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                            <div style={{ width: '6px', height: '6px', background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 10px var(--success)' }}></div> Connected
                        </div>
                    </div>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-base)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.1rem', color: 'var(--accent-primary)' }}>
                        {user.username?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>

            {/* Messages Area */}
            <main style={{ flex: 1, position: 'relative', zIndex: 5, overflowY: 'auto', padding: '2rem 10%', display: 'flex', flexDirection: 'column', gap: '1rem', scrollbarWidth: 'none' }}>
                {messages.length === 0 && (
                    <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
                            <Radio size={36} />
                        </div>
                        <p style={{ fontWeight: '600', letterSpacing: '1px' }}>Waiting for secure transmission...</p>
                    </div>
                )}

                <AnimatePresence>
                    {messages.map((msg, idx) => {
                        const isMe = String(msg.senderId) === String(user.id) || String(msg.senderId) === String(user.username);
                        return (
                            <motion.div
                                key={msg.id || idx}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                style={{
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: '65%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isMe ? 'flex-end' : 'flex-start'
                                }}
                            >
                                {!isMe && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: '600', marginLeft: '4px' }}>{msg.senderId}</div>}

                                <div style={{
                                    padding: '14px 18px',
                                    borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                    background: isMe ? 'linear-gradient(135deg, var(--accent-primary), #00a8ff)' : 'rgba(13, 17, 23, 0.45)', // Blend color
                                    color: isMe ? '#000' : 'var(--text-main)',
                                    border: isMe ? 'none' : '1px solid rgba(255, 255, 255, 0.05)', // Extremely faint white highlight only, no black
                                    boxShadow: isMe ? '0 8px 25px rgba(0, 242, 255, 0.25)' : '0 4px 15px rgba(0,0,0,0.15)',
                                    fontSize: '0.95rem',
                                    lineHeight: '1.5',
                                    position: 'relative',
                                    backdropFilter: isMe ? 'none' : 'blur(25px)',
                                    WebkitBackdropFilter: isMe ? 'none' : 'blur(25px)'
                                }}>
                                    {msg.content}

                                    {/* Timestamp Container */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '6px', opacity: 0.8 }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: '700', color: isMe ? 'rgba(0,0,0,0.6)' : 'var(--text-muted)' }}>
                                            {formatTime(msg.createdAt)}
                                        </span>
                                        {isMe && (
                                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                                {msg.read ? (
                                                    <CheckCheck size={14} color="#0056b3" />
                                                ) : (
                                                    <Check size={14} color="rgba(0,0,0,0.4)" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </main>

            {/* Input Footer */}
            <footer style={{ position: 'relative', zIndex: 10, padding: '1.5rem 10% 2.5rem', background: 'transparent' }}>
                <div style={{ background: 'rgba(13, 17, 23, 0.15)', backdropFilter: 'blur(35px)', WebkitBackdropFilter: 'blur(35px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '50px', display: 'flex', alignItems: 'center', padding: '6px 6px 6px 24px', maxWidth: '900px', margin: '0 auto', transition: 'all 0.3s ease', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
                    <input
                        type="text"
                        placeholder="Type a secure message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        disabled={!isConnected}
                        style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', fontSize: '1rem', fontWeight: '500' }}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || !isConnected}
                        style={{ background: input.trim() ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'rgba(255,255,255,0.05)', color: input.trim() ? '#fff' : 'var(--text-muted)', border: 'none', width: '46px', height: '46px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.3s ease', boxShadow: input.trim() ? '0 5px 15px rgba(0, 242, 255, 0.4)' : 'none' }}
                        onMouseOver={(e) => { if (input.trim()) e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseOut={(e) => { if (input.trim()) e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        <Send size={18} style={{ marginLeft: input.trim() ? '2px' : '0' }} />
                    </button>
                </div>
            </footer>

        </div>
    );
};

export default Chat;