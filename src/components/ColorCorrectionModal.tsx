import React, { useState, useEffect } from 'react';
import { LabColor } from '../types';

interface ColorCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetColor: LabColor;
  currentRecipe: any;
  availableInks: any[];
  onApplyCorrection: (correctionRecipe: any) => void;
}

const ColorCorrectionModal: React.FC<ColorCorrectionModalProps> = ({
  isOpen,
  onClose,
  targetColor,
  currentRecipe,
  availableInks,
  onApplyCorrection
}) => {
  const [actualColor, setActualColor] = useState<LabColor>({ L: 50, a: 0, b: 0 });
  const [inputValues, setInputValues] = useState({ L: '50', a: '0', b: '0' });
  const [correctionAnalysis, setCorrectionAnalysis] = useState<any>(null);
  const [correctionRecipe, setCorrectionRecipe] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSpecialInks, setShowSpecialInks] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset when modal closes
      setActualColor({ L: 50, a: 0, b: 0 });
      setInputValues({ L: '50', a: '0', b: '0' });
      setCorrectionAnalysis(null);
      setCorrectionRecipe(null);
      setShowSpecialInks(false);
    }
  }, [isOpen]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    
    // Dynamic import of CorrectionEngine
    try {
      const { default: CorrectionEngine } = await import('../../core/correctionEngine.js');
      const correctionEngine = new CorrectionEngine();
      
      // Analyze correction
      const analysis = correctionEngine.analyzeCorrection(
        targetColor,
        actualColor,
        currentRecipe,
        availableInks
      );
      
      setCorrectionAnalysis(analysis);
      
      // Calculate correction recipe if possible
      if (analysis.feasibility.isPossible) {
        const corrections = correctionEngine.calculateCorrectionRecipe(
          targetColor,
          actualColor,
          currentRecipe,
          analysis.feasibility.correctionInks
        );
        
        // Calculate the corrected recipe by adding corrections to current recipe
        const correctedInks = [...currentRecipe.inks];
        corrections.forEach((correction: any) => {
          const existingInk = correctedInks.find((ink: any) => ink.inkId === correction.inkId);
          if (existingInk) {
            // Add correction amount to existing ink
            existingInk.ratio = Math.min(100, existingInk.ratio + correction.addAmount);
          } else {
            // Add new ink to recipe
            correctedInks.push({
              inkId: correction.inkId,
              ratio: correction.addAmount,
              concentration: 100
            });
          }
        });
        
        // Normalize ratios to sum to 100%
        const totalRatio = correctedInks.reduce((sum: number, ink: any) => sum + ink.ratio, 0);
        if (totalRatio > 100) {
          correctedInks.forEach((ink: any) => {
            ink.ratio = (ink.ratio / totalRatio) * 100;
          });
        }
        
        // Predict corrected color
        const predictedColor = correctionEngine.predictCorrectedColor(
          actualColor,
          corrections
        );
        
        setCorrectionRecipe({
          corrections,
          correctedInks,
          predictedColor,
          predictedDeltaE: correctionEngine.calculateDeltaE(targetColor, predictedColor)
        });
      }
      
      // Show special inks if needed
      if (!analysis.feasibility.isPossible && analysis.feasibility.suggestedInks) {
        setShowSpecialInks(true);
      }
      
    } catch (error) {
      console.error('Correction analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDeltaE = (value: number) => {
    return value?.toFixed(2) || '0.00';
  };

  const getDeltaEStatus = (deltaE: number) => {
    if (deltaE < 1) return { text: '우수', color: 'text-green-600' };
    if (deltaE < 2) return { text: '양호', color: 'text-blue-600' };
    if (deltaE < 3) return { text: '보통', color: 'text-yellow-600' };
    if (deltaE < 5) return { text: '보정필요', color: 'text-orange-600' };
    return { text: '재조색필요', color: 'text-red-600' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">색상 보정 분석</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Target Color Display */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">목표 색상</h3>
            <div className="flex items-center gap-4">
              <div 
                className="w-20 h-20 rounded border-2 border-gray-300"
                style={{ 
                  backgroundColor: `lab(${targetColor.L}% ${targetColor.a} ${targetColor.b})` 
                }}
              />
              <div className="text-sm">
                <div>L*: {targetColor.L.toFixed(2)}</div>
                <div>a*: {targetColor.a.toFixed(2)}</div>
                <div>b*: {targetColor.b.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Actual Color Input */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">실제 인쇄 색상</h3>
            <div className="flex items-center gap-4">
              <div 
                className="w-20 h-20 rounded border-2 border-gray-300"
                style={{ 
                  backgroundColor: `lab(${actualColor.L}% ${actualColor.a} ${actualColor.b})` 
                }}
              />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="w-8 text-sm">L*:</label>
                  <input
                    type="text"
                    value={inputValues.L}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setInputValues({...inputValues, L: val});
                        const numVal = parseFloat(val);
                        if (!isNaN(numVal)) {
                          setActualColor({...actualColor, L: numVal});
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (isNaN(val)) {
                        setInputValues({...inputValues, L: '50'});
                        setActualColor({...actualColor, L: 50});
                      } else {
                        const clamped = Math.max(0, Math.min(100, val));
                        setInputValues({...inputValues, L: clamped.toString()});
                        setActualColor({...actualColor, L: clamped});
                      }
                    }}
                    className="w-20 px-2 py-1 border rounded"
                    placeholder="0 to 100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-8 text-sm">a*:</label>
                  <input
                    type="text"
                    value={inputValues.a}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow any input that could become a valid number
                      if (val === '' || val === '-' || /^-?\d*\.?\d*$/.test(val)) {
                        setInputValues({...inputValues, a: val});
                        const numVal = parseFloat(val);
                        if (!isNaN(numVal)) {
                          setActualColor({...actualColor, a: numVal});
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // Clean up on blur
                      const val = parseFloat(e.target.value);
                      if (isNaN(val)) {
                        setInputValues({...inputValues, a: '0'});
                        setActualColor({...actualColor, a: 0});
                      } else {
                        const clamped = Math.max(-128, Math.min(127, val));
                        setInputValues({...inputValues, a: clamped.toString()});
                        setActualColor({...actualColor, a: clamped});
                      }
                    }}
                    className="w-20 px-2 py-1 border rounded"
                    placeholder="-128 to 127"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-8 text-sm">b*:</label>
                  <input
                    type="text"
                    value={inputValues.b}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow any input that could become a valid number
                      if (val === '' || val === '-' || /^-?\d*\.?\d*$/.test(val)) {
                        setInputValues({...inputValues, b: val});
                        const numVal = parseFloat(val);
                        if (!isNaN(numVal)) {
                          setActualColor({...actualColor, b: numVal});
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // Clean up on blur
                      const val = parseFloat(e.target.value);
                      if (isNaN(val)) {
                        setInputValues({...inputValues, b: '0'});
                        setActualColor({...actualColor, b: 0});
                      } else {
                        const clamped = Math.max(-128, Math.min(127, val));
                        setInputValues({...inputValues, b: clamped.toString()});
                        setActualColor({...actualColor, b: clamped});
                      }
                    }}
                    className="w-20 px-2 py-1 border rounded"
                    placeholder="-128 to 127"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Analyze Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isAnalyzing ? '분석 중...' : '보정 분석 시작'}
          </button>
        </div>

        {/* Analysis Results */}
        {correctionAnalysis && (
          <div className="space-y-6">
            {/* Color Difference Analysis */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-3">색차 분석</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Delta E</div>
                  <div className={`text-2xl font-bold ${getDeltaEStatus(correctionAnalysis.deltaE).color}`}>
                    {formatDeltaE(correctionAnalysis.deltaE)}
                  </div>
                  <div className="text-sm">{getDeltaEStatus(correctionAnalysis.deltaE).text}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">명도 차이 (ΔL)</div>
                  <div className="text-xl font-semibold">
                    {correctionAnalysis.colorDifference.dL > 0 ? '+' : ''}{correctionAnalysis.colorDifference.dL.toFixed(2)}
                  </div>
                  <div className="text-sm">
                    {correctionAnalysis.colorDifference.dL > 0 ? '더 밝게' : correctionAnalysis.colorDifference.dL < 0 ? '더 어둡게' : '적절함'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">적녹 차이 (Δa)</div>
                  <div className="text-xl font-semibold">
                    {correctionAnalysis.colorDifference.da > 0 ? '+' : ''}{correctionAnalysis.colorDifference.da.toFixed(2)}
                  </div>
                  <div className="text-sm">
                    {correctionAnalysis.colorDifference.da > 0 ? '더 적색' : correctionAnalysis.colorDifference.da < 0 ? '더 녹색' : '적절함'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">황청 차이 (Δb)</div>
                  <div className="text-xl font-semibold">
                    {correctionAnalysis.colorDifference.db > 0 ? '+' : ''}{correctionAnalysis.colorDifference.db.toFixed(2)}
                  </div>
                  <div className="text-sm">
                    {correctionAnalysis.colorDifference.db > 0 ? '더 황색' : correctionAnalysis.colorDifference.db < 0 ? '더 청색' : '적절함'}
                  </div>
                </div>
              </div>
            </div>

            {/* Correction Feasibility */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">보정 가능성 평가</h3>
              <div className="flex items-center gap-4">
                <div className={`text-lg font-semibold ${correctionAnalysis.feasibility.isPossible ? 'text-green-600' : 'text-red-600'}`}>
                  {correctionAnalysis.feasibility.isPossible ? '✓ 보정 가능' : '✗ 보정 어려움'}
                </div>
                <div className="text-sm text-gray-600">
                  신뢰도: {(correctionAnalysis.feasibility.confidence * 100).toFixed(0)}%
                </div>
              </div>
              {correctionAnalysis.feasibility.reason && (
                <div className="mt-2 text-sm">
                  <span className="font-medium">사유: </span>
                  {correctionAnalysis.feasibility.reason === 'COLOR_DIFFERENCE_TOO_LARGE' && '색차가 너무 큼'}
                  {correctionAnalysis.feasibility.reason === 'TAC_LIMIT_REACHED' && 'TAC 한계 도달'}
                  {correctionAnalysis.feasibility.reason === 'NO_SUITABLE_INKS' && '적합한 잉크 없음'}
                  {correctionAnalysis.feasibility.reason === 'CORRECTION_POSSIBLE' && '보정 가능한 범위'}
                </div>
              )}
            </div>

            {/* Correction Recipe */}
            {correctionRecipe && correctionRecipe.corrections.length > 0 && (
              <div className="border rounded-lg p-4 bg-green-50">
                <h3 className="font-semibold mb-3">보정된 최종 레시피</h3>
                
                {/* Final Corrected Recipe Table */}
                <div className="bg-white rounded p-3 mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">잉크</th>
                        <th className="text-right py-2">비율</th>
                        <th className="text-right py-2">변화량</th>
                      </tr>
                    </thead>
                    <tbody>
                      {correctionRecipe.correctedInks.map((ink: any, index: number) => {
                        const originalInk = currentRecipe.inks.find((i: any) => i.inkId === ink.inkId);
                        const changeAmount = originalInk ? ink.ratio - originalInk.ratio : ink.ratio;
                        return (
                          <tr key={index} className="border-b">
                            <td className="py-2">{ink.inkId}</td>
                            <td className="text-right py-2">{ink.ratio.toFixed(1)}%</td>
                            <td className={`text-right py-2 font-semibold ${changeAmount > 0 ? 'text-green-600' : changeAmount < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                              {changeAmount > 0 ? '+' : ''}{changeAmount.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="font-semibold">
                        <td className="py-2">합계</td>
                        <td className="text-right py-2">
                          {correctionRecipe.correctedInks.reduce((sum: number, ink: any) => sum + ink.ratio, 0).toFixed(1)}%
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                {/* Correction Details */}
                <div className="space-y-2 mb-3">
                  <div className="text-sm font-medium text-gray-700">보정 내용:</div>
                  {correctionRecipe.corrections.map((correction: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                      <span>{correction.name}</span>
                      <span className="font-semibold text-green-600">+{correction.addAmount.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
                
                {/* Predicted Result */}
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium">보정 후 예상 색상</div>
                      <div className="text-xs text-gray-600 mt-1">
                        L*: {correctionRecipe.predictedColor.L.toFixed(2)} 
                        a*: {correctionRecipe.predictedColor.a.toFixed(2)} 
                        b*: {correctionRecipe.predictedColor.b.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">예상 Delta E</div>
                      <div className={`text-xl font-bold ${getDeltaEStatus(correctionRecipe.predictedDeltaE).color}`}>
                        {formatDeltaE(correctionRecipe.predictedDeltaE)}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onApplyCorrection(correctionRecipe)}
                  className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  보정 레시피 적용
                </button>
              </div>
            )}

            {/* Special Ink Suggestions */}
            {showSpecialInks && correctionAnalysis.feasibility.suggestedInks && (
              <div className="border rounded-lg p-4 bg-yellow-50">
                <h3 className="font-semibold mb-3">특수 잉크 추천</h3>
                <div className="space-y-3">
                  {correctionAnalysis.feasibility.suggestedInks.map((ink: any, index: number) => (
                    <div key={index} className="p-3 bg-white rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{ink.name}</div>
                          {ink.pantone && <div className="text-sm text-gray-600">{ink.pantone}</div>}
                          <div className="text-sm mt-1">{ink.reason}</div>
                        </div>
                        <div className="text-right text-sm">
                          <div className="font-medium">{ink.usage}</div>
                          <div className="text-gray-600">{ink.effect}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Correction Direction */}
            {correctionAnalysis.correctionDirection.corrections.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">보정 방향</h3>
                <div className="grid grid-cols-2 gap-3">
                  {correctionAnalysis.correctionDirection.corrections.map((dir: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="text-lg">
                        {dir.type === 'brightness' && dir.value === 'increase' && '☀️'}
                        {dir.type === 'brightness' && dir.value === 'decrease' && '🌙'}
                        {dir.type === 'red' && '🔴'}
                        {dir.type === 'green' && '🟢'}
                        {dir.type === 'yellow' && '🟡'}
                        {dir.type === 'blue' && '🔵'}
                      </span>
                      <span>
                        {dir.type === 'brightness' && dir.value === 'increase' && '명도 증가'}
                        {dir.type === 'brightness' && dir.value === 'decrease' && '명도 감소'}
                        {dir.type === 'red' && '적색 보강'}
                        {dir.type === 'green' && '녹색 보강'}
                        {dir.type === 'yellow' && '황색 보강'}
                        {dir.type === 'blue' && '청색 보강'}
                      </span>
                      <span className="text-gray-500">({dir.amount.toFixed(1)})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorCorrectionModal;