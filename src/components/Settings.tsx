import React from 'react';

interface SettingsProps {
  manufacturerDB: any;
  deltaEMethod: string;
  setDeltaEMethod: (method: any) => void;
  setRecipeHistory: (history: any[]) => void;
  onShowInfo: (title: string, content: string | string[]) => void;
}

const Settings: React.FC<SettingsProps> = ({
  manufacturerDB,
  deltaEMethod,
  setDeltaEMethod,
  setRecipeHistory,
  onShowInfo,
}) => {
  return (
    <div className="pro-card">
      <div className="pro-card-header">
        <h2 className="pro-card-title">시스템 설정</h2>
      </div>
      <div className="pro-card-body">
        <div style={{ display: 'grid', gap: '32px' }}>
          {/* Ink Manufacturer Settings */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>
              잉크 제조사 설정
            </h3>
            <div className="data-grid">
              <div className="pro-input-group">
                <label className="pro-label">제조사 선택</label>
                <select
                  className="pro-input"
                  value={manufacturerDB.currentManufacturer}
                  onChange={(e) => {
                    manufacturerDB.setManufacturer(e.target.value);
                    onShowInfo('알림', '제조사가 변경되었습니다. 새로운 잉크 데이터가 적용됩니다.');
                  }}
                >
                  {manufacturerDB.manufacturers.map((mfg: any) => (
                    <option key={mfg.id} value={mfg.id}>
                      {mfg.name} ({mfg.country})
                    </option>
                  ))}
                </select>
              </div>

              <div className="value-box">
                <div className="value-label">현재 제조사 정보</div>
                <div className="value-content" style={{ fontSize: '1rem' }}>
                  {manufacturerDB.getCurrentManufacturer().data?.manufacturer}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '4px' }}>
                  시리즈: {manufacturerDB.getCurrentManufacturer().data?.series}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  잉크 수: {manufacturerDB.getCurrentInks().length}개
                </div>
              </div>
            </div>
          </div>

          {/* Delta E Settings */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>
              Delta E 계산 방법
            </h3>
            <div className="data-grid">
              <div className="pro-input-group">
                <label className="pro-label">계산 방법</label>
                <select
                  className="pro-input"
                  value={deltaEMethod}
                  onChange={(e) => setDeltaEMethod(e.target.value as any)}
                >
                  <option value="CIE2000">CIE2000 (권장)</option>
                  <option value="CIE1994">CIE1994</option>
                  <option value="CIE1976">CIE1976</option>
                  <option value="CMC">CMC</option>
                </select>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>
              디스플레이 설정
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" defaultChecked />
                <span>색상 정확도 경고 표시</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" defaultChecked />
                <span>LRV(Light Reflectance Value) 표시</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" />
                <span>메탈릭 잉크 표시</span>
              </label>
            </div>
          </div>

          {/* Data Management */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>데이터 관리</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="pro-button pro-button-secondary">레시피 내보내기</button>
              <button className="pro-button pro-button-secondary">레시피 가져오기</button>
              <button
                className="pro-button pro-button-secondary"
                style={{ marginLeft: 'auto', borderColor: '#dc3545', color: '#dc3545' }}
                onClick={() => {
                  if (confirm('모든 레시피 기록을 삭제하시겠습니까?')) {
                    localStorage.removeItem('recipeHistory');
                    setRecipeHistory([]);
                    onShowInfo('성공', '레시피 기록이 삭제되었습니다.');
                  }
                }}
              >
                기록 초기화
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
