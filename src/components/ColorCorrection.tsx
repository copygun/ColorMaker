import React, { useState, useCallback } from 'react';
import type { LabColor, Recipe, CorrectionSuggestion } from '../types';

interface CorrectionHistory {
  id: string;
  timestamp: string;
  targetLab: LabColor;
  actualLab: LabColor;
  deltaE: number;
  corrections: CorrectionSuggestion[];
  status: 'pending' | 'applied' | 'success' | 'failed';
}

interface ColorCorrectionProps {
  originalRecipe: Recipe;
  targetColor: LabColor;
  onCorrectionApply: (corrections: CorrectionSuggestion[]) => void;
  correctionEngine: any;
  inkDatabase: any;
}

const ColorCorrection: React.FC<ColorCorrectionProps> = ({
  originalRecipe,
  targetColor,
  onCorrectionApply,
  correctionEngine,
  inkDatabase,
}) => {
  const [actualColor, setActualColor] = useState<LabColor>({ L: 50, a: 0, b: 0 });
  const [correctionHistory, setCorrectionHistory] = useState<CorrectionHistory[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [suggestedCorrections, setSuggestedCorrections] = useState<CorrectionSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictedResult, setPredictedResult] = useState<any>(null);

  // 음수 입력 지원을 위한 문자열 상태
  const [inputValues, setInputValues] = useState({
    L: '50',
    a: '0',
    b: '0',
  });

  // 입력 핸들러 (음수 입력 지원)
  const handleInputChange = (component: keyof LabColor, value: string) => {
    // 모든 입력을 일단 받아들임
    setInputValues((prev) => ({
      ...prev,
      [component]: value,
    }));
  };

  // blur 시점에 값 검증 및 적용
  const handleInputBlur = (component: keyof LabColor) => {
    const value = inputValues[component];

    // 빈 문자열이나 잘못된 값 처리
    if (value === '' || value === '-' || value === '.' || value === '-.') {
      setInputValues((prev) => ({
        ...prev,
        [component]: actualColor[component].toString(),
      }));
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      // 범위 제한
      let clampedValue = numValue;
      if (component === 'L') {
        clampedValue = Math.max(0, Math.min(100, numValue));
      } else {
        clampedValue = Math.max(-128, Math.min(128, numValue));
      }

      setActualColor((prev) => ({
        ...prev,
        [component]: clampedValue,
      }));

      setInputValues((prev) => ({
        ...prev,
        [component]: clampedValue.toString(),
      }));
    }
  };

  // 실제 인쇄 색상 입력 및 분석
  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      // 사용 가능한 잉크 목록 가져오기
      const availableInks = inkDatabase.getAllInks();

      // originalRecipe.inks는 InkRatio 배열이므로, 필요한 형식으로 변환
      const recipeInks = originalRecipe.inks || [];

      // 보정 분석 실행
      const analysis = correctionEngine.analyzeCorrection(
        targetColor,
        actualColor,
        recipeInks,
        availableInks,
      );

      setCurrentAnalysis(analysis);

      // 보정 가능한 경우 레시피 계산
      if (analysis.feasibility.isPossible) {
        const corrections = correctionEngine.calculateCorrectionRecipe(
          targetColor,
          actualColor,
          originalRecipe.inks,
          analysis.feasibility.correctionInks,
        );
        // Ensure each correction has an id
        const correctionsWithId = corrections.map((c: any, index: number) => ({
          ...c,
          id: c.id || `correction-${index}`,
        }));
        setSuggestedCorrections(correctionsWithId);

        // 보정 적용 시 예측 결과 계산
        const predictedLab = correctionEngine.predictCorrectedColor(actualColor, corrections);
        const predictedDeltaE = correctionEngine.calculateDeltaE(targetColor, predictedLab);

        setPredictedResult({
          predictedLab,
          predictedDeltaE,
          improvement: analysis.deltaE - predictedDeltaE,
        });
      } else {
        setSuggestedCorrections([]);
        setPredictedResult(null);
      }

      // 이력에 추가
      const historyEntry: CorrectionHistory = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        targetLab: targetColor,
        actualLab: actualColor,
        deltaE: analysis.deltaE,
        corrections: suggestedCorrections,
        status: 'pending',
      };

      setCorrectionHistory((prev) => [historyEntry, ...prev]);
      correctionEngine.addCorrectionHistory(historyEntry);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    actualColor,
    targetColor,
    originalRecipe,
    correctionEngine,
    inkDatabase,
    suggestedCorrections,
  ]); // 보정 적용
  const handleApplyCorrection = useCallback(
    (corrections: CorrectionSuggestion[]) => {
      if (predictedResult) {
        onCorrectionApply(corrections);

        // 이력 상태 업데이트
        setCorrectionHistory((prev) =>
          prev.map((h) => (h.id === prev[0].id ? { ...h, status: 'applied' as const } : h)),
        );

        // 적용 후 초기화
        setPredictedResult(null);
        setSuggestedCorrections([]);
      }
    },
    [onCorrectionApply, predictedResult],
  );

  return (
    <div className="color-correction">
      <h2>🎯 색상 보정</h2>
      {/* 실제 인쇄 색상 입력 */}
      <div className="actual-color-input">
        <h3>실제 인쇄된 색상 (Lab)</h3>
        <div className="lab-inputs">
          <div className="input-group">
            <label>L*</label>
            <input
              type="text"
              value={inputValues.L}
              onChange={(e) => handleInputChange('L', e.target.value)}
              onBlur={() => handleInputBlur('L')}
              placeholder="50"
            />
          </div>
          <div className="input-group">
            <label>a*</label>
            <input
              type="text"
              value={inputValues.a}
              onChange={(e) => handleInputChange('a', e.target.value)}
              onBlur={() => handleInputBlur('a')}
              placeholder="-20"
            />
          </div>
          <div className="input-group">
            <label>b*</label>
            <input
              type="text"
              value={inputValues.b}
              onChange={(e) => handleInputChange('b', e.target.value)}
              onBlur={() => handleInputBlur('b')}
              placeholder="-30"
            />
          </div>
        </div>

        <button className="btn btn-analyze" onClick={handleAnalyze} disabled={isAnalyzing}>
          {isAnalyzing ? '분석 중...' : '색차 분석 및 보정 제안'}
        </button>
      </div>{' '}
      {/* 분석 결과 */}
      {currentAnalysis && (
        <div className="analysis-result">
          <h3>분석 결과</h3>

          <div className="delta-e-display">
            <span className="label">Delta E 2000:</span>
            <span
              className={`value ${
                currentAnalysis.deltaE < 1
                  ? 'excellent'
                  : currentAnalysis.deltaE < 2
                    ? 'good'
                    : currentAnalysis.deltaE < 5
                      ? 'fair'
                      : 'poor'
              }`}
            >
              {currentAnalysis.deltaE.toFixed(2)}
            </span>
          </div>

          <div className="color-difference">
            <div>ΔL: {currentAnalysis.colorDifference.dL.toFixed(2)}</div>
            <div>Δa: {currentAnalysis.colorDifference.da.toFixed(2)}</div>
            <div>Δb: {currentAnalysis.colorDifference.db.toFixed(2)}</div>
          </div>

          <div className="feasibility-status">
            {currentAnalysis.feasibility.isPossible ? (
              <div className="feasible">
                ✅ 보정 가능 (신뢰도: {(currentAnalysis.feasibility.confidence * 100).toFixed(0)}%)
              </div>
            ) : (
              <div className="not-feasible">
                ⚠️ 보정 불가능
                <div className="reason">{currentAnalysis.feasibility.reason}</div>
                <div className="recommendation">
                  추천:{' '}
                  {currentAnalysis.feasibility.recommendation === 'REMAKE_RECIPE'
                    ? '레시피 재계산 필요'
                    : '특수 잉크 추가 필요'}
                </div>
                {currentAnalysis.feasibility.suggestedInks && (
                  <div className="suggested-inks">
                    <h4>추천 특수 잉크:</h4>
                    {currentAnalysis.feasibility.suggestedInks.map((ink: any, idx: number) => (
                      <div key={idx} className="special-ink-recommendation">
                        <div className="ink-header">
                          <strong>{ink.name || ink.type}</strong>
                          {ink.pantone && <span className="pantone-code"> ({ink.pantone})</span>}
                        </div>
                        <div className="ink-details">
                          <div className="reason">• 이유: {ink.reason}</div>
                          {ink.usage && <div className="usage">• 사용법: {ink.usage}</div>}
                          {ink.effect && <div className="effect">• 예상 효과: {ink.effect}</div>}
                          {ink.labTarget && (
                            <div className="target-lab">
                              • 잉크 Lab값: L:{ink.labTarget.L} a:{ink.labTarget.a} b:
                              {ink.labTarget.b}
                            </div>
                          )}
                          {ink.recommendation && (
                            <div className="additional-info">• 추가 정보: {ink.recommendation}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}{' '}
      {/* 보정 제안 */}
      {suggestedCorrections.length > 0 && (
        <div className="correction-suggestions">
          <h3>보정 제안</h3>
          <div className="corrections-list">
            {suggestedCorrections.map((correction, idx) => (
              <div key={idx} className="correction-item">
                <div className="ink-info">
                  <span className="ink-name">{correction.name}</span>
                  <span className="add-amount">+{correction.addAmount.toFixed(1)}%</span>
                </div>
                <div className="expected-impact">
                  예상 변화: ΔL: {correction.expectedImpact.dL.toFixed(1)}
                  Δa: {correction.expectedImpact.da.toFixed(1)}
                  Δb: {correction.expectedImpact.db.toFixed(1)}
                </div>
              </div>
            ))}

            {/* 예측 결과 표시 */}
            {predictedResult && (
              <div className="predicted-result">
                <h4>📊 보정 적용 시 예측 결과</h4>
                <div className="prediction-details">
                  <div className="predicted-color">
                    <span>예측 Lab:</span>
                    <span>L: {predictedResult.predictedLab.L.toFixed(1)}</span>
                    <span>a: {predictedResult.predictedLab.a.toFixed(1)}</span>
                    <span>b: {predictedResult.predictedLab.b.toFixed(1)}</span>
                  </div>
                  <div className="predicted-delta">
                    <span
                      className={`delta-value ${
                        predictedResult.predictedDeltaE < 1
                          ? 'excellent'
                          : predictedResult.predictedDeltaE < 2
                            ? 'good'
                            : predictedResult.predictedDeltaE < 5
                              ? 'fair'
                              : 'poor'
                      }`}
                    >
                      예측 ΔE: {predictedResult.predictedDeltaE.toFixed(2)}
                    </span>
                    <span className="improvement">
                      개선도: {predictedResult.improvement.toFixed(2)} 감소
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={() => handleApplyCorrection(suggestedCorrections)}
              disabled={!predictedResult}
            >
              보정 적용
            </button>
          </div>
        </div>
      )}
      {/* 보정 이력 */}
      {correctionHistory.length > 0 && (
        <div className="correction-history">
          <h3>보정 이력</h3>
          <div className="history-list">
            {correctionHistory.slice(0, 10).map((entry) => (
              <div key={entry.id} className={`history-item status-${entry.status}`}>
                <div className="timestamp">{new Date(entry.timestamp).toLocaleString('ko-KR')}</div>
                <div className="delta-e">ΔE: {entry.deltaE.toFixed(2)}</div>
                <div className="actual-values">
                  실제: L:{entry.actualLab.L.toFixed(1)}
                  a:{entry.actualLab.a.toFixed(1)}
                  b:{entry.actualLab.b.toFixed(1)}
                </div>
                <div className="status">{entry.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`
        .special-ink-recommendation {
          margin-bottom: 15px;
          padding: 12px;
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          border-radius: 4px;
        }

        .special-ink-recommendation .ink-header {
          font-size: 16px;
          margin-bottom: 8px;
          color: #2d3748;
        }

        .special-ink-recommendation .pantone-code {
          color: #667eea;
          font-weight: 600;
        }

        .special-ink-recommendation .ink-details {
          font-size: 14px;
          color: #4a5568;
          line-height: 1.6;
        }

        .special-ink-recommendation .ink-details > div {
          margin: 4px 0;
        }

        .special-ink-recommendation .usage {
          color: #38a169;
          font-weight: 500;
        }

        .special-ink-recommendation .effect {
          color: #3182ce;
          font-weight: 500;
        }

        .special-ink-recommendation .target-lab {
          font-family: monospace;
          background: #edf2f7;
          padding: 2px 6px;
          border-radius: 3px;
          display: inline-block;
        }

        .suggested-inks {
          margin-top: 15px;
          padding: 15px;
          background: #fff;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
        }

        .suggested-inks h4 {
          margin: 0 0 12px 0;
          color: #2d3748;
          font-size: 16px;
          font-weight: 600;
        }

        .feasibility-status .not-feasible {
          padding: 15px;
          background: #fff5f5;
          border: 1px solid #feb2b2;
          border-radius: 8px;
          margin-top: 10px;
        }

        .feasibility-status .reason {
          margin: 8px 0;
          font-weight: 500;
          color: #c53030;
        }

        .feasibility-status .recommendation {
          margin: 8px 0;
          padding: 8px;
          background: #fffaf0;
          border-left: 3px solid #ed8936;
          color: #7c2d12;
        }
      `}</style>
    </div>
  );
};

export default ColorCorrection;
