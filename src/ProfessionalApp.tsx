/**
 * Professional Color Management System
 * Inspired by e-paint.co.uk professional interface
 */

import { useState, useCallback, useEffect } from 'react';
import { useColorCalculation } from './hooks/useColorCalculation';
import RecipeHistory from './components/RecipeHistory';
import ColorInput from './components/ColorInput';
import MeasurementInfo from './components/MeasurementInfo';
import InfoModal from './components/InfoModal';
import RecipeResults from './components/RecipeResults';
import VendorProfileManager from './components/VendorProfileManager';
import ColorDatabase from './components/ColorDatabase';
import RecipeManagement from './components/RecipeManagement';
import Settings from './components/Settings';
import Navigation from './components/Navigation';
import ColorCorrectionModal from './components/ColorCorrectionModal';
import CorrectionHistory from './components/CorrectionHistory';
import type { LabColor, Recipe } from './types';
import { RecipeStatus } from './types';
import manufacturerDB from '../core/manufacturerInkDatabase.js';
import './styles/professional.css';

type PageView = 'calculator' | 'database' | 'recipes' | 'profiles' | 'settings';

function ProfessionalApp() {
  const {
    calculateRecipe,
    calculateOptimizedRecipe,
    labToRgb,
    getInkDatabase,
    setDeltaEMethod,
    deltaEMethod,
  } = useColorCalculation();

  // Page navigation state
  const [currentPage, setCurrentPage] = useState<PageView>('calculator');

  // Calculator page state
  const [targetColor, setTargetColor] = useState<LabColor>({ L: 0, a: 0, b: 0 });
  // Process Inks (CMYKW)만 기본 선택
  const [selectedInks, setSelectedInks] = useState<string[]>([
    'cyan',
    'magenta',
    'yellow',
    'black',
    'white', // Process Inks only
  ]);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [optimizedRecipes, setOptimizedRecipes] = useState<Recipe[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'lab' | 'rgb' | 'hex' | 'cmyk'>('lab');
  const [maxOptimizedRecipes, setMaxOptimizedRecipes] = useState(5);
  const [printSettings, setPrintSettings] = useState({
    method: 'offset',
    substrate: 'white_coated',
    substrateLab: { L: 95, a: 0, b: -2 }, // 원단 CIELAB 값 (일반적인 백색 코팅지)
    dotGain: 15,
    tacLimit: 320,
  });

  // Vendor profile management state
  interface VendorProfile {
    id: string;
    name: string;
    createdAt: string;
    preparedInks: string[]; // 준비된 잉크 ID 목록
    customValues: any; // 커스텀 Lab 값
    spotInkRecipes?: {
      // Spot Ink 레시피 (계산된 값)
      [spotInkId: string]: {
        recipe: Array<{ inkId: string; percentage: number }>;
        calculatedLab?: { L: number; a: number; b: number };
        measuredLab?: { L: number; a: number; b: number }; // 실제 측정값
      };
    };
    isComplete?: boolean; // 모든 spot ink Lab 값이 입력되었는지
  }

  const [vendorProfiles, setVendorProfiles] = useState<VendorProfile[]>([]);
  const [currentVendorProfile, setCurrentVendorProfile] = useState<string>('');
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<VendorProfile | null>(null);
  const [selectedInksForProfile, setSelectedInksForProfile] = useState<string[]>([]);

  // Database editing state (now vendor-specific)
  const [customInkValues, setCustomInkValues] = useState<any>({});

  // Load vendor profiles from localStorage
  useEffect(() => {
    // Load vendor profiles list
    const savedProfiles = localStorage.getItem('vendorProfiles');
    if (savedProfiles) {
      try {
        const parsedProfiles = JSON.parse(savedProfiles);
        setVendorProfiles(parsedProfiles);
      } catch (e) {
        console.error('Failed to load vendor profiles');
      }
    }

    // Load current vendor profile
    const savedCurrentProfile = localStorage.getItem('currentVendorProfile');
    if (savedCurrentProfile) {
      setCurrentVendorProfile(savedCurrentProfile);
    }
  }, []);

  // Update when vendor profile changes
  useEffect(() => {
    if (currentVendorProfile) {
      const profile = vendorProfiles.find((p) => p.id === currentVendorProfile);
      if (profile) {
        setCustomInkValues(profile.customValues || {});
        // Apply profile's prepared inks to selectedInks if in calculator mode
        if (currentPage === 'calculator' && profile.preparedInks?.length > 0) {
          setSelectedInks(profile.preparedInks);
        }
      }
    } else {
      // Load default custom values
      const saved = localStorage.getItem('customInkValues_default');
      if (saved) {
        try {
          setCustomInkValues(JSON.parse(saved));
        } catch (e) {
          setCustomInkValues({});
        }
      } else {
        setCustomInkValues({});
      }
      // vendor profile이 없을 때는 Process Inks만 기본 선택
      if (currentPage === 'calculator') {
        setSelectedInks(['cyan', 'magenta', 'yellow', 'black', 'white']);
      }
    }
    localStorage.setItem('currentVendorProfile', currentVendorProfile);
  }, [currentVendorProfile, vendorProfiles, currentPage]);

  // Recipe history
  const [recipeHistory, setRecipeHistory] = useState<Recipe[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Color correction modal state
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionHistory, setCorrectionHistory] = useState<any[]>([]);

  // Active recipe management
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);
  // const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);

  // Info modal state for replacing alert()
  const [infoModal, setInfoModal] = useState<{
    isOpen: boolean;
    title?: string;
    content: string | string[];
  }>({
    isOpen: false,
    content: '',
  });

  // Load saved recipes and correction history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('recipeHistory');
    if (savedHistory) {
      try {
        setRecipeHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load history');
      }
    }

    const savedCorrectionHistory = localStorage.getItem('correctionHistory');
    if (savedCorrectionHistory) {
      try {
        setCorrectionHistory(JSON.parse(savedCorrectionHistory));
      } catch (e) {
        console.error('Failed to load correction history');
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
      k: Math.round(k * 100),
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
      b: Math.round(b),
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
    const y = (rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.072175) * 100;
    const z = (rNorm * 0.0193339 + gNorm * 0.119192 + bNorm * 0.9503041) * 100;

    // Convert XYZ to Lab
    const xn = 95.047;
    const yn = 100.0;
    const zn = 108.883;

    const fx = x / xn > 0.008856 ? Math.cbrt(x / xn) : (7.787 * x) / xn + 16 / 116;
    const fy = y / yn > 0.008856 ? Math.cbrt(y / yn) : (7.787 * y) / yn + 16 / 116;
    const fz = z / zn > 0.008856 ? Math.cbrt(z / zn) : (7.787 * z) / zn + 16 / 116;

    return {
      L: 116 * fy - 16,
      a: 500 * (fx - fy),
      b: 200 * (fy - fz),
    };
  };

  // Vendor profile management functions
  const saveVendorProfile = async (name: string, preparedInks: string[], customValues: any) => {
    // Calculate spot ink recipes based on available process inks
    const spotInkRecipes: VendorProfile['spotInkRecipes'] = {};

    // Get available process inks and medium from preparedInks
    const processInks = preparedInks.filter((id) =>
      ['cyan', 'magenta', 'yellow', 'black', 'white'].includes(id),
    );

    // Calculate recipes for each spot ink
    const spotInks = inkDB.getSpotInks();
    for (const spotInk of spotInks) {
      if (spotInk.concentrations?.[100]) {
        try {
          // Calculate recipe using available process inks
          const recipe = await calculateRecipe(spotInk.concentrations[100], processInks, 'offset', {
            printMethod: 'offset',
            substrateType: 'white_coated',
          });

          if (recipe && recipe.inks) {
            spotInkRecipes[spotInk.id] = {
              recipe: recipe.inks.map((ink: any) => ({
                inkId: ink.id,
                percentage: parseFloat(ink.percentage),
              })),
              calculatedLab: recipe.mixed,
              measuredLab: undefined, // To be filled by user
            };
          }
        } catch (error) {
          console.error(`Failed to calculate recipe for ${spotInk.name}:`, error);
        }
      }
    }

    const newProfile: VendorProfile = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
      preparedInks,
      customValues,
      spotInkRecipes,
      isComplete: false, // Not complete until spot ink Lab values are measured
    };
    const updatedProfiles = [...vendorProfiles, newProfile];
    setVendorProfiles(updatedProfiles);
    localStorage.setItem('vendorProfiles', JSON.stringify(updatedProfiles));
    return newProfile;
  };

  const updateVendorProfile = (profileId: string, updates: Partial<VendorProfile>) => {
    const updatedProfiles = vendorProfiles.map((p) =>
      p.id === profileId ? { ...p, ...updates } : p,
    );
    setVendorProfiles(updatedProfiles);
    localStorage.setItem('vendorProfiles', JSON.stringify(updatedProfiles));
  };

  const deleteVendorProfile = (profileId: string) => {
    const updatedProfiles = vendorProfiles.filter((p) => p.id !== profileId);
    setVendorProfiles(updatedProfiles);
    localStorage.setItem('vendorProfiles', JSON.stringify(updatedProfiles));

    // Clear current profile if deleted
    if (currentVendorProfile === profileId) {
      setCurrentVendorProfile('');
    }
  };

  const selectVendorProfile = (profileId: string) => {
    setCurrentVendorProfile(profileId);
  };

  // Generate unique ID for recipes
  const generateRecipeId = () => {
    return `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Select recipe for work
  const selectRecipeForWork = useCallback((recipe: Recipe) => {
    if (!recipe.id) {
      recipe.id = generateRecipeId();
    }

    // Update recipe status
    const updatedRecipe = {
      ...recipe,
      status: RecipeStatus.SELECTED,
      startedAt: new Date().toISOString(),
    };

    setActiveRecipeId(recipe.id);
    setCurrentRecipe(updatedRecipe);

    // Update in allRecipes
    // setAllRecipes((prev) => {
    //   const exists = prev.find((r) => r.id === recipe.id);
    //   if (exists) {
    //     return prev.map((r) => (r.id === recipe.id ? updatedRecipe : r));
    //   } else {
    //     return [...prev, updatedRecipe];
    //   }
    // });

    setInfoModal({
      isOpen: true,
      title: '작업 시작',
      content: '레시피가 선택되었습니다. 조색 작업을 시작하세요.',
    });
  }, []);

  // Update recipe status
  const updateRecipeStatus = useCallback(
    (recipeId: string, status: RecipeStatus) => {
      const updateTimestamps = (recipe: Recipe) => {
        const updated = { ...recipe, status };

        if (status === RecipeStatus.IN_PROGRESS && !updated.startedAt) {
          updated.startedAt = new Date().toISOString();
        }
        if (status === RecipeStatus.COMPLETED || status === RecipeStatus.CORRECTED) {
          updated.completedAt = new Date().toISOString();
        }

        return updated;
      };

      // Update currentRecipe if it matches
      if (currentRecipe?.id === recipeId) {
        setCurrentRecipe((prev) => (prev ? updateTimestamps(prev) : prev));
      }

      // Update in allRecipes
      // setAllRecipes((prev) => prev.map((r) => (r.id === recipeId ? updateTimestamps(r) : r)));

      // Show status message
      const statusMessages: Record<RecipeStatus, string> = {
        [RecipeStatus.CALCULATED]: '레시피가 계산되었습니다.',
        [RecipeStatus.SELECTED]: '레시피가 선택되었습니다.',
        [RecipeStatus.IN_PROGRESS]: '조색 작업을 시작합니다.',
        [RecipeStatus.MEASURING]: '색상을 측정하세요.',
        [RecipeStatus.COMPLETED]: '작업이 완료되었습니다.',
        [RecipeStatus.NEEDS_CORRECTION]: '색상 보정이 필요합니다.',
        [RecipeStatus.CORRECTING]: '색상 보정 중입니다.',
        [RecipeStatus.CORRECTED]: '색상 보정이 완료되었습니다.',
      };

      setInfoModal({
        isOpen: true,
        title: '상태 변경',
        content: statusMessages[status],
      });
    },
    [currentRecipe],
  );

  // Handle correction recipe application
  const handleApplyCorrection = useCallback(
    (correctionRecipe: any) => {
      if (!currentRecipe || !correctionRecipe) return;

      // Apply corrections to current recipe
      const updatedRecipe = { ...currentRecipe };

      // Add correction inks to the recipe
      correctionRecipe.corrections.forEach((correction: any) => {
        const existingInkIndex = updatedRecipe.inks.findIndex(
          (ink: any) => ink.inkId === correction.inkId,
        );

        if (existingInkIndex >= 0) {
          // Update existing ink amount
          updatedRecipe.inks[existingInkIndex].ratio += correction.addAmount;
        } else {
          // Add new ink
          updatedRecipe.inks.push({
            inkId: correction.inkId,
            ratio: correction.addAmount,
            concentration: 100,
          });
        }
      });

      // Normalize percentages to 100%
      const totalPercentage =
        updatedRecipe.inks?.reduce((sum: number, ink: any) => sum + ink.ratio, 0) || 0;

      if (totalPercentage > 100) {
        updatedRecipe.inks?.forEach((ink: any) => {
          ink.ratio = (ink.ratio / totalPercentage) * 100;
        });
      }

      // Update mixed color prediction
      updatedRecipe.mixedColor = correctionRecipe.predictedColor;
      updatedRecipe.originalDeltaE = currentRecipe.deltaE; // 보정 전 Delta E 저장
      updatedRecipe.deltaE = correctionRecipe.predictedDeltaE;
      updatedRecipe.isCorrection = true;
      updatedRecipe.correctionDate = new Date().toISOString();
      updatedRecipe.status = RecipeStatus.CORRECTED;

      setCurrentRecipe(updatedRecipe);

      // Update in allRecipes
      // if (updatedRecipe.id) {
      //   setAllRecipes((prev) => prev.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r)));
      // }

      // Save to correction history
      const correctionEntry = {
        timestamp: new Date().toISOString(),
        targetColor,
        originalRecipe: currentRecipe,
        correctedRecipe: updatedRecipe,
        corrections: correctionRecipe.corrections,
        predictedDeltaE: correctionRecipe.predictedDeltaE,
      };

      const newCorrectionHistory = [correctionEntry, ...correctionHistory.slice(0, 49)];
      setCorrectionHistory(newCorrectionHistory);
      localStorage.setItem('correctionHistory', JSON.stringify(newCorrectionHistory));

      // Close modal and show success message
      setShowCorrectionModal(false);
      setInfoModal({
        isOpen: true,
        title: '보정 완료',
        content:
          '보정 레시피가 적용되었습니다. 예상 Delta E: ' +
          correctionRecipe.predictedDeltaE.toFixed(2),
      });
    },
    [currentRecipe, targetColor, correctionHistory],
  );

  // Calculate recipe
  const handleCalculate = useCallback(async () => {
    console.log('Starting calculation...', { targetColor, selectedInks });
    setIsCalculating(true);

    // Clear previous recipes
    // setAllRecipes([]);
    setActiveRecipeId(null);

    try {
      // 선택된 잉크로 계산
      console.log('Calculating selected inks recipe...');
      const recipe = await calculateRecipe(targetColor, selectedInks, 'offset', {
        printMethod: printSettings.method,
        substrateType: printSettings.substrate,
      });
      console.log('Selected inks recipe:', recipe);

      // Add ID and initial status to recipe
      const recipeWithId = {
        ...recipe,
        id: generateRecipeId(),
        name: '선택된 잉크 레시피',
        type: 'selected' as const,
        status: RecipeStatus.CALCULATED,
        createdAt: new Date().toISOString(),
      };

      setCurrentRecipe(recipeWithId);
      // setAllRecipes((prev) => [...prev, recipeWithId]);

      // 최적화된 레시피 계산 (모든 잉크 사용)
      if (calculateOptimizedRecipe) {
        try {
          console.log('Calculating optimized recipes...');
          const optimized = await calculateOptimizedRecipe(targetColor, {
            maxInks: 4,
            includeWhite: true,
            use100: true,
            use70: true,
            use40: true,
            maxResults: maxOptimizedRecipes,
            // substrateLab: printSettings.substrateLab, // 원단 Lab 값 전달
          });
          console.log('Optimized recipes:', optimized);
          // 배열인 경우 그대로 저장, 단일 객체인 경우 배열로 변환
          let optimizedWithIds: Recipe[] = [];

          if (Array.isArray(optimized)) {
            optimizedWithIds = optimized.map((opt, index) => ({
              ...opt,
              id: generateRecipeId(),
              name: `최적화 레시피 #${index + 1}`,
              type: 'optimized' as const,
              status: RecipeStatus.CALCULATED,
              createdAt: new Date().toISOString(),
            }));
          } else if (optimized) {
            optimizedWithIds = [
              {
                ...optimized,
                id: generateRecipeId(),
                name: '최적화 레시피 #1',
                type: 'optimized' as const,
                status: RecipeStatus.CALCULATED,
                createdAt: new Date().toISOString(),
              },
            ];
          }

          setOptimizedRecipes(optimizedWithIds);
          // setAllRecipes((prev) => [...prev, ...optimizedWithIds]);
        } catch (error) {
          console.error('Optimized recipe calculation error:', error);
          setOptimizedRecipes([]);
        }
      } else {
        console.warn('calculateOptimizedRecipe is not available');
        setOptimizedRecipes([]);
      }

      // Add to history
      const newHistory = [recipe, ...recipeHistory.slice(0, 49)];
      setRecipeHistory(newHistory);
      localStorage.setItem('recipeHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Recipe calculation error:', error);
      setInfoModal({
        isOpen: true,
        title: '오류',
        content: `계산 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsCalculating(false);
    }
  }, [
    targetColor,
    selectedInks,
    calculateRecipe,
    calculateOptimizedRecipe,
    printSettings,
    recipeHistory,
  ]);

  // Convert Lab to RGB
  const rgb = labToRgb(targetColor.L, targetColor.a, targetColor.b);
  const hex = `#${((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1).toUpperCase()}`;

  // Convert RGB to CMYK
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

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
      {/* Loading Overlay */}
      {isCalculating && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '32px 48px',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
              minWidth: '280px',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                border: '5px solid #e0e0e0',
                borderTop: '5px solid #4a90e2',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <div style={{ textAlign: 'center' }}>
              <h3
                style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#2c3e50' }}
              >
                레시피 계산 중...
              </h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                최적의 잉크 조합을 찾고 있습니다
              </p>
              <p style={{ fontSize: '12px', color: '#999' }}>잠시만 기다려 주세요</p>
            </div>
          </div>
        </div>
      )}

      {/* Measurement Info - D50/2° 측정 기준 표시 */}
      <div className="pro-card" style={{ marginBottom: '20px' }}>
        <div className="pro-card-body">
          <MeasurementInfo />
        </div>
      </div>

      {/* Color Input Section */}
      <div className="pro-card">
        <div
          className="pro-card-header"
          style={{ backgroundColor: '#1a1a2e', padding: '12px 20px' }}
        >
          <h2
            className="pro-card-title"
            style={{ color: 'white', fontSize: '1rem', fontWeight: 600 }}
          >
            목표 색상 입력
          </h2>
        </div>
        <div className="pro-card-body">
          {/* Color Conversion Values - 색상 변환 값 */}
          <div>
            {/* Horizontal Tab Navigation */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '16px',
                borderBottom: '2px solid #dee2e6',
                paddingBottom: '0',
              }}
            >
              <button
                className={`tab-button ${activeTab === 'lab' ? 'active' : ''}`}
                onClick={() => setActiveTab('lab')}
                style={{ flex: 1 }}
              >
                Lab
              </button>
              <button
                className={`tab-button ${activeTab === 'rgb' ? 'active' : ''}`}
                onClick={() => setActiveTab('rgb')}
                style={{ flex: 1 }}
              >
                RGB
              </button>
              <button
                className={`tab-button ${activeTab === 'hex' ? 'active' : ''}`}
                onClick={() => setActiveTab('hex')}
                style={{ flex: 1 }}
              >
                HEX
              </button>
              <button
                className={`tab-button ${activeTab === 'cmyk' ? 'active' : ''}`}
                onClick={() => setActiveTab('cmyk')}
                style={{ flex: 1 }}
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
                      onChange={(e) =>
                        setTargetColor({ ...targetColor, L: parseFloat(e.target.value) || 0 })
                      }
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
          </div>

          {/* CIELAB 색상 값 입력 - ColorInput 컴포넌트 사용 */}
          <div style={{ marginTop: '32px' }}>
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
          </div>
        </div>
      </div>

      {/* Ink Selection & Print Settings */}
      <div className="pro-card">
        <div
          className="pro-card-header"
          style={{ backgroundColor: '#1a1a2e', padding: '12px 20px' }}
        >
          <h2
            className="pro-card-title"
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              gap: '16px',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            <span style={{ flexShrink: 0 }}>잉크 선택 및 인쇄 설정</span>
            <select
              className="pro-select"
              style={{
                minWidth: '150px',
                fontSize: '0.875rem',
                fontWeight: 'normal',
                fontFamily: 'inherit',
              }}
              value={currentVendorProfile}
              onChange={(e) => selectVendorProfile(e.target.value)}
            >
              <option value="">프로파일 선택</option>
              {vendorProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.preparedInks.length}개 잉크)
                </option>
              ))}
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button
                className="pro-button pro-button-secondary"
                onClick={() => {
                  // 프로파일이 선택되어 있으면 해당 프로파일의 잉크만, 아니면 전체 잉크
                  if (currentVendorProfile) {
                    const profile = vendorProfiles.find((p) => p.id === currentVendorProfile);
                    if (profile) {
                      setSelectedInks(profile.preparedInks);
                    }
                  } else {
                    const allInkIds = inkDB.getAllInks().map((ink) => ink.id);
                    setSelectedInks(allInkIds);
                  }
                }}
              >
                전체 선택
              </button>
              <button
                className="pro-button pro-button-secondary"
                onClick={() => setSelectedInks([])}
              >
                전체 해제
              </button>
            </div>
          </h2>
        </div>
        <div className="pro-card-body">
          {/* Print Settings - 상단 */}
          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: '12px',
                textTransform: 'uppercase',
              }}
            >
              Print Settings
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                  onChange={(e) => {
                    const substrate = e.target.value;
                    let substrateLab = printSettings.substrateLab;

                    // 원단 타입에 따른 프리셋 Lab 값
                    switch (substrate) {
                      case 'white_coated':
                        substrateLab = { L: 95, a: 0, b: -2 };
                        break;
                      case 'white_uncoated':
                        substrateLab = { L: 92, a: 0.5, b: 2 };
                        break;
                      case 'kraft':
                        substrateLab = { L: 70, a: 5, b: 20 };
                        break;
                      case 'custom':
                        // 현재 값 유지
                        break;
                    }

                    setPrintSettings({ ...printSettings, substrate, substrateLab });
                  }}
                >
                  <option value="white_coated">White Coated</option>
                  <option value="white_uncoated">White Uncoated</option>
                  <option value="kraft">Kraft Paper</option>
                  <option value="custom">Custom (Enter Lab)</option>
                </select>
              </div>
            </div>

            {/* 원단 CIELAB 값 입력 */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #dee2e6',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <label
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#495057',
                    textTransform: 'uppercase',
                  }}
                >
                  원단 CIELAB 값 (Substrate CIELAB)
                </label>
                <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#6c757d' }}>
                  * 실제 원단의 측정값을 입력하세요
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label
                    style={{
                      fontSize: '0.7rem',
                      color: '#6c757d',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    L* (명도)
                  </label>
                  <input
                    type="number"
                    className="pro-input"
                    value={printSettings.substrateLab.L}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setPrintSettings({
                          ...printSettings,
                          substrateLab: { ...printSettings.substrateLab, L: 95 },
                        });
                      } else {
                        setPrintSettings({
                          ...printSettings,
                          substrateLab: { ...printSettings.substrateLab, L: parseFloat(val) },
                        });
                      }
                    }}
                    step="0.1"
                    min="0"
                    max="100"
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '0.7rem',
                      color: '#6c757d',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    a* (적-녹)
                  </label>
                  <input
                    type="number"
                    className="pro-input"
                    value={printSettings.substrateLab.a}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setPrintSettings({
                          ...printSettings,
                          substrateLab: { ...printSettings.substrateLab, a: 0 },
                        });
                      } else {
                        setPrintSettings({
                          ...printSettings,
                          substrateLab: { ...printSettings.substrateLab, a: parseFloat(val) },
                        });
                      }
                    }}
                    step="0.1"
                    min="-128"
                    max="128"
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '0.7rem',
                      color: '#6c757d',
                      display: 'block',
                      marginBottom: '4px',
                    }}
                  >
                    b* (황-청)
                  </label>
                  <input
                    type="number"
                    className="pro-input"
                    value={printSettings.substrateLab.b}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setPrintSettings({
                          ...printSettings,
                          substrateLab: { ...printSettings.substrateLab, b: -2 },
                        });
                      } else {
                        setPrintSettings({
                          ...printSettings,
                          substrateLab: { ...printSettings.substrateLab, b: parseFloat(val) },
                        });
                      }
                    }}
                    step="0.1"
                    min="-128"
                    max="128"
                    style={{ fontSize: '0.875rem' }}
                  />
                </div>
              </div>
              {/* 원단 색상 미리보기 */}
              <div
                style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '30px',
                    borderRadius: '4px',
                    border: '1px solid #dee2e6',
                    backgroundColor: `lab(${printSettings.substrateLab.L}% ${printSettings.substrateLab.a} ${printSettings.substrateLab.b})`,
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                  현재 원단 색상: L*: {printSettings.substrateLab.L.toFixed(1)}, a*:{' '}
                  {printSettings.substrateLab.a.toFixed(1)}, b*:{' '}
                  {printSettings.substrateLab.b.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Base Inks - 하단 */}
          <div>
            <h3
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: '12px',
                textTransform: 'uppercase',
              }}
            >
              Base Inks
            </h3>
            {/* 가로 배열 그리드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {/* Process Inks */}
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    color: '#666',
                    marginBottom: '6px',
                  }}
                >
                  Process Inks
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    maxHeight: '250px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                  }}
                >
                  {inkDB.getProcessInks().map((ink) => {
                    const inkLab = ink.concentrations?.[100] || { L: 50, a: 0, b: 0 };
                    const inkRgb = labToRgb(inkLab.L, inkLab.a, inkLab.b);
                    const inkColor = `rgb(${Math.round(inkRgb.r)}, ${Math.round(inkRgb.g)}, ${Math.round(inkRgb.b)})`;

                    return (
                      <label
                        key={ink.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          paddingLeft: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedInks.includes(ink.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInks([...selectedInks, ink.id]);
                            } else {
                              setSelectedInks(selectedInks.filter((i) => i !== ink.id));
                            }
                          }}
                        />
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: inkColor,
                            border: '1px solid #ccc',
                            borderRadius: '3px',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                          }}
                        />
                        <span style={{ textTransform: 'capitalize', flex: 1 }}>{ink.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const info = [];
                            info.push(`${ink.name} 잉크 정보:`);
                            info.push('');
                            if (ink.concentrations) {
                              Object.entries(ink.concentrations).forEach(([conc, lab]) => {
                                info.push(`${conc}% 농도:`);
                                info.push(`  Lab: L=${lab.L}, a=${lab.a}, b=${lab.b}`);
                                const rgb = labToRgb(lab.L, lab.a, lab.b);
                                info.push(
                                  `  RGB: R=${Math.round(rgb.r)}, G=${Math.round(rgb.g)}, B=${Math.round(rgb.b)}`,
                                );
                              });
                            }
                            setInfoModal({
                              isOpen: true,
                              title: `${ink.name} 잉크 정보`,
                              content: info,
                            });
                          }}
                          style={{
                            padding: '2px 6px',
                            fontSize: '11px',
                            backgroundColor: '#f0f0f0',
                            border: '1px solid #ccc',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                          title="잉크 정보 보기"
                        >
                          ?
                        </button>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Spot Inks */}
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    color: '#666',
                    marginBottom: '6px',
                  }}
                >
                  Spot Inks
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {inkDB.getSpotInks().map((ink) => {
                    const inkLab = ink.concentrations?.[100] || { L: 50, a: 0, b: 0 };
                    const inkRgb = labToRgb(inkLab.L, inkLab.a, inkLab.b);
                    const inkColor = `rgb(${Math.round(inkRgb.r)}, ${Math.round(inkRgb.g)}, ${Math.round(inkRgb.b)})`;

                    return (
                      <label
                        key={ink.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          paddingLeft: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedInks.includes(ink.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInks([...selectedInks, ink.id]);
                            } else {
                              setSelectedInks(selectedInks.filter((i) => i !== ink.id));
                            }
                          }}
                        />
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: inkColor,
                            border: '1px solid #ccc',
                            borderRadius: '3px',
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                          }}
                        />
                        <span style={{ textTransform: 'capitalize', flex: 1 }}>{ink.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const info = [];
                            info.push(`${ink.name} 잉크 정보:`);
                            info.push('');
                            if (ink.concentrations) {
                              Object.entries(ink.concentrations).forEach(([conc, lab]) => {
                                info.push(`${conc}% 농도:`);
                                info.push(`  Lab: L=${lab.L}, a=${lab.a}, b=${lab.b}`);
                                const rgb = labToRgb(lab.L, lab.a, lab.b);
                                info.push(
                                  `  RGB: R=${Math.round(rgb.r)}, G=${Math.round(rgb.g)}, B=${Math.round(rgb.b)}`,
                                );
                              });
                            }
                            setInfoModal({
                              isOpen: true,
                              title: `${ink.name} 잉크 정보`,
                              content: info,
                            });
                          }}
                          style={{
                            padding: '2px 6px',
                            fontSize: '11px',
                            backgroundColor: '#f0f0f0',
                            border: '1px solid #ccc',
                            borderRadius: '3px',
                            cursor: 'pointer',
                          }}
                          title="잉크 정보 보기"
                        >
                          ?
                        </button>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Fluorescent Inks */}
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    color: '#666',
                    marginBottom: '6px',
                  }}
                >
                  Fluorescent Inks
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    maxHeight: '250px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                  }}
                >
                  {inkDB.getFluorescentInks &&
                    inkDB.getFluorescentInks().map((ink) => {
                      const inkLab = ink.concentrations?.[100] || { L: 50, a: 0, b: 0 };
                      const inkRgb = labToRgb(inkLab.L, inkLab.a, inkLab.b);
                      const inkColor = `rgb(${Math.round(inkRgb.r)}, ${Math.round(inkRgb.g)}, ${Math.round(inkRgb.b)})`;

                      return (
                        <label
                          key={ink.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            paddingLeft: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedInks.includes(ink.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedInks([...selectedInks, ink.id]);
                              } else {
                                setSelectedInks(selectedInks.filter((i) => i !== ink.id));
                              }
                            }}
                          />
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              backgroundColor: inkColor,
                              border: '2px solid ' + inkColor,
                              borderRadius: '3px',
                              boxShadow: `0 0 8px ${inkColor}, inset 0 0 8px rgba(255,255,255,0.3)`,
                              background: `linear-gradient(135deg, ${inkColor} 0%, rgba(255,255,255,0.3) 50%, ${inkColor} 100%)`,
                            }}
                            title="Fluorescent"
                          />
                          <span style={{ textTransform: 'capitalize' }}>{ink.name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Medium */}
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    color: '#666',
                    marginBottom: '6px',
                  }}
                >
                  Medium
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    maxHeight: '250px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                  }}
                >
                  {inkDB
                    .getAllInks()
                    .filter((ink) => ink.type === 'medium')
                    .map((ink) => {
                      const inkColor =
                        ink.id === 'transparent_white'
                          ? 'rgba(255, 255, 255, 0.8)'
                          : ink.id === 'extender'
                            ? 'rgba(240, 240, 240, 0.5)'
                            : 'rgba(255, 255, 255, 0.3)';

                      return (
                        <label
                          key={ink.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            paddingLeft: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedInks.includes(ink.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedInks([...selectedInks, ink.id]);
                              } else {
                                setSelectedInks(selectedInks.filter((i) => i !== ink.id));
                              }
                            }}
                          />
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              backgroundColor: inkColor,
                              border: '1px solid #ccc',
                              borderRadius: '3px',
                              backgroundImage:
                                ink.type === 'medium'
                                  ? 'linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%, #ddd), linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%, #ddd)'
                                  : 'none',
                              backgroundSize: '10px 10px',
                              backgroundPosition: '0 0, 5px 5px',
                            }}
                          />
                          <span>{ink.name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>

          {/* 최적화 레시피 개수 선택 */}
          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              <span>최적화 레시피 개수:</span>
              <select
                value={maxOptimizedRecipes}
                onChange={(e) => setMaxOptimizedRecipes(Number(e.target.value))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <option value={3}>상위 3개</option>
                <option value={5}>상위 5개</option>
                <option value={7}>상위 7개</option>
                <option value={10}>상위 10개</option>
              </select>
              <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: 'auto' }}>
                (많을수록 계산 시간 증가)
              </span>
            </label>
          </div>

          <button
            className="pro-button pro-button-primary"
            onClick={handleCalculate}
            disabled={isCalculating || selectedInks.length === 0}
            style={{ marginTop: '12px', width: '100%', position: 'relative' }}
          >
            {isCalculating ? (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                계산 중...
              </span>
            ) : (
              `레시피 계산 (${selectedInks.length}개 잉크 선택됨)`
            )}
          </button>
        </div>
      </div>

      {/* Recipe Result */}
      <RecipeResults
        currentRecipe={currentRecipe}
        optimizedRecipes={optimizedRecipes}
        inkDB={inkDB}
        activeRecipeId={activeRecipeId}
        onSelectRecipe={selectRecipeForWork}
        onUpdateRecipeStatus={updateRecipeStatus}
        onRecipeUpdate={(updatedRecipe) => {
          setCurrentRecipe(updatedRecipe);
          // 레시피 히스토리 업데이트
          const newHistory = [...recipeHistory];
          const index = newHistory.findIndex((r) => r.id === updatedRecipe.id);
          if (index >= 0) {
            newHistory[index] = updatedRecipe;
            setRecipeHistory(newHistory);
          }
        }}
        targetColor={targetColor}
      />

      {/* Correction History */}
      {correctionHistory.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <CorrectionHistory
            correctionHistory={correctionHistory}
            onClearHistory={() => {
              if (confirm('모든 보정 이력을 삭제하시겠습니까?')) {
                setCorrectionHistory([]);
                localStorage.removeItem('correctionHistory');
              }
            }}
          />
        </div>
      )}
    </>
  );

  const renderColorDatabase = () => (
    <>
      <ColorDatabase
        inkDB={inkDB}
        customInkValues={customInkValues}
        setCustomInkValues={setCustomInkValues}
        selectedInksForProfile={selectedInksForProfile}
        setSelectedInksForProfile={setSelectedInksForProfile}
        labToRgb={labToRgb}
        saveVendorProfile={saveVendorProfile}
        setShowVendorModal={setShowVendorModal}
        onShowInfo={(title, content) => setInfoModal({ isOpen: true, title, content })}
      />
      <VendorProfileManager
        vendorProfiles={vendorProfiles}
        currentVendorProfile={currentVendorProfile}
        showVendorModal={showVendorModal}
        editingProfile={editingProfile}
        setShowVendorModal={setShowVendorModal}
        setEditingProfile={setEditingProfile}
        selectVendorProfile={selectVendorProfile}
        deleteVendorProfile={deleteVendorProfile}
        updateVendorProfile={updateVendorProfile}
        inkDB={inkDB}
      />
    </>
  );

  const renderRecipeManagement = () => (
    <RecipeManagement
      recipeHistory={recipeHistory}
      showHistoryModal={showHistoryModal}
      setShowHistoryModal={setShowHistoryModal}
      setTargetColor={setTargetColor}
      setCurrentRecipe={setCurrentRecipe}
      setCurrentPage={(page: string) => setCurrentPage(page as PageView)}
    />
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
                    C: {profile.inkLimit.cyan}% | M: {profile.inkLimit.magenta}% | Y:{' '}
                    {profile.inkLimit.yellow}% | K: {profile.inkLimit.black}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', marginTop: '32px' }}>
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
              onChange={(e) =>
                setPrintSettings({ ...printSettings, dotGain: parseInt(e.target.value) || 15 })
              }
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
              onChange={(e) =>
                setPrintSettings({ ...printSettings, tacLimit: parseInt(e.target.value) || 320 })
              }
              min="200"
              max="400"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <Settings
      manufacturerDB={manufacturerDB}
      deltaEMethod={deltaEMethod}
      setDeltaEMethod={setDeltaEMethod}
      setRecipeHistory={setRecipeHistory}
      onShowInfo={(title, content) => setInfoModal({ isOpen: true, title, content })}
    />
  );

  return (
    <div className="professional-app">
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <div className="professional-container">
        {renderPage()}

        {/* Footer Info */}
        <div
          style={{
            marginTop: '48px',
            padding: '24px',
            textAlign: 'center',
            color: '#78909c',
            fontSize: '0.875rem',
          }}
        >
          <p>색상 정확도 안내: 화면에 표시되는 색상은 실제 인쇄 결과와 다를 수 있습니다.</p>
          <p>정확한 색상 확인을 위해서는 실제 인쇄 샘플을 참고해 주시기 바랍니다.</p>
        </div>
      </div>

      {/* Recipe History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowHistoryModal(false)}>
              ×
            </button>
            <RecipeHistory
              currentRecipe={currentRecipe}
              onSelectRecipe={(recipe) => {
                setTargetColor(recipe.target || recipe.targetColor || { L: 0, a: 0, b: 0 });
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

      {/* Info Modal */}
      <InfoModal
        isOpen={infoModal.isOpen}
        onClose={() => setInfoModal({ isOpen: false, content: '' })}
        title={infoModal.title}
        content={infoModal.content}
      />

      {/* Color Correction Modal */}
      <ColorCorrectionModal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        targetColor={targetColor}
        currentRecipe={currentRecipe}
        availableInks={inkDB.getAllInks()}
        onApplyCorrection={handleApplyCorrection}
      />
    </div>
  );
}

export default ProfessionalApp;
