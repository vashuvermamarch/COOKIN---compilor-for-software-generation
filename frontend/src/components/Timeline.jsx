import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { key: 'stage_1_intent', label: 'Intent Extraction', desc: 'Extracting logical schemas and assumptions from user query.', num: 1 },
  { key: 'stage_2_system_design', label: 'Architecture Design', desc: 'Designing backend structures, APIs, and access boundaries.', num: 2 },
  { key: 'stage_3_database', label: 'Database Schema', desc: 'Structuring database tables, column types, and relations.', num: 3 },
  { key: 'stage_4_api', label: 'API Generation', desc: 'Defining REST routes, schemas, and endpoint mappings.', num: 4 },
  { key: 'stage_5_ui', label: 'UI Layout Mappings', desc: 'Constructing components, layouts, and page route targets.', num: 5 },
  { key: 'stage_6_consistency', label: 'Validation & Repair', desc: 'Evaluating cross-layer constraints. Running repair matches on failures.', num: 6 },
  { key: 'stage_8_runtime', label: 'Runtime Generator', desc: 'Assembling route mappings, data bindings, and client states.', num: 7 }
];

function Timeline({ trace, isCompiling }) {
  const [openStep, setOpenStep] = useState(null);

  const toggleStepDetails = (key) => {
    setOpenStep(openStep === key ? null : key);
  };

  const getStepStatus = (key, idx) => {
    if (isCompiling && (!trace || !trace[key])) {
      // Find current processing index
      const completedCount = trace ? Object.keys(trace).length : 0;
      if (idx === completedCount) return 'compiling';
      return 'pending';
    }
    
    if (!trace || !trace[key]) return 'pending';
    
    const stepData = trace[key];
    if (stepData.valid === false) return 'error';
    if (stepData.repairs && stepData.repairs.length > 0) return 'repairing';
    return 'completed';
  };

  return (
    <div className="pipeline-flow">
      {STEPS.map((step, idx) => {
        const status = getStepStatus(step.key, idx);
        const data = trace ? trace[step.key] : null;
        
        let badgeText = 'Pending';
        if (status === 'compiling') badgeText = 'Processing';
        if (status === 'completed') badgeText = 'Valid';
        if (status === 'repairing') badgeText = 'Repaired';
        if (status === 'error') badgeText = 'Failed';

        return (
          <motion.div 
            key={step.key} 
            className={`pipeline-step ${status}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.08 }}
          >
            <div className="step-icon">
              <span className="step-num">{step.num}</span>
              {status === 'compiling' && (
                <motion.div 
                  className="step-spinner"
                  style={{
                    position: 'absolute',
                    top: -2, left: -2, right: -2, bottom: -2,
                    border: '2px solid transparent',
                    borderTopColor: 'var(--accent-cyan)',
                    borderRadius: '50%'
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                />
              )}
            </div>
            
            <div className="step-content">
              <div className="step-header">
                <h3>{step.label}</h3>
                <span className={`step-badge ${status}`}>{badgeText}</span>
              </div>
              <p>{step.desc}</p>
              
              {data && (
                <div className="step-details-container">
                  <button 
                    className="toggle-details-btn"
                    onClick={() => toggleStepDetails(step.key)}
                  >
                    {openStep === step.key ? 'Hide Details' : 'View Stage Details'}
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {openStep === step.key && (
                      <motion.div
                        className="step-details-payload"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <pre>
                          <code>
                            {JSON.stringify(data.output || data, null, 2)}
                          </code>
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default Timeline;
