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
  showMetallic = false,
}) => {
  const [concentrations, setConcentrations] = useState<Record<string, number>>({});

  const handleInkToggle = (inkId: string) => {
    if (selectedInks.includes(inkId)) {
      onSelectionChange(selectedInks.filter((id) => id !== inkId));
    } else {
      onSelectionChange([...selectedInks, inkId]);
    }
  };

  const handleConcentrationChange = (inkId: string, concentration: number) => {
    setConcentrations((prev) => ({
      ...prev,
      [inkId]: concentration,
    }));
  };

  // 그룹별 전체 선택/해제
  const selectAllProcess = () => {
    const processIds = ['cyan', 'magenta', 'yellow', 'black', 'white'];
    const newSelection = [...new Set([...selectedInks, ...processIds])];
    onSelectionChange(newSelection);
  };

  const deselectAllProcess = () => {
    const processIds = ['cyan', 'magenta', 'yellow', 'black', 'white'];
    onSelectionChange(selectedInks.filter((id) => !processIds.includes(id)));
  };

  const selectAllSpot = () => {
    const spotIds = [
      'orange',
      'green',
      'violet',
      'red',
      'blue',
      'turquoise',
      'teal',
      'bright-green',
      'lime',
    ];
    const newSelection = [...new Set([...selectedInks, ...spotIds])];
    onSelectionChange(newSelection);
  };

  const deselectAllSpot = () => {
    const spotIds = [
      'orange',
      'green',
      'violet',
      'red',
      'blue',
      'turquoise',
      'teal',
      'bright-green',
      'lime',
    ];
    onSelectionChange(selectedInks.filter((id) => !spotIds.includes(id)));
  };

  const selectAllFluorescent = () => {
    const fluorescentIds = [
      'fluorescent-yellow',
      'fluorescent-pink',
      'fluorescent-orange',
      'fluorescent-green',
    ];
    const newSelection = [...new Set([...selectedInks, ...fluorescentIds])];
    onSelectionChange(newSelection);
  };

  const deselectAllFluorescent = () => {
    const fluorescentIds = [
      'fluorescent-yellow',
      'fluorescent-pink',
      'fluorescent-orange',
      'fluorescent-green',
    ];
    onSelectionChange(selectedInks.filter((id) => !fluorescentIds.includes(id)));
  };

  const selectMedium = () => {
    const newSelection = [...new Set([...selectedInks, 'medium'])];
    onSelectionChange(newSelection);
  };

  const deselectMedium = () => {
    onSelectionChange(selectedInks.filter((id) => id !== 'medium'));
  };

  const allInks = [...inkDatabase.baseInks, ...(showMetallic ? inkDatabase.metallicInks : [])];

  return (
    <div className="ink-selector">
      {/* 그룹별 전체 선택/해제 버튼 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
        }}
      >
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>Process Inks</h4>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={selectAllProcess}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              전체 선택
            </button>
            <button
              onClick={deselectAllProcess}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              전체 해제
            </button>
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>Spot Inks</h4>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={selectAllSpot}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              전체 선택
            </button>
            <button
              onClick={deselectAllSpot}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              전체 해제
            </button>
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>Fluorescent Inks</h4>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={selectAllFluorescent}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              전체 선택
            </button>
            <button
              onClick={deselectAllFluorescent}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              전체 해제
            </button>
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>Medium</h4>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={selectMedium}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              선택
            </button>
            <button
              onClick={deselectMedium}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              해제
            </button>
          </div>
        </div>
      </div>

      {/* 기존 잉크 선택 UI */}
      <div className="ink-grid">
        {allInks.map((ink) => (
          <div
            key={ink.id}
            className={`ink-item ${selectedInks.includes(ink.id) ? 'selected' : ''}`}
          >
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

            <div
              className="ink-preview"
              style={{
                backgroundColor: `lab(${ink.concentrations[100].L}% ${ink.concentrations[100].a} ${ink.concentrations[100].b})`,
              }}
            />
          </div>
        ))}
      </div>

      <div className="selection-info">선택된 잉크: {selectedInks.length}개</div>
    </div>
  );
};

export default InkSelector;
