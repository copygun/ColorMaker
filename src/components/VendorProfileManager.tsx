import React from 'react';

interface VendorProfile {
  id: string;
  name: string;
  createdAt: string;
  preparedInks: string[];
  customValues: any;
  spotInkRecipes?: {
    [key: string]: {
      recipe: Array<{ inkId: string; percentage: number }>;
      calculatedLab?: { L: number; a: number; b: number };
      measuredLab?: { L: number; a: number; b: number };
    };
  };
  isComplete?: boolean;
}

interface VendorProfileManagerProps {
  vendorProfiles: VendorProfile[];
  currentVendorProfile: string;
  showVendorModal: boolean;
  editingProfile: VendorProfile | null;
  setShowVendorModal: (show: boolean) => void;
  setEditingProfile: (profile: VendorProfile | null) => void;
  selectVendorProfile: (profileId: string) => void;
  deleteVendorProfile: (profileId: string) => void;
  updateVendorProfile: (profileId: string, updates: Partial<VendorProfile>) => void;
  inkDB: any;
}

const VendorProfileManager: React.FC<VendorProfileManagerProps> = ({
  vendorProfiles,
  currentVendorProfile,
  showVendorModal,
  editingProfile,
  setShowVendorModal,
  setEditingProfile,
  selectVendorProfile,
  deleteVendorProfile,
  updateVendorProfile,
  inkDB,
}) => {
  const handleLabInput = (spotInkId: string, recipeData: any) => {
    const L = prompt('L* 값을 입력하세요:', recipeData.measuredLab?.L?.toString() || '');
    const a = prompt('a* 값을 입력하세요:', recipeData.measuredLab?.a?.toString() || '');
    const b = prompt('b* 값을 입력하세요:', recipeData.measuredLab?.b?.toString() || '');

    if (L && a && b && editingProfile) {
      const updatedProfile = { ...editingProfile };
      if (!updatedProfile.spotInkRecipes) updatedProfile.spotInkRecipes = {};
      updatedProfile.spotInkRecipes[spotInkId] = {
        ...recipeData,
        measuredLab: {
          L: parseFloat(L),
          a: parseFloat(a),
          b: parseFloat(b),
        },
      };

      // Check if all spot inks have measured values
      const allMeasured = Object.values(updatedProfile.spotInkRecipes).every(
        (r) => r.measuredLab !== undefined,
      );
      updatedProfile.isComplete = allMeasured;

      updateVendorProfile(editingProfile.id, updatedProfile);
      setEditingProfile(updatedProfile);
    }
  };

  const calculateDeltaE = (
    lab1: { L: number; a: number; b: number },
    lab2: { L: number; a: number; b: number },
  ) => {
    return Math.sqrt(
      Math.pow(lab1.L - lab2.L, 2) + Math.pow(lab1.a - lab2.a, 2) + Math.pow(lab1.b - lab2.b, 2),
    ).toFixed(2);
  };

  return (
    <>
      {/* Profile Management Modal */}
      {showVendorModal && (
        <div className="modal-overlay" onClick={() => setShowVendorModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '700px' }}
          >
            <button className="modal-close" onClick={() => setShowVendorModal(false)}>
              ×
            </button>
            <h3 style={{ marginBottom: '24px' }}>협력사 프로파일 관리</h3>

            <div>
              <h4 style={{ marginBottom: '12px' }}>등록된 프로파일 목록</h4>
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>프로파일명</th>
                    <th>등록일</th>
                    <th>준비된 잉크</th>
                    <th>상태</th>
                    <th>작업</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorProfiles.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{ textAlign: 'center', padding: '20px', color: '#999' }}
                      >
                        등록된 프로파일이 없습니다. 색상 데이터베이스에서 프로파일을 생성해주세요.
                      </td>
                    </tr>
                  ) : (
                    vendorProfiles.map((profile) => (
                      <tr key={profile.id}>
                        <td>{profile.name}</td>
                        <td>{new Date(profile.createdAt).toLocaleDateString('ko-KR')}</td>
                        <td>{profile.preparedInks.length}개</td>
                        <td>{currentVendorProfile === profile.id ? '✅ 사용중' : ''}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {currentVendorProfile !== profile.id && (
                              <button
                                className="pro-button pro-button-secondary"
                                style={{ padding: '4px 12px', fontSize: '0.875rem' }}
                                onClick={() => selectVendorProfile(profile.id)}
                              >
                                선택
                              </button>
                            )}
                            <button
                              className="pro-button pro-button-secondary"
                              style={{ padding: '4px 12px', fontSize: '0.875rem' }}
                              onClick={() => setEditingProfile(profile)}
                            >
                              상세
                            </button>
                            <button
                              className="pro-button pro-button-secondary"
                              style={{
                                padding: '4px 12px',
                                fontSize: '0.875rem',
                                color: '#dc3545',
                                borderColor: '#dc3545',
                              }}
                              onClick={() => {
                                if (confirm(`"${profile.name}" 프로파일을 삭제하시겠습니까?`)) {
                                  deleteVendorProfile(profile.id);
                                }
                              }}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                className="pro-button pro-button-secondary"
                onClick={() => setShowVendorModal(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Details Modal */}
      {editingProfile && (
        <div className="modal-overlay" onClick={() => setEditingProfile(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '900px', maxHeight: '80vh', overflowY: 'auto' }}
          >
            <button className="modal-close" onClick={() => setEditingProfile(null)}>
              ×
            </button>
            <h3 style={{ marginBottom: '24px' }}>
              {editingProfile.name} 프로파일 상세
              {editingProfile.isComplete ? (
                <span style={{ marginLeft: '12px', fontSize: '0.875rem', color: '#28a745' }}>
                  ✅ 완성됨
                </span>
              ) : (
                <span style={{ marginLeft: '12px', fontSize: '0.875rem', color: '#dc3545' }}>
                  ⚠️ 미완성 (Spot Ink Lab 값 필요)
                </span>
              )}
            </h3>

            {/* Prepared Inks */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>준비된 잉크</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {editingProfile.preparedInks.map((inkId) => {
                  const ink = inkDB.getInkById(inkId);
                  return ink ? (
                    <span
                      key={inkId}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                      }}
                    >
                      {ink.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Spot Ink Recipes */}
            {editingProfile.spotInkRecipes &&
              Object.keys(editingProfile.spotInkRecipes).length > 0 && (
                <div>
                  <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>
                    Spot Ink 레시피 및 CIELAB 값
                  </h4>
                  <table className="pro-table">
                    <thead>
                      <tr>
                        <th>Spot Ink</th>
                        <th>레시피</th>
                        <th>계산된 L*a*b*</th>
                        <th>측정 L*a*b*</th>
                        <th>ΔE*00</th>
                        <th>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(editingProfile.spotInkRecipes).map(
                        ([spotInkId, recipeData]) => {
                          const spotInk = inkDB.getInkById(spotInkId);
                          const deltaE =
                            recipeData.measuredLab && recipeData.calculatedLab
                              ? calculateDeltaE(recipeData.measuredLab, recipeData.calculatedLab)
                              : '-';

                          return spotInk ? (
                            <tr key={spotInkId}>
                              <td>{spotInk.name}</td>
                              <td style={{ fontSize: '0.75rem' }}>
                                {recipeData.recipe
                                  .map((item) => {
                                    const ink = inkDB.getInkById(item.inkId);
                                    return `${ink?.name}: ${item.percentage.toFixed(1)}%`;
                                  })
                                  .join(', ')}
                              </td>
                              <td style={{ fontSize: '0.875rem' }}>
                                {recipeData.calculatedLab
                                  ? `L*:${recipeData.calculatedLab.L.toFixed(1)} a*:${recipeData.calculatedLab.a.toFixed(1)} b*:${recipeData.calculatedLab.b.toFixed(1)}`
                                  : '-'}
                              </td>
                              <td style={{ fontSize: '0.875rem' }}>
                                {recipeData.measuredLab ? (
                                  `L*:${recipeData.measuredLab.L.toFixed(1)} a*:${recipeData.measuredLab.a.toFixed(1)} b*:${recipeData.measuredLab.b.toFixed(1)}`
                                ) : (
                                  <span style={{ color: '#dc3545' }}>입력 필요</span>
                                )}
                              </td>
                              <td>{deltaE}</td>
                              <td>
                                <button
                                  className="pro-button pro-button-secondary"
                                  style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                  onClick={() => handleLabInput(spotInkId, recipeData)}
                                >
                                  Lab 입력
                                </button>
                              </td>
                            </tr>
                          ) : null;
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              )}

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button
                className="pro-button pro-button-secondary"
                onClick={() => setEditingProfile(null)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VendorProfileManager;
