import React, { useState, useEffect } from 'react';
import type { Recipe, LabColor } from '../types';

// Dynamic import to avoid bundling issues
let RecipeRecommender: any = null;
if (typeof window !== 'undefined') {
  import('@core/recipeRecommender.js').then((module) => {
    RecipeRecommender = module.default || module;
  });
}

interface RecipeDisplayProps {
  recipe: Recipe;
  inkDatabase: any;
  targetColor?: LabColor;
}

const RecipeDisplay: React.FC<RecipeDisplayProps> = ({ recipe, inkDatabase, targetColor }) => {
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const getInkName = (inkId: string) => {
    const ink = inkDatabase.getInkById(inkId);
    return ink ? ink.name : inkId;
  };

  // 추천 레시피 계산
  const calculateRecommendations = async () => {
    setIsCalculating(true);
    try {
      // Dynamic import
      if (!RecipeRecommender) {
        const module = await import('@core/recipeRecommender.js');
        RecipeRecommender = module.default || module;
      }

      if (RecipeRecommender) {
        const recommender = new RecipeRecommender(inkDatabase);
        const target = targetColor || recipe.target;
        const currentInks = recipe.inks.map((ink) => ink.inkId);

        const recommendations = recommender.recommendAlternatives(target, currentInks, recipe);

        setRecommendations(recommendations);
        setShowRecommendations(true);
      } else {
        console.error('RecipeRecommender not loaded');
        alert('추천 시스템을 로드하는 중입니다. 잠시 후 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('Failed to calculate recommendations:', error);
      alert('레시피 추천 중 오류가 발생했습니다.');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="recipe-display">
      <div className="recipe-header">
        <div className="delta-e-result">
          <span className="label">Delta E:</span>
          <span
            className={`value ${recipe.deltaE < 1 ? 'excellent' : recipe.deltaE < 2 ? 'good' : 'fair'}`}
          >
            {recipe.deltaE.toFixed(2)}
          </span>
        </div>
        <div className="method-info">
          <span>{recipe.method === 'xyz' ? 'XYZ' : 'Lab'} 혼합</span>
          <span>{recipe.optimization === 'pso' ? 'PSO' : 'Simple'} 최적화</span>
        </div>
      </div>

      <div className="color-comparison">
        <div className="color-box">
          <div className="color-label">목표 색상</div>
          <div className="lab-values">
            L*: {recipe.target.L.toFixed(1)}
            <br />
            a*: {recipe.target.a.toFixed(1)}
            <br />
            b*: {recipe.target.b.toFixed(1)}
          </div>
        </div>

        <div className="arrow">→</div>

        <div className="color-box">
          <div className="color-label">계산 결과</div>
          <div className="lab-values">
            L*: {recipe.mixed.L.toFixed(1)}
            <br />
            a*: {recipe.mixed.a.toFixed(1)}
            <br />
            b*: {recipe.mixed.b.toFixed(1)}
          </div>
        </div>
      </div>

      <div className="ink-recipe">
        <h3>현재 레시피 (선택된 잉크 기준)</h3>
        <table>
          <thead>
            <tr>
              <th>잉크</th>
              <th>비율</th>
              <th>농도</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {recipe.inks.map((ink, index) => (
              <tr key={index}>
                <td>{getInkName(ink.inkId)}</td>
                <td>{ink.ratio.toFixed(1)}%</td>
                <td>{ink.concentration.toFixed(0)}%</td>
                <td>{inkDatabase.getInkById(ink.inkId)?.type || 'process'}</td>
              </tr>
            ))}
            <tr className="total-row">
              <td>
                <strong>합계</strong>
              </td>
              <td>
                <strong>{recipe.inks.reduce((sum, ink) => sum + ink.ratio, 0).toFixed(1)}%</strong>
              </td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 추천 레시피 버튼 */}
      <div className="recommendation-section">
        <button
          className="btn btn-recommend"
          onClick={calculateRecommendations}
          disabled={isCalculating}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '20px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          {isCalculating ? '분석 중...' : '🎯 더 정확한 레시피 추천받기'}
        </button>
      </div>

      {/* 추천 레시피 목록 */}
      {showRecommendations && recommendations.length > 0 && (
        <div
          className="recommendations-container"
          style={{
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#f7fafc',
            borderRadius: '8px',
            border: '2px solid #e2e8f0',
          }}
        >
          <h3 style={{ marginBottom: '20px', color: '#2d3748' }}>
            🎨 추천 대안 레시피 (더 높은 정확도)
          </h3>

          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="recommendation-item"
              style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: 'white',
                borderRadius: '6px',
                border: selectedRecommendation === idx ? '2px solid #667eea' : '1px solid #cbd5e0',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedRecommendation(selectedRecommendation === idx ? null : idx)}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <h4 style={{ margin: 0, color: '#2d3748', fontSize: '18px' }}>{rec.name}</h4>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <span
                    style={{
                      padding: '4px 12px',
                      backgroundColor:
                        rec.expectedDeltaE < 1
                          ? '#c6f6d5'
                          : rec.expectedDeltaE < 2
                            ? '#bee3f8'
                            : '#feebc8',
                      color:
                        rec.expectedDeltaE < 1
                          ? '#22543d'
                          : rec.expectedDeltaE < 2
                            ? '#2c5282'
                            : '#7c2d12',
                      borderRadius: '4px',
                      fontWeight: '600',
                      fontSize: '14px',
                    }}
                  >
                    예상 ΔE: {rec.expectedDeltaE.toFixed(2)}
                  </span>
                  {rec.improvement > 0 && (
                    <span
                      style={{
                        padding: '4px 12px',
                        backgroundColor: '#c6f6d5',
                        color: '#22543d',
                        borderRadius: '4px',
                        fontSize: '14px',
                      }}
                    >
                      ↓ {rec.improvementPercent}% 개선
                    </span>
                  )}
                  <span
                    style={{
                      padding: '4px 12px',
                      backgroundColor: '#e6fffa',
                      color: '#234e52',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  >
                    신뢰도: {(rec.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <p style={{ margin: '10px 0 0 0', color: '#4a5568' }}>{rec.description}</p>

              <div
                style={{
                  margin: '10px 0',
                  padding: '10px',
                  backgroundColor: '#f0fff4',
                  borderLeft: '3px solid #38a169',
                  borderRadius: '4px',
                }}
              >
                <strong>추천 이유:</strong> {rec.reason}
              </div>

              {/* 상세 정보 (클릭시 표시) */}
              {selectedRecommendation === idx && (
                <div style={{ marginTop: '15px' }}>
                  {/* 잉크 구성 */}
                  <div style={{ marginBottom: '15px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>잉크 구성:</h5>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f7fafc' }}>
                          <th
                            style={{
                              padding: '8px',
                              textAlign: 'left',
                              borderBottom: '1px solid #e2e8f0',
                            }}
                          >
                            잉크명
                          </th>
                          <th
                            style={{
                              padding: '8px',
                              textAlign: 'right',
                              borderBottom: '1px solid #e2e8f0',
                            }}
                          >
                            비율
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rec.inks.map((ink: any, inkIdx: number) => (
                          <tr key={inkIdx}>
                            <td style={{ padding: '8px', borderBottom: '1px solid #edf2f7' }}>
                              {ink.name}
                            </td>
                            <td
                              style={{
                                padding: '8px',
                                textAlign: 'right',
                                borderBottom: '1px solid #edf2f7',
                              }}
                            >
                              {ink.ratio.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 장점 */}
                  {rec.advantages && (
                    <div style={{ marginBottom: '15px' }}>
                      <h5 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>장점:</h5>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {rec.advantages.map((adv: string, advIdx: number) => (
                          <li key={advIdx} style={{ color: '#38a169', marginBottom: '5px' }}>
                            {adv}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 주의사항 */}
                  {rec.warnings && (
                    <div style={{ marginBottom: '15px' }}>
                      <h5 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>주의사항:</h5>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {rec.warnings.map((warn: string, warnIdx: number) => (
                          <li key={warnIdx} style={{ color: '#e53e3e', marginBottom: '5px' }}>
                            {warn}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* PANTONE 참조 */}
                  {rec.pantoneReference && (
                    <div
                      style={{
                        padding: '10px',
                        backgroundColor: '#faf5ff',
                        border: '1px solid #d6bcfa',
                        borderRadius: '4px',
                      }}
                    >
                      <strong>PANTONE 참조:</strong> {rec.pantoneReference.code} -{' '}
                      {rec.pantoneReference.name}
                      <br />
                      <span style={{ fontSize: '12px', color: '#718096' }}>
                        Lab: L:{rec.pantoneReference.L.toFixed(1)}
                        a:{rec.pantoneReference.a.toFixed(1)}
                        b:{rec.pantoneReference.b.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {/* 적용 버튼 */}
                  <button
                    style={{
                      marginTop: '15px',
                      padding: '10px 20px',
                      backgroundColor: '#48bb78',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(
                        `"${rec.name}" 레시피를 적용하려면 잉크를 재선택하고 다시 계산해주세요.`,
                      );
                    }}
                  >
                    이 레시피 적용 가이드
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 추가 정보 */}
      {recipe.metadata && (
        <div className="recipe-metadata">
          <h4>추가 정보</h4>
          {recipe.metadata.totalIterations && (
            <div>최적화 반복: {recipe.metadata.totalIterations}회</div>
          )}
          {recipe.metadata.convergenceRate && (
            <div>수렴율: {(recipe.metadata.convergenceRate * 100).toFixed(1)}%</div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecipeDisplay;
