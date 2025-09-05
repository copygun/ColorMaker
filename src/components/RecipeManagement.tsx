import React from 'react';
import type { Recipe, LabColor } from '../types';

interface RecipeManagementProps {
  recipeHistory: Recipe[];
  showHistoryModal: boolean;
  setShowHistoryModal: (show: boolean) => void;
  setTargetColor: (color: LabColor) => void;
  setCurrentRecipe: (recipe: Recipe) => void;
  setCurrentPage: (page: string) => void;
}

const RecipeManagement: React.FC<RecipeManagementProps> = ({
  recipeHistory,
  showHistoryModal,
  setShowHistoryModal,
  setTargetColor,
  setCurrentRecipe,
  setCurrentPage,
}) => {
  return (
    <div className="pro-card">
      <div className="pro-card-header">
        <h2 className="pro-card-title">
          레시피 관리
          <button
            className="pro-button pro-button-secondary"
            style={{ marginLeft: 'auto' }}
            onClick={() => setShowHistoryModal(true)}
          >
            상세 관리
          </button>
        </h2>
      </div>
      <div className="pro-card-body">
        {recipeHistory.length === 0 ? (
          <p>저장된 레시피가 없습니다.</p>
        ) : (
          <table className="pro-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>목표 색상</th>
                <th>혼합 결과</th>
                <th>Delta E</th>
                <th>잉크 구성</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {recipeHistory.slice(0, 10).map((recipe, index) => {
                const date = new Date();
                date.setMinutes(date.getMinutes() - index * 10); // Mock dates
                return (
                  <tr key={index}>
                    <td>{date.toLocaleDateString('ko-KR')}</td>
                    <td>
                      L*{recipe.target.L.toFixed(1)}
                      a*{recipe.target.a.toFixed(1)}
                      b*{recipe.target.b.toFixed(1)}
                    </td>
                    <td>
                      L*{recipe.mixed.L.toFixed(1)}
                      a*{recipe.mixed.a.toFixed(1)}
                      b*{recipe.mixed.b.toFixed(1)}
                    </td>
                    <td>{recipe.deltaE.toFixed(2)}</td>
                    <td>{recipe.inks.length}개 잉크</td>
                    <td>
                      <button
                        className="pro-button pro-button-secondary"
                        style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                        onClick={() => {
                          setTargetColor(recipe.target);
                          setCurrentRecipe(recipe);
                          setCurrentPage('calculator');
                        }}
                      >
                        불러오기
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RecipeManagement;
