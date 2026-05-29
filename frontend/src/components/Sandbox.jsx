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
      // Pre-load appState from static seed data immediately
      const seedState = {};
      Object.entries(runtime.state || {}).forEach(([k, v]) => {
        seedState[k] = v;
      });
      setAppState(seedState);

      const safeRoutes = Array.isArray(runtime.routes) ? runtime.routes : 
                         (runtime.routes && typeof runtime.routes === 'object' ? Object.values(runtime.routes) : []);
                         
      if (safeRoutes.length > 0) {
        setActiveRoute(safeRoutes[0].path);
      }
      // Also try to fetch live from SQLite (won't work on projects page, so seed is fallback)
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

  const runtime = compiledConfig?.runtime || { routes: [], components: [], state: {} };
  
  // Robustly extract arrays, because LLMs hallucinate objects instead of arrays sometimes
  const components = Array.isArray(runtime?.components) ? runtime.components : 
                     (runtime?.components && typeof runtime.components === 'object' ? Object.values(runtime.components) : []);
  const routes = Array.isArray(runtime?.routes) ? runtime.routes : 
                 (runtime?.routes && typeof runtime.routes === 'object' ? Object.values(runtime.routes) : []);
  const stateData = runtime?.state || {};
  
  const navbar = components.find(c => c && c.type === 'navbar');
  const sidebar = components.find(c => c && c.type === 'sidebar');
  
  const normalizeRoute = (r) => {
    if (!r) return '';
    return typeof r === 'string' ? r.toLowerCase().trim().replace(/\/$/, '') : '';
  };

  const pageRoute = routes.find(r => r && normalizeRoute(r.path) === normalizeRoute(activeRoute));
  const pageTitle = pageRoute ? (pageRoute.page_name || pageRoute.name || 'Page') : (routes.length > 0 ? (routes[0].page_name || routes[0].name || 'Dashboard') : 'Application Dashboard');
  
  // Try to match components by route
  let activeComponents = components.filter(c => {
    if (!c) return false;
    if (c.type === 'navbar' || c.type === 'sidebar') return false;
    const componentRoute = c.props?._page_route || (routes.length > 0 ? routes[0].path : '');
    return normalizeRoute(componentRoute) === normalizeRoute(activeRoute);
  });

  // Fallback: if no route-matched components, use ALL non-nav/sidebar components
  if (activeComponents.length === 0) {
    activeComponents = components.filter(c => c && c.type !== 'navbar' && c.type !== 'sidebar');
  }

  const extractStateKey = (apiPath) => {
    if (!apiPath) return 'app_state';
    const parts = apiPath.split('/').filter(p => p && p !== 'api');
    if (parts.length > 0) {
      const rawKey = parts[0].replace(/\{.*?\}/, '').trim();
      if (runtime && runtime.state) {
        const match = Object.keys(runtime.state).find(
          k => k.toLowerCase() === rawKey.toLowerCase()
        );
        if (match) return match;
      }
      return rawKey;
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
        throw new Error(errData?.detail || 'Failed to insert record into SQLite database.');
      }
      
      alert(`Record successfully saved to SQLite database table: '${stateKey}'!`);
      formEl.reset();
      fetchLiveState();
    } catch (err) {
      // Ignore fetch errors if the table doesn't exist, just update local state for preview effect
      const currentRows = appState[stateKey] || stateData[stateKey] || [];
      const updatedRows = Array.isArray(currentRows) ? [...currentRows, { id: Date.now(), ...record }] : [{ id: Date.now(), ...record }];
      setAppState(prev => ({ ...prev, [stateKey]: updatedRows }));
      alert(`Simulated saving record to '${stateKey}'.`);
      formEl.reset();
    }
  };

  // ─── Auto-generated fallback preview from state data ───
  const renderFallbackPreview = () => {
    const stateKeys = Object.keys(stateData || {});
    if (stateKeys.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📦</div>
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>Application Compiled</h3>
          <p style={{ fontSize: '0.85rem' }}>No runtime UI components or seed data were generated for this project.</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>View the other artifact tabs (DB Schema, API Schema, UI Schema) to see the generated specifications.</p>
        </div>
      );
    }

    const accentColors = ['var(--accent-purple)', 'var(--accent-cyan)', 'var(--accent-emerald)', 'var(--accent-blue)', 'var(--accent-orange)', 'var(--accent-coral)'];

    return (
      <>
        {/* Stat cards generated from state data */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', width: '100%', marginBottom: '1rem' }}>
          {stateKeys.map((key, i) => {
            const rawRows = appState[key] || stateData[key] || [];
            const rows = Array.isArray(rawRows) ? rawRows : [];
            return (
              <div key={key} style={{
                background: 'var(--card-bg)', border: '1px solid var(--border-color)',
                borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '4px'
              }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total {key.replace(/_/g, ' ')}
                </span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: accentColors[i % accentColors.length] }}>
                  {rows.length}
                </span>
              </div>
            );
          })}
        </div>

        {/* Tables generated from state data */}
        {stateKeys.map((key) => {
          const rawRows = appState[key] || stateData[key] || [];
          const rows = Array.isArray(rawRows) ? rawRows : [];
          if (rows.length === 0) return null;
          const cols = Object.keys(rows[0] || {});
          const displayName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          return (
            <div className="compiled-card" key={key} style={{ width: '100%', marginBottom: '1rem' }}>
              <div className="compiled-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Table style={{ width: 14, height: 14 }} />
                {displayName}
              </div>
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
                    {rows.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {cols.map((col, colIdx) => (
                          <td key={colIdx}>{row && row[col] !== undefined ? String(row[col]) : '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </>
    );
  };

  // Decide whether to use component-based rendering or fallback
  const hasComponents = activeComponents && activeComponents.length > 0;

  // ── Component renderer for each element type ──
  const renderComponent = (comp) => {
    if (!comp) return null;
    const type = comp.type || 'card';
    const id = comp.id || Math.random().toString();
    const title = comp.title || (typeof type === 'string' ? type.toUpperCase() : 'COMPONENT');
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

    if (['input', 'text_input', 'email_input', 'password_input', 'number_input'].includes(type)) {
      return (
        <div className="compiled-form-group" key={id} style={{ marginBottom: '1rem', width: '100%' }}>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', fontWeight: '600' }}>
            {props.label || title}
          </label>
          <input 
            type={type === 'password_input' ? 'password' : (type === 'number_input' ? 'number' : 'text')} 
            placeholder={props.placeholder || `Enter ${props.label || title}...`}
            style={{
              width: '100%', padding: '0.65rem 0.85rem',
              border: '1px solid var(--border-color)', borderRadius: '8px',
              background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.85rem'
            }}
          />
        </div>
      );
    }

    if (['button', 'submit_button', 'login_button'].includes(type)) {
      return (
        <button key={id} onClick={() => alert(`Clicked ${props.label || title}`)}
          style={{
            background: 'var(--accent-purple)', color: '#ffffff', border: 'none',
            padding: '0.65rem 1.25rem', borderRadius: '8px', fontWeight: '600',
            fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.5rem', display: 'inline-block'
          }}
        >
          {props.label || title}
        </button>
      );
    }

    if (['metric', 'stat', 'stat_card'].includes(type)) {
      return (
        <div key={id} className="compiled-card" style={{
          background: 'var(--card-bg)', border: '1px solid var(--border-color)',
          borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column',
          gap: '4px', minWidth: '150px'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{props.label || title}</span>
          <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-purple)' }}>{props.value || '120'}</span>
        </div>
      );
    }

    if (['header', 'heading', 'title'].includes(type)) {
      return (
        <h3 key={id} style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '1.25rem', margin: '1rem 0 0.5rem 0', color: 'var(--text-primary)', width: '100%' }}>
          {props.label || title}
        </h3>
      );
    }

    if (['text', 'paragraph', 'label'].includes(type)) {
      return (
        <p key={id} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0.5rem 0', width: '100%' }}>
          {props.content || props.text || 'Lorem ipsum dolor sit amet.'}
        </p>
      );
    }

    if (['chart', 'graph'].includes(type)) {
      return (
        <div key={id} className="compiled-card" style={{ width: '100%' }}>
          <div className="compiled-card-title">{title}</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px', padding: '10px 0' }}>
            <div style={{ height: '60%', width: '30px', background: 'var(--accent-purple)', borderRadius: '4px' }}></div>
            <div style={{ height: '85%', width: '30px', background: 'var(--accent-cyan)', borderRadius: '4px' }}></div>
            <div style={{ height: '40%', width: '30px', background: 'var(--accent-blue)', borderRadius: '4px' }}></div>
            <div style={{ height: '95%', width: '30px', background: 'var(--accent-emerald)', borderRadius: '4px' }}></div>
          </div>
        </div>
      );
    }

    if (['list', 'item_list'].includes(type)) {
      const rawItems = props.items || ['Item 1', 'Item 2', 'Item 3'];
      const items = Array.isArray(rawItems) ? rawItems : (typeof rawItems === 'object' && rawItems !== null ? Object.values(rawItems) : []);
      return (
        <div key={id} className="compiled-card" style={{ width: '100%' }}>
          <div className="compiled-card-title">{title}</div>
          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {items.map((it, idx) => (
              <li key={idx}>{typeof it === 'object' ? JSON.stringify(it) : it}</li>
            ))}
          </ul>
        </div>
      );
    }

    if (type === 'form') {
      const rawFields = props.fields || [];
      const fields = Array.isArray(rawFields) ? rawFields : (typeof rawFields === 'object' && rawFields !== null ? Object.values(rawFields) : []);
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
                  <input type={fType} name={fName || `field_${idx}`} required={fRequired} placeholder={`Enter ${fLabel}...`} />
                </div>
              );
            })}
            <button type="submit" className="compiled-form-submit">Submit Record</button>
          </form>
        </div>
      );
    }

    if (type === 'table') {
      const rawCols = props.columns || [];
      const cols = Array.isArray(rawCols) ? rawCols : (typeof rawCols === 'object' && rawCols !== null ? Object.values(rawCols) : []);
      const stateKey = extractStateKey(props.api_endpoint || '');
      const rawRows = appState[stateKey] || stateData[stateKey] || [];
      const rows = Array.isArray(rawRows) ? rawRows : (typeof rawRows === 'object' && rawRows !== null ? Object.values(rawRows) : []);
      
      return (
        <div className="compiled-card" key={id}>
          <div className="compiled-card-title">{title}</div>
          <div className="compiled-table-container">
            <table className="compiled-table">
              <thead>
                <tr>
                  {cols.map((col, idx) => {
                    const colLabel = typeof col === 'object' ? (col.label || col.name || JSON.stringify(col)) : col;
                    return <th key={idx}>{colLabel}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={Math.max(cols.length, 1)} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No records found. Submit the form above to add data.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {cols.map((col, colIdx) => {
                         const colName = typeof col === 'object' ? (col.name || col.label || JSON.stringify(col)) : col;
                         return (
                           <td key={colIdx}>{row && row[colName] !== undefined ? String(row[colName]) : '-'}</td>
                         );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    
    if (type === 'html_widget' || type === 'custom_code') {
      return (
        <div className="compiled-card" key={id} style={{ width: '100%' }}>
          <div className="compiled-card-title">{title || 'Custom Widget'}</div>
          <iframe 
            srcDoc={props.html || props.code || '<h1>Empty Widget</h1>'}
            style={{ width: '100%', minHeight: '400px', border: 'none', background: '#ffffff', borderRadius: '8px' }}
            sandbox="allow-scripts allow-same-origin"
          />
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
          
          {/* Mock Top Navbar — auto-generate from routes if none found */}
          {navbar ? (
            <div className="compiled-navbar">
              <span className="compiled-navbar-brand">{navbar.title || 'Compiled App'}</span>
              <div className="compiled-navbar-links">
                {((navbar.props && navbar.props.links) || []).map((link, i) => (
                  <a 
                    key={i} 
                    className={`compiled-nav-link ${normalizeRoute(activeRoute) === normalizeRoute(link.href) ? 'active' : ''}`}
                    onClick={() => setActiveRoute(link.href)}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ) : routes.length > 1 && (
            <div className="compiled-navbar">
              <span className="compiled-navbar-brand">{pageTitle || 'Compiled App'}</span>
              <div className="compiled-navbar-links">
                {routes.map((r, i) => (
                  <a
                    key={i}
                    className={`compiled-nav-link ${normalizeRoute(activeRoute) === normalizeRoute(r.path) ? 'active' : ''}`}
                    onClick={() => setActiveRoute(r.path)}
                  >
                    {r.page_name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Mock Sidebar */}
          {sidebar && (
            <aside className="compiled-sidebar">
              <div className="compiled-sidebar-title">{sidebar.title || 'MENU'}</div>
              {((sidebar.props && sidebar.props.items) || []).map((item, i) => (
                <div 
                  key={i} 
                  className={`compiled-sidebar-item ${normalizeRoute(activeRoute) === normalizeRoute(item.route) ? 'active' : ''}`}
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
                {hasComponents
                  ? activeComponents.map(renderComponent)
                  : renderFallbackPreview()
                }
              </motion.div>
            </AnimatePresence>
          </main>

        </div>
      </div>
    </div>
  );
}

export default Sandbox;
