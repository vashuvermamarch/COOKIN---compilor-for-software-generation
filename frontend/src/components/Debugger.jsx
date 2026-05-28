import React, { useState } from 'react';

function Debugger({ compiledConfig, setCompiledConfig, setActiveTab, prompt }) {
  const [brokenConfig, setBrokenConfig] = useState(null);
  const [debugLogs, setDebugLogs] = useState([
    { type: 'dim', text: '// Break a schema constraint above to activate the debugger validation report.' }
  ]);
  const [isHealable, setIsHealable] = useState(false);
  const [isHealing, setIsHealing] = useState(false);

  const appendLog = (type, text) => {
    setDebugLogs(prev => [...prev, { type, text }]);
  };

  const injectFailure = async (type) => {
    if (!compiledConfig) {
      alert('Please compile an application first.');
      return;
    }

    const backup = JSON.parse(JSON.stringify(compiledConfig));
    let logMsg = '';

    if (type === 'uipath') {
      if (backup.ui && backup.ui.pages.length > 0) {
        const page = backup.ui.pages[0];
        const table = page.components.find(c => c.type === 'table');
        if (table) {
          table.props.api_endpoint = '/api/broken_endpoint_route';
          logMsg = `[Debugger] Injected broken route '/api/broken_endpoint_route' into Table component '${table.id}'.`;
        }
      }
    } else if (type === 'uifield') {
      if (backup.ui && backup.ui.pages.length > 0) {
        const page = backup.ui.pages[0];
        const form = page.components.find(c => c.type === 'form');
        if (form) {
          form.props.fields.push({
            name: 'undefined_field_name',
            label: 'Broken Column Field',
            type: 'text'
          });
          logMsg = `[Debugger] Injected invalid field 'undefined_field_name' into Form component '${form.id}' that does not exist in the Database schema.`;
        }
      }
    } else if (type === 'fk') {
      if (backup.database && backup.database.tables.length > 0) {
        const table = backup.database.tables.find(t => t.columns.some(c => c.foreign_key));
        if (table) {
          const col = table.columns.find(c => c.foreign_key);
          col.foreign_key = 'non_existent_table.invalid_id';
          logMsg = `[Debugger] Changed column '${table.table_name}.${col.name}' foreign key reference to non-existent table 'non_existent_table.invalid_id'.`;
        } else {
          const t = backup.database.tables[0];
          t.columns[0].foreign_key = 'ghost_table.ghost_column';
          logMsg = `[Debugger] Changed column '${t.table_name}.${t.columns[0].name}' foreign key reference to non-existent table 'ghost_table.ghost_column'.`;
        }
      }
    }

    setBrokenConfig(backup);
    setDebugLogs([{ type: 'info', text: logMsg }, { type: 'info', text: '// Invoking Validation Engine...' }]);
    setIsHealable(false);

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backup)
      });
      const report = await res.json();

      if (report.valid) {
        appendLog('success', '✓ Configuration validated as clean. No errors.');
      } else {
        appendLog('err', `✗ Validation Failed: ${report.errors.length} integrity violations detected.`);
        report.errors.forEach(err => {
          appendLog('err', `> ${err}`);
        });
        appendLog('info', '// Self-healing repair engine ready.');
        setIsHealable(true);
      }
    } catch (err) {
      appendLog('err', 'Validation failed: ' + err.message);
    }
  };

  const triggerSurgicalHeal = async () => {
    if (!brokenConfig) return;
    setIsHealing(true);
    appendLog('info', '// Invoking Stage 7 Repair Engine...');

    try {
      // 1. Re-validate to get full error trace
      const valRes = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brokenConfig)
      });
      const report = await valRes.json();

      // 2. Call Repair
      const res = await fetch('/api/repair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broken_config: brokenConfig,
          errors: report.errors,
          prompt: prompt || 'Task manager app'
        })
      });
      const repData = await res.json();
      const repaired = repData.repaired_config;

      // 3. Verify fix
      const verifyRes = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repaired)
      });
      const verifyReport = await verifyRes.json();

      if (verifyReport.valid) {
        appendLog('success', '✓ Self-Healing completed! All integrity constraints satisfied.');
        
        // Re-compile via API to sync backend runtime state
        const compileRes = await fetch('/api/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt || 'Task manager app',
            mock_mode: 'true'
          })
        });
        const buildResult = await compileRes.json();
        
        setCompiledConfig(buildResult.final_config);
        setIsHealable(false);
        appendLog('success', '✓ Preview Sandbox redrawn with corrected schema bindings.');
      } else {
        appendLog('err', '✗ Repair Engine returned invalid patches:');
        verifyReport.errors.forEach(err => {
          appendLog('err', `> ${err}`);
        });
      }
    } catch (err) {
      appendLog('err', 'Failed during repair pass: ' + err.message);
    } finally {
      setIsHealing(false);
    }
  };

  const isDisabled = !compiledConfig;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="repair-intro">
        <h3>Debug Console: Induce Failures & Self-Heal</h3>
        <p>To demonstrate the robustness of the compiler's <strong>Validation & Repair (Stage 7)</strong> layer, introduce a schema or semantic mismatch below. The system will detect, trace, and patch the config instantly.</p>
      </div>
      
      <div className="repair-actions">
        <button className="danger-btn" onClick={() => injectFailure('uipath')} disabled={isDisabled}>
          1. Break UI API Route Reference
        </button>
        <button className="danger-btn" onClick={() => injectFailure('uifield')} disabled={isDisabled}>
          2. Break Form Column Mapping
        </button>
        <button className="danger-btn" onClick={() => injectFailure('fk')} disabled={isDisabled}>
          3. Break DB Foreign Key Relation
        </button>
      </div>

      <div className="repair-logs-card">
        <div className="repair-logs-header">
          <span>Debugger Console & Patch Feed</span>
          <button 
            className="heal-btn" 
            onClick={triggerSurgicalHeal} 
            disabled={!isHealable || isHealing}
          >
            {isHealing ? 'HEALING...' : 'Surgical Heal'}
          </button>
        </div>
        <div className="repair-logs-body">
          {debugLogs.map((log, idx) => {
            let className = 'dim-log';
            if (log.type === 'err') className = 'log-err';
            if (log.type === 'success') className = 'log-success';
            if (log.type === 'info') className = 'log-info';
            return (
              <div key={idx} className={className}>
                {log.text}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Debugger;
