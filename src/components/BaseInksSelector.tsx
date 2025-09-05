import React from 'react';

interface Ink {
  id: string;
  name: string;
  type?: string;
  concentrations?: {
    [key: number]: { L: number; a: number; b: number };
  };
}

interface BaseInksSelectorProps {
  selectedInks: string[];
  setSelectedInks: (inks: string[]) => void;
  inkDB: any;
  labToRgb: (L: number, a: number, b: number) => { r: number; g: number; b: number };
  onShowInfo?: (title: string, content: string[]) => void;
}

const BaseInksSelector: React.FC<BaseInksSelectorProps> = ({
  selectedInks,
  setSelectedInks,
  inkDB,
  labToRgb,
  onShowInfo,
}) => {
  const handleInkToggle = (inkId: string, checked: boolean) => {
    if (checked) {
      setSelectedInks([...selectedInks, inkId]);
    } else {
      setSelectedInks(selectedInks.filter((i) => i !== inkId));
    }
  };

  const showInkInfo = (ink: Ink) => {
    const info = [];
    info.push(`${ink.name} 잉크 정보:`);
    info.push('');
    if (ink.concentrations) {
      Object.entries(ink.concentrations).forEach(([conc, lab]) => {
        info.push(`${conc}% 농도:`);
        info.push(`  Lab: L=${lab.L}, a=${lab.a}, b=${lab.b}`);
        const rgb = labToRgb(lab.L, lab.a, lab.b);
        info.push(`  RGB: R=${Math.round(rgb.r)}, G=${Math.round(rgb.g)}, B=${Math.round(rgb.b)}`);
      });
    }
    if (onShowInfo) {
      onShowInfo(`${ink.name} 잉크 정보`, info);
    }
  };

  const handleGroupSelectAll = (inks: Ink[]) => {
    const inkIds = inks.map((ink) => ink.id);
    const newSelectedInks = [...new Set([...selectedInks, ...inkIds])];
    setSelectedInks(newSelectedInks);
  };

  const handleGroupDeselectAll = (inks: Ink[]) => {
    const inkIds = inks.map((ink) => ink.id);
    setSelectedInks(selectedInks.filter((id) => !inkIds.includes(id)));
  };

  const renderInkGroup = (title: string, inks: Ink[], specialStyle?: 'fluorescent' | 'medium') => {
    return (
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '0.7rem', color: '#666' }}>{title}</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => handleGroupSelectAll(inks)}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
              title={`${title} 전체 선택`}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => handleGroupDeselectAll(inks)}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
              title={`${title} 전체 해제`}
            >
              해제
            </button>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            maxHeight: '250px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {inks.map((ink) => {
            const inkLab = ink.concentrations?.[100] || { L: 50, a: 0, b: 0 };
            const inkRgb = labToRgb(inkLab.L, inkLab.a, inkLab.b);
            const inkColor = `rgb(${Math.round(inkRgb.r)}, ${Math.round(inkRgb.g)}, ${Math.round(inkRgb.b)})`;

            let colorBoxStyle: React.CSSProperties = {
              width: '20px',
              height: '20px',
              backgroundColor: inkColor,
              border: '1px solid #ccc',
              borderRadius: '3px',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
            };

            if (specialStyle === 'fluorescent') {
              colorBoxStyle = {
                ...colorBoxStyle,
                border: `2px solid ${inkColor}`,
                boxShadow: `0 0 8px ${inkColor}, inset 0 0 8px rgba(255,255,255,0.3)`,
                background: `linear-gradient(135deg, ${inkColor} 0%, rgba(255,255,255,0.3) 50%, ${inkColor} 100%)`,
              };
            } else if (specialStyle === 'medium') {
              const mediumColor =
                ink.id === 'transparent_white'
                  ? 'rgba(255, 255, 255, 0.8)'
                  : ink.id === 'extender'
                    ? 'rgba(240, 240, 240, 0.5)'
                    : 'rgba(255, 255, 255, 0.3)';
              colorBoxStyle = {
                ...colorBoxStyle,
                backgroundColor: mediumColor,
                backgroundImage:
                  'linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%, #ddd), linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%, #ddd)',
                backgroundSize: '10px 10px',
                backgroundPosition: '0 0, 5px 5px',
              };
            }

            return (
              <label
                key={ink.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  paddingLeft: '8px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedInks.includes(ink.id)}
                  onChange={(e) => handleInkToggle(ink.id, e.target.checked)}
                />
                <div
                  style={colorBoxStyle}
                  title={specialStyle === 'fluorescent' ? 'Fluorescent' : ''}
                />
                <span style={{ textTransform: 'capitalize', flex: 1 }}>{ink.name}</span>
                {title !== 'Fluorescent Inks' && title !== 'Medium' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      showInkInfo(ink);
                    }}
                    style={{
                      padding: '2px 6px',
                      fontSize: '11px',
                      backgroundColor: '#f0f0f0',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                    title="잉크 정보 보기"
                  >
                    ?
                  </button>
                )}
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h3
        style={{
          fontSize: '0.8125rem',
          fontWeight: 600,
          marginBottom: '12px',
          textTransform: 'uppercase',
        }}
      >
        Base Inks
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {renderInkGroup('Process Inks', inkDB.getProcessInks())}
        {renderInkGroup('Spot Inks', inkDB.getSpotInks())}
        {renderInkGroup(
          'Fluorescent Inks',
          inkDB.getFluorescentInks ? inkDB.getFluorescentInks() : [],
          'fluorescent',
        )}
        {renderInkGroup(
          'Medium',
          inkDB.getAllInks().filter((ink: Ink) => ink.type === 'medium'),
          'medium',
        )}
      </div>
    </div>
  );
};

export default BaseInksSelector;
