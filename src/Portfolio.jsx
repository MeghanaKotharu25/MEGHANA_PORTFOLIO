import { useEffect, useRef, useState, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════
   HASH ROUTER
═══════════════════════════════════════════════════════ */
function useRoute() {
  const [route, setRoute] = useState(() => window.location.hash === '#/projects' ? 'projects' : 'home');
  useEffect(() => {
    const onHash = () => {
      setRoute(window.location.hash === '#/projects' ? 'projects' : 'home');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}

function navigate(to) {
  window.location.hash = to === 'projects' ? '#/projects' : '#';
}

/* ═══════════════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════════════ */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const onScroll = () => setY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return y;
}

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { threshold: 0.4 });
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);
  return active;
}

/* ═══════════════════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════════════════ */
function Reveal({ children, delay = 0, className = '', from = 'bottom' }) {
  const [ref, inView] = useInView();
  const transforms = { bottom: 'translateY(32px)', left: 'translateX(-32px)', right: 'translateX(32px)' };
  return (
    <div
      ref={ref}
      className={`pf-reveal ${inView ? 'in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}s`, '--pf-from': transforms[from] || transforms.bottom }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   COUNTER
═══════════════════════════════════════════════════════ */
function Counter({ to, decimals = 0, suffix = '', duration = 1400 }) {
  const [ref, inView] = useInView(0.4);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = null, raf;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(to * p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return <span ref={ref}>{val.toFixed(decimals)}{suffix}</span>;
}

/* ═══════════════════════════════════════════════════════
   MATRIX CANVAS
═══════════════════════════════════════════════════════ */
function MatrixCanvas({ scrollY }) {
  const canvasRef = useRef(null);
  const scrollRef = useRef(0);
  useEffect(() => { scrollRef.current = scrollY; }, [scrollY]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const chars = '01アイウエカキクケ█▓░⌬◈⬡∑∆∇∫≡≠→←↑↓⌭⚡◆▸'.split('');
    let w, h, cols, drops;
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      cols = Math.floor(w / 18);
      drops = Array(cols).fill(1);
    };
    resize();
    window.addEventListener('resize', resize);
    const interval = setInterval(() => {
      const scrollFrac = Math.min(scrollRef.current / (document.body.scrollHeight - window.innerHeight || 1), 1);
      const r = Math.round(194 + (155 - 194) * scrollFrac);
      const g = Math.round(163 + (111 - 163) * scrollFrac);
      const b = Math.round(108 + (160 - 108) * scrollFrac);
      const speed = 1 + scrollFrac * 1.5;
      ctx.fillStyle = 'rgba(15,10,12,0.055)';
      ctx.fillRect(0, 0, w, h);
      drops.forEach((y, i) => {
        const ch = chars[Math.floor(Math.random() * chars.length)];
        const alpha = Math.random() * 0.5 + 0.1;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.font = `${Math.random() > 0.93 ? 'bold ' : ''}13px 'IBM Plex Mono',monospace`;
        ctx.fillText(ch, i * 18, y * 18);
        if (y * 18 > h && Math.random() > 0.975) drops[i] = 0;
        drops[i] += speed;
      });
    }, 55);
    return () => { clearInterval(interval); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', opacity: 0.13 }} />;
}

/* ═══════════════════════════════════════════════════════
   SCROLL PROGRESS BAR
═══════════════════════════════════════════════════════ */
function ScrollProgress({ scrollY }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const max = document.body.scrollHeight - window.innerHeight;
    setPct(max > 0 ? (scrollY / max) * 100 : 0);
  }, [scrollY]);
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 200, background: 'rgba(255,255,255,0.04)' }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: 'linear-gradient(90deg, var(--maroon), var(--rose), var(--cyber))',
        transition: 'width 0.1s linear',
        boxShadow: '0 0 8px rgba(217,164,171,0.5)',
      }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PARALLAX BLOBS
═══════════════════════════════════════════════════════ */
function ParallaxBlobs({ scrollY }) {
  const b1y = scrollY * -0.18;
  const b2y = scrollY * -0.1;
  const b3y = scrollY * -0.24;
  const b3x = scrollY * 0.06;
  const scrollFrac = Math.min(scrollY / 3000, 1);
  const b1r = Math.round(122 + (91 - 122) * scrollFrac);
  const b1g = Math.round(46 + (51 - 46) * scrollFrac);
  const b1b = Math.round(61 + (88 - 61) * scrollFrac);
  return (
    <>
      <div className="pf-blob" style={{ width: 480, height: 480, background: `rgb(${b1r},${b1g},${b1b})`, top: '-12%', left: '-10%', opacity: 0.6, transform: `translateY(${b1y}px)`, animation: 'pf-f1 26s ease-in-out infinite' }} />
      <div className="pf-blob" style={{ width: 420, height: 420, background: 'var(--plum)', bottom: '-15%', right: '-8%', opacity: 0.5, transform: `translateY(${b2y}px)`, animation: 'pf-f2 32s ease-in-out infinite' }} />
      <div className="pf-blob" style={{ width: 360, height: 360, background: 'var(--rose)', top: '38%', right: '18%', opacity: 0.18, transform: `translateY(${b3y}px) translateX(${b3x}px)`, animation: 'pf-f3 22s ease-in-out infinite' }} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   HEX GRID
═══════════════════════════════════════════════════════ */
function HexGrid({ scrollY }) {
  const [paths, setPaths] = useState('');
  useEffect(() => {
    const size = 32, W = window.innerWidth, H = window.innerHeight;
    const cCount = Math.ceil(W / (size * 1.73)) + 2;
    const rCount = Math.ceil(H / (size * 1.5)) + 2;
    let out = '';
    for (let r = 0; r < rCount; r++) {
      for (let c = 0; c < cCount; c++) {
        const x = c * size * 1.73 + (r % 2) * size * 0.865;
        const y = r * size * 1.5;
        const pts = Array.from({ length: 6 }, (_, a) => {
          const ang = (Math.PI / 180) * (60 * a - 30);
          return `${x + size * Math.cos(ang)},${y + size * Math.sin(ang)}`;
        });
        out += `<polygon points="${pts.join(' ')}" fill="none" stroke="rgba(194,163,108,0.9)" stroke-width="0.5"/>`;
      }
    }
    setPaths(out);
  }, []);
  const rot = scrollY * 0.008;
  const op = 0.04 + Math.sin(scrollY * 0.002) * 0.025;
  return (
    <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: Math.max(0.01, op), transform: `rotate(${rot}deg)`, transformOrigin: 'center center', transition: 'opacity 0.3s' }}
      dangerouslySetInnerHTML={{ __html: paths }} />
  );
}

/* ═══════════════════════════════════════════════════════
   CUSTOM CURSOR + TRAIL
═══════════════════════════════════════════════════════ */
function Cursor({ isHovering }) {
  const ringRef = useRef(null);
  const dotRef = useRef(null);
  const trailRefs = useRef([]);
  const positions = useRef(Array(12).fill({ x: 0, y: 0 }));
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = e => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMove);
    let raf;
    const animate = () => {
      const ring = ringRef.current;
      if (ring) {
        const prev = positions.current[0];
        const nx = prev.x + (mouse.current.x - prev.x) * 0.14;
        const ny = prev.y + (mouse.current.y - prev.y) * 0.14;
        positions.current[0] = { x: nx, y: ny };
        ring.style.transform = `translate(${nx - 11}px,${ny - 11}px)`;
      }
      if (dotRef.current) dotRef.current.style.transform = `translate(${mouse.current.x - 2.5}px,${mouse.current.y - 2.5}px)`;
      for (let i = trailRefs.current.length - 1; i > 0; i--) {
        const prev2 = positions.current[Math.max(0, i - 1)];
        const cur = positions.current[i] || { x: 0, y: 0 };
        positions.current[i] = { x: cur.x + (prev2.x - cur.x) * 0.28, y: cur.y + (prev2.y - cur.y) * 0.28 };
        const el = trailRefs.current[i];
        if (el) {
          const sz = Math.max(1, 5 - i * 0.35);
          const alpha = (1 - i / trailRefs.current.length) * 0.4;
          const palettes = ['217,164,171', '155,111,160', '194,163,108'];
          el.style.cssText = `position:fixed;top:0;left:0;width:${sz}px;height:${sz}px;border-radius:50%;pointer-events:none;z-index:99998;background:rgba(${palettes[i % 3]},${alpha});transform:translate(${positions.current[i].x - sz / 2}px,${positions.current[i].y - sz / 2}px);`;
        }
      }
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, []);
  return (
    <>
      <div ref={ringRef} style={{ position: 'fixed', top: 0, left: 0, width: isHovering ? 30 : 22, height: isHovering ? 30 : 22, border: `1px solid ${isHovering ? 'var(--rose)' : 'var(--gold)'}`, borderRadius: '50%', pointerEvents: 'none', zIndex: 99999, background: isHovering ? 'rgba(217,164,171,0.08)' : 'transparent', transition: 'border-color 0.25s, background 0.25s, width 0.2s, height 0.2s' }} />
      <div ref={dotRef} style={{ position: 'fixed', top: 0, left: 0, width: 5, height: 5, background: 'var(--rose)', borderRadius: '50%', pointerEvents: 'none', zIndex: 100000 }} />
      {Array.from({ length: 11 }, (_, i) => <div key={i} ref={el => trailRefs.current[i + 1] = el} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none' }} />)}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   LIVE CLOCK
═══════════════════════════════════════════════════════ */
function Clock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    tick(); const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

/* ═══════════════════════════════════════════════════════
   SECTION TINT
═══════════════════════════════════════════════════════ */
function SectionTint({ scrollY }) {
  const sectionColors = [[122, 46, 61], [91, 51, 88], [122, 46, 61], [80, 30, 50]];
  const docH = typeof document !== 'undefined' ? document.body.scrollHeight - window.innerHeight : 1;
  const frac = docH > 0 ? scrollY / docH : 0;
  const idx = Math.min(Math.floor(frac * (sectionColors.length - 1)), sectionColors.length - 2);
  const t = (frac * (sectionColors.length - 1)) - idx;
  const [r, g, b] = sectionColors[idx].map((v, i) => Math.round(v + (sectionColors[idx + 1][i] - v) * t));
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: `radial-gradient(ellipse at 30% 40%, rgba(${r},${g},${b},0.18) 0%, transparent 70%)`, transition: 'background 0.6s ease' }} />
  );
}

/* ═══════════════════════════════════════════════════════
   PROJECT CARD
═══════════════════════════════════════════════════════ */
function ProjectCard({ project, index }) {
  const [ref, inView] = useInView(0.1);
  return (
    <div ref={ref} className="pf-reveal" style={{ transitionDelay: `${index * 0.1}s`, ...(inView ? { opacity: 1, transform: 'none' } : {}) }}>
      <a
        href={project.github}
        target="_blank"
        rel="noopener noreferrer"
        className="pf-project-card"
        style={{ '--accent': project.color, display: 'block', textDecoration: 'none', color: 'inherit' }}
      >
        <div className="pf-project-card-body">
          <div className="pf-project-tag" style={{ color: project.color, borderColor: project.color }}>{project.tag}</div>
          <h3 className="pf-project-title">{project.title}</h3>
          <p className="pf-project-desc">{project.desc}</p>
        </div>
        <div className="pf-project-stack">
          {project.stack.map(s => <span key={s} className="pf-project-chip">{s}</span>)}
        </div>
        <div className="pf-project-arrow" style={{ color: project.color }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
        </div>
        <div className="pf-project-glow" style={{ background: `radial-gradient(circle at 50% 100%, ${project.color}22, transparent 70%)` }} />
      </a>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════ */
const journey = [
  { hash: '7c19f02', date: '2017 — 2024', title: 'NSN Memorial School', org: '', points: [] },
  { hash: 'e48a3d1', date: 'Jun 2024 — present', title: 'B.Tech, CSE (Artificial Intelligence)', org: 'Amrita Vishwa Vidyapeetham, Coimbatore', points: ['CGPA 8.93 / 10, ongoing through 2028'] },
  { hash: '2f9b6aa', date: 'Nov 2025 — present', title: 'Vice President, INIT Club', org: 'Amrita Vishwa Vidyapeetham', points: ['Leading technical initiatives and student project activities'] },
  { hash: 'c0ffee3', date: 'Feb 2026 — June 2026', title: 'Frontend Developer Intern', org: 'TARQEN Solutions', points: ['Built API-driven frontend architectures and optimized responsive UI for production'] },
  { hash: '91dc04b', date: 'Jan 2026 — present', title: 'AI Research Intern', org: 'ROR Technologies', points: ['Built RAG-based AI assistants over enterprise knowledge sources', 'Designed agentic workflows to automate multi-step business processes'] },
];

const projects = [
  { id: 'proj-1', category: 'AI', tag: 'ML / NLP', title: 'Transformer Pruning via ADMM', desc: 'Achieved 70%+ sparsity on transformer models with minimal perplexity loss using alternating direction method of multipliers.', stack: ['PyTorch', 'Python', 'ADMM'], color: 'var(--rose)', github: 'https://github.com/MeghanaKotharu25/MFC3_C13_LLM_Pruning' },
  { id: 'proj-2', category: 'Healthcare', tag: 'Bioinformatics', title: 'Peptide Toxicity Classifier', desc: '438 engineered features, F1 0.94 and ROC-AUC 0.96. Validated end-to-end with SHAP for feature-level interpretability.', stack: ['Scikit-learn', 'XGBoost', 'SHAP'], color: 'var(--gold)', github: 'https://github.com/MeghanaKotharu25/Peptide-Toxicity-Prediction-ML' },
  { id: 'proj-3', category: 'Cyber', tag: 'Cybersec / Hardware', title: 'PMU-Based Grid Anomaly Detection', desc: 'PMU data from IEEE-39 bus system — 99%+ localization accuracy for fault detection using signal processing + ML.', stack: ['RTL-SDR', 'Python', 'PYNQ-Z2'], color: 'var(--cyber)', github: 'https://github.com/MeghanaKotharu25' },
  { id: 'proj-4', category: 'Cyber', tag: 'Cybersec / ML', title: 'Traffic Classification Using ML', desc: 'Developed a machine learning pipeline for network traffic classification using flow-based traffic features, enabling automated identification of different traffic categories.', stack: ['Python', 'Scikit-learn', 'ML'], color: 'var(--cyber)', github: 'https://github.com/MeghanaKotharu25/Traffic-Classification-' },
  { id: 'proj-5', category: 'AI', tag: 'LLMs / Optimization', title: 'LLM Optimizer', desc: 'Built a hardware-aware LLM inference optimization framework that autonomously selects model configurations such as pruning and quantization to balance latency and model quality.', stack: ['LLMs', 'PyTorch', 'Quantization'], color: 'var(--rose)', github: 'https://github.com/MeghanaKotharu25/LLM-Optimizer' },
  { id: 'proj-6', category: 'AI', tag: 'AI / Full-stack', title: 'Railway QR Maintenance System', desc: 'Developed a full-stack maintenance management platform using React, Flask, and TensorFlow. Features QR-code asset tracking and U-Net reconstruction for damaged codes.', stack: ['React', 'Flask', 'TensorFlow', 'U-Net'], color: 'var(--rose)', github: 'https://github.com/MeghanaKotharu25/SIH_AIQR_PIXELS' },
  { id: 'proj-7', category: 'AI', tag: 'AI / CV', title: 'Oil Spill Detection via SAR', desc: 'Built an AI-powered environmental monitoring solution that analyzes Synthetic Aperture Radar (SAR) imagery to detect potential oil spills and marine pollution.', stack: ['Computer Vision', 'PyTorch', 'SAR Imagery'], color: 'var(--rose)', github: 'https://github.com/MeghanaKotharu25/HACKZILLA_CODEWAVE-S' },
  { id: 'proj-8', category: 'Cyber', tag: 'Hardware / CPU', title: 'Hack CPU Using Nand2Tetris', desc: 'Designed and implemented a 16-bit Hack CPU from fundamental logic gates, covering digital logic design, CPU architecture, and low-level computer organization.', stack: ['HDL', 'Nand2Tetris', 'CPU Design'], color: 'var(--cyber)', github: 'https://github.com/MeghanaKotharu25/HACK-CPU-using-Nand2tetris' },
  { id: 'proj-9', category: 'Healthcare', tag: 'AI / Accessibility', title: 'MisSpoke', desc: 'A speech and communication assistance platform designed to improve spoken language accessibility through AI-driven speech analysis, pronunciation feedback, and fluency tools.', stack: ['Speech Processing', 'Python', 'ML'], color: 'var(--gold)', github: 'https://github.com/Mrudula-itsjuzme/speak134' },
  { id: 'proj-10', category: 'Cyber', tag: 'Cybersec / DSP', title: 'Audio Watermarking System', desc: 'Implemented a robust audio watermarking framework for embedding and extracting hidden information within audio signals for copyright protection and secure distribution.', stack: ['Signal Processing', 'Python', 'Watermarking'], color: 'var(--cyber)', github: 'https://github.com/git-hima-bling/MFC4_C1_AudioWatermarking' }
];

const skillGroups = [
  { label: 'languages', items: ['Python', 'C++', 'JavaScript', 'SQL', 'C', 'Java'], cyber: false },
  { label: 'ml & ai', items: ['PyTorch', 'TensorFlow', 'Scikit-learn', 'XGBoost', 'Transformers', 'LLMs', 'RAG', 'XAI', 'NumPy', 'Pandas', 'Seaborn', 'OpenCV'], cyber: false },
  { label: 'web & backend', items: ['HTML', 'CSS', 'JavaScript', 'React', 'Next.js', 'MongoDB'], cyber: false },
  { label: 'hardware / cybersec', items: ['Arduino', 'ESP32', 'PYNQ-Z2', 'RTL-SDR', 'Coral Dev Board', 'ADALM2000', 'Kali Linux'], cyber: true },
  { label: 'tools', items: ['Git', 'VS Code', 'IntelliJ IDEA', 'Jupyter Notebook'], cyber: false },
];

const certifications = [
  { title: 'Supervised Machine Learning: Regression and Classification', issuer: 'DeepLearning.AI', date: 'Jul 2025', link: 'https://coursera.org/share/9520f0d82d75187ce177aec33d2485d8' },
  { title: 'Advanced Learning Algorithms', issuer: 'DeepLearning.AI', date: 'Dec 2025', link: 'https://coursera.org/share/fde8849716706f344e5066f1713085bb' },
  { title: 'Google Prompting Essentials', issuer: 'Google', date: 'May 2026', link: 'https://coursera.org/share/5095525c457ec5f6ec8ece247177464f' },
  { title: 'Google AI Essentials', issuer: 'Google', date: 'May 2026', link: 'https://coursera.org/share/70db0469e4e73b37f7a571b5711ec968' },
  { title: 'Introduction to Responsible AI', issuer: 'Google Skills', date: '2026', link: 'https://www.skills.google/public_profiles/7c0f12d7-2413-4fe9-a2e7-428ad3fef2c9/badges/24912735' },
  { title: 'Introduction to Large Language Models', issuer: 'Google Skills', date: '2026', link: 'https://www.skills.google/public_profiles/7c0f12d7-2413-4fe9-a2e7-428ad3fef2c9/badges/24904583' },
  { title: 'Introduction to Generative AI', issuer: 'Google Skills', date: '2026', link: 'https://www.skills.google/public_profiles/7c0f12d7-2413-4fe9-a2e7-428ad3fef2c9/badges/24904535' },
];

const achievements = [
  { value: 70, decimals: 0, suffix: '%+', label: 'sparsity', detail: 'Transformer pruning via ADMM, minimal perplexity loss' },
  { value: 0.94, decimals: 2, suffix: '', label: 'F1-score', detail: 'Peptide toxicity classifier, 438 engineered features' },
  { value: 0.96, decimals: 2, suffix: '', label: 'ROC-AUC', detail: 'Same model, validated with SHAP' },
  { value: 99, decimals: 0, suffix: '%+', label: 'localization accuracy', detail: 'PMU anomaly detection, IEEE-39 bus' },
  { value: 8.93, decimals: 2, suffix: '/10', label: 'CGPA', detail: 'B.Tech CSE (AI), Amrita Vishwa Vidyapeetham' },
];

/* ═══════════════════════════════════════════════════════
   SHARED STYLES
═══════════════════════════════════════════════════════ */
const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,400&family=IBM+Plex+Mono:wght@400;500&family=Great+Vibes&display=swap');
  :root {
    --bg: #0f0a0c;
    --maroon: #7a2e3d;
    --plum: #5b3358;
    --cream: #f3e8da;
    --cream-dim: #a99b8c;
    --gold: #c2a36c;
    --rose: #d9a4ab;
    --cyber: #9b6fa0;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .pf-root {
    position: relative; width: 100%; background: var(--bg);
    color: var(--cream); font-family: 'IBM Plex Mono', monospace;
    overflow-x: hidden; isolation: isolate;
  }
  @media (hover: hover) { .pf-root, .pf-root * { cursor: none !important; } }
  .pf-root::after { content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 100; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.022) 2px, rgba(0,0,0,0.022) 4px); }
  .pf-blob { position: fixed; border-radius: 50%; filter: blur(90px); mix-blend-mode: screen; pointer-events: none; z-index: 0; will-change: transform; }
  @keyframes pf-f1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(70px,50px) scale(1.1); } }
  @keyframes pf-f2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-60px,-40px) scale(1.15); } }
  @keyframes pf-f3 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px,60px) scale(0.9); } }
  .pf-container { width: 100%; max-width: 1200px; margin: 0 auto; padding-left: 2.5rem; padding-right: 2.5rem; }
  .pf-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 9999; backdrop-filter: blur(20px); background: rgba(15,10,12,0.5); border-bottom: 1px solid rgba(194,163,108,0.08); }
  .pf-nav-container { display: flex; align-items: center; justify-content: space-between; padding-top: 1.2rem; padding-bottom: 1.2rem; width: 100%; }
  .pf-nav-logo { font-family: 'Fraunces', serif; font-size: 1.1rem; font-weight: 500; color: var(--cream); text-decoration: none; letter-spacing: -0.01em; cursor: inherit; background: none; border: none; }
  .pf-nav-logo span { color: var(--rose); }
  .pf-nav-links { display: flex; gap: 2rem; }
  .pf-nav a { font-size: 0.75rem; letter-spacing: 0.12em; color: var(--cream-dim); text-decoration: none; position: relative; padding-bottom: 3px; transition: color 0.3s; }
  .pf-nav a::before { content: '> '; opacity: 0; color: var(--cyber); transition: opacity 0.25s; }
  .pf-nav a::after { content: ''; position: absolute; left: 0; bottom: 0; width: 0; height: 1px; background: var(--rose); transition: width 0.3s; }
  .pf-nav a:hover, .pf-nav a.active { color: var(--cream); }
  .pf-nav a:hover::before, .pf-nav a.active::before { opacity: 1; }
  .pf-nav a:hover::after, .pf-nav a.active::after { width: 100%; }
  .pf-statusbar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; background: rgba(15,10,12,0.85); backdrop-filter: blur(12px); border-top: 1px solid rgba(194,163,108,0.08); }
  .pf-statusbar-container { display: flex; gap: 2rem; align-items: center; font-size: 0.65rem; letter-spacing: 0.1em; color: var(--cream-dim); padding-top: 0.4rem; padding-bottom: 0.4rem; }
  .pf-ping { width: 5px; height: 5px; border-radius: 50%; background: #5dbb8a; display: inline-block; animation: pf-pulse 2s ease-in-out infinite; }
  @keyframes pf-pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; box-shadow: 0 0 6px #5dbb8a; } }
  .pf-section { position: relative; z-index: 5; padding: 5.25rem 0; }
  .pf-section-label { display: inline-block; font-size: 0.8rem; letter-spacing: 0.15em; color: var(--gold); margin-bottom: 1.25rem; }
  .pf-reveal { opacity: 0; transform: var(--pf-from, translateY(32px)); transition: opacity 0.75s cubic-bezier(.2,.8,.2,1), transform 0.75s cubic-bezier(.2,.8,.2,1); }
  .pf-reveal.in { opacity: 1; transform: none; }
  .pf-bio { font-family: 'Fraunces', serif; font-weight: 300; font-size: clamp(0.95rem,1.7vw,1.24rem); line-height: 1.55; color: var(--cream); max-width: min(42rem, 100%); display: grid; gap: 0.95rem; }
  .pf-bio p { margin: 0; }
  .pf-highlight { color: var(--rose); font-weight: 500; }
  .pf-cyber-badge { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; letter-spacing: 0.1em; border: 1px solid rgba(155,111,160,0.4); color: #b87fc2; padding: 0.35rem 0.8rem; border-radius: 4px; margin-top: 1.5rem; }
  .pf-cyber-dot { width: 5px; height: 5px; border-radius: 50%; background: #b87fc2; animation: pf-pulse 1.5s ease-in-out infinite; }
  .pf-blink { animation: pf-cblink 1s steps(1) infinite; color: var(--gold); }
  @keyframes pf-cblink { 50%{opacity:0;} }
  .pf-timeline { position: relative; padding-left: 2rem; }
  .pf-timeline::before { content: ''; position: absolute; left: 5px; top: 0; bottom: 0; width: 1px; background: linear-gradient(to bottom, var(--rose), var(--cyber), transparent); opacity: 0.3; }
  .pf-commit-wrap { margin-bottom: 2.5rem; }
  .pf-commit-wrap:last-child { margin-bottom: 0; }
  .pf-commit { position: relative; }
  .pf-commit-dot { position: absolute; left: -2rem; top: 0.4rem; width: 10px; height: 10px; border-radius: 50%; background: var(--rose); box-shadow: 0 0 12px rgba(217,164,171,0.6), 0 0 0 3px var(--bg); transition: transform 0.3s; }
  .pf-commit-wrap:hover .pf-commit-dot { transform: scale(1.4); }
  .pf-commit-meta { display: flex; gap: 0.75rem; align-items: baseline; font-size: 0.75rem; margin-bottom: 0.4rem; }
  .pf-hash { color: var(--gold); }
  .pf-date { color: var(--cream-dim); }
  .pf-commit-title { font-family: 'Fraunces', serif; font-weight: 500; font-size: 1.3rem; margin: 0 0 0.2rem; transition: color 0.3s; }
  .pf-commit-wrap:hover .pf-commit-title { color: var(--rose); }
  .pf-commit-org { font-size: 0.85rem; color: var(--cream-dim); margin: 0 0 0.6rem; }
  .pf-commit-points { margin: 0; padding-left: 1.1rem; font-size: 0.9rem; color: var(--cream-dim); line-height: 1.6; }
  .pf-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .pf-chip { font-size: 0.8rem; padding: 0.4rem 0.9rem; border: 1px solid rgba(243,232,218,0.12); border-radius: 999px; color: var(--cream-dim); transition: border-color 0.3s, background 0.3s, color 0.3s, transform 0.3s, box-shadow 0.3s; }
  .pf-chip:hover { border-color: var(--rose); background: rgba(217,164,171,0.1); color: var(--cream); transform: translateY(-2px); box-shadow: 0 4px 16px rgba(217,164,171,0.15); }
  .pf-chip-cyber:hover { border-color: var(--cyber); background: rgba(155,111,160,0.12); box-shadow: 0 4px 16px rgba(155,111,160,0.2); }
  .pf-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); gap: 1.5rem; }
  .pf-stat-card { padding: 1.2rem; border: 1px solid rgba(243,232,218,0.08); border-radius: 10px; position: relative; overflow: hidden; transition: border-color 0.4s, transform 0.4s; }
  .pf-stat-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at top left, rgba(122,46,61,0.18), transparent 70%); opacity: 0; transition: opacity 0.4s; }
  .pf-stat-card:hover::before { opacity: 1; }
  .pf-stat-card:hover { border-color: rgba(217,164,171,0.2); transform: translateY(-3px); }
  .pf-stat-value { display: block; font-family: 'Fraunces', serif; font-weight: 500; font-size: 2.2rem; color: var(--cream); }
  .pf-stat-label { display: block; font-size: 0.75rem; letter-spacing: 0.1em; color: var(--cream-dim); margin: 0.3rem 0 0.6rem; text-transform: uppercase; }
  .pf-stat-detail { font-size: 0.8rem; color: var(--cream-dim); line-height: 1.5; }
  .pf-projects-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(265px, 1fr)); gap: 1.25rem; margin-top: 1rem; }
  .pf-project-card { position: relative; overflow: hidden; padding: 1.25rem; border-radius: 10px; border: 1px solid rgba(243,232,218,0.08); background: rgba(15,10,12,0.45); backdrop-filter: blur(6px); transition: border-color 0.3s, transform 0.3s, background 0.3s; cursor: default; display: flex; flex-direction: column; height: 100%; justify-content: space-between; }
  .pf-project-card-body { flex-grow: 1; }
  .pf-project-card:hover { transform: translateY(-3px); background: rgba(15,10,12,0.6); border-color: var(--accent); }
  .pf-project-card:hover .pf-project-chip { border-color: var(--accent); }
  .pf-project-tag { font-size: 0.65rem; letter-spacing: 0.12em; border: 1px solid; display: inline-block; padding: 0.15rem 0.5rem; border-radius: 3px; margin-bottom: 0.65rem; opacity: 0.85; }
  .pf-project-title { font-family: 'Fraunces', serif; font-weight: 500; font-size: 1.1rem; margin-bottom: 0.45rem; line-height: 1.35; }
  .pf-project-desc { font-size: 0.78rem; color: var(--cream-dim); line-height: 1.55; margin-bottom: 0.85rem; }
  .pf-project-stack { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: auto; }
  .pf-project-chip { font-size: 0.65rem; padding: 0.2rem 0.55rem; border: 1px solid rgba(243,232,218,0.12); border-radius: 999px; color: var(--cream-dim); transition: border-color 0.3s; }
  .pf-project-arrow { position: absolute; top: 1.2rem; right: 1.2rem; font-size: 1.0rem; opacity: 0.4; transform: none; transition: opacity 0.3s, transform 0.3s, color 0.3s; }
  .pf-project-card:hover .pf-project-arrow { opacity: 1; transform: translate(2px, -2px); }
  .pf-project-glow { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity 0.35s; }
  .pf-project-card:hover .pf-project-glow { opacity: 1; }
  .pf-contact-btn { display: inline-block; font-family: 'IBM Plex Mono',monospace; font-size: 0.8rem; letter-spacing: 0.1em; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; color: var(--cream); transition: background 0.3s, border-color 0.3s; }
  .pf-contact-btn-rose { border: 1px solid rgba(217,164,171,0.3); }
  .pf-contact-btn-rose:hover { background: rgba(217,164,171,0.1); border-color: var(--rose); }
  .pf-contact-btn-cyber { border: 1px solid rgba(155,111,160,0.3); }
  .pf-contact-btn-cyber:hover { background: rgba(155,111,160,0.1); border-color: var(--cyber); }
  .pf-contact-btn-gold { border: 1px solid rgba(194,163,108,0.25); }
  .pf-contact-btn-gold:hover { background: rgba(194,163,108,0.08); border-color: var(--gold); }
  .pf-divider { height: 1px; background: linear-gradient(to right, transparent, rgba(194,163,108,0.15), rgba(217,164,171,0.15), transparent); position: relative; z-index: 5; width: 100%; }
  .pf-footer { position: relative; z-index: 5; text-align: center; padding: 4rem 0 6rem; font-size: 0.75rem; color: var(--cream-dim); letter-spacing: 0.1em; }
  .pf-footer a { color: var(--rose); text-decoration: none; }
  .pf-footer-hex { font-size: 0.65rem; opacity: 0.4; margin-top: 0.4rem; }
  .pf-skill-label { display: block; font-size: 0.72rem; letter-spacing: 0.18em; color: #ffe1b3; margin-bottom: 0.45rem; text-transform: uppercase; }
  .pf-skills { display: flex; flex-direction: column; gap: 1rem; }
  .pf-chip { font-size: 0.73rem; padding: 0.32rem 0.72rem; border: 1px solid rgba(243,232,218,0.18); border-radius: 999px; color: var(--cream); background: rgba(243,232,218,0.06); transition: border-color 0.3s, background 0.3s, color 0.3s, transform 0.3s, box-shadow 0.3s; }
  .pf-chip:hover { border-color: var(--rose); background: rgba(217,164,171,0.16); color: #fff8f2; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(217,164,171,0.15); }
  .pf-chip-cyber:hover { border-color: var(--cyber); background: rgba(155,111,160,0.16); box-shadow: 0 4px 16px rgba(155,111,160,0.2); }
  .pf-certifications { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-top: 1rem; }
  .pf-cert-card { padding: 1rem 1.1rem; border: 1px solid rgba(243,232,218,0.12); border-radius: 12px; background: linear-gradient(135deg, rgba(15,10,12,0.48), rgba(91,51,88,0.22)); backdrop-filter: blur(6px); transition: border-color 0.3s, transform 0.3s, background 0.3s; min-height: 118px; display: flex; flex-direction: column; justify-content: space-between; text-decoration: none; }
  .pf-cert-card:hover { border-color: rgba(217,164,171,0.35); transform: translateY(-2px); background: linear-gradient(135deg, rgba(15,10,12,0.6), rgba(122,46,61,0.25)); }
  .pf-cert-title { font-family: 'Fraunces', serif; font-size: 1rem; color: var(--cream); display: block; margin-bottom: 0.35rem; }
  .pf-cert-meta { font-size: 0.72rem; color: var(--cream-dim); letter-spacing: 0.1em; text-transform: uppercase; }
  .pf-cert-link { margin-top: 0.7rem; font-size: 0.78rem; color: var(--rose); text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; width: fit-content; }
  .pf-cert-link:hover { color: #ffd1d8; }
  .pf-cert-note { font-size: 0.84rem; color: var(--cream-dim); line-height: 1.6; margin-top: 0.45rem; }
  .pf-hero { position: relative; z-index: 5; min-height: calc(100svh - 6rem); padding-top: clamp(5rem, 9vh, 7rem); padding-bottom: clamp(2rem, 4vh, 3rem); display: flex; flex-direction: column; justify-content: center; }
  .pf-hero-container { display: flex; flex-direction: column; gap: clamp(0.95rem, 2.2vh, 1.4rem); position: relative; width: 100%; }
  
  /* Layout Controls and Switches */
  .pf-projects-controls { display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; margin-bottom: 2rem; flex-wrap: wrap; }
  .pf-view-toggle { display: flex; background: rgba(15, 10, 12, 0.5); border: 1px solid rgba(194, 163, 108, 0.15); border-radius: 6px; padding: 2px; }
  .pf-view-toggle-btn { font-family: 'IBM Plex Mono', monospace; font-size: 0.7rem; letter-spacing: 0.05em; padding: 0.4rem 0.8rem; border-radius: 4px; border: none; background: transparent; color: var(--cream-dim); cursor: inherit; display: flex; align-items: center; gap: 0.35rem; transition: all 0.2s; }
  .pf-view-toggle-btn.active { color: var(--cream); background: rgba(194, 163, 108, 0.15); }
  
  /* Split Pane Layout */
  .pf-explorer-layout { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 2.5rem; border: 1px solid rgba(194, 163, 108, 0.15); border-radius: 12px; background: rgba(15, 10, 12, 0.45); backdrop-filter: blur(8px); min-height: 560px; overflow: hidden; }
  .pf-explorer-left { padding: 1.75rem; border-right: 1px solid rgba(194, 163, 108, 0.15); max-height: 560px; overflow-y: auto; }
  .pf-explorer-left::-webkit-scrollbar { width: 5px; }
  .pf-explorer-left::-webkit-scrollbar-track { background: transparent; }
  .pf-explorer-left::-webkit-scrollbar-thumb { background: rgba(194, 163, 108, 0.15); border-radius: 99px; }
  .pf-explorer-left::-webkit-scrollbar-thumb:hover { background: rgba(217, 164, 171, 0.3); }
  .pf-explorer-right { padding: 2.25rem; background: rgba(15, 10, 12, 0.6); display: flex; flex-direction: column; justify-content: space-between; }
  .pf-explorer-header { font-size: 0.72rem; color: var(--cream-dim); margin-bottom: 1.25rem; padding-bottom: 0.5rem; border-bottom: 1px dashed rgba(194, 163, 108, 0.2); }
  
  /* File Tree list */
  .pf-explorer-list { display: flex; flex-direction: column; gap: 0.3rem; }
  .pf-explorer-row { display: grid; grid-template-columns: 85px 45px 1fr; align-items: center; font-size: 0.78rem; padding: 0.5rem 0.75rem; border-radius: 4px; color: var(--cream-dim); cursor: inherit; transition: all 0.2s ease; user-select: none; text-decoration: none; border-left: 2px solid transparent; }
  .pf-explorer-row:hover { background: rgba(255, 255, 255, 0.03); color: var(--cream); }
  .pf-explorer-row.active { background: rgba(217, 164, 171, 0.06); border-left-color: var(--accent); color: var(--cream); padding-left: 0.75rem; }
  .pf-explorer-perm { color: var(--cream-dim); opacity: 0.45; font-size: 0.7rem; }
  .pf-explorer-owner { color: var(--cream-dim); opacity: 0.6; }
  .pf-explorer-name { color: var(--cream); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  
  /* Click-expand row details */
  .pf-explorer-row-details { display: flex; align-items: center; gap: 0.5rem; padding-left: 135px; margin-top: -0.1rem; margin-bottom: 0.4rem; font-size: 0.72rem; animation: pf-slideDown 0.2s ease-out forwards; }
  @keyframes pf-slideDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
  .pf-explorer-tag-arrow { color: var(--accent); opacity: 0.5; font-weight: bold; font-family: monospace; }
  .pf-explorer-chip { font-size: 0.65rem; padding: 0.1rem 0.45rem; border: 1px solid rgba(194, 163, 108, 0.18); border-radius: 999px; color: var(--cream-dim); background: rgba(15, 10, 12, 0.3); }
  
  /* Inspector Pane */
  .pf-inspector-title { font-family: 'Fraunces', serif; font-size: 1.45rem; line-height: 1.3; color: var(--cream); margin-bottom: 0.65rem; }
  .pf-inspector-meta { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; }
  .pf-inspector-desc { font-size: 0.85rem; line-height: 1.65; color: var(--cream-dim); margin-bottom: 1.5rem; flex-grow: 1; }
  .pf-inspector-github-link { opacity: 0.6; transition: opacity 0.2s, transform 0.2s, color 0.2s; color: var(--accent); display: flex; align-items: center; justify-content: center; }
  .pf-inspector-github-link:hover { opacity: 1; transform: scale(1.1); }
  .pf-inspector-cmd { font-family: 'IBM Plex Mono', monospace; font-size: 0.75rem; color: var(--cream-dim); padding: 0.75rem 1rem; background: rgba(0,0,0,0.2); border-radius: 6px; border: 1px solid rgba(255,255,255,0.03); display: flex; gap: 0.5rem; align-items: center; margin-top: auto; }
  
  @media (max-width: 640px) {
    .pf-container { padding-left: 1.25rem; padding-right: 1.25rem; }
    .pf-nav-container { padding-top: 1rem; padding-bottom: 1rem; }
    .pf-nav-links { gap: 1rem; }
    .pf-section { padding-top: 4rem; padding-bottom: 4rem; }
    .pf-statusbar { display: none; }
    .pf-projects-grid { grid-template-columns: 1fr; }
  }
  @media (hover: none) { .pf-root { cursor: auto; } }
  
  /* Accordion Mode (Mobile fallback) */
  @media (max-width: 768px) {
    .pf-explorer-layout { grid-template-columns: 1fr; min-height: auto; gap: 0; }
    .pf-explorer-left { border-right: none; padding: 1.25rem; max-height: none; }
    .pf-explorer-right { display: none; }
    .pf-explorer-row { grid-template-columns: 60px 1fr; }
    .pf-explorer-perm, .pf-explorer-owner, .pf-explorer-size { display: none; }
    .pf-explorer-row-details { padding-left: 65px; margin-bottom: 0.6rem; flex-wrap: wrap; }
    
    .pf-mobile-details { padding: 1rem; border-top: 1px dashed rgba(194, 163, 108, 0.15); background: rgba(15, 10, 12, 0.6); border-radius: 0 0 6px 6px; margin-bottom: 0.75rem; border-left: 2px solid var(--accent); }
    .pf-mobile-desc { font-size: 0.8rem; line-height: 1.55; color: var(--cream-dim); margin-bottom: 1rem; }
    .pf-mobile-stack { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 1rem; }
  }
`;

/* ═══════════════════════════════════════════════════════
   SHARED NAV + STATUS
═══════════════════════════════════════════════════════ */
function Nav({ route, hover, unhover }) {
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const isHome = route === 'home';

  const handleNavClick = (e, id) => {
    e.preventDefault();
    if (isHome) {
      scrollTo(id);
    } else {
      window.location.hash = `#${id}`;
    }
  };

  return (
    <nav className="pf-nav">
      <div className="pf-nav-container pf-container">
        <button
          className="pf-nav-logo"
          onClick={() => { if (!isHome) navigate('home'); else window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onMouseEnter={hover} onMouseLeave={unhover}
        >
          meg<span>.</span>
        </button>
        <div className="pf-nav-links">
          <a
            href="#about"
            onMouseEnter={hover}
            onMouseLeave={unhover}
            onClick={e => handleNavClick(e, 'about')}
          >
            about
          </a>
          <a
            href="#contact"
            onMouseEnter={hover}
            onMouseLeave={unhover}
            onClick={e => handleNavClick(e, 'contact')}
          >
            contact
          </a>
          <a
            href="#/projects"
            className={route === 'projects' ? 'active' : ''}
            onMouseEnter={hover} onMouseLeave={unhover}
            onClick={e => { e.preventDefault(); navigate('projects'); }}
          >
            projects
          </a>
        </div>
      </div>
    </nav>
  );
}

function StatusBar() {
  return (
    <div className="pf-statusbar">
      <div className="pf-statusbar-container pf-container">
        <span><span className="pf-ping" />&nbsp; sys online</span>
        <span>// main branch</span>
        <Clock />
        <span>↯ meghana.dev</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PROJECTS PAGE
═══════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════
   PROJECTS HELPER
   Generates a dynamic filename and size for each project
═══════════════════════════════════════════════════════ */
const getProjectFileDetails = (p) => {
  let ext = '.py';
  if (p.category === 'Cyber') {
    if (p.title.includes('CPU')) ext = '.hdl';
    else if (p.title.includes('Anomaly') || p.title.includes('Watermarking')) ext = '.cpp';
    else ext = '.sh';
  } else if (p.category === 'Healthcare') {
    ext = '.bin';
  } else if (p.category === 'AI' && p.title.includes('Optimizer')) {
    ext = '.rs';
  }

  const base = p.title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 18);

  const size = `${(p.desc.length / 14 + p.stack.length * 0.3).toFixed(1)}K`;

  return { filename: `${base}${ext}`, size };
};

/* ═══════════════════════════════════════════════════════
   PROJECTS PAGE
   Provides Grid view for projects
═══════════════════════════════════════════════════════ */
function ProjectsPage({ scrollY, hover, unhover }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredProjects = activeCategory === 'All'
    ? projects
    : projects.filter(p => p.category === activeCategory);

  return (
    <div className="pf-root">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');` + SHARED_CSS + `
        .pf-name { font-family: 'Fraunces', serif; font-weight: 500; font-size: clamp(2.6rem,9vw,6rem); line-height: 1.05; letter-spacing: -0.01em; }
        .pf-word { display: inline-block; opacity: 0; transform: translateY(28px); color: var(--cream); animation: pf-riseIn 0.8s cubic-bezier(.2,.8,.2,1) forwards; }
        .pf-word-accent { background: linear-gradient(135deg, var(--cream) 40%, var(--rose) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
        @keyframes pf-riseIn { to { opacity: 1; transform: translateY(0); } }
        .pf-eyebrow { display: flex; align-items: center; gap: 0.6rem; font-size: 0.8rem; letter-spacing: 0.12em; color: var(--cream-dim); }
        .pf-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); animation: pf-pulse 2.4s ease-in-out infinite; }
        .pf-filter-bar { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .pf-filter-btn {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          padding: 0.5rem 1.2rem;
          border-radius: 6px;
          border: 1px solid rgba(243, 232, 218, 0.12);
          color: var(--cream-dim);
          background: rgba(15, 10, 12, 0.3);
          cursor: inherit;
          transition: all 0.3s ease;
        }
        .pf-filter-btn:hover, .pf-filter-btn.active {
          color: var(--cream);
          border-color: var(--rose);
          background: rgba(217, 164, 171, 0.08);
          box-shadow: 0 0 12px rgba(217, 164, 171, 0.15);
        }
      `}</style>

      <MatrixCanvas scrollY={scrollY} />
      <HexGrid scrollY={scrollY} />
      <ParallaxBlobs scrollY={scrollY} />
      <SectionTint scrollY={scrollY} />
      <ScrollProgress scrollY={scrollY} />
      <Cursor isHovering={false} />

      <Nav route="projects" hover={hover} unhover={unhover} />
      <StatusBar />

      {/* Page header */}
      <div className="pf-hero" style={{ minHeight: '40vh', justifyContent: 'flex-end', paddingBottom: '3rem' }}>
        <div className="pf-container pf-hero-container">
          <div className="pf-eyebrow">
            <span className="pf-eyebrow-dot" />
            <span>~/projects on main · {projects.length} entries&nbsp;<span className="pf-blink">_</span></span>
          </div>
          <h1 className="pf-name">
            <span className="pf-word" style={{ animationDelay: '0.1s' }}>$&nbsp;</span>
            <span className="pf-word pf-word-accent" style={{ animationDelay: '0.22s' }}>ls projects/</span>
          </h1>
        </div>
      </div>

      <div className="pf-container">
        <div className="pf-divider" />
      </div>

      {/* Projects list/grid section */}
      <section className="pf-section">
        <div className="pf-container">
          <Reveal><span className="pf-section-label">// all projects</span></Reveal>

          <Reveal>
            <div className="pf-projects-controls">
              <div className="pf-filter-bar">
                {['All', 'AI', 'Cyber', 'Healthcare'].map(cat => (
                  <button
                    key={cat}
                    className={`pf-filter-btn ${activeCategory === cat ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat)}
                    onMouseEnter={hover}
                    onMouseLeave={unhover}
                  >
                    {cat}
                  </button>
                ))}
              </div>

            </div>
          </Reveal>

          <div className="pf-projects-grid">
            {filteredProjects.map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)}
          </div>

          <div style={{ marginTop: '6rem', paddingTop: '3rem', borderTop: '1px solid rgba(194,163,108,0.15)' }}>
            <Reveal><span className="pf-section-label">$ ls skills/</span></Reveal>
            <div className="pf-skills" style={{ marginTop: '1rem' }}>
              {skillGroups.map((g, gi) => (
                <Reveal key={g.label} delay={gi * 0.06}>
                  <span className="pf-skill-label">{g.label}</span>
                  <div className="pf-chips">
                    {g.items.map(item => <span key={item} className={`pf-chip${g.cyber ? ' pf-chip-cyber' : ''}`}>{item}</span>)}
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.12}>
              <div style={{ marginTop: '4.5rem', paddingTop: '3rem', borderTop: '1px solid rgba(194,163,108,0.15)' }}>
                <span className="pf-section-label"># certifications</span>
                <div className="pf-certifications">
                  {certifications.length > 0 ? certifications.map((cert, i) => (
                    <a key={`${cert.title}-${i}`} href={cert.link} target="_blank" rel="noopener noreferrer" className="pf-cert-card">
                      <div>
                        <span className="pf-cert-title">{cert.title}</span>
                        <div className="pf-cert-meta">{cert.issuer} · {cert.date}</div>
                      </div>
                      <span className="pf-cert-link">view certificate ↗</span>
                    </a>
                  )) : (
                    <div className="pf-cert-card">
                      <div>
                        <span className="pf-cert-title">Certificates</span>
                        <p className="pf-cert-note">Add your completed certificates here with their links as you earn them.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <footer className="pf-footer">
        <div className="pf-container">
          <div>
            <button onClick={() => navigate('home')} style={{ background: 'none', border: 'none', color: 'var(--rose)', cursor: 'inherit', fontSize: '0.75rem', letterSpacing: '0.1em' }}>← back to home</button>
          </div>
          <div style={{ marginTop: '0.5rem' }}>designed & built by <a href="#">meghana</a> · 2026</div>
          <div className="pf-footer-hex">0xM3GHANA · commit 7c19f02 → present</div>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════════ */
function HomePage({ scrollY, hover, unhover }) {
  const activeSection = useActiveSection(['home', 'about', 'contact']);
  const heroOpacity = Math.max(0, 1 - scrollY / 500);
  const heroTranslate = scrollY * 0.35;
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#about' || hash === '#contact') {
      const id = hash.substring(1);
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="pf-root">
      <style>{SHARED_CSS + `
        .pf-eyebrow { display: flex; align-items: center; gap: 0.6rem; font-size: 0.8rem; letter-spacing: 0.12em; color: var(--cream-dim); }
        .pf-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); animation: pf-pulse 2.4s ease-in-out infinite; }
        .pf-name { font-family: 'Fraunces', serif; font-weight: 500; font-size: clamp(2.6rem,9vw,6rem); line-height: 0.95; letter-spacing: -0.01em; margin: 0; padding-top: 0.03em; padding-bottom: 0.02em; }
        .pf-word { display: inline-block; opacity: 0; transform: translateY(28px); color: var(--cream); animation: pf-riseIn 0.8s cubic-bezier(.2,.8,.2,1) forwards; }
        .pf-word-accent { background: linear-gradient(135deg, var(--cream) 40%, var(--rose) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
        @keyframes pf-riseIn { to { opacity: 1; transform: translateY(0); } }
        .pf-glitch { position: relative; display: inline-block; }
        .pf-glitch::before { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; color: var(--rose); animation: pf-gl1 5s ease-in-out infinite; }
        .pf-glitch::after  { content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; color: var(--cyber); animation: pf-gl2 5s ease-in-out infinite; }
        @keyframes pf-gl1 { 0%,92%,100%{clip-path:none;transform:none;opacity:0;} 93%{clip-path:polygon(0 20%,100% 20%,100% 38%,0 38%);transform:translateX(-3px);opacity:0.8;} 96%{clip-path:polygon(0 55%,100% 55%,100% 72%,0 72%);transform:translateX(3px);opacity:0.7;} }
        @keyframes pf-gl2 { 0%,90%,100%{clip-path:none;transform:none;opacity:0;} 91%{clip-path:polygon(0 60%,100% 60%,100% 78%,0 78%);transform:translateX(2px);opacity:0.7;} 94%{clip-path:polygon(0 10%,100% 10%,100% 28%,0 28%);transform:translateX(-2px);opacity:0.6;} }
        .pf-tagline { font-family: 'Fraunces', serif; font-style: italic; font-weight: 300; font-size: clamp(1rem,2vw,1.25rem); color: var(--cream-dim); max-width: 34rem; line-height: 1.6; }
        .pf-projects-teaser { display: flex; align-items: center; gap: 1.5rem; margin-top: 1rem; flex-wrap: wrap; }
        .pf-projects-teaser-btn { font-family: 'IBM Plex Mono', monospace; font-size: 0.8rem; letter-spacing: 0.1em; padding: 0.75rem 1.5rem; border-radius: 6px; border: 1px solid rgba(194,163,108,0.3); color: var(--cream); background: none; cursor: inherit; transition: background 0.3s, border-color 0.3s; display: inline-flex; align-items: center; gap: 0.5rem; }
        .pf-projects-teaser-btn:hover { background: rgba(194,163,108,0.08); border-color: var(--gold); }
        .pf-projects-teaser-count { font-size: 0.75rem; color: var(--cream-dim); letter-spacing: 0.1em; }
      `}</style>

      <MatrixCanvas scrollY={scrollY} />
      <HexGrid scrollY={scrollY} />
      <ParallaxBlobs scrollY={scrollY} />
      <SectionTint scrollY={scrollY} />
      <ScrollProgress scrollY={scrollY} />
      <Cursor isHovering={false} />

      <Nav route="home" hover={hover} unhover={unhover} />
      <StatusBar />

      {/* ═══ HERO ═══ */}
      <section id="home" className="pf-hero" style={{ opacity: heroOpacity, transform: `translateY(${heroTranslate}px)`, willChange: 'transform, opacity' }}>
        <div className="pf-container pf-hero-container">
          <div className="pf-eyebrow">
            <span className="pf-eyebrow-dot" />
            ~/portfolio on main · status clean&nbsp;<span className="pf-blink">_</span>
          </div>
          <h1 className="pf-name">
            <span className="pf-word pf-glitch" data-text="hi," style={{ animationDelay: '0.15s' }}>hi,&nbsp;</span>
            <span className="pf-word" style={{ animationDelay: '0.27s' }}>  i'm&nbsp;</span>
            <span className="pf-word pf-word-accent" style={{ animationDelay: '0.39s', fontFamily: "'Great Vibes', cursive", fontSize: 'clamp(3.2rem,11vw,7.5rem)', letterSpacing: '0.02em', lineHeight: 1.0, padding: '0.1em 0.03em', display: 'inline-block' }}>Meghana</span>
          </h1>
          <p className="pf-tagline">
            3rd-year CS (AI) undergrad — building across{' '}
            <span style={{ color: 'var(--rose)' }}>ML</span>,{' '}
            <span style={{ color: 'var(--cyber)' }}>security</span> and the web,
            and writing about most of it here.
          </p>

          {/* Projects teaser — visible from hero */}
          <div className="pf-projects-teaser">
            <button
              className="pf-projects-teaser-btn"
              onMouseEnter={hover} onMouseLeave={unhover}
              onClick={() => navigate('projects')}
            >
              $ ls projects/ <span style={{ color: 'var(--gold)' }}>→</span>
            </button>
          </div>
        </div>
      </section>

      <div className="pf-container">
        <div className="pf-divider" />
      </div>

      {/* ═══ ABOUT ═══ */}
      <section id="about" className="pf-section">
        <div className="pf-container">
          <Reveal><span className="pf-section-label">// about</span></Reveal>
          <Reveal delay={0.08} from="left">
            <div className="pf-bio">
              <p>I'm Meghana.</p>
              <p>I'm an <span className="pf-highlight">AI undergraduate</span> who enjoys building <span className="pf-highlight">systems</span>, solving complex problems, and learning technologies that sit at the intersection of <span className="pf-highlight">intelligence</span>, <span className="pf-highlight">security</span>, and <span className="pf-highlight">scale</span>.</p>
              <p>I enjoy working at the intersection of <span className="pf-highlight">intelligence</span>, <span className="pf-highlight">problem-solving</span>, and <span className="pf-highlight">technology</span>. My interests are rooted in <span className="pf-highlight">AI</span> and <span className="pf-highlight">machine learning</span>, but I'm just as curious about the <span className="pf-highlight">systems</span> surrounding them—how they're built, how they're secured, and how they scale beyond a research paper and into the real world.</p>
              <p>Over the years, I've worked on <span className="pf-highlight">research projects</span>, <span className="pf-highlight">industry internships</span>, and <span className="pf-highlight">independent builds</span> that have strengthened both my technical skills and my ability to learn quickly in unfamiliar domains. I enjoy asking difficult questions, challenging assumptions, and understanding how systems behave beneath the surface rather than simply accepting that they work.</p>
              <p>Technology changes fast. Fortunately, <span className="pf-highlight">curiosity scales better than any framework</span>.</p>
              <p>I'm currently focused on deepening my expertise in <span className="pf-highlight">AI</span>, <span className="pf-highlight">cybersecurity</span>, and <span className="pf-highlight">large-scale software systems</span> while continuing to <span className="pf-highlight">build</span>, <span className="pf-highlight">experiment</span>, and <span className="pf-highlight">contribute</span> wherever I can create meaningful impact.</p>
            </div>
            <div className="pf-cyber-badge">
              <span className="pf-cyber-dot" /> AI · security · systems
            </div>
          </Reveal>

          {/* Timeline */}
          <div style={{ marginTop: '4rem' }}>
            <Reveal><span className="pf-section-label"># git log --journey</span></Reveal>
            <div className="pf-timeline" style={{ marginTop: '1.5rem' }}>
              {journey.map((entry, i) => (
                <Reveal key={entry.hash} delay={i * 0.07} className="pf-commit-wrap">
                  <div className="pf-commit">
                    <span className="pf-commit-dot" />
                    <div className="pf-commit-meta">
                      <span className="pf-hash">{entry.hash}</span>
                      <span className="pf-date">{entry.date}</span>
                    </div>
                    <h3 className="pf-commit-title">{entry.title}</h3>
                    {entry.org && <p className="pf-commit-org">{entry.org}</p>}
                    {entry.points && entry.points.length > 0 && (
                      <ul className="pf-commit-points">
                        {entry.points.map(p => <li key={p}>{p}</li>)}
                      </ul>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="pf-container">
        <div className="pf-divider" />
      </div>

      <div className="pf-container">
        <div className="pf-divider" />
      </div>

      {/* ═══ CONTACT ═══ */}
      <section id="contact" className="pf-section" style={{ textAlign: 'center' }}>
        <div className="pf-container">
          <Reveal><span className="pf-section-label">// contact</span></Reveal>
          <Reveal delay={0.1}>
            <p className="pf-bio" style={{ margin: '0 auto', maxWidth: '28rem', fontSize: 'clamp(1rem,1.8vw,1.25rem)' }}>
              Open to research collabs, interesting internships, and clever side projects.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
              <a href="mailto:meghanakotaru25@gmail.com" className="pf-contact-btn pf-contact-btn-rose" onMouseEnter={hover} onMouseLeave={unhover} target="_blank" rel="noopener noreferrer">✉ email</a>
              <a href="https://github.com/MeghanaKotharu25" className="pf-contact-btn pf-contact-btn-cyber" onMouseEnter={hover} onMouseLeave={unhover} target="_blank" rel="noopener noreferrer">⌥ github</a>
              <a href="https://www.linkedin.com/in/meghana-k-a65a25319/" className="pf-contact-btn pf-contact-btn-gold" onMouseEnter={hover} onMouseLeave={unhover} target="_blank" rel="noopener noreferrer">↗ linkedin</a>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="pf-footer">
        <div className="pf-container">
          <div>designed & built by <a href="#">meghana</a> · 2026</div>
          <div className="pf-footer-hex">0xM3GHANA · commit 7c19f02 → present</div>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ROOT — ROUTER
═══════════════════════════════════════════════════════ */
export default function Portfolio() {
  const route = useRoute();
  const scrollY = useScrollY();
  const [isHovering, setIsHovering] = useState(false);
  const hover = useCallback(() => setIsHovering(true), []);
  const unhover = useCallback(() => setIsHovering(false), []);

  if (route === 'projects') {
    return <ProjectsPage scrollY={scrollY} hover={hover} unhover={unhover} />;
  }
  return <HomePage scrollY={scrollY} hover={hover} unhover={unhover} />;
}
