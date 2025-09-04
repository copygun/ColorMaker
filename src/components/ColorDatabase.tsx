import React, { useState } from 'react';

interface EditingInk {
  ink: any;
  concentration: number;
  current: { L: number; a: number; b: number };
}

interface ColorDatabaseProps {
  inkDB: any;
  customInkValues: any;
  setCustomInkValues: (values: any) => void;
  selectedInksForProfile: string[];
  setSelectedInksForProfile: (inks: string[]) => void;
  labToRgb: (L: number, a: number, b: number) => { r: number; g: number; b: number };
  saveVendorProfile: (profileName: string, preparedInks: string[], customValues: any) => Promise<any>;
  setShowVendorModal: (show: boolean) => void;
  onShowInfo: (title: string, content: string | string[]) => void;
}

const ColorDatabase: React.FC<ColorDatabaseProps> = ({
  inkDB,
  customInkValues,
  setCustomInkValues,
  selectedInksForProfile,
  setSelectedInksForProfile,
  labToRgb,
  saveVendorProfile,
  setShowVendorModal,
  onShowInfo
}) => {
  const [editingInk, setEditingInk] = useState<EditingInk | null>(null);

  // 사용자 정의 값과 원본 값 병합
  const getInkLabValue = (inkId: string, concentration: number) => {
    if (customInkValues[inkId] && customInkValues[inkId][concentration]) {
      return customInkValues[inkId][concentration];
    }
    const ink = inkDB.getInkById(inkId);
    return ink?.concentrations?.[concentration] || { L: 0, a: 0, b: 0 };
  };

  const saveCustomValue = (inkId: string, concentration: number, lab: any) => {
    const newValues = {
      ...customInkValues,
      [inkId]: {
        ...customInkValues[inkId],
        [concentration]: lab
      }
    };
    setCustomInkValues(newValues);
    // Save to default storage for now
    localStorage.setItem('customInkValues_default', JSON.stringify(newValues));
  };

  const resetToDefault = (inkId: string) => {
    const newValues = { ...customInkValues };
    delete newValues[inkId];
    setCustomInkValues(newValues);
    // Save to default storage
    localStorage.setItem('customInkValues_default', JSON.stringify(newValues));
  };
  
  const saveAsProfile = async () => {
    const profileName = prompt('협력사 프로파일 이름을 입력하세요:');
    if (!profileName) return;
    
    // Get selected inks (those with custom values or explicitly selected)
    const preparedInks = selectedInksForProfile.length > 0 
      ? selectedInksForProfile 
      : Object.keys(customInkValues);
    
    if (preparedInks.length === 0) {
      onShowInfo('알림', '먼저 잉크를 선택하거나 Lab 값을 수정해주세요.');
      return;
    }
    
    // Check if Process Inks are included for spot ink recipe calculation
    const hasProcessInks = preparedInks.some(id => 
      ['cyan', 'magenta', 'yellow', 'black', 'white'].includes(id)
    );
    
    if (!hasProcessInks) {
      onShowInfo('알림', 'Spot Ink 레시피 계산을 위해 Process Inks(CMYK)를 포함해야 합니다.');
      return;
    }
    
    onShowInfo('처리 중', '  Spot Ink 레시피를 계산 중입니다...');
    const profile = await saveVendorProfile(profileName, preparedInks, customInkValues);
    
    // Show spot ink recipes
    if (profile.spotInkRecipes && Object.keys(profile.spotInkRecipes).length > 0) {
      const recipeInfo: string[] = [`"${profileName}" 프로파일이 저장되었습니다.`, '', 'Spot Ink 레시피가 계산되었습니다:', ''];
      
      for (const [spotInkId, recipe] of Object.entries<any>(profile.spotInkRecipes)) {
        const spotInk = inkDB.getInkById(spotInkId);
        if (spotInk && recipe.recipe) {
          recipeInfo.push(`${spotInk.name}:`);
          recipe.recipe.forEach((item: any) => {
            const ink = inkDB.getInkById(item.inkId);
            recipeInfo.push(`  - ${ink?.name || item.inkId}: ${item.percentage.toFixed(1)}%`);
          });
          recipeInfo.push('');
        }
      }
      recipeInfo.push('프로파일 완성을 위해 각 Spot Ink의 실제 Lab 값을 측정하여 입력해주세요.');
      onShowInfo('Spot Ink 레시피', recipeInfo);
    } else {
      onShowInfo('성공', `"${profileName}" 프로파일이 저장되었습니다.`);
    }
    
    setSelectedInksForProfile([]);
  };

  return (
    <>
      <div className="pro-card">
        <div className="pro-card-header">
          <h2 className="pro-card-title">
            색상 데이터베이스
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="pro-button pro-button-primary"
                onClick={saveAsProfile}
                disabled={Object.keys(customInkValues).length === 0 && selectedInksForProfile.length === 0}
              >
                협력사 프로파일로 저장
              </button>
              <button
                className="pro-button pro-button-secondary"
                onClick={() => setShowVendorModal(true)}
              >
                프로파일 관리
              </button>
              <button
                className="pro-button pro-button-secondary"
                onClick={() => {
                  if (confirm('모든 커스텀 잉크 값을 초기화하시겠습니까?')) {
                    localStorage.removeItem('customInkValues_default');
                    setCustomInkValues({});
                    setSelectedInksForProfile([]);
                  }
                }}
              >
                전체 초기화
              </button>
            </div>
          </h2>
        </div>
        <div className="pro-card-body">
          <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
              💡 각 잉크의 Lab 값을 클릭하여 수정할 수 있습니다. 실제 측정값과 차이가 있을 경우 보정하세요.
            </p>
          </div>
          <table className="pro-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInksForProfile(inkDB.getAllInks().map((ink: any) => ink.id));
                      } else {
                        setSelectedInksForProfile([]);
                      }
                    }}
                    checked={selectedInksForProfile.length === inkDB.getAllInks().length}
                  />
                </th>
                <th>잉크명</th>
                <th>타입</th>
                <th>L* (100%)</th>
                <th>a* (100%)</th>
                <th>b* (100%)</th>
                <th>L* (70%)</th>
                <th>a* (70%)</th>
                <th>b* (70%)</th>
                <th>L* (40%)</th>
                <th>a* (40%)</th>
                <th>b* (40%)</th>
                <th>색상</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {inkDB.getAllInks().map((ink: any) => {
                const lab100 = getInkLabValue(ink.id, 100);
                const lab70 = getInkLabValue(ink.id, 70);
                const lab40 = getInkLabValue(ink.id, 40);
                const rgbColor = labToRgb(lab100.L, lab100.a, lab100.b);
                const hasCustom = !!customInkValues[ink.id];
                
                return (
                  <tr key={ink.id} style={{ backgroundColor: hasCustom ? '#fff3cd' : 'transparent' }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedInksForProfile.includes(ink.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInksForProfile([...selectedInksForProfile, ink.id]);
                          } else {
                            setSelectedInksForProfile(selectedInksForProfile.filter(id => id !== ink.id));
                          }
                        }}
                      />
                    </td>
                    <td>
                      {ink.name}
                      {hasCustom && <span style={{ color: '#856404', fontSize: '0.75rem', marginLeft: '4px' }}>(수정됨)</span>}
                    </td>
                    <td>{ink.type}</td>
                    <td>{lab100.L.toFixed(1)}</td>
                    <td>{lab100.a.toFixed(1)}</td>
                    <td>{lab100.b.toFixed(1)}</td>
                    <td>{lab70.L.toFixed(1)}</td>
                    <td>{lab70.a.toFixed(1)}</td>
                    <td>{lab70.b.toFixed(1)}</td>
                    <td>{lab40.L.toFixed(1)}</td>
                    <td>{lab40.a.toFixed(1)}</td>
                    <td>
                      {lab40.b.toFixed(1)}
                    </td>
                    <td>
                      <div style={{
                        width: '30px',
                        height: '20px',
                        backgroundColor: `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`,
                        border: '1px solid #dee2e6',
                        borderRadius: '3px'
                      }} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          className="pro-button pro-button-secondary"
                          style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                          onClick={() => setEditingInk({ ink, concentration: 100, current: lab100 })}
                        >
                          수정
                        </button>
                        {hasCustom && (
                          <button
                            className="pro-button pro-button-secondary"
                            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                            onClick={() => resetToDefault(ink.id)}
                          >
                            초기화
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingInk && (
        <div className="modal-overlay" onClick={() => setEditingInk(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <button 
              className="modal-close" 
              onClick={() => setEditingInk(null)}
            >
              ×
            </button>
            <h3 style={{ marginBottom: '24px' }}>
              {editingInk.ink.name} - CIELAB 값 수정
            </h3>
            
            {/* Concentration Tabs */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #dee2e6' }}>
                {[100, 70, 40].map(conc => (
                  <button
                    key={conc}
                    className={`tab-button ${editingInk.concentration === conc ? 'active' : ''}`}
                    onClick={() => {
                      const labValue = customInkValues[editingInk.ink.id]?.[conc] || 
                                     editingInk.ink.concentrations?.[conc] || 
                                     { L: 50, a: 0, b: 0 };
                      setEditingInk({ ...editingInk, concentration: conc, current: labValue });
                    }}
                    style={{ flex: 1 }}
                  >
                    {conc}%
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <h4 style={{ fontSize: '0.875rem', marginBottom: '8px', color: '#495057' }}>
                현재 값 ({editingInk.concentration}%)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>L*</span>
                  <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{editingInk.current.L.toFixed(1)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>a*</span>
                  <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{editingInk.current.a.toFixed(1)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>b*</span>
                  <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{editingInk.current.b.toFixed(1)}</div>
                </div>
              </div>
            </div>
            
            <h4 style={{ fontSize: '0.875rem', marginBottom: '12px', color: '#495057' }}>
              새 CIELAB 값 입력
            </h4>
            <div className="data-grid" style={{ gap: '16px' }}>
              <div className="pro-input-group">
                <label className="pro-label">L* (Lightness)</label>
                <input
                  type="number"
                  className="pro-input"
                  defaultValue={editingInk.current.L}
                  step="0.1"
                  min="0"
                  max="100"
                  id="edit-L"
                />
              </div>
              <div className="pro-input-group">
                <label className="pro-label">a* (Red-Green)</label>
                <input
                  type="number"
                  className="pro-input"
                  defaultValue={editingInk.current.a}
                  step="0.1"
                  min="-128"
                  max="127"
                  id="edit-a"
                />
              </div>
              <div className="pro-input-group">
                <label className="pro-label">b* (Yellow-Blue)</label>
                <input
                  type="number"
                  className="pro-input"
                  defaultValue={editingInk.current.b}
                  step="0.1"
                  min="-128"
                  max="127"
                  id="edit-b"
                />
              </div>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                className="pro-button pro-button-secondary"
                onClick={() => setEditingInk(null)}
              >
                취소
              </button>
              <button
                className="pro-button pro-button-primary"
                onClick={() => {
                  const L = parseFloat((document.getElementById('edit-L') as HTMLInputElement).value);
                  const a = parseFloat((document.getElementById('edit-a') as HTMLInputElement).value);
                  const b = parseFloat((document.getElementById('edit-b') as HTMLInputElement).value);
                  
                  if (!isNaN(L) && !isNaN(a) && !isNaN(b)) {
                    saveCustomValue(editingInk.ink.id, editingInk.concentration, { L, a, b });
                    setEditingInk(null);
                  }
                }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ColorDatabase;