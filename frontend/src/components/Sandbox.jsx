import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, CheckSquare, Plus, Table, AlertCircle } from 'lucide-react';

function Sandbox({ compiledConfig, isCompiling, setCompiledConfig }) {
  const [activeRoute, setActiveRoute] = useState('');
  const [appState, setAppState] = useState({});

  const fetchLiveState = async () => {
    if (!compiledConfig || !compiledConfig.runtime) return;
    const runtime = compiledConfig.runtime;
    const tables = Object.keys(runtime.state || {});
    const newState = {};
    for (let table of tables) {
      try {
        const res = await fetch(`/api/execute/${table}`);
        if (res.ok) {
          newState[table] = await res.json();
        } else {
          newState[table] = runtime.state[table] || [];
        }
      } catch (err) {
        newState[table] = runtime.state[table] || [];
      }
    }
    setAppState(newState);
  };

  // Reset/sync state when a new compilation finishes
  useEffect(() => {
    if (compiledConfig && compiledConfig.runtime) {
      const runtime = compiledConfig.runtime;
      if (runtime.routes.length > 0) {
        setActiveRoute(runtime.routes[0].path);
      }
      fetchLiveState();
    }
  }, [compiledConfig]);

  if (isCompiling) {
    return (
      <div className="sandbox-window" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="sandbox-empty">
          <div className="compile-wave">
            <div className="wave-circle"></div>
            <div className="wave-circle"></div>
          </div>
          <h3>Compiling code bundle...</h3>
          <p>The compiler is assembling components and seeding the mockup databases.</p>
        </div>
      </div>
    );
  }

  if (!compiledConfig || !compiledConfig.runtime) {
    return (
      <div className="sandbox-window">
        <div className="sandbox-header">
          <div className="sandbox-dots">
            <span className="dot-red"></span>
            <span className="dot-yellow"></span>
            <span className="dot-green"></span>
          </div>
          <div className="sandbox-address">
            <span>🔒</span>
            <span>https://compiled-app.local/</span>
          </div>
        </div>
        <div className="sandbox-body">
          <div className="sandbox-empty">
            <div className="compile-wave">
              <div className="wave-circle"></div>
              <div className="wave-circle"></div>
            </div>
            <h3>Waiting for compilation pass...</h3>
            <p>Compile a prompt on the left to hydrate this live running application layout sandbox.</p>
          </div>
        </div>
      </div>
    );
  }

  const runtime = compiledConfig.runtime;
  const navbar = runtime.components.find(c => c.type === 'navbar');
  const sidebar = runtime.components.find(c => c.type === 'sidebar');
  
  const pageRoute = runtime.routes.find(r => r.path === activeRoute);
  const pageTitle = pageRoute ? pageRoute.page_name : 'Workspace Dashboard';
  
  const activeComponents = runtime.components.filter(c => {
    return c.props && c.props._page_route === activeRoute && c.type !== 'navbar' && c.type !== 'sidebar';
  });

  const extractStateKey = (apiPath) => {
    const parts = apiPath.split('/').filter(p => p && p !== 'api');
    if (parts.length > 0) {
      return parts[0].replace(/\{.*?\}/, '').trim();
    }
    return 'app_state';
  };

  const handleFormSubmit = async (e, apiEndpoint) => {
    e.preventDefault();
    const formEl = e.target;
    const formData = new FormData(formEl);
    const record = {};
    
    for (let [key, val] of formData.entries()) {
      const numVal = Number(val);
      record[key] = isNaN(numVal) || val.trim() === '' ? val : numVal;
    }

    const stateKey = extractStateKey(apiEndpoint);
    
    try {
      const res = await fetch(`/api/execute/${stateKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to insert record into SQLite database.');
      }
      
      alert(`Record successfully saved to SQLite database table: '${stateKey}'!`);
      formEl.reset();
      fetchLiveState(); // Re-fetch the live state from SQLite to update tables!
    } catch (err) {
      alert(`Database Insertion Error: ${err.message}`);
    }
  };

  return (
    <div className="sandbox-window">
      {/* Address Header Bar */}
      <div className="sandbox-header">
        <div className="sandbox-dots">
          <span className="dot-red"></span>
          <span className="dot-yellow"></span>
          <span className="dot-green"></span>
        </div>
        <div className="sandbox-address">
          <span>🔒</span>
          <span>https://compiled-app.local{activeRoute}</span>
        </div>
      </div>
      
      {/* Interactive Web Page View */}
      <div className="sandbox-body" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className={`compiled-app-layout ${navbar ? 'has-navbar' : ''}`}>
          
          {/* Mock Top Navbar */}
          {navbar && (
            <div className="compiled-navbar">
              <span className="compiled-navbar-brand">{navbar.title || 'Compiled App'}</span>
              <div className="compiled-navbar-links">
                {(navbar.props.links || []).map((link, i) => (
                  <a 
                    key={i} 
                    className={`compiled-nav-link ${activeRoute === link.href ? 'active' : ''}`}
                    onClick={() => setActiveRoute(link.href)}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Mock Sidebar */}
          {sidebar && (
            <aside className="compiled-sidebar">
              <div className="compiled-sidebar-title">{sidebar.title || 'MENU'}</div>
              {(sidebar.props.items || []).map((item, i) => (
                <div 
                  key={i} 
                  className={`compiled-sidebar-item ${activeRoute === item.route ? 'active' : ''}`}
                  onClick={() => setActiveRoute(item.route)}
                >
                  {item.label}
                </div>
              ))}
            </aside>
          )}

          {/* Page Panel Layout */}
          <main className="compiled-page-content">
            <div className="compiled-page-header">{pageTitle}</div>
            
            {/* Animated Router Transition */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeRoute}
                className="compiled-grid"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {activeComponents.map((comp) => {
                  const type = comp.type;
                  const id = comp.id;
                  const title = comp.title || type.toUpperCase();
                  const props = comp.props || {};

                  if (type === 'card') {
                    return (
                      <div className="compiled-card" key={id}>
                        <div className="compiled-card-title">{title}</div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {props.content || 'Placeholder content panel details.'}
                        </p>
                      </div>
                    );
                  }

                  if (type === 'form') {
                    const fields = props.fields || [];
                    return (
                      <div className="compiled-card" key={id}>
                        <div className="compiled-card-title">{title}</div>
                        <form className="compiled-form" onSubmit={(e) => handleFormSubmit(e, props.api_endpoint)}>
                          {fields.map((f, idx) => {
                            const isObj = typeof f === 'object' && f !== null;
                            const fName = isObj ? f.name : f;
                            const fLabel = isObj ? (f.label || f.name) : f;
                            const fRequired = isObj ? f.required : false;
                            const fType = isObj && f.type === 'integer' ? 'number' : 'text';
                            return (
                              <div className="compiled-form-group" key={idx}>
                                <label>{fLabel}</label>
                                <input 
                                  type={fType} 
                                  name={fName} 
                                  required={fRequired} 
                                  placeholder={`Enter ${fLabel}...`}
                                />
                              </div>
                            );
                          })}
                          <button type="submit" className="compiled-form-submit">Submit Record</button>
                        </form>
                      </div>
                    );
                  }

                  if (type === 'table') {
                    const cols = props.columns || [];
                    const stateKey = extractStateKey(props.api_endpoint || '');
                    const rows = appState[stateKey] || [];
                    
                    return (
                      <div className="compiled-card" key={id}>
                        <div className="compiled-card-title">{title}</div>
                        <div className="compiled-table-container">
                          <table className="compiled-table">
                            <thead>
                              <tr>
                                {cols.map((col, idx) => (
                                  <th key={idx}>{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {rows.length === 0 ? (
                                <tr>
                                  <td colSpan={cols.length} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No records found. Submit the form above to add data.
                                  </td>
                                </tr>
                              ) : (
                                rows.map((row, rowIdx) => (
                                  <tr key={rowIdx}>
                                    {cols.map((col, colIdx) => (
                                      <td key={colIdx}>{row[col] !== undefined ? String(row[col]) : '-'}</td>
                                    ))}
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="compiled-card" key={id}>
                      <div className="compiled-card-title" style={{ color: 'var(--accent-coral)' }}>
                        <AlertCircle style={{ width: 14, height: 14, marginRight: 5, verticalAlign: 'middle' }} />
                        Unsupported element type: {type}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </main>

        </div>
      </div>
    </div>
  );
}

export default Sandbox;
