import React, { useState, useEffect } from 'react';
import InkEditor from './InkEditor';
import type { Ink } from '../types';

interface InkManagerProps {
  inkDatabase: any;
  onInkUpdate?: () => void;
}

const InkManager: React.FC<InkManagerProps> = ({ inkDatabase, onInkUpdate }) => {
  const [inks, setInks] = useState<Ink[]>([]);
  const [editingInk, setEditingInk] = useState<Ink | null>(null);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customInk, setCustomInk] = useState<Ink>({
    id: '',
    name: '',
    type: 'custom',
    concentrations: {
      100: { L: 50, a: 0, b: 0 },
      70: { L: 65, a: 0, b: 0 },
      40: { L: 75, a: 0, b: 0 }
    }
  });

  useEffect(() => {
    // 모든 잉크 로드
    setInks([...inkDatabase.baseInks, ...inkDatabase.metallicInks]);
  }, [inkDatabase]);

  const handleInkSave = (updatedInk: Ink) => {
    // 데이터베이스 업데이트
    const inkIndex = inkDatabase.baseInks.findIndex((ink: Ink) => ink.id === updatedInk.id);
    if (inkIndex !== -1) {
      inkDatabase.baseInks[inkIndex] = updatedInk;
    } else {
      const metallicIndex = inkDatabase.metallicInks.findIndex((ink: Ink) => ink.id === updatedInk.id);
      if (metallicIndex !== -1) {
        inkDatabase.metallicInks[metallicIndex] = updatedInk;
      }
    }

    // 로컬 상태 업데이트
    setInks(prevInks => 
      prevInks.map(ink => ink.id === updatedInk.id ? updatedInk : ink)
    );

    // LocalStorage에 저장
    const customInks = {
      baseInks: inkDatabase.baseInks,
      metallicInks: inkDatabase.metallicInks
    };
    localStorage.setItem('customInkValues', JSON.stringify(customInks));

    // 부모 컴포넌트에 알림
    if (onInkUpdate) {
      onInkUpdate();
    }

    setEditingInk(null);
  };

  const handleAddCustomInk = () => {
    const newInk: Ink = {
      ...customInk,
      id: `custom_${Date.now()}`,
      type: 'custom'
    };

    // 데이터베이스에 추가
    if (inkDatabase.addCustomInk) {
      inkDatabase.addCustomInk(newInk);
    } else {
      // 직접 배열에 추가
      inkDatabase.baseInks.push(newInk);
    }
    
    // 로컬 상태 업데이트
    setInks(prev => [...prev, newInk]);
    
    // LocalStorage에 저장
    const customInks = {
      baseInks: inkDatabase.baseInks,
      metallicInks: inkDatabase.metallicInks
    };
    localStorage.setItem('customInkValues', JSON.stringify(customInks));
    
    // 초기화 및 닫기
    setCustomInk({
      id: '',
      name: '',
      type: 'custom',
      concentrations: {
        100: { L: 50, a: 0, b: 0 },
        70: { L: 65, a: 0, b: 0 },
        40: { L: 75, a: 0, b: 0 }
      }
    });
    setShowAddCustom(false);
    
    // 부모 컴포넌트에 알림
    if (onInkUpdate) {
      onInkUpdate();
    }
  };

  const handleExportInks = () => {
    const data = JSON.stringify({ baseInks: inks }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ink_database_${Date.now()}.json`;
    a.click();
  };

  const handleImportInks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported.baseInks) {
          // 데이터베이스 업데이트
          inkDatabase.baseInks = imported.baseInks.filter((ink: Ink) => ink.type !== 'metallic');
          inkDatabase.metallicInks = imported.baseInks.filter((ink: Ink) => ink.type === 'metallic');
          
          // 로컬 상태 업데이트
          setInks(imported.baseInks);
          
          // LocalStorage 저장
          localStorage.setItem('customInkValues', JSON.stringify(imported));
          
          alert('잉크 데이터를 성공적으로 가져왔습니다.');
        }
      } catch (error) {
        alert('파일을 읽는 중 오류가 발생했습니다.');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDefault = () => {
    if (confirm('모든 잉크 값을 기본값으로 초기화하시겠습니까?')) {
      localStorage.removeItem('customInkValues');
      window.location.reload();
    }
  };

  return (
    <div className="ink-manager">
      <div className="manager-header">
        <h2>🎨 베이스 잉크 관리</h2>
        <div className="manager-actions">
          <button className="btn btn-small" onClick={() => setShowAddCustom(true)}>
            + 커스텀 잉크 추가
          </button>
          <button className="btn btn-small" onClick={handleExportInks}>
            📥 내보내기
          </button>
          <label className="btn btn-small">
            📤 가져오기
            <input 
              type="file" 
              accept=".json"
              onChange={handleImportInks}
              style={{ display: 'none' }}
            />
          </label>
          <button className="btn btn-small btn-danger" onClick={handleResetToDefault}>
            🔄 초기화
          </button>
        </div>
      </div>

      <div className="ink-list">
        <table className="ink-table">
          <thead>
            <tr>
              <th>잉크명</th>
              <th>종류</th>
              <th>100% Lab</th>
              <th>70% Lab</th>
              <th>40% Lab</th>
              <th>색상</th>
              <th>편집</th>
            </tr>
          </thead>
          <tbody>
            {inks.map(ink => (
              <tr key={ink.id}>
                <td className="ink-name">{ink.name}</td>
                <td>
                  <span className={`type-badge ${ink.type}`}>{ink.type}</span>
                </td>
                <td className="lab-values">
                  L:{ink.concentrations[100].L.toFixed(1)} 
                  a:{ink.concentrations[100].a.toFixed(1)} 
                  b:{ink.concentrations[100].b.toFixed(1)}
                </td>
                <td className="lab-values">
                  {ink.concentrations[70] ? (
                    <>
                      L:{ink.concentrations[70].L.toFixed(1)} 
                      a:{ink.concentrations[70].a.toFixed(1)} 
                      b:{ink.concentrations[70].b.toFixed(1)}
                    </>
                  ) : '-'}
                </td>
                <td className="lab-values">
                  {ink.concentrations[40] ? (
                    <>
                      L:{ink.concentrations[40].L.toFixed(1)} 
                      a:{ink.concentrations[40].a.toFixed(1)} 
                      b:{ink.concentrations[40].b.toFixed(1)}
                    </>
                  ) : '-'}
                </td>
                <td>
                  <div className="color-samples">
                    <div 
                      className="color-sample"
                      style={{
                        backgroundColor: `lab(${ink.concentrations[100].L}% ${ink.concentrations[100].a} ${ink.concentrations[100].b})`
                      }}
                      title="100%"
                    />
                    {ink.concentrations[70] && (
                      <div 
                        className="color-sample"
                        style={{
                          backgroundColor: `lab(${ink.concentrations[70].L}% ${ink.concentrations[70].a} ${ink.concentrations[70].b})`
                        }}
                        title="70%"
                      />
                    )}
                    {ink.concentrations[40] && (
                      <div 
                        className="color-sample"
                        style={{
                          backgroundColor: `lab(${ink.concentrations[40].L}% ${ink.concentrations[40].a} ${ink.concentrations[40].b})`
                        }}
                        title="40%"
                      />
                    )}
                  </div>
                </td>
                <td>
                  <button 
                    className="btn btn-small btn-edit"
                    onClick={() => setEditingInk(ink)}
                  >
                    ✏️ 편집
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 커스텀 잉크 추가 모달 */}
      {showAddCustom && (
        <div className="custom-ink-modal">
          <div className="custom-ink-form">
            <h3>커스텀 잉크 추가</h3>
            <div className="form-group">
              <label>잉크명</label>
              <input
                type="text"
                value={customInk.name}
                onChange={(e) => setCustomInk(prev => ({ ...prev, name: e.target.value }))}
                placeholder="예: Special Red"
              />
            </div>
            
            <div className="concentration-section">
              <h4>100% 농도</h4>
              <div className="lab-inputs-row">
                <input
                  type="number"
                  placeholder="L*"
                  value={customInk.concentrations[100].L}
                  onChange={(e) => setCustomInk(prev => ({
                    ...prev,
                    concentrations: {
                      ...prev.concentrations,
                      100: { ...prev.concentrations[100], L: parseFloat(e.target.value) || 0 }
                    }
                  }))}
                />
                <input
                  type="number"
                  placeholder="a*"
                  value={customInk.concentrations[100].a}
                  onChange={(e) => setCustomInk(prev => ({
                    ...prev,
                    concentrations: {
                      ...prev.concentrations,
                      100: { ...prev.concentrations[100], a: parseFloat(e.target.value) || 0 }
                    }
                  }))}
                />
                <input
                  type="number"
                  placeholder="b*"
                  value={customInk.concentrations[100].b}
                  onChange={(e) => setCustomInk(prev => ({
                    ...prev,
                    concentrations: {
                      ...prev.concentrations,
                      100: { ...prev.concentrations[100], b: parseFloat(e.target.value) || 0 }
                    }
                  }))}
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-cancel"
                onClick={() => setShowAddCustom(false)}
              >
                취소
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleAddCustomInk}
                disabled={!customInk.name}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 잉크 편집 모달 */}
      {editingInk && (
        <InkEditor
          ink={editingInk}
          onSave={handleInkSave}
          onClose={() => setEditingInk(null)}
        />
      )}
    </div>
  );
};

export default InkManager;