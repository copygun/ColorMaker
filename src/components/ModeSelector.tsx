import React from 'react';

interface ModeSelectorProps {
  currentMode: 'legacy' | 'advanced' | 'hybrid';
  onModeChange: (mode: 'legacy' | 'advanced' | 'hybrid') => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange }) => {
  return (
    <div className="mode-selector">
      <div className="mode-options">
        <button
          className={`mode-btn ${currentMode === 'legacy' ? 'active' : ''}`}
          onClick={() => onModeChange('legacy')}
        >
          <span className="mode-icon">⚡</span>
          <span className="mode-name">Legacy</span>
          <span className="mode-desc">빠른 계산 (검증됨)</span>
        </button>
        
        <button
          className={`mode-btn ${currentMode === 'hybrid' ? 'active' : ''}`}
          onClick={() => onModeChange('hybrid')}
        >
          <span className="mode-icon">🔄</span>
          <span className="mode-name">Hybrid</span>
          <span className="mode-desc">선택적 기능</span>
        </button>
        
        <button
          className={`mode-btn ${currentMode === 'advanced' ? 'active' : ''}`}
          onClick={() => onModeChange('advanced')}
        >
          <span className="mode-icon">🚀</span>
          <span className="mode-name">Advanced</span>
          <span className="mode-desc">정밀 계산</span>
        </button>
      </div>
      
      <div className="mode-info">
        {currentMode === 'legacy' && (
          <p>✓ 기존 v3.0 알고리즘 사용<br/>✓ Lab 직접 혼합<br/>✓ 빠른 계산 속도</p>
        )}
        {currentMode === 'hybrid' && (
          <p>✓ 기능 선택 가능<br/>✓ A/B 테스트 지원<br/>✓ 폴백 메커니즘</p>
        )}
        {currentMode === 'advanced' && (
          <p>✓ XYZ 색공간 혼합<br/>✓ PSO 최적화<br/>✓ 물리적 정확도</p>
        )}
      </div>
    </div>
  );
};

export default ModeSelector;