/**
 * 메인 App 컴포넌트
 * 하이브리드 잉크 레시피 계산기
 */

import { useState, useCallback, useEffect } from 'react';
import { useColorCalculation } from './hooks/useColorCalculation';
import ColorInput from './components/ColorInput';
import ModernColorInput from './components/ModernColorInput';
import InkSelector from './components/InkSelector';
import InkManager from './components/InkManager';
import MixingCalculator from './components/MixingCalculator';
import RecipeDisplay from './components/RecipeDisplay';
import RecipeHistory from './components/RecipeHistory';
import ModeSelector from './components/ModeSelector';
import FeatureToggles from './components/FeatureToggles';
import DeltaESettings from './components/DeltaESettings';
import ComparisonView from './components/ComparisonView';
import ColorCorrection from './components/ColorCorrection';
import Certificate from './components/Certificate';
import MeasurementInfo from './components/MeasurementInfo';
import PrintSettings from './components/PrintSettings';
import OptimizedMixing from './components/OptimizedMixing';
import ProfessionalMixing from './components/ProfessionalMixing';
import PrintResultTracker from './components/PrintResultTracker';
import type { LabColor, Recipe, CorrectionSuggestion } from './types';
import CorrectionEngine from '@core/correctionEngine.js';
import './App.css';

function App() {
  // 색상 계산 훅
  const {
    calculationMode,
    features,
    deltaEWeights,
    deltaEMethod,
    calculateRecipe,
    compareCalculations,
    switchMode,
    toggleFeature,
    setDeltaEWeights,
    setDeltaEMethod,
    labToRgb,
    getInkDatabase,
  } = useColorCalculation();

  // 상태 관리
  const [targetColor, setTargetColor] = useState<LabColor>({ L: 0, a: 0, b: 0 });
  const [selectedInks, setSelectedInks] = useState<string[]>([
    'cyan',
    'magenta',
    'yellow',
    'black',
  ]);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showInkManager, setShowInkManager] = useState(false);
  const [showMixingCalculator, setShowMixingCalculator] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showOptimizedMixing, setShowOptimizedMixing] = useState(false);
  const [showProfessionalMixing, setShowProfessionalMixing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Recipe[]>([]);
  const [correctionEngine] = useState(() => new CorrectionEngine());

  // 인쇄 설정 상태
  const [printMethod, setPrintMethod] = useState('offset');
  const [substrateType, setSubstrateType] = useState('white_coated');
  const [useModernUI, setUseModernUI] = useState(false);

  // 레시피 계산
  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    try {
      const recipe = await calculateRecipe(targetColor, selectedInks, 'offset', {
        printMethod,
        substrateType,
      });
      setCurrentRecipe(recipe);

      // 히스토리에 추가
      setHistory((prev) => [recipe, ...prev.slice(0, 9)]);

      // LocalStorage에 저장
      localStorage.setItem('recipeHistory', JSON.stringify([recipe, ...history.slice(0, 9)]));
    } catch (error) {
      // Error is shown to user via alert
      alert('레시피 계산 중 오류가 발생했습니다.');
    } finally {
      setIsCalculating(false);
    }
  }, [targetColor, selectedInks, calculateRecipe, history, printMethod, substrateType]);

  // A/B 테스트 실행
  const handleCompare = useCallback(async () => {
    setIsCalculating(true);
    try {
      const result = await compareCalculations(targetColor, selectedInks);
      setComparisonResult(result);
      setShowComparison(true);
    } catch (error) {
      // Error is handled silently for comparison
    } finally {
      setIsCalculating(false);
    }
  }, [targetColor, selectedInks, compareCalculations]);

  // 보정 적용 핸들러
  const handleCorrectionApply = useCallback(
    (corrections: CorrectionSuggestion[]) => {
      // 보정이 적용된 새로운 레시피 생성
      if (currentRecipe) {
        const correctedRecipe: Recipe = {
          ...currentRecipe,
          inks: [
            ...currentRecipe.inks,
            ...corrections.map((c) => ({
              inkId: c.inkId,
              ratio: c.addAmount,
              concentration: 100,
            })),
          ],
          mixed: currentRecipe.mixed, // Use current recipe's mixed color
          deltaE: currentRecipe.deltaE, // Use current recipe's deltaE
          isCorrection: true,
        };

        setCurrentRecipe(correctedRecipe);
        setHistory((prev) => [correctedRecipe, ...prev.slice(0, 9)]);
        localStorage.setItem(
          'recipeHistory',
          JSON.stringify([correctedRecipe, ...history.slice(0, 9)]),
        );
      }
    },
    [currentRecipe, history],
  );

  // 초기 로드 시 히스토리 복원
  useEffect(() => {
    const savedHistory = localStorage.getItem('recipeHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        // Failed to load history - continue without it
      }
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎨 원라벨 컬러연구소 — 별색 잉크 레시피 계산기</h1>
        <div className="version-badge">v3.1 Hybrid</div>
      </header>

      <div className="app-body">
        <div className="control-panel">
          {/* 모드 선택 */}
          <section className="panel-section">
            <h2>계산 모드</h2>
            <ModeSelector currentMode={calculationMode.mode} onModeChange={switchMode} />
          </section>

          {/* 측정 기준 정보 */}
          <MeasurementInfo />

          {/* 인쇄 설정 (Advanced/Hybrid 모드에서만) */}
          {(calculationMode.mode === 'advanced' || calculationMode.mode === 'hybrid') && (
            <section className="panel-section">
              <h2>인쇄 설정</h2>
              <PrintSettings
                printMethod={printMethod}
                substrateType={substrateType}
                onPrintMethodChange={setPrintMethod}
                onSubstrateChange={setSubstrateType}
              />
            </section>
          )}

          {/* 색상 입력 */}
          <section className="panel-section">
            <div className="section-header">
              <h2>목표 색상</h2>
              <button
                className="btn btn-small"
                onClick={() => setUseModernUI(!useModernUI)}
                style={{
                  background: useModernUI ? 'var(--primary)' : 'var(--gray-500)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.875rem',
                }}
              >
                {useModernUI ? '모던 UI' : '클래식 UI'}
              </button>
            </div>
            {useModernUI ? (
              <ModernColorInput
                value={targetColor}
                onChange={setTargetColor}
                onValidate={(color) => {
                  const rgb = labToRgb(color.L, color.a, color.b);
                  return (
                    rgb.r >= 0 &&
                    rgb.r <= 255 &&
                    rgb.g >= 0 &&
                    rgb.g <= 255 &&
                    rgb.b >= 0 &&
                    rgb.b <= 255
                  );
                }}
                labToRgb={labToRgb}
              />
            ) : (
              <ColorInput
                value={targetColor}
                onChange={setTargetColor}
                onValidate={(color) => {
                  const rgb = labToRgb(color.L, color.a, color.b);
                  return (
                    rgb.r >= 0 &&
                    rgb.r <= 255 &&
                    rgb.g >= 0 &&
                    rgb.g <= 255 &&
                    rgb.b >= 0 &&
                    rgb.b <= 255
                  );
                }}
                labToRgb={labToRgb}
              />
            )}
          </section>

          {/* 잉크 선택 */}
          <section className="panel-section">
            <div className="section-header">
              <h2>베이스 잉크</h2>
              <button className="btn btn-small" onClick={() => setShowInkManager(!showInkManager)}>
                {showInkManager ? '닫기' : '🎨 잉크 편집'}
              </button>
            </div>
            {showInkManager ? (
              <InkManager
                inkDatabase={getInkDatabase()}
                onInkUpdate={() => {
                  // 잉크 업데이트 시 재렌더링
                  window.location.reload();
                }}
              />
            ) : (
              <InkSelector
                selectedInks={selectedInks}
                onSelectionChange={setSelectedInks}
                inkDatabase={getInkDatabase()}
                showMetallic={features.ENABLE_METALLIC}
              />
            )}
          </section>

          {/* Delta E 설정 */}
          <section className="panel-section">
            <h2>Delta E 설정</h2>
            <DeltaESettings
              method={deltaEMethod}
              weights={deltaEWeights}
              onMethodChange={setDeltaEMethod}
              onWeightsChange={setDeltaEWeights}
            />
          </section>

          {/* 기능 토글 (Hybrid 모드에서만) */}
          {calculationMode.mode === 'hybrid' && (
            <section className="panel-section">
              <h2>고급 기능</h2>
              <FeatureToggles features={features} onToggle={toggleFeature} />
              {features.ENABLE_CERTIFICATE && currentRecipe && (
                <button
                  className="btn btn-certificate"
                  onClick={() => setShowCertificate(true)}
                  style={{ marginTop: '10px', width: '100%' }}
                >
                  📄 성적서 출력
                </button>
              )}
            </section>
          )}

          {/* 계산 버튼 */}
          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={handleCalculate}
              disabled={isCalculating || selectedInks.length === 0}
            >
              {isCalculating ? '계산 중...' : '레시피 계산'}
            </button>

            {calculationMode.mode === 'hybrid' && (
              <button
                className="btn btn-secondary"
                onClick={handleCompare}
                disabled={isCalculating}
              >
                A/B 비교
              </button>
            )}

            <button
              className="btn btn-ink-manager"
              onClick={() => setShowInkManager(!showInkManager)}
            >
              🎨 {showInkManager ? '잉크 선택' : '잉크 관리'}
            </button>

            <button className="btn btn-history" onClick={() => setShowHistory(!showHistory)}>
              📋 히스토리 관리
            </button>

            <button
              className="btn btn-mixing"
              onClick={() => setShowMixingCalculator(!showMixingCalculator)}
            >
              🧪 배합 계산기
            </button>

            <button
              className="btn btn-optimized"
              onClick={() => setShowOptimizedMixing(!showOptimizedMixing)}
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              🎯 최적화 배합
            </button>

            <button
              className="btn btn-professional"
              onClick={() => setShowProfessionalMixing(!showProfessionalMixing)}
              style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)' }}
            >
              🔬 전문가 모드
            </button>
          </div>
        </div>

        <div className="results-panel">
          {/* 현재 레시피 */}
          {currentRecipe && (
            <section className="panel-section">
              <div className="section-header">
                <h2>계산 결과</h2>
                <button
                  className="btn btn-small"
                  onClick={() => setShowCorrection(!showCorrection)}
                >
                  {showCorrection ? '보정 닫기' : '🎯 색상 보정'}
                </button>
              </div>
              <RecipeDisplay
                recipe={currentRecipe}
                inkDatabase={getInkDatabase()}
                targetColor={targetColor}
              />
            </section>
          )}

          {/* 색상 보정 */}
          {showCorrection && currentRecipe && (
            <section className="panel-section">
              <ColorCorrection
                originalRecipe={currentRecipe}
                targetColor={targetColor}
                onCorrectionApply={handleCorrectionApply}
                correctionEngine={correctionEngine}
                inkDatabase={getInkDatabase()}
              />
            </section>
          )}

          {/* 실측값 피드백 시스템 */}
          <PrintResultTracker
            currentRecipe={currentRecipe}
            predictedLab={currentRecipe?.mixed}
            onCalibrationUpdate={() => {
              // 보정 프로파일이 업데이트되면 재계산 권장
              console.log('Calibration profile updated');
            }}
          />

          {/* 최적화된 배합 */}
          {showOptimizedMixing && (
            <section className="panel-section">
              <OptimizedMixing targetColor={targetColor} />
            </section>
          )}

          {/* 전문가 모드 */}
          {showProfessionalMixing && (
            <section className="panel-section">
              <ProfessionalMixing targetColor={targetColor} />
            </section>
          )}

          {/* 비교 결과 */}
          {showComparison && comparisonResult && (
            <section className="panel-section">
              <h2>계산 방식 비교</h2>
              <ComparisonView
                comparison={comparisonResult}
                onClose={() => setShowComparison(false)}
              />
            </section>
          )}

          {/* 히스토리 */}
          {history.length > 0 && (
            <section className="panel-section">
              <h2>최근 레시피</h2>
              <div className="history-list">
                {history.slice(0, 5).map((recipe, index) => (
                  <div
                    key={index}
                    className="history-item"
                    onClick={() => {
                      setTargetColor(recipe.target);
                      setCurrentRecipe(recipe);
                    }}
                  >
                    <div
                      className="color-preview"
                      style={{
                        backgroundColor: `rgb(${labToRgb(recipe.mixed.L, recipe.mixed.a, recipe.mixed.b).r},
                                           ${labToRgb(recipe.mixed.L, recipe.mixed.a, recipe.mixed.b).g},
                                           ${labToRgb(recipe.mixed.L, recipe.mixed.a, recipe.mixed.b).b})`,
                      }}
                    />
                    <span>
                      L:{recipe.mixed.L.toFixed(1)} a:{recipe.mixed.a.toFixed(1)} b:
                      {recipe.mixed.b.toFixed(1)}
                    </span>
                    <span className="delta-e">ΔE: {recipe.deltaE.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <footer className="app-footer">
        <div className="footer-info">
          <span>Mode: {calculationMode.mode}</span>
          <span>Mixing: {features.USE_XYZ_MIXING ? 'XYZ' : 'Lab'}</span>
          <span>Optimization: {features.USE_PSO_OPTIMIZER ? 'PSO' : 'Simple'}</span>
          <span>ΔE: {deltaEMethod}</span>
        </div>
      </footer>

      {/* 배합 계산기 모달 */}
      {showMixingCalculator && (
        <div className="modal-overlay" onClick={() => setShowMixingCalculator(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowMixingCalculator(false)}>
              ×
            </button>
            <MixingCalculator inkDatabase={getInkDatabase()} targetColor={targetColor} />
          </div>
        </div>
      )}

      {/* 성적서 모달 */}
      {showCertificate && currentRecipe && (
        <Certificate
          recipe={currentRecipe}
          targetColor={targetColor}
          inkDatabase={getInkDatabase()}
          show={showCertificate}
          onClose={() => setShowCertificate(false)}
        />
      )}

      {/* 히스토리 모달 */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowHistory(false)}>
              ×
            </button>
            <RecipeHistory
              currentRecipe={currentRecipe}
              onSelectRecipe={(recipe) => {
                setTargetColor(recipe.target || recipe.targetColor || { L: 0, a: 0, b: 0 });
                setCurrentRecipe(recipe);
                setShowHistory(false);
              }}
              onCompareRecipes={(recipes) => {
                // 비교 기능 구현
                console.log('Comparing recipes:', recipes);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
