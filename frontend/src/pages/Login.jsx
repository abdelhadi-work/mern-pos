import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Eye, EyeOff, User, Lock, Zap, ShoppingCart, Loader2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/global.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [spiders, setSpiders] = useState([]);
  const { login } = useAuth();

  // Optimized particles - FEWER for better performance
  const [particles, setParticles] = useState([]);
  const animationFrameRef = useRef(null);
  const timeRef = useRef(0);

  useMemo(() => {
    const initialParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      baseX: Math.random() * 100,
      baseY: Math.random() * 100,
      currentX: Math.random() * 100,
      currentY: Math.random() * 100,
      size: Math.random() * 5 + 3, // 3-8px
      speedX: (Math.random() - 0.5) * 0.08,
      speedY: (Math.random() - 0.5) * 0.08,
      angle: Math.random() * Math.PI * 2,
      orbitSpeed: (Math.random() - 0.5) * 0.02,
      delay: Math.random() * 2,
    }));
    setParticles(initialParticles);
  }, []);

  // OPTIMIZED AUTONOMOUS MOVEMENT - Throttled to 30fps for performance
  useEffect(() => {
    let lastUpdate = 0;
    const targetFPS = 30; // Reduced from 60fps
    const frameInterval = 1000 / targetFPS;
    
    const animate = (timestamp) => {
      if (timestamp - lastUpdate < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      lastUpdate = timestamp;
      timeRef.current += 0.033; // ~30fps
      
      setParticles(prevParticles =>
        prevParticles.map(particle => {
          // Simplified movement calculation
          const orbitX = Math.cos(timeRef.current * particle.orbitSpeed + particle.angle) * 2;
          const orbitY = Math.sin(timeRef.current * particle.orbitSpeed + particle.angle) * 2;
          
          let newBaseX = particle.baseX + particle.speedX;
          let newBaseY = particle.baseY + particle.speedY;
          
          // Bounce off edges
          if (newBaseX < 0 || newBaseX > 100) particle.speedX *= -1;
          if (newBaseY < 0 || newBaseY > 100) particle.speedY *= -1;
          
          newBaseX = Math.max(0, Math.min(100, newBaseX));
          newBaseY = Math.max(0, Math.min(100, newBaseY));
          
          return {
            ...particle,
            baseX: newBaseX,
            baseY: newBaseY,
            currentX: particle.currentX + (newBaseX + orbitX - particle.currentX) * 0.05,
            currentY: particle.currentY + (newBaseY + orbitY - particle.currentY) * 0.05,
          };
        })
      );
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Optimized currency symbols - FEWER for performance
  const currencySymbols = useMemo(() => {
    const symbols = ['$', '€', '£', '¥'];
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      x: Math.random() * 100,
      y: 100 + Math.random() * 20,
      delay: Math.random() * 8,
      duration: 12 + Math.random() * 8,
      size: 28 + Math.random() * 12,
    }));
  }, []);

  // Generate spiders that walk across the screen
  useEffect(() => {
    const spawnSpider = () => {
      const isLeftToRight = Math.random() > 0.5;
      const newSpider = {
        id: Date.now() + Math.random(),
        startX: isLeftToRight ? -50 : window.innerWidth + 50,
        startY: Math.random() * window.innerHeight,
        endX: isLeftToRight ? window.innerWidth + 50 : -50,
        endY: Math.random() * window.innerHeight,
        duration: 10 + Math.random() * 5,
        size: 25 + Math.random() * 15,
        clicked: false,
      };
      
      setSpiders(prev => [...prev, newSpider]);
      
      // Remove spider after animation completes
      setTimeout(() => {
        setSpiders(prev => prev.filter(s => s.id !== newSpider.id));
      }, (newSpider.duration + 1) * 1000);
    };

    // Spawn first spider immediately
    spawnSpider();
    
    // Spawn another spider after 2 seconds
    const secondSpider = setTimeout(spawnSpider, 2000);
    
    // Spawn new spider every 8-15 seconds
    const spiderInterval = setInterval(() => {
      spawnSpider();
    }, 8000 + Math.random() * 7000);

    return () => {
      clearTimeout(secondSpider);
      clearInterval(spiderInterval);
    };
  }, []);

  // Handle spider click
  const handleSpiderClick = (spiderId) => {
    setSpiders(prevSpiders =>
      prevSpiders.map(spider =>
        spider.id === spiderId
          ? { ...spider, clicked: true }
          : spider
      )
    );

    // Remove glow effect after 2 seconds
    setTimeout(() => {
      setSpiders(prevSpiders =>
        prevSpiders.map(spider =>
          spider.id === spiderId
            ? { ...spider, clicked: false }
            : spider
        )
      );
    }, 2000);
  };

  // Simple mouse tracking with basic repulsion
  const handleMouseMove = (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    setMousePos({ x: mouseX, y: mouseY });

    // Simple particle repulsion
    setParticles(prevParticles => 
      prevParticles.map(particle => {
        const particleScreenX = (particle.currentX / 100) * window.innerWidth;
        const particleScreenY = (particle.currentY / 100) * window.innerHeight;
        
        const dx = particleScreenX - mouseX;
        const dy = particleScreenY - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const repulsionRadius = 200;
        
        if (distance < repulsionRadius && distance > 0) {
          const force = Math.pow((repulsionRadius - distance) / repulsionRadius, 2);
          const angle = Math.atan2(dy, dx);
          const pushStrength = 30;
          
          const pushX = Math.cos(angle) * force * pushStrength;
          const pushY = Math.sin(angle) * force * pushStrength;
          
          return {
            ...particle,
            currentX: particle.currentX + (pushX / window.innerWidth) * 100,
            currentY: particle.currentY + (pushY / window.innerHeight) * 100,
          };
        }
        
        return particle;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login({ username, password });
    
    if (!result.success) {
      setError(result.message);
      setLoading(false);
    } else {
      // Show success animation with confetti
      setLoading(false);
      setShowSuccess(true);
    }
  };

  return (
    <div className="login-container" onMouseMove={handleMouseMove}>
      {/* Success Celebration with Confetti - Optimized */}
      {showSuccess && (
        <div className="login-success-overlay">
          <div className="confetti-container">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  '--delay': `${Math.random() * 0.3}s`,
                  '--x': `${Math.random() * 100}vw`,
                  '--rotation': `${Math.random() * 360}deg`,
                  '--color': ['#10b981', '#3b82f6', '#f59e0b'][Math.floor(Math.random() * 3)],
                }}
              />
            ))}
          </div>
          <div className="success-celebration">
            <div className="success-checkmark-bounce">
              <Check size={56} strokeWidth={4} />
            </div>
            <div className="success-message-slide">
              <h2>Welcome back!</h2>
              <p>Loading your workspace...</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Transaction Particles Background */}
      <div className="login-bg-decoration">
        {/* Particle Network */}
        <svg className="particle-canvas" width="100%" height="100%">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <radialGradient id="particleGradient">
              <stop offset="0%" stopColor="rgba(226, 232, 240, 1)" />
              <stop offset="50%" stopColor="rgba(203, 213, 225, 0.95)" />
              <stop offset="100%" stopColor="rgba(148, 163, 184, 0.8)" />
            </radialGradient>
          </defs>
          
          {/* Connection Lines */}
          {particles.map((p1, i) => 
            particles.slice(i + 1).map((p2, j) => {
              const distance = Math.sqrt(Math.pow(p1.currentX - p2.currentX, 2) + Math.pow(p1.currentY - p2.currentY, 2));
              if (distance < 15) {
                return (
                  <line
                    key={`line-${i}-${j}`}
                    x1={`${p1.currentX}%`}
                    y1={`${p1.currentY}%`}
                    x2={`${p2.currentX}%`}
                    y2={`${p2.currentY}%`}
                    stroke="rgba(203, 213, 225, 0.15)"
                    strokeWidth="1"
                    className="particle-line"
                  />
                );
              }
              return null;
            })
          )}
          
          {/* Simple Particles */}
          {particles.map((particle) => (
            <circle
              key={particle.id}
              className="floating-particle"
              cx={`${particle.currentX}%`}
              cy={`${particle.currentY}%`}
              r={particle.size}
              fill="rgba(203, 213, 225, 0.7)"
              filter="url(#glow)"
            />
          ))}
        </svg>

        {/* Currency Symbols */}
        {currencySymbols.map((symbol) => (
          <div
            key={symbol.id}
            className="currency-symbol"
            style={{
              left: `${symbol.x}%`,
              top: `${symbol.y}%`,
              animationDelay: `${symbol.delay}s`,
              animationDuration: `${symbol.duration}s`,
              fontSize: `${symbol.size}px`,
            }}
          >
            {symbol.symbol}
          </div>
        ))}

        <div className="particle-overlay"></div>
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>

        {/* Walking Spiders */}
        {spiders.map((spider) => (
          <div
            key={spider.id}
            className={`spider ${spider.clicked ? 'spider-clicked' : ''}`}
            style={{
              '--start-x': `${spider.startX}px`,
              '--start-y': `${spider.startY}px`,
              '--end-x': `${spider.endX}px`,
              '--end-y': `${spider.endY}px`,
              '--duration': `${spider.duration}s`,
              '--size': `${spider.size}px`,
              left: `${spider.startX}px`,
              top: `${spider.startY}px`,
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
            onClick={() => handleSpiderClick(spider.id)}
          >
            <div className="spider-body">
              <div className="spider-head"></div>
              <div className="spider-abdomen"></div>
            </div>
            <div className="spider-legs">
              <div className="leg leg-1"></div>
              <div className="leg leg-2"></div>
              <div className="leg leg-3"></div>
              <div className="leg leg-4"></div>
              <div className="leg leg-5"></div>
              <div className="leg leg-6"></div>
              <div className="leg leg-7"></div>
              <div className="leg leg-8"></div>
            </div>
          </div>
        ))}
      </div>

      <div className={`login-card ${showSuccess ? 'login-card-fadeout' : ''}`}>
        {/* Logo Section */}
        <div className="login-logo-container">
          <div className="login-logo-icon">
            <ShoppingCart size={40} />
          </div>
          <div className="login-logo-pulse"></div>
        </div>

        {/* Header */}
        <div className="login-header">
          <h1 className="login-logo">Electronics POS</h1>
          <p className="login-subtitle">Welcome back! Please sign in to continue</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠</span>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">
              <User size={16} />
              <span>Username</span>
            </label>
            <div className="input-wrapper">
              <input
                type="text"
                className="form-input login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
              <div className="input-border"></div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={16} />
              <span>Password</span>
            </label>
            <div className="input-wrapper">
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="input-border"></div>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={20} className="spinner" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <Zap size={20} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

      </div>

      {/* Footer */}
      <div className="login-footer">
        <p>© 2025 Electronics POS. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Login;