import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Terminal, PawPrint, Shield, Zap, GitCommit, GitBranch, Lock, Database, CheckCheck, Clock, Layers, Mail, Twitter, Instagram, Facebook, Linkedin, FileText, Code, Phone } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

    // Animated Line Height based on scroll
    const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
    const [isChangelogOpen, setIsChangelogOpen] = useState(false);
    const [showTnc, setShowTnc] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [usernameInput, setUsernameInput] = useState('');

    return (
        <div ref={containerRef} style={{ background: '#0d1117', color: '#c9d1d9', minHeight: '300vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif' }}>

            {/* Changelog Modal */}
            <AnimatePresence>
                {isChangelogOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsChangelogOpen(false)}
                            style={{ position: 'absolute', inset: 0, background: 'rgba(13, 17, 23, 0.8)', backdropFilter: 'blur(8px)' }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            style={{ position: 'relative', width: '100%', maxWidth: '500px', background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.5)', zIndex: 10 }}
                        >
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid #30363d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <GitCommit size={20} color="#79c0ff" />
                                    Changelog (v11)
                                </h3>
                                <button onClick={() => setIsChangelogOpen(false)} style={{ background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer', padding: '4px', fontSize: '1.2rem' }}>✕</button>
                            </div>
                            <div style={{ padding: '24px', maxHeight: '60vh', overflowY: 'auto' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ borderLeft: '2px solid #30363d', paddingLeft: '16px', position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '-5px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: '#26ef2dff', boxShadow: '0 0 10px #3fb950' }}></div>
                                        <div style={{ fontSize: '0.8rem', color: '#8b949e', marginBottom: '4px' }}>Latest - 5ce52d3</div>
                                        <div style={{ color: '#c9d1d9', fontWeight: '500' }}>Redis Integration, Read Recipts,Bcrypt Password Encryption</div>
                                    </div>
                                    <div style={{ borderLeft: '2px solid #30363d', paddingLeft: '16px', position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '-5px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: '#30363d' }}></div>
                                        <div style={{ fontSize: '0.8rem', color: '#8b949e', marginBottom: '4px' }}>d799db0</div>
                                        <div style={{ color: '#c9d1d9' }}>Fixed random room entry</div>
                                    </div>
                                    <div style={{ borderLeft: '2px solid #30363d', paddingLeft: '16px', position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '-5px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: '#30363d' }}></div>
                                        <div style={{ fontSize: '0.8rem', color: '#8b949e', marginBottom: '4px' }}>980ba21</div>
                                        <div style={{ color: '#c9d1d9' }}>Websocket updates</div>
                                    </div>
                                    <div style={{ borderLeft: '2px solid #30363d', paddingLeft: '16px', position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '-5px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: '#30363d' }}></div>
                                        <div style={{ fontSize: '0.8rem', color: '#8b949e', marginBottom: '4px' }}>25be791</div>
                                        <div style={{ color: '#c9d1d9' }}>MongoDB migration, 4-digit room code logic added, and entity IDs converted to String.</div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #30363d', textAlign: 'center' }}>
                                    <a href="https://github.com/anket08/cxatapp/commits/main" target="_blank" rel="noopener noreferrer" style={{ color: '#79c0ff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>
                                        View full history on GitHub →
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Navbar area */}
            <nav style={{ padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', top: 0, width: '100%', zIndex: 100, background: 'rgba(13, 17, 23, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #30363d' }}>
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1.5rem', color: '#fff', cursor: 'pointer', position: 'relative' }}
                    onClick={() => navigate('/')}
                >
                    <motion.div
                        animate={{
                            filter: [
                                "drop-shadow(0px 0px 0px rgba(0,255,255,0))",
                                "drop-shadow(2px 0px 0px rgba(0,255,255,0.8)) drop-shadow(-2px 0px 0px rgba(255,0,255,0.8))",
                                "drop-shadow(-2px 0px 0px rgba(0,255,255,0.8)) drop-shadow(2px 0px 0px rgba(255,0,255,0.8))",
                                "drop-shadow(3px -1px 0px rgba(0,255,255,0.8)) drop-shadow(-3px 1px 0px rgba(255,0,255,0.8))",
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
                        <PawPrint size={28} color="#79c0ff" />
                    </motion.div>
                    cXat
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <button onClick={() => navigate('/login')} style={{ background: 'transparent', border: 'none', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>Sign in</button>
                    <a href="https://github.com/anket08/cxatapp" target="_blank" rel="noopener noreferrer" style={{ background: '#fff', color: '#0d1117', border: '1px solid rgba(27,31,36,0.15)', borderRadius: '6px', padding: '5px 16px', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem', textDecoration: 'none' }}>Read Docs</a>
                </div>
            </nav>

            {/* Hero Section */}
            <header style={{ position: 'relative', overflow: 'hidden', padding: '180px 5% 100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {/* Background glow abstract */}
                <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '80%', background: 'radial-gradient(ellipse at top, rgba(112,0,255,0.15), transparent 70%)', pointerEvents: 'none' }} />

                <motion.div
                    onClick={() => setIsChangelogOpen(true)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ background: 'rgba(255,255,255,0.05)' }}
                    style={{ border: '1px solid #30363d', borderRadius: '100px', padding: '6px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#8b949e', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                    <div style={{ width: '8px', height: '8px', background: '#3fb950', borderRadius: '50%', boxShadow: '0 0 10px #3fb950' }}></div>
                    VERSION 11 <ChevronRight size={14} />
                </motion.div>

                <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} style={{ fontSize: 'clamp(3.5rem, 8vw, 5.5rem)', fontWeight: '800', lineHeight: 1.1, color: '#fff', textAlign: 'center', maxWidth: '900px', letterSpacing: '-0.04em' }}>
                    Let's connect from <span style={{ color: '#79c0ff' }}>cXat.</span>
                </motion.h1>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }} style={{ color: '#8b949e', fontSize: '1.5rem', textAlign: 'center', maxWidth: '700px', marginTop: '24px', lineHeight: 1.5, fontWeight: '400' }}>
                    Fast, agile messaging inspired by the speed of the cat family.
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }} style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
                    <div style={{ background: '#fff', borderRadius: '6px', padding: '4px', display: 'flex', boxShadow: '0 8px 24px rgba(112,0,255,0.2)' }}>
                        <input type="text" placeholder="Enter cXat Id" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} style={{ border: 'none', background: 'transparent', padding: '12px 16px', color: '#000', outline: 'none', fontSize: '1.1rem', minWidth: '280px' }} />
                        <button onClick={() => navigate('/login', { state: { username: usernameInput } })} style={{ background: '#7000ff', color: '#fff', border: 'none', borderRadius: '6px', padding: '12px 24px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 0 20px rgba(112,0,255,0.5)' }}>
                            Login to cXat
                        </button>
                    </div>
                </motion.div>

                {/* Visual Code Example / Interface Graphic */}
                <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.7 }} style={{ marginTop: '80px', width: '100%', maxWidth: '1000px', background: '#161b22', border: '1px solid #30363d', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
                    <div style={{ background: '#0d1117', padding: '12px 16px', display: 'flex', gap: '8px', borderBottom: '1px solid #30363d' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }} />
                        <div style={{ marginLeft: '16px', color: '#8b949e', fontSize: '0.8rem', fontFamily: 'monospace' }}>terminal - cXat-secure</div>
                    </div>
                    <div style={{ padding: '24px', fontFamily: 'monospace', fontSize: '0.9rem', color: '#c9d1d9', lineHeight: 1.6, overflowX: 'auto' }}>
                        <div style={{ color: '#79c0ff' }}> Connecting to secure relay...</div>
                        <div style={{ color: '#3fb950' }}>[OK] Handshake established (AES-256)</div>
                        <div style={{ color: '#d2a8ff' }}>[SYS] Allocating private channel '349X'</div>
                        <div>Waiting for peer connection...</div>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5, duration: 0.5 }} style={{ color: '#ff7b72', marginTop: '12px' }}>
                            <span style={{ color: '#79c0ff' }}>Operator:</span> "The payload has been delivered."
                        </motion.div>
                    </div>
                </motion.div>
            </header>

            {/* Content with Timeline */}
            <div style={{ position: 'relative', display: 'flex', maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>

                {/* Fixed Timeline Column */}
                <div style={{ position: 'relative', width: '100px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                    {/* The Rail */}
                    <div style={{ position: 'absolute', top: 0, bottom: 0, width: '2px', background: '#30363d' }}>
                        {/* The Glowing progress line */}
                        <motion.div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: lineHeight, background: 'linear-gradient(to bottom, transparent, #79c0ff, #d2a8ff)', boxShadow: '0 0 10px #79c0ff, 0 0 20px #d2a8ff' }} />
                    </div>
                </div>

                {/* Scrollytelling Sections */}
                <div style={{ flex: 1, paddingBottom: '20vh' }}>
                    {/* Section 1: BCrypt */}
                    <Section
                        icon={<Lock size={24} color="#3fb950" />}
                        title="Impenetrable Authentication."
                        subtitle="Zero-knowledge security architecture"
                        text="Credentials are never stored in plaintext. Utilizing enterprise-grade BCrypt hashing algorithms, your identity remains mathematically secure even in the event of a total database compromise."
                        visual={<CodeBox title="encodePassword()" color="#3fb950" content={
                            <>
                                <span style={{ color: '#ff7b72' }}>public</span> User <span style={{ color: '#d2a8ff' }}>register</span>(User user) &#123;<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#8b949e' }}>// Hash password before saving to MongoDB</span><br />
                                &nbsp;&nbsp;&nbsp;&nbsp;user.<span style={{ color: '#d2a8ff' }}>setPassword</span>(<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;passwordEncoder.<span style={{ color: '#d2a8ff' }}>encode</span>(user.<span style={{ color: '#d2a8ff' }}>getPassword</span>())<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;);<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#ff7b72' }}>return</span> userRepository.<span style={{ color: '#d2a8ff' }}>save</span>(user);<br />
                                &#125;
                            </>
                        } />}
                    />

                    {/* Section 2: WebSocket */}
                    <Section
                        icon={<Zap size={24} color="#79c0ff" />}
                        title="Real-time performance at scale."
                        subtitle="Accelerate your communication workflows"
                        text="cXat's WebSocket infrastructure empowers teams to connect instantly with zero polling overhead. Experience uncompromised speed via bidirectional STOMP protocol streams."
                        visual={<CodeBox title="socket.connect()" color="#79c0ff" content={
                            <>
                                <span style={{ color: '#ff7b72' }}>const</span> socket <span style={{ color: '#79c0ff' }}>=</span> <span style={{ color: '#ff7b72' }}>new</span> <span style={{ color: '#d2a8ff' }}>SockJS</span>(<span style={{ color: '#a5d6ff' }}>'/ws'</span>);<br />
                                <span style={{ color: '#ff7b72' }}>const</span> client <span style={{ color: '#79c0ff' }}>=</span> Stomp.<span style={{ color: '#d2a8ff' }}>over</span>(socket);<br />
                                <br />
                                client.<span style={{ color: '#d2a8ff' }}>connect</span>(&#123;&#125;, () <span style={{ color: '#ff7b72' }}>={'>'}</span> &#123;<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;client.<span style={{ color: '#d2a8ff' }}>subscribe</span>(<span style={{ color: '#a5d6ff' }}>\`/topic/messages/&#36;&#123;roomId&#125;\`</span>, (msg) <span style={{ color: '#ff7b72' }}>={'>'}</span> &#123;<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#d2a8ff' }}>setMessages</span>(prev <span style={{ color: '#ff7b72' }}>={'>'}</span> [...prev, <span style={{ color: '#79c0ff' }}>JSON</span>.<span style={{ color: '#d2a8ff' }}>parse</span>(msg.body)]);<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;&#125;);<br />
                                &#125;);
                            </>
                        } />}
                    />

                    {/* Section 3: Redis */}
                    <Section
                        icon={<Database size={24} color="#ff7b72" />}
                        title="Synchronized across clients."
                        subtitle="Distributed caching layer"
                        text="Our high-throughput Redis caching cluster ensures that whether you're joining late or switching devices, your active room state and online status are instantly retrieved in sub-milliseconds."
                        visual={<CodeBox title="Redis Sync" color="#ff7b72" content={
                            <>
                                <span style={{ color: '#8b949e' }}>// Cache-Aside Pattern Implementation</span><br />
                                List&lt;Message&gt; cached <span style={{ color: '#79c0ff' }}>=</span> redisService.<span style={{ color: '#d2a8ff' }}>getCached</span>(roomId);<br />
                                <span style={{ color: '#ff7b72' }}>if</span> (cached <span style={{ color: '#79c0ff' }}>!=</span> <span style={{ color: '#79c0ff' }}>null</span>) <span style={{ color: '#ff7b72' }}>return</span> cached;<br />
                                <br />
                                List&lt;Message&gt; messages <span style={{ color: '#79c0ff' }}>=</span> mongoRepo.<span style={{ color: '#d2a8ff' }}>find</span>(roomId);<br />
                                redisService.<span style={{ color: '#d2a8ff' }}>cacheMessages</span>(roomId, messages);<br />
                                <span style={{ color: '#ff7b72' }}>return</span> messages;
                            </>
                        } />}
                    />

                    {/* Section 4: Read Receipts */}
                    <Section
                        icon={<CheckCheck size={24} color="#79c0ff" />}
                        title="Absolute delivery confirmation."
                        subtitle="Read receipt telemetry"
                        text="Never wonder if a payload was received. cXat emits read statuses across WebSockets instantly updating your UI with double blue ticks the moment the recipient connects."
                        visual={<CodeBox title="ReadReceipt Event" color="#79c0ff" content={
                            <>
                                <span style={{ color: '#8b949e' }}>/* Automatically emit read status on view */</span><br />
                                <span style={{ color: '#ff7b72' }}>const</span> unread <span style={{ color: '#79c0ff' }}>=</span> res.data.<span style={{ color: '#d2a8ff' }}>some</span>(m <span style={{ color: '#ff7b72' }}>={'>'}</span> <br />
                                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#79c0ff' }}>!</span>m.read <span style={{ color: '#79c0ff' }}>&amp;&amp;</span> m.senderId <span style={{ color: '#79c0ff' }}>!==</span> user.username<br />
                                );<br />
                                <br />
                                <span style={{ color: '#ff7b72' }}>if</span> (unread) &#123;<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;client.<span style={{ color: '#d2a8ff' }}>send</span>(<span style={{ color: '#a5d6ff' }}>"/app/read"</span>, &#123;&#125;, <span style={{ color: '#79c0ff' }}>JSON</span>.<span style={{ color: '#d2a8ff' }}>stringify</span>(&#123; roomId &#125;));<br />
                                &#125;
                            </>
                        } />}
                    />

                    {/* Section 5: Global Time */}
                    <Section
                        icon={<Clock size={24} color="#f0883e" />}
                        title="Universally synchronized."
                        subtitle="UTC standard timeframes"
                        text="Collaborate globally without timezone confusion. Every transmission is strictly stamped in UTC at the database level, ensuring perfect chronological orchestration for all clients."
                        visual={<CodeBox title="Message Entity" color="#f0883e" content={
                            <>
                                <span style={{ color: '#d2a8ff' }}>@Document</span>(collection <span style={{ color: '#79c0ff' }}>=</span> <span style={{ color: '#a5d6ff' }}>"messages"</span>)<br />
                                <span style={{ color: '#ff7b72' }}>public class</span> Message &#123;<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#ff7b72' }}>private</span> String content;<br />
                                <br />
                                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#8b949e' }}>// Forced UTC timestamping</span><br />
                                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#ff7b72' }}>private</span> String createdAt <span style={{ color: '#79c0ff' }}>=</span> <br />
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;LocalDateTime.<span style={{ color: '#d2a8ff' }}>now</span>(ZoneOffset.UTC).<span style={{ color: '#d2a8ff' }}>toString</span>();<br />
                                &#125;
                            </>
                        } />}
                    />

                    {/* Section 6: Kafka */}
                    <Section
                        icon={<Layers size={24} color="#d2a8ff" />}
                        title="Decoupled event streaming."
                        subtitle="Apache Kafka integration"
                        text="Built to handle massive bursts of traffic. Complex asynchronous tasks are strictly decoupled into micro-events allowing your primary sockets to remain unblocked and fluid."
                        visual={<CodeBox title="Transmission Broker" color="#d2a8ff" content={
                            <>
                                <span style={{ color: '#d2a8ff' }}>@KafkaListener</span>(topics <span style={{ color: '#79c0ff' }}>=</span> <span style={{ color: '#a5d6ff' }}>"chat-events"</span>)<br />
                                <span style={{ color: '#ff7b72' }}>public void</span> <span style={{ color: '#d2a8ff' }}>consume</span>(String message) &#123;<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#8b949e' }}>// Process heavy background persistence</span><br />
                                &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#8b949e' }}>// asynchronously off the main thread</span><br />
                                &nbsp;&nbsp;&nbsp;&nbsp;eventProcessor.<span style={{ color: '#d2a8ff' }}>handle</span>(message);<br />
                                &#125;
                            </>
                        } />}
                    />
                </div>
            </div>




            {/* Main Footer Section (Original Layout) */}
            <div style={{ background: '#010409', padding: '60px 20px', display: 'flex', justifyContent: 'center', borderTop: '1px solid #30363d' }}>
                <div style={{ maxWidth: '1200px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '40px' }}>
                    {/* Brand Area */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '1.25rem', color: '#fff' }}>
                            <PawPrint size={24} color="#79c0ff" /> cXat
                        </div>
                        <div style={{ color: '#8b949e', fontSize: '0.85rem', lineHeight: '1.8' }}>
                            © cXat Inc. - All rights reserved.<br />
                            A secure communication protocol.<br />
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div>
                        <h4 style={{ color: '#fff', marginBottom: '16px', fontSize: '1rem', fontWeight: '600' }}>Company</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <a href="mailto:cxat.app@gmail.com" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#8b949e'}><Mail size={14} /> Contact Us</a>
                            <a href="tel:+9175281623" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#8b949e'}><Phone size={14} /> +91 7528**1623</a>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ color: '#fff', marginBottom: '16px', fontSize: '1rem', fontWeight: '600' }}>Resources</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <a href="https://react.dev/" target="_blank" rel="noopener noreferrer" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#8b949e'}>React Documentation</a>
                            <a href="https://spring.io/projects/spring-boot" target="_blank" rel="noopener noreferrer" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#8b949e'}>Spring Boot Reference</a>
                            <a href="https://kafka.apache.org/documentation/" target="_blank" rel="noopener noreferrer" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#8b949e'}>Apache Kafka Docs</a>
                            <a href="https://redis.io/docs/latest/" target="_blank" rel="noopener noreferrer" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#8b949e'}>Redis Learn</a>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ color: '#fff', marginBottom: '16px', fontSize: '1rem', fontWeight: '600' }}>Legal</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <span onClick={() => setShowTnc(true)} style={{ color: '#8b949e', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#8b949e'}>Terms & Conditions</span>
                            <span onClick={() => setShowPrivacy(true)} style={{ color: '#8b949e', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#8b949e'}>Privacy Policy</span>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ color: '#fff', marginBottom: '16px', fontSize: '1rem', fontWeight: '600' }}>Socials</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <a href="https://x.com/annkettt" target="_blank" rel="noopener noreferrer" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#8b949e'}><Twitter size={14} /> X (Twitter)</a>
                            <a href="https://www.instagram.com/anket.08/" target="_blank" rel="noopener noreferrer" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#8b949e'}><Instagram size={14} /> Instagram</a>
                            <a href="https://www.linkedin.com/in/anket-aeri-746347163/" target="_blank" rel="noopener noreferrer" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#8b949e'}><Linkedin size={14} /> LinkedIn</a>
                            <a href="https://leetcode.com/u/anket7/" target="_blank" rel="noopener noreferrer" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#8b949e'}><Code size={14} /> LeetCode</a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Terms and Conditions Modal */}
            {showTnc && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }} onClick={() => setShowTnc(false)}>
                    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '16px', padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255, 123, 114, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 123, 114, 0.2)' }}>
                                <FileText size={32} color="#ff7b72" />
                            </div>
                        </div>
                        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '16px', fontWeight: 'bold' }}>Terms and Conditions</h2>
                        <p style={{ color: '#8b949e', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '30px', fontWeight: '500' }}>
                            By using cXat, you acknowledge that you <span style={{ color: '#fff' }}>chat at your own risk</span>. We are not responsible for any intercepted or lost transmissions.
                        </p>
                        <button
                            onClick={() => setShowTnc(false)}
                            style={{ background: '#ff7b72', color: '#0d1117', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', width: '100%' }}
                        >
                            I Understand
                        </button>
                    </div>
                </div>
            )}

            {/* Privacy Policy Modal */}
            {showPrivacy && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }} onClick={() => setShowPrivacy(false)}>
                    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '16px', padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(121, 192, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(121, 192, 255, 0.2)' }}>
                                <Shield size={32} color="#79c0ff" />
                            </div>
                        </div>
                        <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '16px', fontWeight: 'bold' }}>Privacy Policy</h2>
                        <p style={{ color: '#8b949e', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '30px', fontWeight: '500' }}>
                            Your <span style={{ color: '#fff' }}>messages are persistent</span> and stored securely. All user <span style={{ color: '#fff' }}>passwords are hashed</span> and encrypted before storage to ensure maximum security.
                        </p>
                        <button
                            onClick={() => setShowPrivacy(false)}
                            style={{ background: '#79c0ff', color: '#0d1117', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', width: '100%' }}
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

const Section = ({ title, subtitle, text, icon, visual }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { margin: "-20%", once: true });

    return (
        <div ref={ref} style={{ padding: '80px 0', position: 'relative' }}>
            {/* Timeline Node Glow inside the section container relative to timeline */}
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={isInView ? { scale: 1, opacity: 1 } : {}} transition={{ duration: 0.5, delay: 0.2 }} style={{ position: 'absolute', top: '90px', left: '-68px', width: '36px', height: '36px', background: '#0d1117', border: '2px solid #30363d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                {icon}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ color: '#8b949e', fontSize: '1.25rem', fontWeight: '600' }}>{subtitle}</div>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fff', lineHeight: 1.2, maxWidth: '600px' }}>{title}</h2>
                <p style={{ color: '#c9d1d9', fontSize: '1.2rem', lineHeight: 1.6, maxWidth: '600px', marginBottom: '32px' }}>{text}</p>
                {visual}
            </motion.div>
        </div>
    );
};

const CodeBox = ({ title, content, color = "#79c0ff" }) => (
    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', maxWidth: '700px' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #30363d', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={14} color={color} /> {title}
            </span>
        </div>
        <div style={{ padding: '24px', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: 1.6, overflowX: 'auto', background: '#0d1117' }}>
            {content}
        </div>
    </div>
);

export default LandingPage;