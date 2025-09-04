import React, { useState } from 'react';

interface InkSelectorProps {
  selectedInks: string[];
  onSelectionChange: (inks: string[]) => void;
  inkDatabase: any;
  showMetallic?: boolean;
}

const InkSelector: React.FC<InkSelectorProps> = ({ 
  selectedInks, 
  onSelectionChange, 
  inkDatabase,
  showMetallic = false 
}) => {
  const [concentrations, setConcentrations] = useState<Record<string, number>>({});

  const handleInkToggle = (inkId: string) => {
    if (selectedInks.includes(inkId)) {
      onSelectionChange(selectedInks.filter(id => id !== inkId));
    } else {
      onSelectionChange([...selectedInks, inkId]);
    }
  };

  const handleConcentrationChange = (inkId: string, concentration: number) => {
    setConcentrations(prev => ({
      ...prev,
      [inkId]: concentration
    }));
  };

  // 잉크를 그룹별로 분류
  const processInks = inkDatabase.baseInks.filter((ink: any) => 
    ['cyan', 'magenta', 'yellow', 'black'].includes(ink.id)
  );
  
  const spotInks = inkDatabase.baseInks.filter((ink: any) => 
    ['red', 'green', 'blue', 'orange', 'violet', 'brown'].includes(ink.id)
  );
  
  const fluorescentInks = inkDatabase.baseInks.filter((ink: any) => 
    ink.id && ink.id.includes('fluorescent')
  );
  
  const mediumInks = inkDatabase.baseInks.filter((ink: any) => 
    ink.type === 'medium'
  );

  const metallicInks = showMetallic ? inkDatabase.metallicInks : [];

  // 그룹 전체 선택/해제 함수
  const handleGroupSelectAll = (groupInks: any[]) => {
    const groupIds = groupInks.map(ink => ink.id);
    const newSelectedInks = [...new Set([...selectedInks, ...groupIds])];
    onSelectionChange(newSelectedInks);
  };

  const handleGroupDeselectAll = (groupInks: any[]) => {
    const groupIds = groupInks.map(ink => ink.id);
    onSelectionChange(selectedInks.filter(id => !groupIds.includes(id)));
  };

  // 잉크 그룹 렌더링 함수
  const renderInkGroup = (title: string, inks: any[]) => {
    if (inks.length === 0) return null;

    return (
      <div className="ink-group" style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '10px',
          padding: '5px 10px',
          backgroundColor: '#f5f5f5',
          borderRadius: '5px'
        }}>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{title}</h4>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              type="button"
              onClick={() => handleGroupSelectAll(inks)}
              style={{
                padding: '3px 10px',
                fontSize: '12px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              전체 선택
            </button>
            <button
              type="button"
              onClick={() => handleGroupDeselectAll(inks)}
              style={{
                padding: '3px 10px',
                fontSize: '12px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              전체 해제
            </button>
          </div>
        </div>
        <div className="ink-grid">
          {inks.map(ink => (
            <div key={ink.id} className={`ink-item ${selectedInks.includes(ink.id) ? 'selected' : ''}`}>
              <label className="ink-label">
                <input
                  type="checkbox"
                  checked={selectedInks.includes(ink.id)}
                  onChange={() => handleInkToggle(ink.id)}
                />
                <span className="ink-name">{ink.name}</span>
                {ink.type === 'metallic' && <span className="metallic-badge">M</span>}
                {ink.type === 'medium' && <span className="medium-badge">MEDIUM</span>}
              </label>
              
              {selectedInks.includes(ink.id) && ink.type !== 'medium' && (
                <div className="concentration-selector">
                  <label>농도:</label>
                  <select 
                    value={concentrations[ink.id] || 100}
                    onChange={(e) => handleConcentrationChange(ink.id, Number(e.target.value))}
                  >
                    <option value={100}>100%</option>
                    {ink.concentrations[70] && <option value={70}>70% (Satin)</option>}
                    {ink.concentrations[40] && <option value={40}>40% (Satin)</option>}
                  </select>
                </div>
              )}
              
              {selectedInks.includes(ink.id) && ink.type === 'medium' && (
                <div className="medium-info-box">
                  <small>투명 베이스 (희석제)</small>
                </div>
              )}
              
              <div className="ink-preview" style={{
                backgroundColor: `lab(${ink.concentrations[100].L}% ${ink.concentrations[100].a} ${ink.concentrations[100].b})`
              }} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="ink-selector">
      {renderInkGroup('Process Inks', processInks)}
      {renderInkGroup('Spot Inks', spotInks)}
      {renderInkGroup('Fluorescent Inks', fluorescentInks)}
      {renderInkGroup('Medium', mediumInks)}
      {showMetallic && renderInkGroup('Metallic Inks', metallicInks)}
      
      <div className="selection-info" style={{ marginTop: '20px', fontSize: '14px' }}>
        선택된 잉크: {selectedInks.length}개
      </div>
    </div>
  );
};

export default InkSelector;