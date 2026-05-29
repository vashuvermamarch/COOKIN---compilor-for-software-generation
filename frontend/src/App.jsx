import React, { useState, useEffect } from 'react';
import Timeline from './components/Timeline';
import Sandbox from './components/Sandbox';
import Explorer from './components/Explorer';
import Debugger from './components/Debugger';

function App() {
  const [prompt, setPrompt] = useState('');
  const [mockMode, setMockMode] = useState('true');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledConfig, setCompiledConfig] = useState(null);
  const [trace, setTrace] = useState(null);
  const [activeTab, setActiveTab] = useState('sandbox');
  const [theme, setTheme] = useState('light');
  
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

    fetch('/api/compile')
      .then(res => res.json())
      .then(data => {
        if (data && data.final_config) {
          setTrace(data.trace);
          setCompiledConfig(data.final_config);
        }
      })
      .catch(err => console.error('Failed to load active compiled configuration:', err));
  }, []);

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

  const runCompilerPipeline = async () => {
    const promptText = prompt.trim();
    if (!promptText) {
      alert('Please enter your prompt.');
      return;
    }
    
    setIsCompiling(true);
    setTrace(null);
    setActiveTab('sandbox');
    
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
      setTrace(result.trace);
      setCompiledConfig(result.final_config);
    } catch (err) {
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
            <div className="logo-container" style={{ display: 'flex', alignItems: 'center', marginRight: '2rem' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#1e293b"/>
                <path d="M12 6V8C9.79 8 8 9.79 8 12H6C6 8.69 8.69 6 12 6Z" fill="#a855f7"/>
                <circle cx="12" cy="12" r="3.5" fill="#1e293b"/>
              </svg>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '2px', color: '#0f172a' }}>COOKIN</span>
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

        {/* Content Body */}
        <div className="content-body-wrapper">
          {!compiledConfig && !isCompiling ? (
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
                    {isCompiling && <span className="pulse-compiling-text">Compiling...</span>}
                  </div>
                  <textarea 
                    value={prompt} 
                    onChange={(e) => setPrompt(e.target.value)} 
                    placeholder="Type new requirements..."
                    disabled={isCompiling}
                  />
                  <button className="compile-again-btn" onClick={runCompilerPipeline} disabled={isCompiling}>
                    {isCompiling ? 'Re-compiling System...' : 'Re-compile System'}
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
