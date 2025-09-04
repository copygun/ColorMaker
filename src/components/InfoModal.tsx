import React from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  content: string | string[];
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, title = '정보', content }) => {
  if (!isOpen) return null;

  const displayContent = Array.isArray(content) ? content : [content];

  return (
    <>
      <div 
        className="modal-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div 
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>{title}</h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#666',
                padding: '0',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              ×
            </button>
          </div>
          
          <div style={{ 
            fontSize: '0.875rem', 
            lineHeight: '1.6',
            color: '#333'
          }}>
            {displayContent.map((line, index) => (
              <div key={index} style={{ marginBottom: line === '' ? '8px' : '4px' }}>
                {line || '\u00A0'}
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <button
              onClick={onClose}
              className="pro-button pro-button-primary"
              style={{
                padding: '8px 20px',
                fontSize: '0.875rem'
              }}
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default InfoModal;