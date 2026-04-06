import { useState } from 'react';
import type { VariableCategory, VariableValueType } from '../../types';
import type { useProjectVariables } from '../../hooks/useProjectVariables';

type VariablesHook = ReturnType<typeof useProjectVariables>;

interface Props {
  projectId: string;
  variables: VariablesHook;
  onClose: () => void;
}

type Tab = 'variable' | 'background' | 'character';

const TAB_LABELS: Record<Tab, string> = {
  variable: '변수',
  background: '배경',
  character: '캐릭터',
};

const VALUE_TYPES: VariableValueType[] = ['string', 'number', 'boolean'];
const VALUE_TYPE_LABELS: Record<VariableValueType, string> = {
  string: '문자열',
  number: '숫자',
  boolean: '참/거짓',
};

export function ProjectVariablesModal({ variables: hook, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('variable');
  const [addingKey, setAddingKey] = useState('');
  const [addingValueType, setAddingValueType] = useState<VariableValueType>('string');
  const [addingDefaultValue, setAddingDefaultValue] = useState('');
  const [addingFileName, setAddingFileName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const items = hook.getByCategory(activeTab as VariableCategory);

  const handleAdd = async () => {
    const key = addingKey.trim();
    if (!key) return;

    try {
      if (activeTab === 'variable') {
        await hook.addVariable({
          category: 'variable',
          key,
          value_type: addingValueType,
          default_value: addingDefaultValue.trim() || undefined,
        });
      } else {
        await hook.addVariable({
          category: activeTab as VariableCategory,
          key,
          file_name: addingFileName.trim() || undefined,
        });
      }
      setAddingKey('');
      setAddingValueType('string');
      setAddingDefaultValue('');
      setAddingFileName('');
      setIsAdding(false);
    } catch {
      // 에러 무시 (RLS 또는 DB 미생성 시)
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setIsAdding(false);
    setAddingKey('');
    setAddingValueType('string');
    setAddingDefaultValue('');
    setAddingFileName('');
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-800">프로젝트 데이터 관리</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-gray-200 px-6">
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* 테이블 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {hook.loading ? (
            <p className="text-sm text-gray-400 text-center py-8">로딩중...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="text-left pb-2 pr-3">이름</th>
                  {activeTab === 'variable' && (
                    <>
                      <th className="text-left pb-2 pr-3 w-28">타입</th>
                      <th className="text-left pb-2 pr-3">기본값</th>
                    </>
                  )}
                  {activeTab !== 'variable' && (
                    <th className="text-left pb-2 pr-3">파일명</th>
                  )}
                  <th className="w-8 pb-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="py-1.5 pr-3">
                      <input
                        type="text"
                        defaultValue={item.key}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val && val !== item.key) {
                            hook.updateVariable(item.id, { key: val });
                          }
                        }}
                        className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                      />
                    </td>
                    {activeTab === 'variable' && (
                      <>
                        <td className="py-1.5 pr-3">
                          <select
                            value={item.value_type ?? 'string'}
                            onChange={(e) =>
                              hook.updateVariable(item.id, { value_type: e.target.value as VariableValueType })
                            }
                            className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm bg-white"
                          >
                            {VALUE_TYPES.map((t) => (
                              <option key={t} value={t}>{VALUE_TYPE_LABELS[t]}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1.5 pr-3">
                          <input
                            type="text"
                            defaultValue={item.default_value ?? ''}
                            onBlur={(e) => {
                              hook.updateVariable(item.id, { default_value: e.target.value });
                            }}
                            placeholder="기본값"
                            className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                          />
                        </td>
                      </>
                    )}
                    {activeTab !== 'variable' && (
                      <td className="py-1.5 pr-3">
                        <input
                          type="text"
                          defaultValue={item.file_name ?? ''}
                          onBlur={(e) => {
                            hook.updateVariable(item.id, { file_name: e.target.value });
                          }}
                          placeholder="파일명"
                          className="w-full px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                        />
                      </td>
                    )}
                    <td className="py-1.5 text-center">
                      <button
                        onClick={() => hook.deleteVariable(item.id)}
                        className="text-gray-300 hover:text-red-400 transition text-base leading-none"
                        title="삭제"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}

                {/* 추가 행 */}
                {isAdding && (
                  <tr className="border-t border-blue-100 bg-blue-50/30">
                    <td className="py-1.5 pr-3">
                      <input
                        type="text"
                        value={addingKey}
                        onChange={(e) => setAddingKey(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAdd();
                          if (e.key === 'Escape') setIsAdding(false);
                        }}
                        placeholder="이름"
                        autoFocus
                        className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                      />
                    </td>
                    {activeTab === 'variable' && (
                      <>
                        <td className="py-1.5 pr-3">
                          <select
                            value={addingValueType}
                            onChange={(e) => setAddingValueType(e.target.value as VariableValueType)}
                            className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm bg-white"
                          >
                            {VALUE_TYPES.map((t) => (
                              <option key={t} value={t}>{VALUE_TYPE_LABELS[t]}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1.5 pr-3">
                          <input
                            type="text"
                            value={addingDefaultValue}
                            onChange={(e) => setAddingDefaultValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAdd();
                              if (e.key === 'Escape') setIsAdding(false);
                            }}
                            placeholder="기본값"
                            className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                          />
                        </td>
                      </>
                    )}
                    {activeTab !== 'variable' && (
                      <td className="py-1.5 pr-3">
                        <input
                          type="text"
                          value={addingFileName}
                          onChange={(e) => setAddingFileName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAdd();
                            if (e.key === 'Escape') setIsAdding(false);
                          }}
                          placeholder="파일명"
                          className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                        />
                      </td>
                    )}
                    <td className="py-1.5 text-center">
                      <button
                        onClick={() => setIsAdding(false)}
                        className="text-gray-300 hover:text-red-400 transition text-base leading-none"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                )}

                {items.length === 0 && !isAdding && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                      아직 {TAB_LABELS[activeTab]}이(가) 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 하단 */}
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setIsAdding(true)}
            disabled={isAdding}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-40 transition"
          >
            + 추가
          </button>
          {isAdding && (
            <button
              onClick={handleAdd}
              disabled={!addingKey.trim()}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              저장
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
