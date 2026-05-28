import React from 'react';

function Explorer({ data, filename }) {
  const handleCopy = () => {
    if (!data) return;
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text)
      .then(() => alert('Config copied to clipboard!'))
      .catch(err => console.error('Failed to copy text: ', err));
  };

  const displayText = data 
    ? JSON.stringify(data, null, 2)
    : JSON.stringify({ info: `Pipeline has not executed. Once run, the compiled ${filename} manifest will appear here.` }, null, 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="code-editor-header">
        <span>{filename}</span>
        {data && <button onClick={handleCopy}>Copy JSON</button>}
      </div>
      <pre className="code-display" style={{ margin: 0, overflow: 'auto', flex: 1 }}>
        <code>{displayText}</code>
      </pre>
    </div>
  );
}

export default Explorer;
