import React, { useState, useCallback } from 'react';
import type { LabColor } from '../types';

interface ProfessionalMixingProps {
  targetColor: LabColor;
}

const ProfessionalMixing: React.FC<ProfessionalMixingProps> = ({ targetColor }) => {
  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'regular' | 'fluorescent' | 'spectral'>('regular');

  const [options, setOptions] = useState({
    maxInks: 4,
    includeWhite: true,
    includeFluorescent: true,
    useSpectralModel: true,
    checkMetamerism: true,
    targetIlluminant: 'D50',
    costWeight: 0.2,
  });

  const calculateProfessionalMix = useCallback(async () => {
    setIsCalculating(true);

    try {
      // Dynamic import로 엔진 로드
      const { ProfessionalMixingEngine } = await import('../../core/professionalMixingEngine.js');
      const engine = new ProfessionalMixingEngine();

      // 설정 업데이트
      engine.settings.useFluorescent = options.includeFluorescent;
      engine.settings.useSpectralPrediction = options.useSpectralModel;
      engine.settings.checkMetamerism = options.checkMetamerism;
      engine.settings.targetIlluminant = options.targetIlluminant;

      // 전문가용 계산
      const professionalResult = await engine.findProfessionalMix(targetColor, {
        maxInks: options.maxInks,
        includeWhite: options.includeWhite,
        costWeight: options.costWeight,
        concentrations: [100, 70, 40],
      });

      setResult(professionalResult);
    } catch (error) {
      console.error('Professional calculation failed:', error);
      alert('계산 중 오류가 발생했습니다.');
    } finally {
      setIsCalculating(false);
    }
  }, [targetColor, options]);

  const getQualityBadgeClass = (quality: string) => {
    const q = quality?.toLowerCase();
    if (q === 'perfect' || q === 'excellent') return 'quality-excellent';
    if (q === 'very good' || q === 'good') return 'quality-good';
    if (q === 'acceptable') return 'quality-fair';
    return 'quality-poor';
  };

  return (
    <div className="professional-mixing">
      <h3>🔬 전문가용 고급 잉크 배합 시스템</h3>

      {/* 옵션 패널 */}
      <div className="options-panel">
        <h4>⚙️ 고급 설정</h4>

        <div className="option-row">
          <div className="option-group">
            <label>최대 잉크 수:</label>
            <select
              value={options.maxInks}
              onChange={(e) => setOptions({ ...options, maxInks: parseInt(e.target.value) })}
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}개
                </option>
              ))}
            </select>
          </div>

          <div className="option-group">
            <label>목표 조명:</label>
            <select
              value={options.targetIlluminant}
              onChange={(e) => setOptions({ ...options, targetIlluminant: e.target.value })}
            >
              <option value="D50">D50 (인쇄 표준)</option>
              <option value="D65">D65 (주광)</option>
              <option value="F11">F11 (형광등)</option>
              <option value="A">A (백열등)</option>
            </select>
          </div>
        </div>

        <div className="checkbox-row">
          <label>
            <input
              type="checkbox"
              checked={options.includeWhite}
              onChange={(e) => setOptions({ ...options, includeWhite: e.target.checked })}
            />
            화이트 포함
          </label>

          <label>
            <input
              type="checkbox"
              checked={options.includeFluorescent}
              onChange={(e) => setOptions({ ...options, includeFluorescent: e.target.checked })}
            />
            <span className="fluorescent-label">형광 잉크 사용</span>
          </label>

          <label>
            <input
              type="checkbox"
              checked={options.useSpectralModel}
              onChange={(e) => setOptions({ ...options, useSpectralModel: e.target.checked })}
            />
            스펙트럼 예측
          </label>

          <label>
            <input
              type="checkbox"
              checked={options.checkMetamerism}
              onChange={(e) => setOptions({ ...options, checkMetamerism: e.target.checked })}
            />
            메타메리즘 체크
          </label>
        </div>

        <div className="option-group">
          <label>비용 가중치: {options.costWeight.toFixed(1)}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={options.costWeight}
            onChange={(e) => setOptions({ ...options, costWeight: parseFloat(e.target.value) })}
          />
        </div>

        <button
          className="calculate-btn professional"
          onClick={calculateProfessionalMix}
          disabled={isCalculating}
        >
          {isCalculating ? '고급 분석 중...' : '🔬 전문가 분석 실행'}
        </button>
      </div>

      {/* 결과 표시 */}
      {result && (
        <div className="result-panel">
          <h4>📊 전문가 분석 결과</h4>

          {/* 색상 품질 */}
          <div className="quality-section">
            <div className="quality-header">
              <span className={`quality-badge ${getQualityBadgeClass(result.colorData?.quality)}`}>
                {result.colorData?.quality}
              </span>
              <span className="delta-e">ΔE: {result.colorData?.deltaE?.toFixed(2)}</span>
              <span className="mix-type">
                {result.type === 'fluorescent'
                  ? '🌟 형광'
                  : result.type === 'spectral'
                    ? '🌈 스펙트럼'
                    : '🎨 일반'}
              </span>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'regular' ? 'active' : ''}`}
              onClick={() => setActiveTab('regular')}
            >
              기본 레시피
            </button>
            {result.fluorescenceData && (
              <button
                className={`tab ${activeTab === 'fluorescent' ? 'active' : ''}`}
                onClick={() => setActiveTab('fluorescent')}
              >
                형광 분석
              </button>
            )}
            {result.spectralData && (
              <button
                className={`tab ${activeTab === 'spectral' ? 'active' : ''}`}
                onClick={() => setActiveTab('spectral')}
              >
                스펙트럼 분석
              </button>
            )}
          </div>

          {/* 탭 컨텐츠 */}
          <div className="tab-content">
            {activeTab === 'regular' && (
              <div className="recipe-section">
                <h5>📋 잉크 배합 레시피</h5>
                <table className="recipe-table">
                  <thead>
                    <tr>
                      <th>순서</th>
                      <th>잉크</th>
                      <th>농도</th>
                      <th>비율</th>
                      <th>타입</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.recipe?.inks?.map((ink: any, idx: number) => (
                      <tr key={idx} className={ink.type === 'fluorescent' ? 'fluorescent-row' : ''}>
                        <td>{idx + 1}</td>
                        <td>{ink.name}</td>
                        <td>{ink.concentration}%</td>
                        <td>{ink.percentage}%</td>
                        <td>
                          {ink.type === 'fluorescent' ? '형광' : ink.isSatin ? 'Satin' : 'Base'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 생산 지침 */}
                {result.production && (
                  <div className="production-section">
                    <h5>🏭 생산 지침</h5>
                    <div className="instructions">
                      {result.production.mixingInstructions?.map(
                        (instruction: string, idx: number) => (
                          <div key={idx} className="instruction-item">
                            {instruction}
                          </div>
                        ),
                      )}
                    </div>

                    <div className="cost-info">
                      <span>비용 수준: </span>
                      <span className={`cost-level ${result.production.costAnalysis?.costLevel}`}>
                        {result.production.costAnalysis?.costLevel}
                      </span>
                      {result.production.costAnalysis?.costFactors?.map(
                        (factor: string, idx: number) => (
                          <div key={idx} className="cost-factor">
                            • {factor}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'fluorescent' && result.fluorescenceData && (
              <div className="fluorescence-section">
                <h5>🌟 형광 효과 분석</h5>
                <div className="fluor-info">
                  <div>
                    효과적 형광도: {result.fluorescenceData.effectiveFluorescence?.toFixed(2)}
                  </div>
                  <div>
                    권장 UV 강도:{' '}
                    {(result.fluorescenceData.recommendedUVIntensity * 100).toFixed(0)}%
                  </div>
                  {result.fluorescenceData.uvAppearance && (
                    <div className="uv-appearance">
                      <h6>UV 조명 하 예상 색상:</h6>
                      <div>L: {result.fluorescenceData.uvAppearance.L?.toFixed(1)}</div>
                      <div>a: {result.fluorescenceData.uvAppearance.a?.toFixed(1)}</div>
                      <div>b: {result.fluorescenceData.uvAppearance.b?.toFixed(1)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'spectral' && result.spectralData && (
              <div className="spectral-section">
                <h5>🌈 스펙트럼 예측 분석</h5>
                <div className="illuminant-comparison">
                  <h6>조명별 색상 예측:</h6>
                  <table className="illuminant-table">
                    <thead>
                      <tr>
                        <th>조명</th>
                        <th>L*</th>
                        <th>a*</th>
                        <th>b*</th>
                        <th>ΔE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(result.spectralData.appearances || {}).map(
                        ([illum, lab]: [string, any]) => (
                          <tr key={illum}>
                            <td>{illum}</td>
                            <td>{lab.L?.toFixed(1)}</td>
                            <td>{lab.a?.toFixed(1)}</td>
                            <td>{lab.b?.toFixed(1)}</td>
                            <td>{result.metamerism?.deltaEs?.[illum]?.toFixed(2)}</td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* 메타메리즘 경고 */}
          {result.metamerism && (
            <div
              className={`metamerism-warning ${result.metamerism.isMetameric ? 'warning' : 'safe'}`}
            >
              {result.metamerism.warning}
              {result.metamerism.isMetameric && (
                <div className="metamerism-index">
                  메타메리즘 지수: {result.metamerism.metamerismIndex?.toFixed(2)}
                </div>
              )}
            </div>
          )}

          {/* 권장사항 */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="recommendations">
              <h5>💡 전문가 권장사항</h5>
              {result.recommendations.map((rec: any, idx: number) => (
                <div key={idx} className={`recommendation ${rec.type}`}>
                  <span className="rec-icon">
                    {rec.type === 'critical' ? '⚠️' : rec.type === 'warning' ? '⚡' : 'ℹ️'}
                  </span>
                  {rec.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .professional-mixing {
          padding: 25px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 15px;
          margin: 20px 0;
        }
        
        .professional-mixing h3 {
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 24px;
        }
        
        .options-panel {
          background: white;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 25px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .option-row {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
        }
        
        .option-group {
          flex: 1;
        }
        
        .option-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #555;
        }
        
        .option-group select,
        .option-group input[type="range"] {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 5px;
        }
        
        .checkbox-row {
          display: flex;
          gap: 20px;
          margin: 20px 0;
          flex-wrap: wrap;
        }
        
        .checkbox-row label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        
        .fluorescent-label {
          background: linear-gradient(90deg, #ff00ff, #00ffff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: bold;
        }
        
        .calculate-btn.professional {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 20px;
          transition: all 0.3s ease;
        }
        
        .calculate-btn.professional:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        
        .calculate-btn.professional:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .result-panel {
          background: white;
          padding: 25px;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        
        .quality-section {
          margin-bottom: 20px;
        }
        
        .quality-header {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .quality-badge {
          padding: 8px 20px;
          border-radius: 25px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .quality-excellent {
          background: #4caf50;
          color: white;
        }
        
        .quality-good {
          background: #8bc34a;
          color: white;
        }
        
        .quality-fair {
          background: #ffc107;
          color: #333;
        }
        
        .quality-poor {
          background: #f44336;
          color: white;
        }
        
        .delta-e {
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }
        
        .mix-type {
          margin-left: auto;
          padding: 5px 15px;
          background: #e3f2fd;
          border-radius: 15px;
          font-weight: 600;
        }
        
        .tabs {
          display: flex;
          gap: 10px;
          margin: 20px 0;
          border-bottom: 2px solid #e0e0e0;
        }
        
        .tab {
          padding: 10px 20px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-weight: 600;
          color: #666;
          transition: all 0.3s ease;
        }
        
        .tab:hover {
          color: #333;
        }
        
        .tab.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }
        
        .tab-content {
          padding: 20px 0;
        }
        
        .recipe-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        
        .recipe-table th,
        .recipe-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .recipe-table th {
          background: #f5f5f5;
          font-weight: bold;
        }
        
        .fluorescent-row {
          background: linear-gradient(90deg, rgba(255,0,255,0.1), rgba(0,255,255,0.1));
        }
        
        .production-section {
          margin-top: 30px;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
        }
        
        .production-section h5 {
          color: #333;
          margin-bottom: 15px;
        }
        
        .instructions {
          margin: 15px 0;
        }
        
        .instruction-item {
          padding: 8px;
          margin: 5px 0;
          background: white;
          border-left: 3px solid #667eea;
          border-radius: 4px;
        }
        
        .cost-info {
          margin-top: 20px;
          padding: 15px;
          background: #fff3e0;
          border-radius: 8px;
        }
        
        .cost-level {
          font-weight: bold;
          padding: 3px 10px;
          border-radius: 12px;
          margin-left: 10px;
        }
        
        .cost-level.낮음 {
          background: #c8e6c9;
          color: #2e7d32;
        }
        
        .cost-level.중간 {
          background: #fff3e0;
          color: #f57c00;
        }
        
        .cost-level.높음 {
          background: #ffcdd2;
          color: #c62828;
        }
        
        .cost-factor {
          margin-top: 8px;
          color: #666;
          font-size: 14px;
        }
        
        .fluorescence-section,
        .spectral-section {
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .fluor-info {
          padding: 15px;
          background: linear-gradient(135deg, rgba(255,0,255,0.1), rgba(0,255,255,0.1));
          border-radius: 8px;
          margin: 15px 0;
        }
        
        .uv-appearance {
          margin-top: 15px;
          padding: 10px;
          background: white;
          border-radius: 5px;
        }
        
        .illuminant-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        
        .illuminant-table th,
        .illuminant-table td {
          padding: 10px;
          text-align: center;
          border: 1px solid #e0e0e0;
        }
        
        .illuminant-table th {
          background: #667eea;
          color: white;
        }
        
        .metamerism-warning {
          margin-top: 20px;
          padding: 15px;
          border-radius: 8px;
          font-weight: 600;
        }
        
        .metamerism-warning.warning {
          background: #fff3e0;
          border: 2px solid #ff9800;
          color: #e65100;
        }
        
        .metamerism-warning.safe {
          background: #e8f5e9;
          border: 2px solid #4caf50;
          color: #2e7d32;
        }
        
        .metamerism-index {
          margin-top: 8px;
          font-size: 14px;
          color: #666;
        }
        
        .recommendations {
          margin-top: 25px;
          padding: 20px;
          background: #f0f4f8;
          border-radius: 10px;
        }
        
        .recommendations h5 {
          color: #2c3e50;
          margin-bottom: 15px;
        }
        
        .recommendation {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          margin: 8px 0;
          background: white;
          border-radius: 6px;
          border-left: 4px solid;
        }
        
        .recommendation.critical {
          border-left-color: #f44336;
          background: #ffebee;
        }
        
        .recommendation.warning {
          border-left-color: #ff9800;
          background: #fff3e0;
        }
        
        .recommendation.info {
          border-left-color: #2196f3;
          background: #e3f2fd;
        }
        
        .rec-icon {
          font-size: 20px;
        }
      `}</style>
    </div>
  );
};

export default ProfessionalMixing;
