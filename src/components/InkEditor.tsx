import React, { useState } from 'react';
import type { Ink } from '../types';

interface InkEditorProps {
  ink: Ink;
  onSave: (updatedInk: Ink) => void;
  onClose: () => void;
}

const InkEditor: React.FC<InkEditorProps> = ({ ink, onSave, onClose }) => {
  const [editedInk, setEditedInk] = useState<Ink>(JSON.parse(JSON.stringify(ink)));
  const [activeTab, setActiveTab] = useState<'100' | '70' | '40'>('100');

  const handleLabChange = (
    concentration: '100' | '70' | '40',
    component: 'L' | 'a' | 'b',
    value: string,
  ) => {
    const numValue = parseFloat(value) || 0;
    setEditedInk((prev) => ({
      ...prev,
      concentrations: {
        ...prev.concentrations,
        [concentration]: {
          ...prev.concentrations[concentration],
          [component]: numValue,
        },
      },
    }));
  };

  const handleSave = () => {
    onSave(editedInk);
    onClose();
  };

  const handleReset = () => {
    setEditedInk(JSON.parse(JSON.stringify(ink)));
  };

  return (
    <div className="ink-editor-modal">
      <div className="ink-editor">
        <div className="editor-header">
          <h3>{ink.name} 잉크 편집</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="editor-body">
          <div className="concentration-tabs">
            <button
              className={`tab ${activeTab === '100' ? 'active' : ''}`}
              onClick={() => setActiveTab('100')}
            >
              100%
            </button>
            {editedInk.concentrations[70] && (
              <button
                className={`tab ${activeTab === '70' ? 'active' : ''}`}
                onClick={() => setActiveTab('70')}
              >
                70% (Satin)
              </button>
            )}
            {editedInk.concentrations[40] && (
              <button
                className={`tab ${activeTab === '40' ? 'active' : ''}`}
                onClick={() => setActiveTab('40')}
              >
                40% (Satin)
              </button>
            )}
          </div>

          <div className="lab-inputs">
            <div className="input-row">
              <label>L*</label>
              <input
                type="number"
                value={editedInk.concentrations[activeTab]?.L || 0}
                onChange={(e) => handleLabChange(activeTab, 'L', e.target.value)}
                min="0"
                max="100"
                step="0.1"
              />
              <span className="range">(0-100)</span>
            </div>
            <div className="input-row">
              <label>a*</label>
              <input
                type="number"
                value={editedInk.concentrations[activeTab]?.a || 0}
                onChange={(e) => handleLabChange(activeTab, 'a', e.target.value)}
                min="-128"
                max="128"
                step="0.1"
              />
              <span className="range">(-128 to 128)</span>
            </div>
            <div className="input-row">
              <label>b*</label>
              <input
                type="number"
                value={editedInk.concentrations[activeTab]?.b || 0}
                onChange={(e) => handleLabChange(activeTab, 'b', e.target.value)}
                min="-128"
                max="128"
                step="0.1"
              />
              <span className="range">(-128 to 128)</span>
            </div>
          </div>

          <div className="color-preview-section">
            <h4>색상 미리보기</h4>
            <div className="preview-grid">
              {(['100', '70', '40'] as const).map((conc) => {
                const labValues = editedInk.concentrations[conc];
                if (!labValues) return null;

                return (
                  <div key={conc} className="preview-item">
                    <div
                      className="color-swatch"
                      style={{
                        backgroundColor: `lab(${labValues.L}% ${labValues.a} ${labValues.b})`,
                      }}
                    />
                    <div className="preview-label">{conc}%</div>
                    <div className="lab-text">
                      L:{labValues.L.toFixed(1)}
                      a:{labValues.a.toFixed(1)}
                      b:{labValues.b.toFixed(1)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="all-values">
            <h4>모든 농도 값</h4>
            <table className="values-table">
              <thead>
                <tr>
                  <th>농도</th>
                  <th>L*</th>
                  <th>a*</th>
                  <th>b*</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>100%</td>
                  <td>{editedInk.concentrations[100].L.toFixed(1)}</td>
                  <td>{editedInk.concentrations[100].a.toFixed(1)}</td>
                  <td>{editedInk.concentrations[100].b.toFixed(1)}</td>
                </tr>
                {editedInk.concentrations[70] && (
                  <tr>
                    <td>70%</td>
                    <td>{editedInk.concentrations[70].L.toFixed(1)}</td>
                    <td>{editedInk.concentrations[70].a.toFixed(1)}</td>
                    <td>{editedInk.concentrations[70].b.toFixed(1)}</td>
                  </tr>
                )}
                {editedInk.concentrations[40] && (
                  <tr>
                    <td>40%</td>
                    <td>{editedInk.concentrations[40].L.toFixed(1)}</td>
                    <td>{editedInk.concentrations[40].a.toFixed(1)}</td>
                    <td>{editedInk.concentrations[40].b.toFixed(1)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="editor-footer">
          <button className="btn btn-secondary" onClick={handleReset}>
            초기값으로 리셋
          </button>
          <div className="action-buttons">
            <button className="btn btn-cancel" onClick={onClose}>
              취소
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InkEditor;
