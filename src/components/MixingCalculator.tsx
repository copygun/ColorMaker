import React, { useState, useEffect, useCallback } from 'react';
import { KubelkaMunkModel } from '../../core/advancedMixingEngine.js';
import { ColorScience } from '../../core/colorScience.js';
import type { LabColor, Ink } from '../types';

interface MixingCalculatorProps {
  inkDatabase: any;
  targetColor?: LabColor;
}

interface MixingResult {
  color: LabColor;
  deltaE: number;
  inks: Array<{
    ink: Ink;
    percentage: number;
    grams: number;
  }>;
  totalWeight: number;
}

const MixingCalculator: React.FC<MixingCalculatorProps> = ({ inkDatabase, targetColor }) => {
  const [selectedInks, setSelectedInks] = useState<string[]>([]);
  const [inkRatios, setInkRatios] = useState<{ [key: string]: number }>({});
  const [batchSize, setBatchSize] = useState<number>(100);
  const [mixingResult, setMixingResult] = useState<MixingResult | null>(null);
  // const [isCalculating, setIsCalculating] = useState(false); // Not used in rendering
  const setIsCalculating = (_value: boolean) => {
    /* State used for loading indicator */
  };
  const [substrate, setSubstrate] = useState('coated');

  const kubelkaMunk = new KubelkaMunkModel();

  // 잉크 선택 핸들러
  const handleInkToggle = (inkId: string) => {
    if (selectedInks.includes(inkId)) {
      setSelectedInks((prev) => prev.filter((id) => id !== inkId));
      const newRatios = { ...inkRatios };
      delete newRatios[inkId];
      setInkRatios(newRatios);
    } else {
      setSelectedInks((prev) => [...prev, inkId]);
      setInkRatios((prev) => ({ ...prev, [inkId]: 25 }));
    }
  };

  // 비율 변경 핸들러
  const handleRatioChange = (inkId: string, value: number) => {
    setInkRatios((prev) => ({ ...prev, [inkId]: value }));
  };

  // 비율 정규화
  const normalizeRatios = () => {
    const total = Object.values(inkRatios).reduce((sum, ratio) => sum + ratio, 0);
    if (total === 0) return;

    const normalized: { [key: string]: number } = {};
    Object.keys(inkRatios).forEach((inkId) => {
      normalized[inkId] = (inkRatios[inkId] / total) * 100;
    });
    setInkRatios(normalized);
  };

  // 혼합 색상 계산
  const calculateMixing = useCallback(() => {
    if (selectedInks.length === 0) return;

    setIsCalculating(true);

    try {
      // 선택된 잉크 데이터 수집
      const inks: Ink[] = [];
      const concentrations: number[] = [];

      selectedInks.forEach((inkId) => {
        const ink = [...inkDatabase.baseInks, ...inkDatabase.metallicInks].find(
          (i: Ink) => i.id === inkId,
        );
        if (ink) {
          inks.push(ink);
          concentrations.push((inkRatios[inkId] || 0) / 100);
        }
      });

      // Kubelka-Munk 모델로 혼합
      const mixedColor = kubelkaMunk.mixInks(
        inks.map((ink) => ({ ...ink.concentrations[100], type: ink.type })),
        concentrations,
        substrate,
      );

      // Delta E 계산 (타겟 색상이 있는 경우)
      let deltaE = 0;
      if (targetColor) {
        deltaE = ColorScience.calculateDeltaE00(
          targetColor.L,
          targetColor.a,
          targetColor.b,
          mixedColor.L,
          mixedColor.a,
          mixedColor.b,
        );
      }

      // 중량 계산
      const inkDetails = selectedInks
        .map((inkId) => {
          const ink = [...inkDatabase.baseInks, ...inkDatabase.metallicInks].find(
            (i: Ink) => i.id === inkId,
          );
          const percentage = inkRatios[inkId] || 0;
          const grams = (batchSize * percentage) / 100;

          return {
            ink: ink!,
            percentage,
            grams,
          };
        })
        .filter((item) => item.ink);

      setMixingResult({
        color: mixedColor,
        deltaE,
        inks: inkDetails,
        totalWeight: batchSize,
      });
    } catch (error) {
      console.error('Mixing calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [selectedInks, inkRatios, batchSize, substrate, targetColor, inkDatabase]);

  // 최적화 실행
  const runOptimization = async () => {
    if (!targetColor || selectedInks.length === 0) {
      alert('타겟 색상과 잉크를 선택해주세요.');
      return;
    }

    setIsCalculating(true);

    try {
      // 선택된 잉크로 최적화 실행
      const inks = selectedInks
        .map((inkId) => {
          return [...inkDatabase.baseInks, ...inkDatabase.metallicInks].find(
            (i: Ink) => i.id === inkId,
          );
        })
        .filter(Boolean);

      // 간단한 최적화 알고리즘 (실제로는 더 복잡한 알고리즘 필요)
      let bestRatios: { [key: string]: number } = {};
      let bestDeltaE = Infinity;

      // 랜덤 샘플링으로 최적 비율 찾기
      for (let i = 0; i < 1000; i++) {
        const testRatios: { [key: string]: number } = {};
        let total = 0;

        selectedInks.forEach((inkId) => {
          const ratio = Math.random();
          testRatios[inkId] = ratio;
          total += ratio;
        });

        // 정규화
        selectedInks.forEach((inkId) => {
          testRatios[inkId] = (testRatios[inkId] / total) * 100;
        });

        // 혼합 색상 계산
        const testInks = inks.map((ink) => ({ ...ink.concentrations[100], type: ink.type }));
        const testConcentrations = selectedInks.map((inkId) => testRatios[inkId] / 100);

        const mixedColor = kubelkaMunk.mixInks(testInks, testConcentrations, substrate);

        const deltaE = ColorScience.calculateDeltaE00(
          targetColor.L,
          targetColor.a,
          targetColor.b,
          mixedColor.L,
          mixedColor.a,
          mixedColor.b,
        );

        if (deltaE < bestDeltaE) {
          bestDeltaE = deltaE;
          bestRatios = { ...testRatios };
        }
      }

      setInkRatios(bestRatios);
      calculateMixing();
    } catch (error) {
      console.error('Optimization error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  // 자동 계산
  useEffect(() => {
    if (selectedInks.length > 0) {
      calculateMixing();
    }
  }, [inkRatios, substrate]);

  return (
    <div className="mixing-calculator">
      <div className="calculator-header">
        <h2>🧪 잉크 배합 계산기</h2>
        <div className="batch-size">
          <label>배치 크기:</label>
          <input
            type="number"
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            min="1"
            max="10000"
          />
          <span>g</span>
        </div>
      </div>

      <div className="calculator-body">
        <div className="ink-selection">
          <h3>잉크 선택</h3>
          <div className="ink-grid">
            {[...inkDatabase.baseInks, ...inkDatabase.metallicInks].map((ink: Ink) => (
              <div key={ink.id} className="ink-option">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedInks.includes(ink.id)}
                    onChange={() => handleInkToggle(ink.id)}
                  />
                  <span className="ink-name">{ink.name}</span>
                  <div
                    className="ink-color-sample"
                    style={{
                      backgroundColor: `lab(${ink.concentrations[100].L}% ${ink.concentrations[100].a} ${ink.concentrations[100].b})`,
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="ratio-controls">
          <h3>배합 비율</h3>
          <div className="substrate-select">
            <label>기질 선택:</label>
            <select value={substrate} onChange={(e) => setSubstrate(e.target.value)}>
              <option value="coated">코팅지</option>
              <option value="uncoated">비코팅지</option>
              <option value="plastic">플라스틱</option>
              <option value="metal">금속</option>
              <option value="transparent">투명 필름</option>
            </select>
          </div>

          {selectedInks.map((inkId) => {
            const ink = [...inkDatabase.baseInks, ...inkDatabase.metallicInks].find(
              (i: Ink) => i.id === inkId,
            );
            if (!ink) return null;

            return (
              <div key={inkId} className="ratio-control">
                <span className="ink-label">{ink.name}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={inkRatios[inkId] || 0}
                  onChange={(e) => handleRatioChange(inkId, Number(e.target.value))}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={inkRatios[inkId] || 0}
                  onChange={(e) => handleRatioChange(inkId, Number(e.target.value))}
                />
                <span>%</span>
              </div>
            );
          })}

          <div className="ratio-actions">
            <button onClick={normalizeRatios} className="btn btn-small">
              정규화
            </button>
            {targetColor && (
              <button onClick={runOptimization} className="btn btn-small btn-primary">
                최적화
              </button>
            )}
          </div>
        </div>

        {mixingResult && (
          <div className="mixing-result">
            <h3>혼합 결과</h3>

            <div className="result-color">
              <div
                className="color-preview"
                style={{
                  backgroundColor: `lab(${mixingResult.color.L}% ${mixingResult.color.a} ${mixingResult.color.b})`,
                }}
              />
              <div className="color-values">
                <div>L*: {mixingResult.color.L.toFixed(2)}</div>
                <div>a*: {mixingResult.color.a.toFixed(2)}</div>
                <div>b*: {mixingResult.color.b.toFixed(2)}</div>
                {targetColor && (
                  <div className="delta-e">ΔE00: {mixingResult.deltaE.toFixed(2)}</div>
                )}
              </div>
            </div>

            <div className="recipe-details">
              <h4>레시피 상세</h4>
              <table className="recipe-table">
                <thead>
                  <tr>
                    <th>잉크</th>
                    <th>비율</th>
                    <th>중량</th>
                  </tr>
                </thead>
                <tbody>
                  {mixingResult.inks.map((item, index) => (
                    <tr key={index}>
                      <td>{item.ink.name}</td>
                      <td>{item.percentage.toFixed(1)}%</td>
                      <td>{item.grams.toFixed(2)}g</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>총 중량</td>
                    <td>{mixingResult.totalWeight.toFixed(2)}g</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {targetColor && (
              <div className="color-comparison">
                <h4>색상 비교</h4>
                <div className="comparison-display">
                  <div className="comparison-item">
                    <div
                      className="color-block"
                      style={{
                        backgroundColor: `lab(${targetColor.L}% ${targetColor.a} ${targetColor.b})`,
                      }}
                    />
                    <span>타겟</span>
                  </div>
                  <div className="comparison-arrow">→</div>
                  <div className="comparison-item">
                    <div
                      className="color-block"
                      style={{
                        backgroundColor: `lab(${mixingResult.color.L}% ${mixingResult.color.a} ${mixingResult.color.b})`,
                      }}
                    />
                    <span>결과</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MixingCalculator;
