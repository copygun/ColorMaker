import React, { useState } from 'react';
import { Recipe, RecipeStatus } from '../types';
import ColorCorrectionSection from './ColorCorrectionSection';

interface InkRecipe {
  inkId: string;
  ratio: number;
  concentration: number;
}

interface RecipeResultsProps {
  currentRecipe: Recipe | null;
  optimizedRecipes: Recipe[];
  inkDB: any;
  onOpenCorrectionModal?: () => void;
  activeRecipeId?: string | null;
  onSelectRecipe?: (recipe: Recipe) => void;
  onUpdateRecipeStatus?: (recipeId: string, status: RecipeStatus) => void;
  onRecipeUpdate?: (recipe: Recipe) => void;
  targetColor?: { L: number; a: number; b: number };
  gamutWarning?: {
    isOutOfGamut: boolean;
    message: string;
    confidence: number;
    deltaE?: number;
    suggestion?: { L: number; a: number; b: number };
  };
}

const RecipeResults: React.FC<RecipeResultsProps> = ({
  currentRecipe,
  optimizedRecipes,
  inkDB,
  onOpenCorrectionModal,
  activeRecipeId,
  onSelectRecipe,
  onUpdateRecipeStatus,
  onRecipeUpdate,
  targetColor,
  gamutWarning
}) => {
  const [showCorrection, setShowCorrection] = useState<string | null>(null);
  if (!currentRecipe && optimizedRecipes.length === 0) {
    return null;
  }

  const getDeltaEStatusClass = (deltaE: number) => {
    if (deltaE < 1) return 'status-success';
    if (deltaE < 3) return 'status-primary';
    return 'status-warning';
  };

  const getQualityLabel = (deltaE: number) => {
    if (deltaE < 1) return 'Excellent';
    if (deltaE < 2) return 'Very Good';
    if (deltaE < 3) return 'Good';
    if (deltaE < 5) return 'Acceptable';
    return 'Poor';
  };

  const getStatusBadge = (status?: RecipeStatus) => {
    if (!status) return null;
    
    const statusStyles: Record<RecipeStatus, { bg: string; color: string; text: string }> = {
      [RecipeStatus.CALCULATED]: { bg: '#e3f2fd', color: '#1976d2', text: '계산됨' },
      [RecipeStatus.SELECTED]: { bg: '#fff3e0', color: '#f57c00', text: '선택됨' },
      [RecipeStatus.IN_PROGRESS]: { bg: '#fff8e1', color: '#fbc02d', text: '작업중' },
      [RecipeStatus.MEASURING]: { bg: '#f3e5f5', color: '#7b1fa2', text: '측정중' },
      [RecipeStatus.COMPLETED]: { bg: '#e8f5e9', color: '#388e3c', text: '완료' },
      [RecipeStatus.NEEDS_CORRECTION]: { bg: '#ffebee', color: '#c62828', text: '보정필요' },
      [RecipeStatus.CORRECTING]: { bg: '#fce4ec', color: '#c2185b', text: '보정중' },
      [RecipeStatus.CORRECTED]: { bg: '#e0f2f1', color: '#00796b', text: '보정완료' }
    };
    
    const style = statusStyles[status];
    return (
      <span style={{
        padding: '2px 8px',
        background: style.bg,
        color: style.color,
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'normal',
        marginLeft: '8px'
      }}>
        {style.text}
      </span>
    );
  };

  const renderRecipeTable = (recipe: Recipe, showFooter: boolean = true) => (
    <>
      <table className="pro-table">
        <thead>
          <tr>
            <th>잉크</th>
            <th>비율</th>
            <th>농도</th>
            <th>타입</th>
          </tr>
        </thead>
        <tbody>
          {recipe.inks
            .filter(ink => ink.ratio > 0)
            .map((ink, index) => {
              const inkData = inkDB.getInkById(ink.inkId);
              const ratio = typeof ink.ratio === 'number' ? ink.ratio : 0;
              return (
                <tr key={index}>
                  <td style={{ textTransform: 'capitalize' }}>{ink.inkId}</td>
                  <td>{ratio.toFixed(1)}%</td>
                  <td>{ink.concentration}%</td>
                  <td>{inkData?.type || 'process'}</td>
                </tr>
              );
            })}
        </tbody>
        {showFooter && (
          <tfoot>
            <tr style={{ fontWeight: 600 }}>
              <td>합계</td>
              <td>{recipe.inks
                .filter(ink => ink.ratio > 0)
                .reduce((sum, ink) => sum + ink.ratio, 0).toFixed(1)}%</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        )}
      </table>

      <div className="data-grid" style={{ marginTop: '12px' }}>
        <div className="data-item">
          <div className="data-item-label">혼합 CIELAB</div>
          <div className="data-item-value" style={{ fontSize: '0.9rem' }}>
            L*: {recipe.mixed.L.toFixed(1)}, a*: {recipe.mixed.a.toFixed(1)}, b*: {recipe.mixed.b.toFixed(1)}
          </div>
        </div>
        <div className="data-item">
          <div className="data-item-label">ΔE*00</div>
          <div className="data-item-value">{recipe.deltaE.toFixed(2)}</div>
        </div>
      </div>
    </>
  );

  return (
    <div>
      {/* 색역 경고 메시지 */}
      {gamutWarning && gamutWarning.isOutOfGamut && (
        <div style={{
          padding: '16px',
          marginBottom: '20px',
          background: gamutWarning.confidence < 50 ? '#ffebee' : '#fff3e0',
          border: `2px solid ${gamutWarning.confidence < 50 ? '#f44336' : '#ff9800'}`,
          borderRadius: '8px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ 
              fontSize: '24px', 
              marginRight: '12px' 
            }}>
              {gamutWarning.confidence < 50 ? '⚠️' : '⚡'}
            </span>
            <div>
              <h3 style={{ 
                margin: 0, 
                color: gamutWarning.confidence < 50 ? '#c62828' : '#ef6c00'
              }}>
                색역 검증 결과
              </h3>
              <p style={{ 
                margin: '4px 0 0 0', 
                fontSize: '14px', 
                color: '#666' 
              }}>
                {gamutWarning.message}
              </p>
            </div>
          </div>
          
          {gamutWarning.suggestion && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '4px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                🎯 제안된 대체 색상
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <span style={{ color: '#666', fontSize: '12px' }}>L*</span>
                  <div style={{ fontWeight: 'bold' }}>{gamutWarning.suggestion.L.toFixed(2)}</div>
                </div>
                <div>
                  <span style={{ color: '#666', fontSize: '12px' }}>a*</span>
                  <div style={{ fontWeight: 'bold' }}>{gamutWarning.suggestion.a.toFixed(2)}</div>
                </div>
                <div>
                  <span style={{ color: '#666', fontSize: '12px' }}>b*</span>
                  <div style={{ fontWeight: 'bold' }}>{gamutWarning.suggestion.b.toFixed(2)}</div>
                </div>
              </div>
              {gamutWarning.deltaE && (
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '12px', 
                  color: '#666' 
                }}>
                  원본과의 색차: ΔE*00 = {gamutWarning.deltaE.toFixed(2)}
                </div>
              )}
            </div>
          )}
          
          <div style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              flex: 1,
              height: '8px',
              background: '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${gamutWarning.confidence}%`,
                height: '100%',
                background: gamutWarning.confidence > 70 ? '#4caf50' : 
                           gamutWarning.confidence > 40 ? '#ff9800' : '#f44336',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <span style={{ fontSize: '12px', color: '#666', minWidth: '45px' }}>
              {gamutWarning.confidence}% 신뢰도
            </span>
          </div>
        </div>
      )}
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: optimizedRecipes.length > 0 ? '1fr 1fr' : '1fr', 
        gap: '20px' 
      }}>
        {/* Selected Inks Recipe */}
        {currentRecipe && (
        <div className="pro-card">
          <div className="pro-card-header" style={{
            border: activeRecipeId === currentRecipe.id ? '2px solid #2196F3' : 'none'
          }}>
            <h2 className="pro-card-title">
              선택된 잉크 레시피
              {getStatusBadge(currentRecipe.status)}
              {currentRecipe.isCorrection && (
                <span style={{ 
                  marginLeft: '10px', 
                  padding: '2px 8px', 
                  background: '#4CAF50', 
                  color: 'white', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'normal'
                }}>
                  ✓ 보정됨
                </span>
              )}
              <span className={`status-indicator ${getDeltaEStatusClass(currentRecipe.deltaE)}`} 
                    style={{ marginLeft: 'auto' }}>
                ΔE*00 {currentRecipe.deltaE.toFixed(2)}
              </span>
            </h2>
          </div>
          <div className="pro-card-body">
            {currentRecipe.isCorrection && currentRecipe.correctionDate && (
              <div style={{
                padding: '12px',
                background: '#e8f5e9',
                borderRadius: '8px',
                marginBottom: '12px',
                border: '1px solid #4CAF50'
              }}>
                <div style={{ fontWeight: 'bold', color: '#2e7d32', marginBottom: '8px' }}>
                  🎯 보정 정보
                </div>
                <div style={{ fontSize: '14px', color: '#555' }}>
                  <div>보정 적용 시간: {new Date(currentRecipe.correctionDate).toLocaleString('ko-KR')}</div>
                  {currentRecipe.originalDeltaE && (
                    <div>
                      개선 효과: Delta E {currentRecipe.originalDeltaE?.toFixed(2)} → {currentRecipe.deltaE.toFixed(2)} 
                      <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                        {' '}(−{(currentRecipe.originalDeltaE - currentRecipe.deltaE).toFixed(2)})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {renderRecipeTable(currentRecipe)}
            
            {/* 색상 보정 섹션 - 선택된 레시피에 항상 표시 */}
            {targetColor && (activeRecipeId === currentRecipe.id || 
              currentRecipe.status === RecipeStatus.SELECTED ||
              currentRecipe.status === RecipeStatus.IN_PROGRESS ||
              currentRecipe.status === RecipeStatus.MEASURING) && (
              <ColorCorrectionSection
                recipe={currentRecipe}
                targetColor={targetColor}
                onCorrectionApply={(correctedRecipe) => {
                  if (onRecipeUpdate) {
                    onRecipeUpdate(correctedRecipe);
                  }
                }}
                inkDB={inkDB}
              />
            )}
            
            {/* 작업 관리 버튼들 */}
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(!currentRecipe.status || currentRecipe.status === RecipeStatus.CALCULATED) && onSelectRecipe && (
                <button
                  onClick={() => onSelectRecipe(currentRecipe)}
                  className="pro-button pro-button-primary"
                  style={{ flex: 1 }}
                >
                  🎯 이 레시피로 작업 시작
                </button>
              )}
              
              {currentRecipe.status === RecipeStatus.SELECTED && onUpdateRecipeStatus && (
                <button
                  onClick={() => onUpdateRecipeStatus(currentRecipe.id!, RecipeStatus.IN_PROGRESS)}
                  className="pro-button"
                  style={{ flex: 1, background: '#fbc02d', color: 'white' }}
                >
                  🎨 조색 시작
                </button>
              )}
              
              {currentRecipe.status === RecipeStatus.IN_PROGRESS && onUpdateRecipeStatus && (
                <button
                  onClick={() => onUpdateRecipeStatus(currentRecipe.id!, RecipeStatus.MEASURING)}
                  className="pro-button"
                  style={{ flex: 1, background: '#7b1fa2', color: 'white' }}
                >
                  📏 색상 측정
                </button>
              )}
              
              {currentRecipe.status === RecipeStatus.MEASURING && onUpdateRecipeStatus && (
                <button
                  onClick={() => onUpdateRecipeStatus(currentRecipe.id!, RecipeStatus.COMPLETED)}
                  className="pro-button"
                  style={{ flex: 1, background: '#388e3c', color: 'white' }}
                >
                  ✅ 작업 완료
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Optimized Recipes */}
      {optimizedRecipes && optimizedRecipes.length > 0 && (() => {
        // 중복 제거를 위한 필터링
        const uniqueRecipes = optimizedRecipes.reduce((acc: Recipe[], recipe) => {
          const recipeKey = recipe.inks
            .filter((ink: any) => ink.ratio > 0.01)
            .map((ink: any) => `${ink.inkId}_${ink.concentration}_${Math.round(ink.ratio)}`)
            .sort()
            .join('|');
          
          const isDuplicate = acc.some(existing => {
            const existingKey = existing.inks
              .filter((ink: any) => ink.ratio > 0.01)
              .map((ink: any) => `${ink.inkId}_${ink.concentration}_${Math.round(ink.ratio)}`)
              .sort()
              .join('|');
            return existingKey === recipeKey;
          });
          
          if (!isDuplicate) {
            acc.push(recipe);
          }
          return acc;
        }, []);
        
        return (
        <div className="pro-card">
          <div className="pro-card-header">
            <h2 className="pro-card-title">
              최적화된 레시피 {uniqueRecipes.length === 1 ? '' : `(상위 ${uniqueRecipes.length}개)`}
            </h2>
          </div>
          <div className="pro-card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {uniqueRecipes.map((recipe, recipeIndex) => (
              <div key={recipeIndex} style={{ 
                marginBottom: recipeIndex < uniqueRecipes.length - 1 ? '24px' : '0',
                paddingBottom: recipeIndex < uniqueRecipes.length - 1 ? '24px' : '0',
                borderBottom: recipeIndex < uniqueRecipes.length - 1 ? '1px solid #e0e0e0' : 'none',
                padding: activeRecipeId === recipe.id ? '12px' : '0',
                border: activeRecipeId === recipe.id ? '2px solid #2196F3' : 'none',
                borderRadius: activeRecipeId === recipe.id ? '8px' : '0'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#333' }}>
                    #{recipeIndex + 1} 레시피
                    {getStatusBadge(recipe.status)}
                  </h3>
                  <span className={`status-indicator ${getDeltaEStatusClass(recipe.deltaE)}`}>
                    ΔE*00 {recipe.deltaE.toFixed(2)}
                  </span>
                </div>
                
                <table className="pro-table">
                  <thead>
                    <tr>
                      <th>잉크</th>
                      <th>비율</th>
                      <th>농도</th>
                      <th>타입</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipe.inks
                      .filter(ink => ink.ratio > 0)
                      .map((ink, index) => {
                        const inkData = inkDB.getInkById(ink.inkId);
                        const ratio = typeof ink.ratio === 'number' ? ink.ratio : 0;
                        return (
                          <tr key={index}>
                            <td style={{ textTransform: 'capitalize' }}>{ink.inkId}</td>
                            <td>{ratio.toFixed(1)}%</td>
                            <td>{ink.concentration}%</td>
                            <td>{inkData?.type || 'process'}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 600 }}>
                      <td>합계</td>
                      <td>{recipe.inks
                        .filter(ink => ink.ratio > 0)
                        .reduce((sum, ink) => sum + ink.ratio, 0).toFixed(1)}%</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>

                <div className="data-grid" style={{ marginTop: '12px' }}>
                  <div className="data-item">
                    <div className="data-item-label">혼합 CIELAB</div>
                    <div className="data-item-value" style={{ fontSize: '0.9rem' }}>
                      L*: {recipe.mixed.L.toFixed(1)}, a*: {recipe.mixed.a.toFixed(1)}, b*: {recipe.mixed.b.toFixed(1)}
                    </div>
                  </div>
                  <div className="data-item">
                    <div className="data-item-label">품질</div>
                    <div className="data-item-value" style={{ fontSize: '0.9rem' }}>
                      {getQualityLabel(recipe.deltaE)}
                    </div>
                  </div>
                </div>
                
                {/* 색상 보정 섹션 - 선택된 최적화 레시피에도 표시 */}
                {targetColor && activeRecipeId === recipe.id && (
                  <ColorCorrectionSection
                    recipe={recipe}
                    targetColor={targetColor}
                    onCorrectionApply={(correctedRecipe) => {
                      if (onRecipeUpdate) {
                        onRecipeUpdate(correctedRecipe);
                      }
                    }}
                    inkDB={inkDB}
                  />
                )}
                
                {/* 작업 시작 버튼 */}
                {(!recipe.status || recipe.status === RecipeStatus.CALCULATED) && onSelectRecipe && (
                  <button
                    onClick={() => onSelectRecipe(recipe)}
                    className="pro-button pro-button-primary"
                    style={{ marginTop: '12px', width: '100%' }}
                  >
                    🎯 이 레시피로 작업 시작
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        );
      })()}
      </div>
    </div>
  );
};

export default RecipeResults;