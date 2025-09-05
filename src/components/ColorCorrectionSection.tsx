import React, { useState, useEffect } from 'react';
import { Recipe, LabColor } from '../types';
import { ColorScience } from '../../core/colorScience.js';

interface CorrectionHistory {
  iteration: number;
  measuredLab: LabColor;
  deltaE: number;
  suggestions: any[];
  timestamp: Date;
}

interface ColorCorrectionSectionProps {
  recipe: Recipe;
  targetColor: LabColor;
  onCorrectionApply: (correctedRecipe: Recipe) => void;
  inkDB: any;
}

const ColorCorrectionSection: React.FC<ColorCorrectionSectionProps> = ({
  recipe,
  targetColor,
  onCorrectionApply,
  inkDB,
}) => {
  const [measuredLab, setMeasuredLab] = useState<LabColor>({
    L: 0,
    a: 0,
    b: 0,
  });

  const [inputValues, setInputValues] = useState({
    L: '',
    a: '',
    b: '',
  });

  const [deltaE, setDeltaE] = useState<number>(0);
  const [correctionSuggestion, setCorrectionSuggestion] = useState<any>(null);
  const [correctionHistory, setCorrectionHistory] = useState<CorrectionHistory[]>([]);
  const [currentIteration, setCurrentIteration] = useState<number>(1);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Delta E 계산
  useEffect(() => {
    const calculatedDeltaE = ColorScience.calculateDeltaE00(
      targetColor.L,
      targetColor.a,
      targetColor.b,
      measuredLab.L,
      measuredLab.a,
      measuredLab.b,
    );
    setDeltaE(calculatedDeltaE);

    // 색차가 1 이상이면 보정 제안 계산
    if (calculatedDeltaE >= 1) {
      calculateCorrection();
    }
  }, [measuredLab, targetColor]);

  const handleInputChange = (axis: 'L' | 'a' | 'b', value: string) => {
    // 음수 입력 허용
    if (value === '' || value === '-' || !isNaN(Number(value))) {
      setInputValues((prev) => ({ ...prev, [axis]: value }));

      // 유효한 숫자인 경우에만 measuredLab 업데이트
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setMeasuredLab((prev) => ({ ...prev, [axis]: numValue }));
      }
    }
  };

  const calculateCorrection = () => {
    // 색상 차이 분석
    const deltaL = targetColor.L - measuredLab.L;
    const deltaA = targetColor.a - measuredLab.a;
    const deltaB = targetColor.b - measuredLab.b;

    // 보정에 필요한 잉크 제안
    const suggestions = [];

    // 명도 보정 (더 정밀한 기준)
    if (Math.abs(deltaL) > 1) {
      if (deltaL > 0) {
        suggestions.push({
          ink: 'white',
          action: '추가',
          amount: Math.min(10, Math.abs(deltaL) * 2.0),
          reason: '명도를 높이기 위해',
        });
      } else {
        suggestions.push({
          ink: 'black',
          action: '추가',
          amount: Math.min(8, Math.abs(deltaL) * 1.0),
          reason: '명도를 낮추기 위해',
        });
      }
    }

    // a축 보정 (빨강-녹색) - 더 정밀한 기준
    if (Math.abs(deltaA) > 1) {
      if (deltaA > 0) {
        suggestions.push({
          ink: 'magenta',
          action: '추가',
          amount: Math.min(8, Math.abs(deltaA) * 1.5),
          reason: '빨간색을 강화하기 위해',
        });
      } else {
        suggestions.push({
          ink: 'cyan',
          action: '추가',
          amount: Math.min(8, Math.abs(deltaA) * 1.5),
          reason: '녹색을 강화하기 위해',
        });
      }
    }

    // b축 보정 (노랑-파랑) - 더 정밀한 기준
    if (Math.abs(deltaB) > 1) {
      if (deltaB > 0) {
        suggestions.push({
          ink: 'yellow',
          action: '추가',
          amount: Math.min(8, Math.abs(deltaB) * 1.5),
          reason: '노란색을 강화하기 위해',
        });
      } else {
        suggestions.push({
          ink: 'cyan',
          action: '추가',
          amount: Math.min(6, Math.abs(deltaB) * 1.2),
          reason: '파란색을 강화하기 위해',
        });
      }
    }

    setCorrectionSuggestion({
      deltaL,
      deltaA,
      deltaB,
      suggestions,
    });
  };

  const saveCorrectionToHistory = () => {
    const newHistory: CorrectionHistory = {
      iteration: currentIteration,
      measuredLab: { ...measuredLab },
      deltaE: deltaE,
      suggestions: correctionSuggestion?.suggestions || [],
      timestamp: new Date(),
    };

    setCorrectionHistory((prev) => [...prev, newHistory]);
    setCurrentIteration((prev) => prev + 1);
  };

  const applyCorrectionSuggestion = () => {
    if (!correctionSuggestion || !correctionSuggestion.suggestions.length) return;

    // 보정 이력 저장
    saveCorrectionToHistory();

    // 현재 레시피 복사
    const correctedRecipe = { ...recipe };
    correctedRecipe.inks = [...recipe.inks];

    // 보정 잉크 추가
    correctionSuggestion.suggestions.forEach((suggestion: any) => {
      const existingInk = correctedRecipe.inks.find((ink) => ink.inkId === suggestion.ink);

      if (existingInk) {
        // 기존 잉크의 비율 증가
        existingInk.ratio = Math.min(100, existingInk.ratio + suggestion.amount);
      } else {
        // 새 잉크 추가
        const inkData = inkDB.base.find((ink: any) => ink.id === suggestion.ink);
        if (inkData) {
          correctedRecipe.inks.push({
            inkId: suggestion.ink,
            ratio: suggestion.amount,
            concentration: 100,
          });
        }
      }
    });

    // 비율 정규화 (합계가 100이 되도록)
    const totalRatio = correctedRecipe.inks.reduce((sum, ink) => sum + ink.ratio, 0);
    correctedRecipe.inks = correctedRecipe.inks.map((ink) => ({
      ...ink,
      ratio: parseFloat(((ink.ratio / totalRatio) * 100).toFixed(1)),
    }));

    // 보정 정보 추가
    correctedRecipe.isCorrection = true;
    correctedRecipe.correctionDate = new Date().toISOString();
    correctedRecipe.originalDeltaE = recipe.deltaE;
    correctedRecipe.correctedDeltaE = deltaE;
    correctedRecipe.correctionIteration = currentIteration;

    onCorrectionApply(correctedRecipe);
  };

  const resetForNextCorrection = () => {
    // 현재 상태를 이력에 저장
    saveCorrectionToHistory();

    // 입력값 초기화 (목표값으로)
    setInputValues({
      L: targetColor.L.toString(),
      a: targetColor.a.toString(),
      b: targetColor.b.toString(),
    });

    setMeasuredLab({
      L: targetColor.L,
      a: targetColor.a,
      b: targetColor.b,
    });

    setCorrectionSuggestion(null);
  };

  const getDeltaEStatus = () => {
    if (deltaE <= 0.5) return { color: '#4caf50', text: '최우수' };
    if (deltaE <= 1.0) return { color: '#8bc34a', text: '우수' };
    if (deltaE <= 1.5) return { color: '#2196f3', text: '양호' };
    if (deltaE <= 2.0) return { color: '#ff9800', text: '허용' };
    if (deltaE <= 3.0) return { color: '#ff5722', text: '주의' };
    return { color: '#f44336', text: '불량' };
  };

  const status = getDeltaEStatus();

  return (
    <div
      style={{
        padding: '16px',
        background: '#f8f9fa',
        borderRadius: '8px',
        marginTop: '16px',
        border: '1px solid #dee2e6',
      }}
    >
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#333' }}>
        🔧 색상 보정 분석
      </h3>

      {/* 목표 색상값 표시 */}
      <div
        style={{
          marginBottom: '16px',
          padding: '12px',
          background: '#e3f2fd',
          borderRadius: '6px',
          border: '1px solid #90caf9',
        }}
      >
        <label
          style={{
            fontSize: '14px',
            color: '#1976d2',
            fontWeight: 600,
            marginBottom: '8px',
            display: 'block',
          }}
        >
          목표 색상값:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div style={{ fontSize: '14px', color: '#333' }}>
            <span style={{ color: '#666' }}>L*:</span> {targetColor.L.toFixed(2)}
          </div>
          <div style={{ fontSize: '14px', color: '#333' }}>
            <span style={{ color: '#666' }}>a*:</span> {targetColor.a.toFixed(2)}
          </div>
          <div style={{ fontSize: '14px', color: '#333' }}>
            <span style={{ color: '#666' }}>b*:</span> {targetColor.b.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 인쇄 샘플 Lab 입력 */}
      <div style={{ marginBottom: '16px' }}>
        <label
          style={{
            fontSize: '14px',
            color: '#666',
            fontWeight: 600,
            marginBottom: '8px',
            display: 'block',
          }}
        >
          인쇄 샘플 측정값:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#999' }}>L* (명도)</label>
            <input
              type="text"
              value={inputValues.L}
              onChange={(e) => handleInputChange('L', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
              placeholder="0-100"
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#999' }}>a* (빨강-녹색)</label>
            <input
              type="text"
              value={inputValues.a}
              onChange={(e) => handleInputChange('a', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
              placeholder="-128 to 128"
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#999' }}>b* (노랑-파랑)</label>
            <input
              type="text"
              value={inputValues.b}
              onChange={(e) => handleInputChange('b', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
              placeholder="-128 to 128"
            />
          </div>
        </div>
      </div>

      {/* 색차 표시 */}
      <div
        style={{
          padding: '12px',
          background: 'white',
          borderRadius: '6px',
          marginBottom: '16px',
          border: `2px solid ${status.color}33`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '14px', color: '#666' }}>목표 색상과의 색차:</span>
            <div style={{ fontSize: '24px', fontWeight: 600, color: status.color }}>
              ΔE*00 = {deltaE.toFixed(2)}
            </div>
          </div>
          <div
            style={{
              padding: '8px 16px',
              background: `${status.color}20`,
              color: status.color,
              borderRadius: '20px',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
          >
            {status.text}
          </div>
        </div>
      </div>

      {/* 보정 제안 */}
      {correctionSuggestion && correctionSuggestion.suggestions.length > 0 && (
        <div
          style={{
            padding: '12px',
            background: '#fff3e0',
            borderRadius: '6px',
            marginBottom: '16px',
            border: '1px solid #ffb74d',
          }}
        >
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#e65100' }}>
            💡 잉크 배합 수정안
          </h4>
          <div style={{ fontSize: '14px' }}>
            {correctionSuggestion.suggestions.map((suggestion: any, index: number) => (
              <div
                key={index}
                style={{
                  marginBottom: '8px',
                  padding: '8px',
                  background: 'white',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    fontWeight: 'bold',
                    color: '#333',
                    minWidth: '80px',
                  }}
                >
                  {suggestion.ink.toUpperCase()}
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    background: '#4caf50',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  +{suggestion.amount.toFixed(1)}%
                </span>
                <span style={{ color: '#666', fontSize: '13px' }}>{suggestion.reason}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginTop: '12px',
            }}
          >
            <button
              onClick={applyCorrectionSuggestion}
              style={{
                padding: '10px',
                background: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              🔄 보정 레시피 적용
            </button>
            <button
              onClick={resetForNextCorrection}
              style={{
                padding: '10px',
                background: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              ➕ 추가 보정 ({currentIteration}차)
            </button>
          </div>
        </div>
      )}

      {/* 색상 차이 상세 */}
      {correctionSuggestion && (
        <div
          style={{
            padding: '12px',
            background: 'white',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#666',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <span style={{ color: '#999' }}>ΔL*:</span>
              <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                {correctionSuggestion.deltaL.toFixed(1)}
              </span>
            </div>
            <div>
              <span style={{ color: '#999' }}>Δa*:</span>
              <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                {correctionSuggestion.deltaA.toFixed(1)}
              </span>
            </div>
            <div>
              <span style={{ color: '#999' }}>Δb*:</span>
              <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                {correctionSuggestion.deltaB.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 보정 이력 */}
      {correctionHistory.length > 0 && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            background: '#f5f5f5',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#333', margin: 0 }}>
              📊 보정 이력 ({correctionHistory.length}회)
            </h4>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                padding: '4px 8px',
                background: 'transparent',
                border: '1px solid #999',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                color: '#666',
              }}
            >
              {showHistory ? '숨기기' : '보기'}
            </button>
          </div>

          {showHistory && (
            <div style={{ fontSize: '13px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '50px 1fr 80px 1fr',
                  gap: '8px',
                  padding: '8px',
                  background: 'white',
                  borderRadius: '4px',
                  fontWeight: 600,
                  color: '#666',
                  borderBottom: '2px solid #e0e0e0',
                }}
              >
                <div>차수</div>
                <div>측정값 (L*, a*, b*)</div>
                <div>ΔE*00</div>
                <div>보정 제안</div>
              </div>

              {correctionHistory.map((history, index) => (
                <div
                  key={index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '50px 1fr 80px 1fr',
                    gap: '8px',
                    padding: '8px',
                    background: 'white',
                    borderRadius: '4px',
                    marginTop: '4px',
                    borderLeft: `3px solid ${history.deltaE <= 1 ? '#4caf50' : history.deltaE <= 2 ? '#ff9800' : '#f44336'}`,
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{history.iteration}차</div>
                  <div>
                    L: {history.measuredLab.L.toFixed(1)}, a: {history.measuredLab.a.toFixed(1)}, b:{' '}
                    {history.measuredLab.b.toFixed(1)}
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color:
                        history.deltaE <= 1
                          ? '#4caf50'
                          : history.deltaE <= 2
                            ? '#ff9800'
                            : '#f44336',
                    }}
                  >
                    {history.deltaE.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    {history.suggestions.length > 0
                      ? history.suggestions
                          .map((s) => `${s.ink} +${s.amount.toFixed(1)}%`)
                          .join(', ')
                      : '목표 달성'}
                  </div>
                </div>
              ))}

              {/* 개선 추이 */}
              {correctionHistory.length > 1 && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '8px',
                    background: '#e8f5e9',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: '#2e7d32',
                  }}
                >
                  <strong>개선 추이:</strong> ΔE {correctionHistory[0].deltaE.toFixed(2)} →{' '}
                  {correctionHistory[correctionHistory.length - 1].deltaE.toFixed(2)} (
                  {(
                    (1 -
                      correctionHistory[correctionHistory.length - 1].deltaE /
                        correctionHistory[0].deltaE) *
                    100
                  ).toFixed(0)}
                  % 개선)
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ColorCorrectionSection;
