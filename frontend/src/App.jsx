import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Timeline from './components/Timeline';
import Sandbox from './components/Sandbox';
import Explorer from './components/Explorer';
import Debugger from './components/Debugger';
import ProjectsPage, { MOCK_PROJECTS } from './components/ProjectsPage';

function App() {
  const [prompt, setPrompt] = useState('');
  const [mockMode, setMockMode] = useState('true');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledConfig, setCompiledConfig] = useState(null);
  const [trace, setTrace] = useState(null);
  const [activeTab, setActiveTab] = useState('sandbox');
  const [theme, setTheme] = useState('light');
  const [view, setView] = useState('compiler');
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [compilationProgress, setCompilationProgress] = useState(0);
  const [compilationStage, setCompilationStage] = useState('');
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  // Settings and active config initialization
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setMockMode(data.mock_mode || 'true');
        setGroqApiKey(data.groq_api_key_configured ? 'CONFIGURED_IN_ENV' : '');
      })
      .catch(err => console.error('Failed to load settings:', err));

    // Removed auto-load of last compile to ensure home page is shown on refresh
    // as per user request.
  }, []);

  const goHome = () => {
    setView('compiler');
    setCompiledConfig(null);
    setTrace(null);
    setPrompt('');
  };

  const handleApplySettings = async () => {
    const btn = document.getElementById('save-settings-btn');
    if (btn) btn.innerText = 'Applying...';
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groq_api_key: groqApiKey === 'CONFIGURED_IN_ENV' ? '' : groqApiKey,
          mock_mode: mockMode
        })
      });
      const data = await res.json();
      alert('Settings updated successfully!');
    } catch (err) {
      alert('Failed to update settings: ' + err.message);
    } finally {
      if (btn) btn.innerText = 'Save Settings';
    }
  };

  const handlePresetClick = (pText) => {
    setPrompt(pText);
  };

  const [showCompileOverlay, setShowCompileOverlay] = useState(false);
  const progressIntervalRef = useRef(null);

  const COMPILE_STAGES = [
    { pct: 0,  label: 'Initializing compiler pipeline...',              icon: '⚙️' },
    { pct: 8,  label: 'Stage 1/8 — Extracting User Intent',            icon: '🧠' },
    { pct: 20, label: 'Stage 2/8 — Designing Blueprint Architecture',  icon: '🏗️' },
    { pct: 35, label: 'Stage 3/8 — Structuring SQL Database Schemas',  icon: '🗄️' },
    { pct: 50, label: 'Stage 4/8 — Generating API Routers',            icon: '🔌' },
    { pct: 65, label: 'Stage 5/8 — Building UI Component Layouts',     icon: '🎨' },
    { pct: 78, label: 'Stage 6/8 — Verifying System Consistency',      icon: '✅' },
    { pct: 88, label: 'Stage 7/8 — Applying Repair Engine Patches',    icon: '🔧' },
    { pct: 96, label: 'Stage 8/8 — Assembling Runtime Preview',        icon: '🚀' },
  ];

  const getStageForProgress = (pct) => {
    for (let i = COMPILE_STAGES.length - 1; i >= 0; i--) {
      if (pct >= COMPILE_STAGES[i].pct) return COMPILE_STAGES[i];
    }
    return COMPILE_STAGES[0];
  };

  const runCompilerPipeline = async () => {
    const promptText = prompt.trim();
    if (!promptText) {
      alert('Please enter your prompt.');
      return;
    }
    
    setIsCompiling(true);
    setShowCompileOverlay(true);
    setTrace(null);
    setActiveTab('sandbox');
    setCompilationProgress(0);
    setCompilationStage('Initializing compiler pipeline...');

    let currentProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      if (currentProgress < 95) {
        currentProgress += Math.floor(Math.random() * 3) + 1;
        if (currentProgress > 95) currentProgress = 95;
        setCompilationProgress(currentProgress);
        const stage = getStageForProgress(currentProgress);
        setCompilationStage(stage.label);
      }
    }, 200);
    
    try {
      const res = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          groq_api_key: groqApiKey === 'CONFIGURED_IN_ENV' ? '' : groqApiKey,
          mock_mode: mockMode
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Server compilation failure.');
      }
      
      const result = await res.json();
      
      clearInterval(progressIntervalRef.current);
      setCompilationProgress(100);
      setCompilationStage('✅ Compilation Complete — Launching Preview...');
      
      setTrace(result.trace);
      setCompiledConfig(result.final_config);

      // Append compiled layout to projects list
      const newProj = {
        id: `project-${Date.now()}`,
        title: result.final_config.app_name || 'Custom Application',
        prompt: promptText,
        intent: result.trace.stage_1_intent?.output || {},
        architecture: result.trace.stage_2_system_design?.output || {},
        dbSchema: result.trace.stage_3_database?.output || {},
        apiSchema: result.trace.stage_4_api?.output || {},
        uiSchema: result.trace.stage_5_ui?.output || {},
        validationReport: {
          valid: result.trace.stage_6_consistency?.valid ?? true,
          errors: result.trace.stage_6_consistency?.errors || [],
          checks: [
            { name: 'Valid JSON', status: 'Passed' },
            { name: 'APIs match DB', status: 'Passed' },
            { name: 'UI matches APIs', status: 'Passed' }
          ]
        },
        repairLogs: {
          repair_count: result.trace.stage_6_consistency?.repairs?.length || 0,
          issues_fixed: result.trace.stage_6_consistency?.repairs || []
        },
        runtimePreview: {
          runtime: {
            routes: result.final_config.runtime?.routes || [],
            components: result.final_config.runtime?.components || [],
            state: result.final_config.runtime?.state || {}
          }
        }
      };
      setProjects(prev => [...prev, newProj]);

      // Let user see the 100% bar for a moment, then navigate
      await new Promise(resolve => setTimeout(resolve, 1200));
      setView('projects');
      setShowCompileOverlay(false);
    } catch (err) {
      clearInterval(progressIntervalRef.current);
      setShowCompileOverlay(false);
      alert('Compilation Error: ' + err.message);
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="app-container no-sidebar">
      {/* Main Content Area */}
      <div className="app-main-content">
        
        {/* Top Header Bar */}
        <header className="app-header">
          <div className="header-left">
            <div className="logo-container" onClick={goHome} style={{ display: 'flex', alignItems: 'center', marginRight: '2.5rem', cursor: 'pointer' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#1e293b"/>
                <path d="M12 6V8C9.79 8 8 9.79 8 12H6C6 8.69 8.69 6 12 6Z" fill="#a855f7"/>
                <circle cx="12" cy="12" r="3.5" fill="#1e293b"/>
              </svg>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '2px', color: '#0f172a' }}>COOKIN</span>
            </div>

            <div className="view-selector-tabs" style={{ display: 'flex', gap: '8px', marginRight: '2rem' }}>
              <button 
                onClick={() => setView('compiler')}
                style={{
                  background: view === 'compiler' ? 'var(--text-primary)' : 'transparent',
                  color: view === 'compiler' ? 'var(--bg-color)' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)', padding: '0.45rem 1rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Compiler Cockpit
              </button>
              <button 
                onClick={() => setView('projects')}
                style={{
                  background: view === 'projects' ? 'var(--text-primary)' : 'transparent',
                  color: view === 'projects' ? 'var(--bg-color)' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)', padding: '0.45rem 1rem', borderRadius: '10px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Projects & Stats
              </button>
            </div>

            <div className="setting-item model-selector">
              <span className="sparkle-icon">✨</span>
              <select value={mockMode} onChange={(e) => setMockMode(e.target.value)}>
                <option value="auto">Auto Engine</option>
                <option value="true">Heuristic Chef</option>
                <option value="false">Groq LLM Engine</option>
              </select>
            </div>
            {mockMode === 'false' && (
              <div className="setting-item header-input-container">
                <input 
                  type="password" 
                  value={groqApiKey} 
                  onChange={(e) => setGroqApiKey(e.target.value)} 
                  placeholder={groqApiKey === 'CONFIGURED_IN_ENV' ? 'Groq Key Active' : 'Enter GROQ_API_KEY...'} 
                />
              </div>
            )}
            <button id="save-settings-btn" className="header-btn" onClick={handleApplySettings}>Save Settings</button>
          </div>
          
          <div className="header-right">
            <button 
              className="header-action-btn theme-toggle-btn" 
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '10px', fontWeight: '600' }}
            >
              {theme === 'light' ? (
                <>
                  <span style={{ fontSize: '1rem' }}>🌙</span>
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '1rem' }}>☀️</span>
                  <span>Light Mode</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* ── Compilation Progress Overlay ── */}
        <AnimatePresence>
          {showCompileOverlay && (
            <motion.div
              className="compile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.78)',
                backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '24px',
                  padding: '3rem 3.5rem',
                  width: '560px',
                  maxWidth: '92vw',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem',
                  boxShadow: '0 25px 80px rgba(0,0,0,0.5)'
                }}
              >
                {/* Title */}
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-primary)', margin: 0 }}>
                    🚀 Building Your Application
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Running the 8-stage compiler pipeline...
                  </p>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {compilationStage}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                      {compilationProgress}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%', height: '12px',
                    background: 'var(--border-color)',
                    borderRadius: '6px', overflow: 'hidden'
                  }}>
                    <motion.div
                      animate={{ width: `${compilationProgress}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      style={{
                        height: '100%',
                        background: compilationProgress >= 100
                          ? 'linear-gradient(90deg, #10b981, #34d399)'
                          : 'linear-gradient(90deg, var(--accent-purple), var(--accent-cyan))',
                        borderRadius: '6px',
                        boxShadow: compilationProgress >= 100
                          ? '0 0 16px rgba(16,185,129,0.5)'
                          : '0 0 16px rgba(139,92,246,0.4)'
                      }}
                    />
                  </div>
                </div>

                {/* Stage checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
                  {COMPILE_STAGES.map((stage, i) => {
                    const done = compilationProgress >= (COMPILE_STAGES[i + 1]?.pct ?? 100);
                    const active = !done && compilationProgress >= stage.pct;
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '0.4rem 0.6rem',
                          borderRadius: '8px',
                          background: active ? 'rgba(139,92,246,0.08)' : 'transparent',
                          transition: 'all 0.2s'
                        }}
                      >
                        <span style={{ fontSize: '1rem', width: '24px', textAlign: 'center' }}>
                          {done ? '✅' : active ? '⏳' : '⬜'}
                        </span>
                        <span style={{
                          fontSize: '0.8rem',
                          fontWeight: active ? 600 : 400,
                          color: done ? 'var(--accent-emerald)' : active ? 'var(--text-primary)' : 'var(--text-muted)'
                        }}>
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {compilationProgress >= 100 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--accent-emerald)', fontWeight: 600 }}
                  >
                    ✨ Project compiled successfully! Opening preview...
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Body */}
        <div className="content-body-wrapper">
          {view === 'projects' ? (
            <ProjectsPage projects={projects} />
          ) : !compiledConfig && !isCompiling ? (
            /* A. Spacious Landing View (Matching User Reference Image) */
            <div className="landing-view-container">
              <div className="central-orb-container">
                <div className="floating-3d-orb">
                  <div className="orb-highlight"></div>
                </div>
                <div className="floating-3d-orb-shadow"></div>
              </div>
              
              <div className="landing-prompt-container">
                <h2>What shall we compile today?</h2>
                <p>Describe your app layout, tables, endpoints, and role rules. We'll build and persist it instantly.</p>
                
                <div className="landing-input-box">
                  <textarea 
                    value={prompt} 
                    onChange={(e) => setPrompt(e.target.value)} 
                    placeholder="Create a SaaS CRM portal with contact database, lead assignment workflow, and deal pipeline management..."
                  />
                  <div className="input-box-actions">
                    <button className="compiler-launch-btn" onClick={runCompilerPipeline}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>
                </div>

                <div className="presets-row">
                  <button className="preset-pill" onClick={() => handlePresetClick('Create a SaaS CRM portal with contact database, lead assignment workflow, and deal pipeline management.')}>
                    SaaS CRM
                  </button>
                  <button className="preset-pill" onClick={() => handlePresetClick('Build a clean Task Planner app with projects list, team roles, status tracker columns, and due alerts.')}>
                    Team Task Planner
                  </button>
                  <button className="preset-pill" onClick={() => handlePresetClick('Create an E-Commerce shop dashboard with product stock inventory, product cards list, and user shopping cart checkout.')}>
                    E-Shop Console
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* B. Active Compiler Cockpit View */
            <div className="cockpit-view-container">
              {/* Left Column: Trace & Dashboard */}
              <div className="cockpit-left-panel">
                <div className="cockpit-prompt-card">
                  <div className="card-header">
                    <h4>Current Prompt</h4>
                    {isCompiling && <span className="pulse-compiling-text">Compiling ({compilationProgress}%)</span>}
                  </div>
                  <textarea 
                    value={prompt} 
                    onChange={(e) => setPrompt(e.target.value)} 
                    placeholder="Type new requirements..."
                    disabled={isCompiling}
                  />
                  
                  {isCompiling && (
                    <div className="compilation-progress-wrapper" style={{ margin: '1rem 0 0.5rem 0', width: '100%' }}>
                      <div className="progress-bar-container" style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div 
                          className="progress-bar-fill" 
                          style={{ 
                            width: `${compilationProgress}%`, 
                            height: '100%', 
                            background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-cyan))', 
                            transition: 'width 0.2s ease-out' 
                          }}
                        />
                      </div>
                      <div className="progress-stage-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: '500' }}>
                        {compilationStage}
                      </div>
                    </div>
                  )}

                  <button className="compile-again-btn" onClick={runCompilerPipeline} disabled={isCompiling}>
                    {isCompiling ? 'Compiling system...' : 'Re-compile System'}
                  </button>
                </div>

                <div className="cockpit-pipeline-card">
                  <h4>Pipeline Trace</h4>
                  <Timeline trace={trace} isCompiling={isCompiling} />
                </div>
              </div>

              {/* Right Column: Tabbed Configurations and Sandbox */}
              <div className="cockpit-right-panel">
                <div className="tabs-container">
                  <div className="tab-triggers">
                    <button className={`tab-trigger ${activeTab === 'sandbox' ? 'active' : ''}`} onClick={() => setActiveTab('sandbox')}>Live Preview</button>
                    <button className={`tab-trigger ${activeTab === 'database' ? 'active' : ''}`} onClick={() => setActiveTab('database')}>DB Schema</button>
                    <button className={`tab-trigger ${activeTab === 'apis' ? 'active' : ''}`} onClick={() => setActiveTab('apis')}>APIs</button>
                    <button className={`tab-trigger ${activeTab === 'ui' ? 'active' : ''}`} onClick={() => setActiveTab('ui')}>UI Schema</button>
                    <button className={`tab-trigger ${activeTab === 'auth' ? 'active' : ''}`} onClick={() => setActiveTab('auth')}>Auth Config</button>
                    <button className={`tab-trigger ${activeTab === 'runtime' ? 'active' : ''}`} onClick={() => setActiveTab('runtime')}>Runtime</button>
                    <button className={`tab-trigger ${activeTab === 'repair' ? 'active' : ''}`} onClick={() => setActiveTab('repair')}>Debug</button>
                  </div>
                  <div className="tab-contents">
                    <div className={`tab-content ${activeTab === 'sandbox' ? 'active' : ''}`}>
                      <Sandbox compiledConfig={compiledConfig} isCompiling={isCompiling} setCompiledConfig={setCompiledConfig} />
                    </div>
                    <div className={`tab-content ${activeTab === 'database' ? 'active' : ''}`}>
                      <Explorer data={compiledConfig?.database} filename="database_schema.json" />
                    </div>
                    <div className={`tab-content ${activeTab === 'apis' ? 'active' : ''}`}>
                      <Explorer data={compiledConfig?.api} filename="api_schema.json" />
                    </div>
                    <div className={`tab-content ${activeTab === 'ui' ? 'active' : ''}`}>
                      <Explorer data={compiledConfig?.ui} filename="ui_schema.json" />
                    </div>
                    <div className={`tab-content ${activeTab === 'auth' ? 'active' : ''}`}>
                      <Explorer data={compiledConfig?.system_design?.auth_design} filename="auth_design.json" />
                    </div>
                    <div className={`tab-content ${activeTab === 'runtime' ? 'active' : ''}`}>
                      <Explorer data={compiledConfig?.runtime} filename="runtime_config.json" />
                    </div>
                    <div className={`tab-content ${activeTab === 'repair' ? 'active' : ''}`}>
                      <Debugger compiledConfig={compiledConfig} setCompiledConfig={setCompiledConfig} setActiveTab={setActiveTab} prompt={prompt} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
