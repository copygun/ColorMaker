/**
 * Professional Color Management System
 * Inspired by e-paint.co.uk professional interface
 */

import { useState, useCallback, useEffect } from 'react';
import { useColorCalculation } from './hooks/useColorCalculation';
import RecipeHistory from './components/RecipeHistory';
import ColorInput from './components/ColorInput';
import MeasurementInfo from './components/MeasurementInfo';
import type { LabColor, Recipe } from './types';
import CorrectionEngine from '../core/correctionEngine.js';
import manufacturerDB from '../core/manufacturerInkDatabase.js';
import './styles/professional.css';

type PageView = 'calculator' | 'database' | 'recipes' | 'profiles' | 'settings';

function ProfessionalApp() {
  const {
    calculateRecipe,
    labToRgb,
    getInkDatabase,
    setDeltaEMethod,
    deltaEMethod
  } = useColorCalculation();

  // Page navigation state
  const [currentPage, setCurrentPage] = useState<PageView>('calculator');
  
  // Calculator page state
  const [targetColor, setTargetColor] = useState<LabColor>({ L: 50, a: 0, b: 0 });
  const [selectedInks, setSelectedInks] = useState<string[]>(['cyan', 'magenta', 'yellow', 'black']);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'lab' | 'rgb' | 'hex' | 'cmyk'>('lab');
  const [printSettings, setPrintSettings] = useState({
    method: 'offset',
    substrate: 'white_coated',
    dotGain: 15,
    tacLimit: 320
  });
  
  // Recipe history
  const [recipeHistory, setRecipeHistory] = useState<Recipe[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Load saved recipes on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('recipeHistory');
    if (savedHistory) {
      try {
        setRecipeHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load history');
      }
    }
  }, []);

  // Convert RGB to CMYK
  const rgbToCmyk = (r: number, g: number, b: number) => {
    // Normalize RGB values to 0-1
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    // Calculate K (Key/Black)
    const k = 1 - Math.max(rNorm, gNorm, bNorm);
    
    // Handle pure black case
    if (k === 1) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }

    // Calculate CMY
    const c = (1 - rNorm - k) / (1 - k);
    const m = (1 - gNorm - k) / (1 - k);
    const y = (1 - bNorm - k) / (1 - k);

    // Convert to percentages
    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  };

  // Convert CMYK to RGB
  const cmykToRgb = (c: number, m: number, y: number, k: number) => {
    // Convert percentages to 0-1
    c = c / 100;
    m = m / 100;
    y = y / 100;
    k = k / 100;

    const r = 255 * (1 - c) * (1 - k);
    const g = 255 * (1 - m) * (1 - k);
    const b = 255 * (1 - y) * (1 - k);

    return {
      r: Math.round(r),
      g: Math.round(g),
      b: Math.round(b)
    };
  };

  // Convert RGB to Lab (simplified)
  const rgbToLab = (r: number, g: number, b: number): LabColor => {
    // Normalize RGB values
    let rNorm = r / 255;
    let gNorm = g / 255;
    let bNorm = b / 255;

    // Apply gamma correction
    rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92;
    gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92;
    bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92;

    // Convert to XYZ
    const x = (rNorm * 0.4124564 + gNorm * 0.3575761 + bNorm * 0.1804375) * 100;
    const y = (rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.0721750) * 100;
    const z = (rNorm * 0.0193339 + gNorm * 0.1191920 + bNorm * 0.9503041) * 100;

    // Convert XYZ to Lab
    const xn = 95.047;
    const yn = 100.000;
    const zn = 108.883;

    const fx = x / xn > 0.008856 ? Math.cbrt(x / xn) : (7.787 * x / xn + 16 / 116);
    const fy = y / yn > 0.008856 ? Math.cbrt(y / yn) : (7.787 * y / yn + 16 / 116);
    const fz = z / zn > 0.008856 ? Math.cbrt(z / zn) : (7.787 * z / zn + 16 / 116);

    return {
      L: 116 * fy - 16,
      a: 500 * (fx - fy),
      b: 200 * (fy - fz)
    };
  };

  // Calculate recipe
  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    try {
      const recipe = await calculateRecipe(targetColor, selectedInks, 'offset', {
        printMethod: printSettings.method,
        substrateType: printSettings.substrate
      });
      setCurrentRecipe(recipe);
      
      // Add to history
      const newHistory = [recipe, ...recipeHistory.slice(0, 49)];
      setRecipeHistory(newHistory);
      localStorage.setItem('recipeHistory', JSON.stringify(newHistory));
    } catch (error) {
      alert('계산 중 오류가 발생했습니다.');
    } finally {
      setIsCalculating(false);
    }
  }, [targetColor, selectedInks, calculateRecipe, printSettings, recipeHistory]);

  // Convert Lab to RGB
  const rgb = labToRgb(targetColor.L, targetColor.a, targetColor.b);
  const hex = `#${((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1).toUpperCase()}`;
  
  // Convert RGB to CMYK
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

  // Calculate LRV (Light Reflectance Value)
  const lrv = ((targetColor.L / 100) ** 2 * 100).toFixed(1);

  // Get ink database
  const inkDB = getInkDatabase();

  // Handle hex input
  const handleHexInput = (hexValue: string) => {
    const cleanHex = hexValue.replace('#', '');
    if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substr(0, 2), 16);
      const g = parseInt(cleanHex.substr(2, 2), 16);
      const b = parseInt(cleanHex.substr(4, 2), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        const lab = rgbToLab(r, g, b);
        setTargetColor(lab);
      }
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'database':
        return renderColorDatabase();
      case 'recipes':
        return renderRecipeManagement();
      case 'profiles':
        return renderPrintProfiles();
      case 'settings':
        return renderSettings();
      default:
        return renderCalculator();
    }
  };

  const renderCalculator = () => (
    <>
      {/* Measurement Info - D50/2° 측정 기준 표시 */}
      <div className="pro-card" style={{ marginBottom: '20px' }}>
        <div className="pro-card-body">
          <MeasurementInfo />
        </div>
      </div>

      {/* Color Display Section */}
      <div className="pro-card">
        <div className="pro-card-header">
          <h2 className="pro-card-title">
            <span>색상 정보</span>
            <span className="status-indicator status-success">활성</span>
          </h2>
        </div>
        <div className="pro-card-body">
          <div className="color-display-section">
            {/* Color Swatch */}
            <div className="color-swatch-container">
              <div 
                className="color-swatch" 
                style={{ 
                  backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` 
                }}
              >
                <div className="color-swatch-label">
                  목표 색상
                </div>
              </div>
              <div className="value-box" style={{ marginTop: '16px' }}>
                <div className="value-label">Light Reflectance Value</div>
                <div className="value-content">{lrv}<span className="value-unit">%</span></div>
              </div>
            </div>

            {/* Color Values */}
            <div className="color-values-grid">
              <div className="value-box">
                <div className="value-label">CIE L*a*b* Values</div>
                <div className="value-content">
                  L* {targetColor.L.toFixed(1)} 
                  <span style={{ margin: '0 8px' }}>a* {targetColor.a.toFixed(1)}</span>
                  b* {targetColor.b.toFixed(1)}
                </div>
              </div>

              <div className="value-box">
                <div className="value-label">RGB Values</div>
                <div className="value-content">
                  R {rgb.r} G {rgb.g} B {rgb.b}
                </div>
              </div>

              <div className="value-box">
                <div className="value-label">HEX Code</div>
                <div className="value-content">{hex}</div>
              </div>
              
              <div className="value-box">
                <div className="value-label">CMYK Values</div>
                <div className="value-content">
                  C {cmyk.c} M {cmyk.m} Y {cmyk.y} K {cmyk.k}
                </div>
              </div>

              <div className="value-box">
                <div className="value-label">Delta E 2000</div>
                <div className="value-content">
                  {currentRecipe ? currentRecipe.deltaE.toFixed(2) : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Color Input Section */}
      <div className="pro-card">
        <div className="pro-card-header">
          <h2 className="pro-card-title">색상 입력</h2>
        </div>
        <div className="pro-card-body">
          <ColorInput
            value={targetColor}
            onChange={setTargetColor}
            onValidate={(color) => {
              const rgb = labToRgb(color.L, color.a, color.b);
              return rgb.r >= 0 && rgb.r <= 255 && 
                     rgb.g >= 0 && rgb.g <= 255 && 
                     rgb.b >= 0 && rgb.b <= 255;
            }}
            labToRgb={labToRgb}
          />
          
          {/* Alternative Tab Navigation for manual input */}
          <details style={{ marginTop: '24px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '16px' }}>
              수동 입력 (고급)
            </summary>
            <div className="tab-navigation" style={{ marginBottom: '24px' }}>
              <button 
                className={`tab-button ${activeTab === 'lab' ? 'active' : ''}`}
                onClick={() => setActiveTab('lab')}
              >
                L*a*b*
              </button>
              <button 
                className={`tab-button ${activeTab === 'rgb' ? 'active' : ''}`}
                onClick={() => setActiveTab('rgb')}
              >
                RGB
              </button>
              <button 
                className={`tab-button ${activeTab === 'hex' ? 'active' : ''}`}
                onClick={() => setActiveTab('hex')}
              >
                HEX
              </button>
              <button 
                className={`tab-button ${activeTab === 'cmyk' ? 'active' : ''}`}
                onClick={() => setActiveTab('cmyk')}
              >
                CMYK
              </button>
            </div>

          {/* Input Fields */}
          <div className="data-grid">
            {activeTab === 'lab' && (
              <>
                <div className="pro-input-group">
                  <label className="pro-label">L* (Lightness)</label>
                  <input
                    type="number"
                    className="pro-input"
                    value={targetColor.L}
                    onChange={(e) => setTargetColor({ ...targetColor, L: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="pro-input-group">
                  <label className="pro-label">a* (Red-Green)</label>
                  <input
                    type="text"
                    className="pro-input"
                    value={targetColor.a}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow negative sign and numbers
                      if (value === '' || value === '-' || !isNaN(parseFloat(value))) {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue) && numValue >= -128 && numValue <= 127) {
                          setTargetColor({ ...targetColor, a: numValue });
                        } else if (value === '' || value === '-') {
                          // Allow temporary empty or just minus sign
                          setTargetColor({ ...targetColor, a: value === '-' ? -0 : 0 });
                        }
                      }
                    }}
                    placeholder="-128 to 127"
                  />
                </div>
                <div className="pro-input-group">
                  <label className="pro-label">b* (Yellow-Blue)</label>
                  <input
                    type="text"
                    className="pro-input"
                    value={targetColor.b}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow negative sign and numbers
                      if (value === '' || value === '-' || !isNaN(parseFloat(value))) {
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue) && numValue >= -128 && numValue <= 127) {
                          setTargetColor({ ...targetColor, b: numValue });
                        } else if (value === '' || value === '-') {
                          // Allow temporary empty or just minus sign
                          setTargetColor({ ...targetColor, b: value === '-' ? -0 : 0 });
                        }
                      }
                    }}
                    placeholder="-128 to 127"
                  />
                </div>
              </>
            )}
            
            {activeTab === 'rgb' && (
              <>
                <div className="pro-input-group">
                  <label className="pro-label">R (Red)</label>
                  <input
                    type="number"
                    className="pro-input"
                    value={rgb.r}
                    onChange={(e) => {
                      const r = parseInt(e.target.value) || 0;
                      const lab = rgbToLab(r, rgb.g, rgb.b);
                      setTargetColor(lab);
                    }}
                    min="0"
                    max="255"
                  />
                </div>
                <div className="pro-input-group">
                  <label className="pro-label">G (Green)</label>
                  <input
                    type="number"
                    className="pro-input"
                    value={rgb.g}
                    onChange={(e) => {
                      const g = parseInt(e.target.value) || 0;
                      const lab = rgbToLab(rgb.r, g, rgb.b);
                      setTargetColor(lab);
                    }}
                    min="0"
                    max="255"
                  />
                </div>
                <div className="pro-input-group">
                  <label className="pro-label">B (Blue)</label>
                  <input
                    type="number"
                    className="pro-input"
                    value={rgb.b}
                    onChange={(e) => {
                      const b = parseInt(e.target.value) || 0;
                      const lab = rgbToLab(rgb.r, rgb.g, b);
                      setTargetColor(lab);
                    }}
                    min="0"
                    max="255"
                  />
                </div>
              </>
            )}
            
            {activeTab === 'hex' && (
              <div className="pro-input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="pro-label">HEX Color Code</label>
                <input
                  type="text"
                  className="pro-input"
                  value={hex}
                  onChange={(e) => handleHexInput(e.target.value)}
                  placeholder="#000000"
                />
              </div>
            )}
            
            {activeTab === 'cmyk' && (
              <>
                <div className="pro-input-group">
                  <label className="pro-label">C (Cyan)</label>
                  <input
                    type="number"
                    className="pro-input"
                    value={cmyk.c}
                    onChange={(e) => {
                      const c = parseInt(e.target.value) || 0;
                      const newRgb = cmykToRgb(c, cmyk.m, cmyk.y, cmyk.k);
                      const lab = rgbToLab(newRgb.r, newRgb.g, newRgb.b);
                      setTargetColor(lab);
                    }}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="pro-input-group">
                  <label className="pro-label">M (Magenta)</label>
                  <input
                    type="number"
                    className="pro-input"
                    value={cmyk.m}
                    onChange={(e) => {
                      const m = parseInt(e.target.value) || 0;
                      const newRgb = cmykToRgb(cmyk.c, m, cmyk.y, cmyk.k);
                      const lab = rgbToLab(newRgb.r, newRgb.g, newRgb.b);
                      setTargetColor(lab);
                    }}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="pro-input-group">
                  <label className="pro-label">Y (Yellow)</label>
                  <input
                    type="number"
                    className="pro-input"
                    value={cmyk.y}
                    onChange={(e) => {
                      const y = parseInt(e.target.value) || 0;
                      const newRgb = cmykToRgb(cmyk.c, cmyk.m, y, cmyk.k);
                      const lab = rgbToLab(newRgb.r, newRgb.g, newRgb.b);
                      setTargetColor(lab);
                    }}
                    min="0"
                    max="100"
                  />
                </div>
                <div className="pro-input-group">
                  <label className="pro-label">K (Black)</label>
                  <input
                    type="number"
                    className="pro-input"
                    value={cmyk.k}
                    onChange={(e) => {
                      const k = parseInt(e.target.value) || 0;
                      const newRgb = cmykToRgb(cmyk.c, cmyk.m, cmyk.y, k);
                      const lab = rgbToLab(newRgb.r, newRgb.g, newRgb.b);
                      setTargetColor(lab);
                    }}
                    min="0"
                    max="100"
                  />
                </div>
              </>
            )}
          </div>
          </details>
        </div>
      </div>

      {/* Ink Selection & Print Settings */}
      <div className="pro-card">
        <div className="pro-card-header">
          <h2 className="pro-card-title">잉크 선택 및 인쇄 설정</h2>
        </div>
        <div className="pro-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Ink Selection */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
                Base Inks
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {/* Process Inks */}
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', marginTop: '8px' }}>Process Inks</div>
                {inkDB.getProcessInks().map(ink => (
                  <label key={ink.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '12px' }}>
                    <input
                      type="checkbox"
                      checked={selectedInks.includes(ink.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInks([...selectedInks, ink.id]);
                        } else {
                          setSelectedInks(selectedInks.filter(i => i !== ink.id));
                        }
                      }}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{ink.name}</span>
                  </label>
                ))}
                
                {/* Spot Inks */}
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', marginTop: '12px' }}>Spot Inks</div>
                {inkDB.getSpotInks().map(ink => (
                  <label key={ink.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '12px' }}>
                    <input
                      type="checkbox"
                      checked={selectedInks.includes(ink.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInks([...selectedInks, ink.id]);
                        } else {
                          setSelectedInks(selectedInks.filter(i => i !== ink.id));
                        }
                      }}
                    />
                    <span style={{ textTransform: 'capitalize' }}>{ink.name}</span>
                  </label>
                ))}
                
                {/* Medium */}
                <div style={{ fontWeight: 600, fontSize: '0.75rem', color: '#666', marginTop: '12px' }}>Medium</div>
                {inkDB.getAllInks().filter(ink => ink.type === 'medium').map(ink => (
                  <label key={ink.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '12px' }}>
                    <input
                      type="checkbox"
                      checked={selectedInks.includes(ink.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInks([...selectedInks, ink.id]);
                        } else {
                          setSelectedInks(selectedInks.filter(i => i !== ink.id));
                        }
                      }}
                    />
                    <span>{ink.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Print Settings */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase' }}>
                Print Settings
              </h3>
              <div className="pro-input-group">
                <label className="pro-label">Print Method</label>
                <select 
                  className="pro-input"
                  value={printSettings.method}
                  onChange={(e) => setPrintSettings({ ...printSettings, method: e.target.value })}
                >
                  <option value="offset">Offset Press</option>
                  <option value="flexo">Flexo Press</option>
                  <option value="digital">Digital Press</option>
                </select>
              </div>
              <div className="pro-input-group">
                <label className="pro-label">Substrate</label>
                <select 
                  className="pro-input"
                  value={printSettings.substrate}
                  onChange={(e) => setPrintSettings({ ...printSettings, substrate: e.target.value })}
                >
                  <option value="white_coated">White Coated</option>
                  <option value="white_uncoated">White Uncoated</option>
                  <option value="kraft">Kraft Paper</option>
                </select>
              </div>
            </div>
          </div>

          <button
            className="pro-button pro-button-primary"
            onClick={handleCalculate}
            disabled={isCalculating || selectedInks.length === 0}
            style={{ marginTop: '24px', width: '100%' }}
          >
            {isCalculating ? '계산 중...' : '레시피 계산'}
          </button>
        </div>
      </div>

      {/* Recipe Result */}
      {currentRecipe && (
        <div className="pro-card">
          <div className="pro-card-header">
            <h2 className="pro-card-title">
              계산된 잉크 레시피
              <span className="status-indicator status-success" style={{ marginLeft: 'auto' }}>
                ΔE {currentRecipe.deltaE.toFixed(2)}
              </span>
            </h2>
          </div>
          <div className="pro-card-body">
            <table className="pro-table">
              <thead>
                <tr>
                  <th>잉크</th>
                  <th>비율</th>
                  <th>농도</th>
                  <th>타입</th>
                  <th>L*</th>
                  <th>a*</th>
                  <th>b*</th>
                </tr>
              </thead>
              <tbody>
                {currentRecipe.inks.map((ink, index) => {
                  const inkData = inkDB.getInkById(ink.inkId);
                  const inkLab = inkData?.concentrations?.[100] || { L: 0, a: 0, b: 0 };
                  return (
                    <tr key={index}>
                      <td style={{ textTransform: 'capitalize' }}>{ink.inkId}</td>
                      <td>{ink.ratio.toFixed(1)}%</td>
                      <td>{ink.concentration}%</td>
                      <td>{inkData?.type || 'process'}</td>
                      <td>{inkLab.L.toFixed(1)}</td>
                      <td>{inkLab.a.toFixed(1)}</td>
                      <td>{inkLab.b.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 600 }}>
                  <td>합계</td>
                  <td>{currentRecipe.inks.reduce((sum, ink) => sum + ink.ratio, 0).toFixed(1)}%</td>
                  <td colSpan={5}></td>
                </tr>
              </tfoot>
            </table>

            {/* Mixed Color Result */}
            <div className="data-grid" style={{ marginTop: '24px' }}>
              <div className="data-item">
                <div className="data-item-label">혼합 결과 L*</div>
                <div className="data-item-value">{currentRecipe.mixed.L.toFixed(1)}</div>
              </div>
              <div className="data-item">
                <div className="data-item-label">혼합 결과 a*</div>
                <div className="data-item-value">{currentRecipe.mixed.a.toFixed(1)}</div>
              </div>
              <div className="data-item">
                <div className="data-item-label">혼합 결과 b*</div>
                <div className="data-item-value">{currentRecipe.mixed.b.toFixed(1)}</div>
              </div>
              <div className="data-item">
                <div className="data-item-label">Delta E 2000</div>
                <div className="data-item-value">{currentRecipe.deltaE.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderColorDatabase = () => (
    <div className="pro-card">
      <div className="pro-card-header">
        <h2 className="pro-card-title">색상 데이터베이스</h2>
      </div>
      <div className="pro-card-body">
        <table className="pro-table">
          <thead>
            <tr>
              <th>잉크명</th>
              <th>타입</th>
              <th>L* (100%)</th>
              <th>a* (100%)</th>
              <th>b* (100%)</th>
              <th>농도</th>
              <th>색상</th>
            </tr>
          </thead>
          <tbody>
            {inkDB.getAllInks().map((ink) => {
              const lab100 = ink.concentrations?.[100] || { L: 0, a: 0, b: 0 };
              const rgbColor = labToRgb(lab100.L, lab100.a, lab100.b);
              return (
                <tr key={ink.id}>
                  <td>{ink.name}</td>
                  <td>{ink.type}</td>
                  <td>{lab100.L.toFixed(1)}</td>
                  <td>{lab100.a.toFixed(1)}</td>
                  <td>{lab100.b.toFixed(1)}</td>
                  <td>100%, 70%, 40%</td>
                  <td>
                    <div style={{
                      width: '30px',
                      height: '20px',
                      backgroundColor: `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`,
                      border: '1px solid #dee2e6',
                      borderRadius: '3px'
                    }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRecipeManagement = () => (
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

  const renderPrintProfiles = () => (
    <div className="pro-card">
      <div className="pro-card-header">
        <h2 className="pro-card-title">인쇄 프로파일 관리</h2>
      </div>
      <div className="pro-card-body">
        <div className="data-grid" style={{ marginBottom: '32px' }}>
          {inkDB.printerProfiles.map((profile) => (
            <div key={profile.id} className="value-box">
              <div className="value-label">{profile.name}</div>
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '0.875rem', marginBottom: '8px' }}>
                  TAC Limit: <strong>{profile.tacLimit}%</strong>
                </div>
                <div style={{ fontSize: '0.875rem', marginBottom: '8px' }}>
                  Dot Gain: <strong>{profile.dotGain}%</strong>
                </div>
                <div style={{ fontSize: '0.875rem' }}>
                  Ink Limits: 
                  <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                    C: {profile.inkLimit.cyan}% | 
                    M: {profile.inkLimit.magenta}% | 
                    Y: {profile.inkLimit.yellow}% | 
                    K: {profile.inkLimit.black}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', marginTop: '32px' }}>
          현재 설정
        </h3>
        <div className="data-grid">
          <div className="pro-input-group">
            <label className="pro-label">활성 프로파일</label>
            <select className="pro-input" value={printSettings.method}>
              <option value="offset">Offset Press</option>
              <option value="flexo">Flexo Press</option>
              <option value="digital">Digital Press</option>
            </select>
          </div>
          <div className="pro-input-group">
            <label className="pro-label">Dot Gain 보정</label>
            <input 
              type="number" 
              className="pro-input" 
              value={printSettings.dotGain}
              onChange={(e) => setPrintSettings({ ...printSettings, dotGain: parseInt(e.target.value) || 15 })}
              min="0"
              max="50"
            />
          </div>
          <div className="pro-input-group">
            <label className="pro-label">TAC Limit</label>
            <input 
              type="number" 
              className="pro-input" 
              value={printSettings.tacLimit}
              onChange={(e) => setPrintSettings({ ...printSettings, tacLimit: parseInt(e.target.value) || 320 })}
              min="200"
              max="400"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="pro-card">
      <div className="pro-card-header">
        <h2 className="pro-card-title">시스템 설정</h2>
      </div>
      <div className="pro-card-body">
        <div style={{ display: 'grid', gap: '32px' }}>
          {/* Ink Manufacturer Settings */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
              잉크 제조사 설정
            </h3>
            <div className="data-grid">
              <div className="pro-input-group">
                <label className="pro-label">제조사 선택</label>
                <select 
                  className="pro-input"
                  value={manufacturerDB.currentManufacturer}
                  onChange={(e) => {
                    manufacturerDB.setManufacturer(e.target.value);
                    alert('제조사가 변경되었습니다. 새로운 잉크 데이터가 적용됩니다.');
                    window.location.reload();
                  }}
                >
                  {manufacturerDB.manufacturers.map(mfg => (
                    <option key={mfg.id} value={mfg.id}>
                      {mfg.name} ({mfg.country})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="value-box">
                <div className="value-label">현재 제조사 정보</div>
                <div className="value-content" style={{ fontSize: '1rem' }}>
                  {manufacturerDB.getCurrentManufacturer().data?.manufacturer}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '4px' }}>
                  시리즈: {manufacturerDB.getCurrentManufacturer().data?.series}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  잉크 수: {manufacturerDB.getCurrentInks().length}개
                </div>
              </div>
            </div>
          </div>
          
          {/* Delta E Settings */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
              Delta E 계산 방법
            </h3>
            <div className="data-grid">
              <div className="pro-input-group">
                <label className="pro-label">계산 방법</label>
                <select 
                  className="pro-input"
                  value={deltaEMethod}
                  onChange={(e) => setDeltaEMethod(e.target.value as any)}
                >
                  <option value="CIE2000">CIE2000 (권장)</option>
                  <option value="CIE1994">CIE1994</option>
                  <option value="CIE1976">CIE1976</option>
                  <option value="CMC">CMC</option>
                </select>
              </div>
            </div>
          </div>

          {/* Display Settings */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
              디스플레이 설정
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" defaultChecked />
                <span>색상 정확도 경고 표시</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" defaultChecked />
                <span>LRV(Light Reflectance Value) 표시</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" />
                <span>메탈릭 잉크 표시</span>
              </label>
            </div>
          </div>

          {/* Data Management */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
              데이터 관리
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="pro-button pro-button-secondary">
                레시피 내보내기
              </button>
              <button className="pro-button pro-button-secondary">
                레시피 가져오기
              </button>
              <button 
                className="pro-button pro-button-secondary"
                style={{ marginLeft: 'auto', borderColor: '#dc3545', color: '#dc3545' }}
                onClick={() => {
                  if (confirm('모든 레시피 기록을 삭제하시겠습니까?')) {
                    localStorage.removeItem('recipeHistory');
                    setRecipeHistory([]);
                    alert('레시피 기록이 삭제되었습니다.');
                  }
                }}
              >
                기록 초기화
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="professional-app">
      {/* Professional Header */}
      <header className="professional-header">
        <div className="header-content">
          <div>
            <h1 className="header-title">원라벨 컬러연구소</h1>
            <p className="header-subtitle">Professional Color Recipe Management System</p>
          </div>
          <nav className="header-nav">
            <a 
              href="#" 
              className={`nav-item ${currentPage === 'calculator' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setCurrentPage('calculator'); }}
            >
              계산기
            </a>
            <a 
              href="#" 
              className={`nav-item ${currentPage === 'database' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setCurrentPage('database'); }}
            >
              색상 데이터베이스
            </a>
            <a 
              href="#" 
              className={`nav-item ${currentPage === 'recipes' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setCurrentPage('recipes'); }}
            >
              레시피 관리
            </a>
            <a 
              href="#" 
              className={`nav-item ${currentPage === 'profiles' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setCurrentPage('profiles'); }}
            >
              인쇄 프로파일
            </a>
            <a 
              href="#" 
              className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setCurrentPage('settings'); }}
            >
              설정
            </a>
          </nav>
        </div>
      </header>

      <div className="professional-container">
        {renderPage()}

        {/* Footer Info */}
        <div style={{ marginTop: '48px', padding: '24px', textAlign: 'center', color: '#78909c', fontSize: '0.875rem' }}>
          <p>색상 정확도 안내: 화면에 표시되는 색상은 실제 인쇄 결과와 다를 수 있습니다.</p>
          <p>정확한 색상 확인을 위해서는 실제 인쇄 샘플을 참고해 주시기 바랍니다.</p>
        </div>
      </div>

      {/* Recipe History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => setShowHistoryModal(false)}
            >
              ×
            </button>
            <RecipeHistory 
              currentRecipe={currentRecipe}
              onSelectRecipe={(recipe) => {
                setTargetColor(recipe.target || recipe.targetColor?.lab || { L: 50, a: 0, b: 0 });
                setCurrentRecipe(recipe);
                setShowHistoryModal(false);
                setCurrentPage('calculator');
              }}
              onCompareRecipes={(recipes) => {
                console.log('Comparing recipes:', recipes);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfessionalApp;