import React from 'react';

/**
 * Shared full-view loading state (spinner CSS lives in App.css).
 * @param {{ as?: 'h4' | 'p', text: import('react').ReactNode, className?: string }} props
 */
export default function LoadingPanel({ as: Tag = 'p', text, className }) {
  return (
    <div className="loading-panel" aria-busy="true">
      <Tag className={className} style={{ textAlign: 'center' }}>
        {text}
      </Tag>
      <div className="sk-fading-circle">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className={`sk-circle${i + 1} sk-circle`} />
        ))}
      </div>
    </div>
  );
}
