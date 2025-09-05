import React, { useState, useEffect } from 'react';
import type { Recipe, LabColor } from '../types';

interface RecipeHistoryProps {
  currentRecipe?: Recipe | null;
  onSelectRecipe?: (recipe: Recipe) => void;
  onCompareRecipes?: (recipes: Recipe[]) => void;
}

const RecipeHistory: React.FC<RecipeHistoryProps> = ({
  currentRecipe,
  onSelectRecipe,
  onCompareRecipes,
}) => {
  const [history, setHistory] = useState<Recipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'cmyk' | 'pantone' | 'custom'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'deltaE' | 'name'>('date');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  // 히스토리 로드
  useEffect(() => {
    loadHistory();

    // 자동 저장 이벤트 리스너
    const handleStorageChange = () => {
      loadHistory();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 현재 레시피 추가
  useEffect(() => {
    if (currentRecipe && currentRecipe.id) {
      addToHistory(currentRecipe);
    }
  }, [currentRecipe]);

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('recipeHistory');
      if (saved) {
        const parsedHistory = JSON.parse(saved);
        setHistory(parsedHistory);
      }
    } catch (e) {
      console.error('Failed to load recipe history:', e);
    }
  };

  const addToHistory = (recipe: Recipe) => {
    setHistory((prev) => {
      // 중복 제거
      const filtered = prev.filter((r) => r.id !== recipe.id);
      const updated = [recipe, ...filtered].slice(0, 50); // 최대 50개 저장
      localStorage.setItem('recipeHistory', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteRecipe = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      localStorage.setItem('recipeHistory', JSON.stringify(updated));
      return updated;
    });
    setSelectedRecipes((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const clearHistory = () => {
    if (confirm('모든 레시피 히스토리를 삭제하시겠습니까?')) {
      setHistory([]);
      setSelectedRecipes(new Set());
      localStorage.removeItem('recipeHistory');
    }
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportName = `recipe-history-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
  };

  const importHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          setHistory((prev) => {
            const combined = [...imported, ...prev];
            // ID로 중복 제거
            const unique = Array.from(new Map(combined.map((r) => [r.id, r])).values()).slice(
              0,
              100,
            );
            localStorage.setItem('recipeHistory', JSON.stringify(unique));
            return unique;
          });
          alert(`${imported.length}개의 레시피를 가져왔습니다.`);
        }
      } catch (error) {
        alert('파일을 읽을 수 없습니다.');
      }
    };
    reader.readAsText(file);
  };

  const toggleSelection = (id: string) => {
    setSelectedRecipes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const compareSelected = () => {
    const recipes = history.filter((r) => r.id && selectedRecipes.has(r.id));
    if (recipes.length >= 2 && onCompareRecipes) {
      onCompareRecipes(recipes);
    }
  };

  // 필터링 및 정렬
  const filteredHistory = history
    .filter((recipe) => {
      // 검색어 필터
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          recipe.name?.toLowerCase().includes(search) ||
          false || // LabColor doesn't have a name property
          recipe.inks?.some((ink) => ink.inkId.toLowerCase().includes(search));

        if (!matchesSearch) return false;
      }

      // 타입 필터
      if (filterType !== 'all') {
        if (
          filterType === 'cmyk' &&
          !recipe.inks?.some((ink) =>
            ['cyan', 'magenta', 'yellow', 'black'].includes(ink.inkId.toLowerCase()),
          )
        ) {
          return false;
        }
        if (
          filterType === 'pantone' &&
          !recipe.inks?.some((ink) => ink.inkId.toLowerCase().includes('pantone'))
        ) {
          return false;
        }
        if (
          filterType === 'custom' &&
          recipe.inks?.every(
            (ink) =>
              ['cyan', 'magenta', 'yellow', 'black'].includes(ink.inkId.toLowerCase()) ||
              ink.inkId.toLowerCase().includes('pantone'),
          )
        ) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'deltaE':
          return (a.deltaE || 0) - (b.deltaE || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'date':
        default: {
          const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          return bTime - aTime;
        }
      }
    });

  const formatDate = (timestamp?: string | number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return (
      date.toLocaleDateString('ko-KR') +
      ' ' +
      date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  };

  const formatColor = (color?: LabColor) => {
    if (!color) return '';
    return `L:${color.L.toFixed(1)} a:${color.a.toFixed(1)} b:${color.b.toFixed(1)}`;
  };

  return (
    <div className="recipe-history">
      <div className="history-header">
        <h2>📋 레시피 히스토리</h2>

        {/* 도구 모음 */}
        <div className="history-tools">
          <button
            onClick={exportHistory}
            disabled={history.length === 0}
            className="btn-export"
            title="JSON 형식으로 내보내기"
          >
            📥 내보내기
          </button>

          <label className="btn-import">
            📤 가져오기
            <input
              type="file"
              accept=".json"
              onChange={importHistory}
              style={{ display: 'none' }}
            />
          </label>

          <button
            onClick={compareSelected}
            disabled={selectedRecipes.size < 2}
            className="btn-compare"
            title="선택한 레시피 비교"
          >
            🔍 비교 ({selectedRecipes.size})
          </button>

          <button
            onClick={clearHistory}
            disabled={history.length === 0}
            className="btn-clear"
            title="모든 히스토리 삭제"
          >
            🗑️ 전체 삭제
          </button>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="history-filters">
        <input
          type="text"
          placeholder="🔍 레시피 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="filter-select"
        >
          <option value="all">모든 타입</option>
          <option value="cmyk">CMYK</option>
          <option value="pantone">PANTONE</option>
          <option value="custom">커스텀</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="sort-select"
        >
          <option value="date">날짜순</option>
          <option value="deltaE">Delta E순</option>
          <option value="name">이름순</option>
        </select>

        <div className="history-count">총 {filteredHistory.length}개</div>
      </div>

      {/* 레시피 목록 */}
      <div className="history-list">
        {filteredHistory.length === 0 ? (
          <div className="empty-state">
            {history.length === 0 ? <p>저장된 레시피가 없습니다.</p> : <p>검색 결과가 없습니다.</p>}
          </div>
        ) : (
          filteredHistory.map((recipe) => (
            <div
              key={recipe.id}
              className={`history-item ${recipe.id && selectedRecipes.has(recipe.id) ? 'selected' : ''}`}
            >
              <div className="item-header">
                <input
                  type="checkbox"
                  checked={recipe.id ? selectedRecipes.has(recipe.id) : false}
                  onChange={() => recipe.id && toggleSelection(recipe.id)}
                  className="item-checkbox"
                />

                <div className="item-main" onClick={() => onSelectRecipe?.(recipe)}>
                  <h4 className="item-name">
                    {recipe.name || `레시피 #${recipe.id?.substring(0, 8) || ''}`}
                  </h4>

                  <div className="item-info">
                    <span className="item-date">{formatDate(recipe.timestamp)}</span>
                    {recipe.deltaE !== undefined && (
                      <span
                        className={`item-delta ${
                          recipe.deltaE < 1
                            ? 'excellent'
                            : recipe.deltaE < 2
                              ? 'good'
                              : recipe.deltaE < 5
                                ? 'fair'
                                : 'poor'
                        }`}
                      >
                        ΔE: {recipe.deltaE.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="item-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetails(showDetails === recipe.id ? null : recipe.id || null);
                    }}
                    className="btn-details"
                    title="상세 정보"
                  >
                    {showDetails === recipe.id ? '📂' : '📁'}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      recipe.id && deleteRecipe(recipe.id);
                    }}
                    className="btn-delete"
                    title="삭제"
                  >
                    ❌
                  </button>
                </div>
              </div>

              {/* 상세 정보 */}
              {showDetails === recipe.id && (
                <div className="item-details">
                  <div className="detail-section">
                    <h5>목표 색상</h5>
                    <div className="detail-color">
                      <div
                        className="color-swatch"
                        style={{
                          backgroundColor: `lab(${recipe.targetColor?.L || 50}% ${recipe.targetColor?.a || 0} ${recipe.targetColor?.b || 0})`,
                          width: '40px',
                          height: '40px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                        }}
                      />
                      <span>{formatColor(recipe.targetColor)}</span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h5>잉크 구성</h5>
                    <div className="detail-inks">
                      {recipe.inks?.map((ink, idx) => (
                        <div key={idx} className="ink-item">
                          <span className="ink-name">{ink.inkId}</span>
                          <span className="ink-ratio">{ink.ratio.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {recipe.metadata && (
                    <div className="detail-section">
                      <h5>추가 정보</h5>
                      <div className="detail-metadata">
                        {recipe.metadata.printMethod && (
                          <div>인쇄 방식: {recipe.metadata.printMethod}</div>
                        )}
                        {recipe.metadata.substrate && <div>기재: {recipe.metadata.substrate}</div>}
                        {recipe.metadata.notes && <div>메모: {recipe.metadata.notes}</div>}
                      </div>
                    </div>
                  )}

                  <div className="detail-actions">
                    <button onClick={() => onSelectRecipe?.(recipe)} className="btn-apply">
                      이 레시피 적용
                    </button>

                    <button
                      onClick={() => {
                        const dataStr = JSON.stringify(recipe, null, 2);
                        const dataUri =
                          'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
                        const linkElement = document.createElement('a');
                        linkElement.setAttribute('href', dataUri);
                        linkElement.setAttribute('download', `recipe-${recipe.id}.json`);
                        linkElement.click();
                      }}
                      className="btn-export-single"
                    >
                      개별 내보내기
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <style>{`
        .recipe-history {
          padding: 20px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .history-header h2 {
          margin: 0;
          color: #2d3748;
        }

        .history-tools {
          display: flex;
          gap: 10px;
        }

        .history-tools button,
        .history-tools .btn-import {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          background: #667eea;
          color: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .history-tools button:hover,
        .history-tools .btn-import:hover {
          background: #5a67d8;
        }

        .history-tools button:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
        }

        .btn-clear {
          background: #f56565 !important;
        }

        .btn-clear:hover {
          background: #e53e3e !important;
        }

        .history-filters {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          align-items: center;
        }

        .search-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 14px;
        }

        .filter-select,
        .sort-select {
          padding: 8px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 14px;
          background: white;
        }

        .history-count {
          padding: 8px 12px;
          background: #edf2f7;
          border-radius: 6px;
          font-size: 14px;
          color: #4a5568;
        }

        .history-list {
          max-height: 600px;
          overflow-y: auto;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #718096;
        }

        .history-item {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 10px;
          transition: all 0.2s;
        }

        .history-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .history-item.selected {
          border-color: #667eea;
          background: #ebf4ff;
        }

        .item-header {
          display: flex;
          align-items: center;
          padding: 15px;
          gap: 15px;
        }

        .item-checkbox {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .item-main {
          flex: 1;
          cursor: pointer;
        }

        .item-name {
          margin: 0 0 5px 0;
          color: #2d3748;
          font-size: 16px;
        }

        .item-info {
          display: flex;
          gap: 15px;
          font-size: 14px;
          color: #718096;
        }

        .item-delta {
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .item-delta.excellent {
          background: #c6f6d5;
          color: #22543d;
        }

        .item-delta.good {
          background: #bee3f8;
          color: #2c5282;
        }

        .item-delta.fair {
          background: #feebc8;
          color: #7c2d12;
        }

        .item-delta.poor {
          background: #fed7d7;
          color: #742a2a;
        }

        .item-actions {
          display: flex;
          gap: 5px;
        }

        .item-actions button {
          padding: 5px 10px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 18px;
          transition: transform 0.2s;
        }

        .item-actions button:hover {
          transform: scale(1.2);
        }

        .item-details {
          padding: 15px;
          background: #f7fafc;
          border-top: 1px solid #e2e8f0;
        }

        .detail-section {
          margin-bottom: 15px;
        }

        .detail-section h5 {
          margin: 0 0 10px 0;
          color: #4a5568;
          font-size: 14px;
          font-weight: 600;
        }

        .detail-color {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .detail-inks {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .ink-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 10px;
          background: white;
          border-radius: 4px;
        }

        .ink-name {
          color: #2d3748;
        }

        .ink-ratio {
          font-weight: 600;
          color: #667eea;
        }

        .detail-metadata {
          font-size: 14px;
          color: #4a5568;
          line-height: 1.6;
        }

        .detail-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .detail-actions button {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn-apply {
          background: #48bb78;
          color: white;
        }

        .btn-apply:hover {
          background: #38a169;
        }

        .btn-export-single {
          background: #4299e1;
          color: white;
        }

        .btn-export-single:hover {
          background: #3182ce;
        }
      `}</style>
    </div>
  );
};

export default RecipeHistory;
