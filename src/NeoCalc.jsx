import React, { useState, useEffect, useRef } from 'react';
import { evaluateExpression } from './utils/mathParser';
import './NeoCalc.css';

const NeoCalc = () => {
  // Read theme from localStorage or default to dark
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('neocalc_theme') || 'dark';
  });

  // Sound toggle (default to false)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('neocalc_sound') === 'true';
  });

  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [isScientific, setIsScientific] = useState(() => {
    return localStorage.getItem('neocalc_scientific') === 'true';
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('neocalc_history')) || [];
    } catch {
      return [];
    }
  });

  // Track copy feedback for individual items in history
  const [copiedIndex, setCopiedIndex] = useState(null);

  // References for automatic screen scrolling on content change
  const screenExprRef = useRef(null);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('neocalc_theme', theme);
  }, [theme]);

  // Keep screen scrolled to the end as user inputs
  useEffect(() => {
    if (screenExprRef.current) {
      screenExprRef.current.scrollLeft = screenExprRef.current.scrollWidth;
    }
  }, [input]);

  // Save scientific state
  useEffect(() => {
    localStorage.setItem('neocalc_scientific', isScientific.toString());
  }, [isScientific]);

  // Save sound state
  useEffect(() => {
    localStorage.setItem('neocalc_sound', soundEnabled.toString());
  }, [soundEnabled]);

  // Live Calculation Preview
  useEffect(() => {
    if (input.trim() === '') {
      setResult('');
      return;
    }

    let expr = input;
    // Clean up trailing operator patterns for safe live preview
    expr = expr.replace(/[+\-×÷^%]+$/, '');
    expr = expr.replace(/\($/, '');

    // Dynamically auto-close brackets for live evaluation preview
    let openCount = (expr.match(/\(/g) || []).length;
    let closeCount = (expr.match(/\)/g) || []).length;
    if (openCount > closeCount) {
      expr += ')'.repeat(openCount - closeCount);
    }

    if (expr.trim() === '') {
      setResult('');
      return;
    }

    const previewVal = evaluateExpression(expr);
    // Only display preview if it's a valid number and doesn't exactly match the current input
    if (previewVal !== 'Error' && previewVal !== input) {
      setResult(previewVal);
    } else {
      setResult('');
    }
  }, [input]);

  // Synthesis soft digital key click sound
  const playClickSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      // High-to-low pitch sweep for a snappy "tap" sound
      oscillator.frequency.setValueAtTime(650, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.06);

      gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.06);
    } catch (e) {
      console.warn('AudioContext not allowed or initialized:', e);
    }
  };

  const handleKeyClick = (val) => {
    playClickSound();

    if (val === 'C') {
      setInput('');
      setResult('');
    } else if (val === 'CE') {
      setInput((prev) => {
        // If we are deleting a scientific function e.g. "sin(", delete the whole name
        const match = prev.match(/(sin\(|cos\(|tan\(|log\(|ln\(|sqrt\(|abs\()$/);
        if (match) {
          return prev.slice(0, -match[1].length);
        }
        return prev.slice(0, -1);
      });
    } else if (val === '=') {
      if (input.trim() === '') return;
      const finalVal = evaluateExpression(input);
      if (finalVal !== 'Error') {
        // Save to history list
        const newItem = {
          id: Date.now(),
          expression: input,
          result: finalVal,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const updated = [newItem, ...history.slice(0, 29)]; // Save up to 30 items
        setHistory(updated);
        localStorage.setItem('neocalc_history', JSON.stringify(updated));

        setInput(finalVal);
        setResult('');
      } else {
        setResult('Error');
      }
    } else if (val === '±') {
      setInput((prev) => {
        if (prev === '') return '-';
        // Extract the last float or integer block at the end of input
        const match = prev.match(/(-?[0-9.]+)$/);
        if (match) {
          const lastNum = match[1];
          const start = prev.slice(0, prev.length - lastNum.length);
          if (lastNum.startsWith('-')) {
            return start + lastNum.slice(1);
          } else {
            return start + '-' + lastNum;
          }
        }
        // If not a number, toggle a trailing minus or add parenthesized negation
        if (prev.endsWith('-')) {
          return prev.slice(0, -1);
        }
        return prev + '-';
      });
    } else {
      // Append specific formatted string
      const sciFunctions = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs'];
      if (sciFunctions.includes(val)) {
        setInput((prev) => prev + val + '(');
      } else if (val === 'x²') {
        setInput((prev) => prev + '^2');
      } else if (val === '1/x') {
        setInput((prev) => prev + '1/(');
      } else {
        setInput((prev) => prev + val);
      }
    }
  };

  // Capture Global Keydown listeners
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ignore keys if user is typing in standard textareas or focus is elsewhere (none in this app except keys)
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && activeEl.type !== 'button') {
        return;
      }

      const key = e.key;

      if (/[0-9]/.test(key)) {
        e.preventDefault();
        handleKeyClick(key);
      } else if (key === '.') {
        e.preventDefault();
        handleKeyClick('.');
      } else if (key === '+') {
        e.preventDefault();
        handleKeyClick('+');
      } else if (key === '-') {
        e.preventDefault();
        handleKeyClick('-');
      } else if (key === '*') {
        e.preventDefault();
        handleKeyClick('×');
      } else if (key === '/') {
        e.preventDefault();
        handleKeyClick('÷');
      } else if (key === '%') {
        e.preventDefault();
        handleKeyClick('%');
      } else if (key === '^') {
        e.preventDefault();
        handleKeyClick('^');
      } else if (key === '(') {
        e.preventDefault();
        handleKeyClick('(');
      } else if (key === ')') {
        e.preventDefault();
        handleKeyClick(')');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleKeyClick('=');
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleKeyClick('CE');
      } else if (key === 'Escape') {
        e.preventDefault();
        handleKeyClick('C');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [input, history, soundEnabled]); // Rebind triggers on state change

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 1800);
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('neocalc_history');
  };

  const loadHistoryItem = (item) => {
    setInput(item.expression);
    setResult('');
    setIsHistoryOpen(false);
  };

  const standardKeys = [
    { value: 'C', type: 'clear' },
    { value: 'CE', type: 'backspace' },
    { value: '%', type: 'operator' },
    { value: '÷', type: 'operator' },
    
    { value: '7', type: 'number' },
    { value: '8', type: 'number' },
    { value: '9', type: 'number' },
    { value: '×', type: 'operator' },
    
    { value: '4', type: 'number' },
    { value: '5', type: 'number' },
    { value: '6', type: 'number' },
    { value: '-', type: 'operator' },
    
    { value: '1', type: 'number' },
    { value: '2', type: 'number' },
    { value: '3', type: 'number' },
    { value: '+', type: 'operator' },
    
    { value: '±', type: 'number' },
    { value: '0', type: 'number' },
    { value: '.', type: 'number' },
    { value: '=', type: 'equals' }
  ];

  const scientificKeys = [
    { value: 'sin', type: 'scientific-key' },
    { value: 'cos', type: 'scientific-key' },
    { value: 'C', type: 'clear' },
    { value: 'CE', type: 'backspace' },
    { value: '%', type: 'operator' },
    { value: '÷', type: 'operator' },
    
    { value: 'tan', type: 'scientific-key' },
    { value: 'log', type: 'scientific-key' },
    { value: '7', type: 'number' },
    { value: '8', type: 'number' },
    { value: '9', type: 'number' },
    { value: '×', type: 'operator' },
    
    { value: 'ln', type: 'scientific-key' },
    { value: 'sqrt', type: 'scientific-key' },
    { value: '4', type: 'number' },
    { value: '5', type: 'number' },
    { value: '6', type: 'number' },
    { value: '-', type: 'operator' },
    
    { value: 'π', type: 'scientific-key' },
    { value: 'e', type: 'scientific-key' },
    { value: '1', type: 'number' },
    { value: '2', type: 'number' },
    { value: '3', type: 'number' },
    { value: '+', type: 'operator' },
    
    { value: '^', type: 'scientific-key' },
    { value: 'abs', type: 'scientific-key' },
    { value: '(', type: 'scientific-key' },
    { value: ')', type: 'scientific-key' },
    { value: '±', type: 'number' },
    { value: '0', type: 'number' },
    
    { value: 'x²', type: 'scientific-key' },
    { value: '1/x', type: 'scientific-key' },
    { value: '.', type: 'number' },
    { value: '=', type: 'equals', gridSpan: 3 }
  ];

  const keys = isScientific ? scientificKeys : standardKeys;

  return (
    <div className={`calculator-container ${isScientific ? 'scientific' : ''}`}>
      {/* Header section with toggle buttons */}
      <div className="calc-header">
        <h1 className="calc-title" id="main-title">
          <span>🧮</span> NeoCalc
        </h1>
        <div className="calc-controls">
          {/* Scientific Mode Toggle */}
          <button
            className={`icon-btn ${isScientific ? 'active' : ''}`}
            onClick={() => setIsScientific(!isScientific)}
            title="Toggle Scientific Mode"
            aria-label="Toggle Scientific Mode"
          >
            {isScientific ? 'Std' : 'Sci'}
          </button>

          {/* Audio Sound FX Toggle */}
          <button
            className={`icon-btn ${soundEnabled ? 'active' : ''}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
            title="Toggle Sound Effects"
            aria-label="Toggle Sound Effects"
          >
            {soundEnabled ? (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.536 14.01A8.473 8.473 0 0 0 14.02 12c.787-.756 1.48-1.61 2.062-2.538l-1.07-.639A7.478 7.478 0 0 1 13 11a7.48 7.48 0 0 1-2.02-3.18l-1.069.639c.607 1.015 1.393 1.91 2.3 2.651a7.482 7.482 0 0 1-2.207 1.9l.608 1.01Zm-3.18-12.83c-.347.1-.645.297-.887.58L4.01 5.34H1.5A1.5 1.5 0 0 0 0 6.84v2.32A1.5 1.5 0 0 0 1.5 10.66h2.51l3.46 3.59c.242.283.54.48.887.58a1.455 1.455 0 0 0 1.643-1.427V2.607A1.455 1.455 0 0 0 8.356 1.18Zm.644 1.427v10.786a.455.455 0 0 1-.513.447c-.108-.031-.202-.093-.278-.182L4.545 9.94H1.5a.5.5 0 0 1-.5-.5V6.84a.5.5 0 0 1 .5-.5h3.045l3.664-3.8c.076-.089.17-.15.278-.182a.455.455 0 0 1 .513.447Z"/>
              </svg>
            ) : (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06ZM6 4.712 4.313 6.062a.5.5 0 0 1-.312.11H2v3.66h2a.5.5 0 0 1 .312.11L6 11.288V4.712Zm6.427 1.123L11.13 7.13 9.833 5.835l-.707.707 1.298 1.298-1.298 1.297.707.707 1.297-1.298 1.298 1.298.707-.707-1.298-1.297 1.298-1.298-.707-.707Z"/>
              </svg>
            )}
          </button>

          {/* Theme Switcher */}
          <button
            className="icon-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0Zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13Zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5ZM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5ZM13.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0Zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0Zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707ZM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708Z"/>
              </svg>
            ) : (
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278ZM4.858 1.311A7.269 7.269 0 0 0 1.025 7.71c0 4.02 3.279 7.276 7.319 7.276a7.316 7.316 0 0 0 5.201-2.162 7.533 7.533 0 0 1-.844.055 7.33 7.33 0 0 1-7.319-7.276 7.325 7.325 0 0 1 1.319-4.148c-.563-.186-1.15-.29-1.763-.29-.27 0-.535.02-.796.06Z"/>
              </svg>
            )}
          </button>

          {/* Calculations History Toggle */}
          <button
            className={`icon-btn ${isHistoryOpen ? 'active' : ''}`}
            onClick={() => setIsHistoryOpen(true)}
            title="View History"
            aria-label="View History"
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8.515 1.019A7 7 0 1 0 15 8h-1.5a5.5 5.5 0 1 1-5.097-5.467L9.58 3.65a.25.25 0 0 0 .38-.033l1.82-2.355a.25.25 0 0 0-.033-.35L9.39.082a.25.25 0 0 0-.35.033L8.515 1.02Zm2.513 4.112a.5.5 0 0 0-.707-.707l-3 3a.5.5 0 0 0 0 .707l2 2a.5.5 0 0 0 .708-.708L8.707 8l2.32-2.869Z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Screen Display */}
      <div className="calc-screen">
        <div className="screen-expression" ref={screenExprRef}>
          {input || '0'}
        </div>
        <div className={`screen-result ${result ? '' : 'final'}`}>
          {result ? `= ${result}` : ''}
        </div>
      </div>

      {/* Mobile Scientific Helper Panel (displayed only on mobile/narrow layouts) */}
      {isScientific && (
        <div className="sci-layout-mobile">
          {['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'π', 'e', '(', ')', '^', 'abs'].map((key) => (
            <button
              key={key}
              className="calc-key scientific-key"
              onClick={() => handleKeyClick(key)}
            >
              {key}
            </button>
          ))}
        </div>
      )}

      {/* Keyboard Grid */}
      <div className="calc-grid">
        {keys.map((key, index) => {
          const style = key.gridSpan ? { gridColumn: `span ${key.gridSpan}` } : {};
          return (
            <button
              key={`${key.value}-${index}`}
              className={`calc-key ${key.type}`}
              style={style}
              onClick={() => handleKeyClick(key.value)}
            >
              {key.type === 'backspace' ? (
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5.83 5.146a.5.5 0 0 0 0 .708L7.975 8l-2.147 2.146a.5.5 0 0 0 .707.708l2.147-2.147 2.146 2.147a.5.5 0 0 0 .707-.708L9.39 8l2.146-2.146a.5.5 0 0 0-.707-.708L8.683 7.293 6.536 5.146a.5.5 0 0 0-.707 0z"/>
                  <path d="M13.683 1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7.08a2 2 0 0 1-1.519-.698L.241 8.65a1 1 0 0 1 0-1.302L5.084 1.7A2 2 0 0 1 6.603 1h7.08zm-7.08 1a1 1 0 0 0-.76.35L1 8l4.844 5.65a1 1 0 0 0 .759.35h7.08a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1h-7.08z"/>
                </svg>
              ) : (
                key.value
              )}
            </button>
          );
        })}
      </div>

      {/* History Drawer */}
      <div className={`history-drawer ${isHistoryOpen ? 'open' : ''}`}>
        <div className="history-header">
          <h3>History</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {history.length > 0 && (
              <button
                className="icon-btn"
                onClick={clearHistory}
                title="Clear History"
                style={{ border: 'none', background: 'transparent' }}
              >
                <svg width="15" height="15" fill="hsl(var(--accent-danger))" viewBox="0 0 16 16">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                </svg>
              </button>
            )}
            <button
              className="icon-btn"
              onClick={() => setIsHistoryOpen(false)}
              title="Close Panel"
              style={{ border: 'none', background: 'transparent' }}
            >
              <svg width="15" height="15" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="history-list">
          {history.length === 0 ? (
            <div className="history-empty">No calculations yet</div>
          ) : (
            history.map((item, index) => (
              <div 
                key={item.id} 
                className="history-item"
                onClick={() => loadHistoryItem(item)}
                title="Click to load back to screen"
              >
                <div className="history-expr">{item.expression}</div>
                <div className="history-res-row" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="history-copy-btn"
                    onClick={() => copyToClipboard(item.result, index)}
                  >
                    {copiedIndex === index ? 'Copied ✓' : 'Copy'}
                  </button>
                  <div className="history-res">= {item.result}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NeoCalc;
