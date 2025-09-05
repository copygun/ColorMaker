/**
 * 실측값 입력 및 관리 컴포넌트
 * 인쇄 후 실제 측정한 Lab 값을 입력하고 편차를 분석
 */

import React, { useState, useEffect } from 'react';
import { learningSystem, PrintResult } from '../services/LocalLearningSystem';
import type { Recipe, LabColor } from '../types';
import './PrintResultTracker.css';

interface PrintResultTrackerProps {
  currentRecipe?: Recipe | null;
  predictedLab?: LabColor;
  onCalibrationUpdate?: () => void;
}

const PrintResultTracker: React.FC<PrintResultTrackerProps> = ({
  currentRecipe,
  predictedLab,
  onCalibrationUpdate
}) => {
  const [actualLab, setActualLab] = useState<LabColor>({ L: 0, a: 0, b: 0 });
  const [printConditions, setPrintConditions] = useState({
    substrate: 'white_coated',
    printMethod: 'offset',
    meshCount: 0,
    squeegeeAngle: 0,
    pressure: 0,
    temperature: 25,
    humidity: 50,
    dotGain: 15,
    inkBrand: '',
    notes: ''
  });
  
  const [showHistory, setShowHistory] = useState(false);
  const [recentResults, setRecentResults] = useState<PrintResult[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [activeProfile, setActiveProfile] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadRecentResults();
    updateStatistics();
    setActiveProfile(learningSystem.getActiveProfileId());
  }, []);

  const loadRecentResults = () => {
    const results = learningSystem.getAllPrintResults();
    setRecentResults(results.slice(-10).reverse());
  };

  const updateStatistics = () => {
    const stats = learningSystem.getStatistics();
    setStatistics(stats);
  };

  const calculateDeltaE = (lab1: LabColor, lab2: LabColor): number => {
    // CIE2000 Delta E 간단 계산
    const dL = lab1.L - lab2.L;
    const da = lab1.a - lab2.a;
    const db = lab1.b - lab2.b;
    
    const C1 = Math.sqrt(lab1.a ** 2 + lab1.b ** 2);
    const C2 = Math.sqrt(lab2.a ** 2 + lab2.b ** 2);
    const dC = C1 - C2;
    
    const dH = Math.sqrt(da ** 2 + db ** 2 - dC ** 2);
    
    const SL = 1;
    const SC = 1 + 0.045 * C1;
    const SH = 1 + 0.015 * C1;
    
    return Math.sqrt(
      (dL / SL) ** 2 +
      (dC / SC) ** 2 +
      (dH / SH) ** 2
    );
  };

  const handleSaveResult = () => {
    if (!currentRecipe || !predictedLab) {
      alert('레시피와 예측 색상이 필요합니다.');
      return;
    }

    const deltaE = calculateDeltaE(predictedLab, actualLab);
    
    const result = learningSystem.savePrintResult({
      recipeId: currentRecipe.id,
      recipeName: currentRecipe.name,
      predictedLab: predictedLab,
      actualLab: actualLab,
      deltaE: deltaE,
      recipe: {
        inks: currentRecipe.inks.map(ink => ({
          inkId: ink.id,
          name: ink.name,
          ratio: ink.ratio,
          concentration: ink.concentration || 100
        })),
        totalAmount: currentRecipe.totalAmount || 100
      },
      printConditions: printConditions,
      isValid: true
    });

    // 자동 학습 트리거
    const patterns = learningSystem.analyzeAndLearn();
    if (patterns.length > 0) {
      console.log('학습 패턴 발견:', patterns);
      if (onCalibrationUpdate) {
        onCalibrationUpdate();
      }
    }

    // UI 업데이트
    loadRecentResults();
    updateStatistics();
    
    // 입력 필드 초기화
    setActualLab({ L: 0, a: 0, b: 0 });
    
    alert(`실측값이 저장되었습니다. Delta E: ${deltaE.toFixed(2)}`);
  };

  const handleCreateProfile = () => {
    const name = prompt('새 보정 프로파일 이름을 입력하세요:');
    if (name) {
      const profileId = learningSystem.createNewProfile(name);
      setActiveProfile(profileId);
      alert(`'${name}' 프로파일이 생성되었습니다.`);
    }
  };

  const handleExportData = () => {
    const data = learningSystem.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `color-calibration-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (learningSystem.importData(content)) {
        loadRecentResults();
        updateStatistics();
        alert('데이터를 성공적으로 가져왔습니다.');
      } else {
        alert('데이터 가져오기에 실패했습니다.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="print-result-tracker">
      <div className="tracker-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>📊 실측값 피드백 시스템</h3>
        <button className="expand-btn">{isExpanded ? '▼' : '▶'}</button>
      </div>
      
      {isExpanded && (
        <div className="tracker-content">
          {/* 통계 요약 */}
          {statistics && (
            <div className="statistics-summary">
              <div className="stat-item">
                <span className="stat-label">총 샘플:</span>
                <span className="stat-value">{statistics.totalSamples}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">평균 ΔE:</span>
                <span className="stat-value">{statistics.averageDeltaE?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">성공률:</span>
                <span className="stat-value">{statistics.successRate?.toFixed(1) || 0}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">활성 프로파일:</span>
                <span className="stat-value">
                  {activeProfile ? 
                    learningSystem.getCalibrationProfile(activeProfile)?.name || '기본' : 
                    '없음'}
                </span>
              </div>
            </div>
          )}
          
          {/* 실측값 입력 섹션 */}
          <div className="measurement-input">
            <h4>실측 Lab 값 입력</h4>
            
            {predictedLab && (
              <div className="predicted-values">
                <div className="color-preview">
                  <div className="color-box predicted" 
                       style={{ backgroundColor: `lab(${predictedLab.L}% ${predictedLab.a} ${predictedLab.b})` }}>
                    <span>예측</span>
                  </div>
                  <div className="lab-values">
                    L*: {predictedLab.L.toFixed(2)}, 
                    a*: {predictedLab.a.toFixed(2)}, 
                    b*: {predictedLab.b.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
            
            <div className="lab-input-group">
              <div className="input-field">
                <label>L* (명도)</label>
                <input
                  type="number"
                  value={actualLab.L}
                  onChange={(e) => setActualLab({...actualLab, L: parseFloat(e.target.value) || 0})}
                  step="0.1"
                  min="0"
                  max="100"
                />
              </div>
              <div className="input-field">
                <label>a* (적-녹)</label>
                <input
                  type="number"
                  value={actualLab.a}
                  onChange={(e) => setActualLab({...actualLab, a: parseFloat(e.target.value) || 0})}
                  step="0.1"
                  min="-100"
                  max="100"
                />
              </div>
              <div className="input-field">
                <label>b* (황-청)</label>
                <input
                  type="number"
                  value={actualLab.b}
                  onChange={(e) => setActualLab({...actualLab, b: parseFloat(e.target.value) || 0})}
                  step="0.1"
                  min="-100"
                  max="100"
                />
              </div>
            </div>
            
            {/* 인쇄 조건 입력 (접을 수 있음) */}
            <details className="print-conditions">
              <summary>인쇄 조건 상세 설정</summary>
              <div className="conditions-grid">
                <div className="input-field">
                  <label>기질</label>
                  <select 
                    value={printConditions.substrate}
                    onChange={(e) => setPrintConditions({...printConditions, substrate: e.target.value})}
                  >
                    <option value="white_coated">백색 코팅지</option>
                    <option value="white_uncoated">백색 비코팅지</option>
                    <option value="ivory">아이보리지</option>
                    <option value="kraft">크라프트지</option>
                    <option value="transparent">투명 필름</option>
                  </select>
                </div>
                
                <div className="input-field">
                  <label>인쇄 방식</label>
                  <select 
                    value={printConditions.printMethod}
                    onChange={(e) => setPrintConditions({...printConditions, printMethod: e.target.value})}
                  >
                    <option value="offset">오프셋</option>
                    <option value="flexo">플렉소</option>
                    <option value="gravure">그라비어</option>
                    <option value="screen">스크린</option>
                    <option value="digital">디지털</option>
                  </select>
                </div>
                
                <div className="input-field">
                  <label>망점 확대 (%)</label>
                  <input
                    type="number"
                    value={printConditions.dotGain}
                    onChange={(e) => setPrintConditions({...printConditions, dotGain: parseFloat(e.target.value) || 15})}
                    step="1"
                    min="0"
                    max="50"
                  />
                </div>
                
                <div className="input-field">
                  <label>온도 (°C)</label>
                  <input
                    type="number"
                    value={printConditions.temperature}
                    onChange={(e) => setPrintConditions({...printConditions, temperature: parseFloat(e.target.value) || 25})}
                    step="1"
                    min="0"
                    max="50"
                  />
                </div>
                
                <div className="input-field">
                  <label>습도 (%)</label>
                  <input
                    type="number"
                    value={printConditions.humidity}
                    onChange={(e) => setPrintConditions({...printConditions, humidity: parseFloat(e.target.value) || 50})}
                    step="1"
                    min="0"
                    max="100"
                  />
                </div>
                
                <div className="input-field">
                  <label>잉크 브랜드</label>
                  <input
                    type="text"
                    value={printConditions.inkBrand}
                    onChange={(e) => setPrintConditions({...printConditions, inkBrand: e.target.value})}
                    placeholder="예: DIC, Toyo"
                  />
                </div>
              </div>
              
              <div className="notes-field">
                <label>메모</label>
                <textarea
                  value={printConditions.notes}
                  onChange={(e) => setPrintConditions({...printConditions, notes: e.target.value})}
                  placeholder="특이사항이나 추가 정보를 입력하세요"
                  rows={3}
                />
              </div>
            </details>
            
            <button 
              className="save-result-btn"
              onClick={handleSaveResult}
              disabled={!currentRecipe || !predictedLab}
            >
              실측값 저장 및 학습
            </button>
          </div>
          
          {/* 최근 결과 */}
          <div className="recent-results">
            <h4>최근 측정 결과</h4>
            <div className="results-list">
              {recentResults.map((result) => (
                <div key={result.id} className={`result-item ${result.deltaE < 2 ? 'good' : result.deltaE < 5 ? 'fair' : 'poor'}`}>
                  <div className="result-header">
                    <span className="recipe-name">{result.recipeName || result.recipeId.substring(0, 8)}</span>
                    <span className="delta-e">ΔE: {result.deltaE.toFixed(2)}</span>
                  </div>
                  <div className="result-details">
                    <div className="deviation">
                      ΔL: {(result.actualLab.L - result.predictedLab.L).toFixed(1)}, 
                      Δa: {(result.actualLab.a - result.predictedLab.a).toFixed(1)}, 
                      Δb: {(result.actualLab.b - result.predictedLab.b).toFixed(1)}
                    </div>
                    <div className="timestamp">
                      {new Date(result.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 관리 도구 */}
          <div className="management-tools">
            <button onClick={handleCreateProfile}>새 프로파일 생성</button>
            <button onClick={handleExportData}>데이터 내보내기</button>
            <label className="import-btn">
              데이터 가져오기
              <input 
                type="file" 
                accept=".json"
                onChange={handleImportData}
                style={{ display: 'none' }}
              />
            </label>
            <button 
              onClick={() => {
                if (confirm('모든 학습 데이터가 삭제됩니다. 계속하시겠습니까?')) {
                  learningSystem.resetLearning();
                  loadRecentResults();
                  updateStatistics();
                }
              }}
              className="reset-btn"
            >
              학습 초기화
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrintResultTracker;