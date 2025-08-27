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

  const allInks = [
    ...inkDatabase.baseInks,
    ...(showMetallic ? inkDatabase.metallicInks : [])
  ];

  return (
    <div className="ink-selector">
      <div className="ink-grid">
        {allInks.map(ink => (
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
      
      <div className="selection-info">
        선택된 잉크: {selectedInks.length}개
      </div>
    </div>
  );
};

export default InkSelector;