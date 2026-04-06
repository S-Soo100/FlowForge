import { useEffect, useRef, useState } from 'react';
import type { EventNodeData, ProgressionBlock, ChoicesData, ConditionItem, ConditionGroup } from '../../types';

interface Props {
  nodeId: string;
  data: EventNodeData;
  variableKeys: string[];
  onSave: (
    nodeId: string,
    updates: { name?: string; node_data?: Record<string, unknown> }
  ) => Promise<void>;
  onSyncChoices?: (nodeId: string, choices: string[] | null) => Promise<void>;
  onDelete: (nodeId: string) => Promise<void>;
  onClose: () => void;
}

// ── 조건 빌더 ──
interface ConditionBuilderProps {
  conditions: ConditionGroup | null;
  onChange: (conditions: ConditionGroup | null) => void;
  variableKeys: string[];
}

const COMPARATORS: ConditionItem['comparator'][] = ['==', '!=', '>', '<', '>=', '<='];

function ConditionBuilder({ conditions, onChange, variableKeys }: ConditionBuilderProps) {
  const items = conditions?.items ?? [];
  const operator = conditions?.operator ?? 'and';

  const updateOperator = (op: 'and' | 'or') => {
    if (!conditions) return;
    onChange({ ...conditions, operator: op });
  };

  const addItem = () => {
    const newItem: ConditionItem = { variableKey: '', comparator: '==', value: '' };
    if (!conditions) {
      onChange({ operator: 'and', items: [newItem] });
    } else {
      onChange({ ...conditions, items: [...conditions.items, newItem] });
    }
  };

  const updateItem = (index: number, updated: ConditionItem) => {
    if (!conditions) return;
    const newItems = conditions.items.map((it, i) => (i === index ? updated : it));
    onChange({ ...conditions, items: newItems });
  };

  const removeItem = (index: number) => {
    if (!conditions) return;
    const newItems = conditions.items.filter((_, i) => i !== index);
    if (newItems.length === 0) {
      onChange(null);
    } else {
      onChange({ ...conditions, items: newItems });
    }
  };

  return (
    <div className="space-y-2">
      {/* 논리 연산자 — 조건 2개 이상일 때만 표시 */}
      {items.length >= 2 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">전체 논리:</span>
          <select
            value={operator}
            onChange={(e) => updateOperator(e.target.value as 'and' | 'or')}
            className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="and">AND (모두 만족)</option>
            <option value="or">OR (하나라도 만족)</option>
          </select>
        </div>
      )}

      {/* 조건 행 목록 */}
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 italic">조건이 없으면 항상 발생</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded px-2 py-1.5"
            >
              {/* 변수 드롭다운 */}
              <select
                value={item.variableKey}
                onChange={(e) => updateItem(i, { ...item, variableKey: e.target.value })}
                className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-0 flex-1"
              >
                {item.variableKey === '' && (
                  <option value="" disabled>
                    {variableKeys.length === 0 ? '변수 없음' : '변수 선택'}
                  </option>
                )}
                {variableKeys.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>

              {/* 비교 연산자 */}
              <select
                value={item.comparator}
                onChange={(e) =>
                  updateItem(i, { ...item, comparator: e.target.value as ConditionItem['comparator'] })
                }
                className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 flex-shrink-0"
              >
                {COMPARATORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* 값 입력 */}
              <input
                type="text"
                value={item.value}
                onChange={(e) => updateItem(i, { ...item, value: e.target.value })}
                placeholder="값"
                className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 min-w-0 flex-1"
              />

              {/* 삭제 */}
              <button
                onClick={() => removeItem(i)}
                className="text-gray-300 hover:text-red-400 text-sm flex-shrink-0 leading-none"
                title="조건 삭제"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 조건 추가 버튼 */}
      <button
        onClick={addItem}
        disabled={variableKeys.length === 0}
        className="w-full py-1.5 border border-dashed border-gray-300 rounded text-xs text-gray-400 hover:text-blue-500 hover:border-blue-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title={variableKeys.length === 0 ? '먼저 프로젝트 변수를 추가하세요' : undefined}
      >
        + 조건 추가
      </button>
    </div>
  );
}

// ── 블럭 타입 메타 ──
const BLOCK_TYPE_META: Record<
  ProgressionBlock['type'],
  { label: string; borderColor: string }
> = {
  system: { label: '시스템 패널', borderColor: '#60a5fa' },
  text: { label: '텍스트 패널', borderColor: '#4ade80' },
  background: { label: '배경 패널', borderColor: '#c084fc' },
};

// ── 진행 블럭 아이템 ──
interface BlockItemProps {
  block: ProgressionBlock;
  index: number;
  total: number;
  onChange: (index: number, updated: ProgressionBlock) => void;
  onDelete: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDrop: () => void;
  isDragging: boolean;
}

function BlockItem({
  block,
  index,
  onChange,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
}: BlockItemProps) {
  const meta = BLOCK_TYPE_META[block.type];

  return (
    <div
      draggable
      className={`relative rounded border border-gray-200 bg-white transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-40' : 'opacity-100'
      }`}
      style={{ borderLeft: `3px solid ${meta.borderColor}` }}
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e, index);
      }}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-2 px-2 pt-2 pb-1">
        {/* 드래그 핸들 (시각적 힌트) */}
        <div
          className="text-gray-300 hover:text-gray-500 select-none flex-shrink-0 text-base leading-none"
          title="드래그해서 순서 변경"
        >
          ⠿
        </div>

        {/* 타입 드롭다운 */}
        <select
          value={block.type}
          onChange={(e) =>
            onChange(index, {
              ...block,
              type: e.target.value as ProgressionBlock['type'],
            })
          }
          className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 flex-shrink-0"
        >
          <option value="text">텍스트 패널</option>
          <option value="system">시스템 패널</option>
          <option value="background">배경 패널</option>
        </select>

        {/* 삭제 버튼 */}
        <button
          onClick={() => onDelete(index)}
          className="ml-auto text-gray-300 hover:text-red-400 text-sm flex-shrink-0 leading-none"
          title="블럭 삭제"
        >
          ×
        </button>
      </div>

      {/* 내용 textarea */}
      <div className="px-2 pb-2">
        <textarea
          value={block.content}
          onChange={(e) =>
            onChange(index, { ...block, content: e.target.value })
          }
          placeholder={
            block.type === 'background'
              ? '배경 이미지 경로 또는 설명'
              : block.type === 'system'
              ? '시스템 메시지 내용'
              : '대사 또는 텍스트 내용'
          }
          rows={2}
          className="w-full text-xs border border-gray-100 rounded px-2 py-1.5 resize-y focus:outline-none focus:ring-1 focus:ring-blue-300 bg-gray-50"
        />
      </div>
    </div>
  );
}

// ── 선택지 블럭 카드 ──
interface ChoicesBlockProps {
  label: string;
  onLabelChange: (label: string) => void;
  choices: string[];
  onChange: (choices: string[]) => void;
  onRemove: () => void;
}

function ChoicesBlock({ label, onLabelChange, choices, onChange, onRemove }: ChoicesBlockProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addChoice = (text: string) => {
    const trimmed = text.trim();
    if (trimmed) {
      onChange([...choices, trimmed]);
    }
  };

  const removeChoice = (index: number) => {
    onChange(choices.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addChoice(inputValue);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && inputValue === '' && choices.length > 0) {
      removeChoice(choices.length - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.endsWith(', ')) {
      const candidate = val.slice(0, -2);
      if (candidate.trim()) {
        addChoice(candidate);
        setInputValue('');
      } else {
        setInputValue('');
      }
    } else {
      setInputValue(val);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addChoice(inputValue);
      setInputValue('');
    }
  };

  return (
    <div
      className="rounded border border-gray-200 bg-white"
      style={{ borderLeft: '3px solid #f59e0b' }}
    >
      <div className="flex items-center gap-2 px-2 pt-2 pb-1">
        {/* 고정 아이콘 (드래그 핸들 자리) */}
        <div className="text-gray-300 select-none flex-shrink-0 text-base leading-none">
          📋
        </div>

        {/* 고정 라벨 */}
        <span className="text-xs font-medium text-amber-600 flex-shrink-0">
          선택지
        </span>

        {/* 삭제 버튼 */}
        <button
          onClick={onRemove}
          className="ml-auto text-gray-300 hover:text-red-400 text-sm flex-shrink-0 leading-none"
          title="선택지 삭제"
        >
          ×
        </button>
      </div>

      <div className="px-2 pb-2 space-y-1.5">
        {/* 선택지 라벨 입력 */}
        <input
          type="text"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder="선택지 라벨 (선택사항)"
          className="w-full text-xs border border-gray-100 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-300 bg-gray-50"
        />

        {/* 번호 붙은 선택지 태그 */}
        {choices.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {choices.map((choice, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-full px-2.5 py-0.5"
              >
                {i + 1}. {choice}
                <button
                  type="button"
                  onClick={() => removeChoice(i)}
                  className="text-amber-400 hover:text-red-400 leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* 입력 필드 */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="선택지를 입력하고 Enter"
          className="w-full text-xs border border-gray-100 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-300 bg-gray-50"
        />

        {choices.length > 0 && (
          <p className="text-[10px] text-gray-400">
            나가는 엣지 라벨이 선택지 순서대로 자동 업데이트됩니다.
          </p>
        )}
      </div>
    </div>
  );
}

// ── 블럭 추가 버튼 (드롭다운 메뉴) ──
interface AddBlockButtonProps {
  hasChoices: boolean;
  onAddBlock: (type: ProgressionBlock['type']) => void;
  onAddChoices: () => void;
}

function AddBlockButton({ hasChoices, onAddBlock, onAddChoices }: AddBlockButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 → 메뉴 닫힘
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const menuItems: Array<{
    label: string;
    borderColor: string;
    action: () => void;
    disabled?: boolean;
    hint?: string;
  }> = [
    {
      label: '텍스트 패널',
      borderColor: '#4ade80',
      action: () => { onAddBlock('text'); setOpen(false); },
    },
    {
      label: '시스템 패널',
      borderColor: '#60a5fa',
      action: () => { onAddBlock('system'); setOpen(false); },
    },
    {
      label: '배경 패널',
      borderColor: '#c084fc',
      action: () => { onAddBlock('background'); setOpen(false); },
    },
    {
      label: '선택지',
      borderColor: '#f59e0b',
      action: () => { onAddChoices(); setOpen(false); },
      disabled: hasChoices,
      hint: hasChoices ? '(이미 추가됨)' : undefined,
    },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full py-2 border border-dashed border-gray-300 rounded text-xs text-gray-400 hover:text-blue-500 hover:border-blue-400 transition-colors text-center"
      >
        + 블럭 추가
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-200 rounded shadow-md z-10 py-1 min-w-[160px] whitespace-nowrap">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={item.disabled ? undefined : item.action}
              disabled={item.disabled}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                item.disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.disabled ? '#d1d5db' : item.borderColor }}
              />
              <span>{item.label}</span>
              {item.hint && (
                <span className="ml-auto text-[10px] text-gray-300">{item.hint}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ──
export function EventDetailPanel({
  nodeId,
  data,
  variableKeys,
  onSave,
  onSyncChoices,
  onDelete,
  onClose,
}: Props) {
  const [name, setName] = useState(data.label);
  const [declaration, setDeclaration] = useState(data.declaration ?? '');
  const [conditions, setConditions] = useState<ConditionGroup | null>(data.conditions ?? null);
  const [blocks, setBlocks] = useState<ProgressionBlock[]>(
    data.progression ?? []
  );
  const [choices, setChoices] = useState<string[]>(data.choices?.items ?? []);
  const [choicesLabel, setChoicesLabel] = useState<string>(data.choices?.label ?? '');
  const [showChoices, setShowChoices] = useState<boolean>(
    data.choices !== null && data.choices !== undefined
  );
  const [saving, setSaving] = useState(false);

  // 드래그 상태
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  // 노드 변경 시 폼 리셋
  useEffect(() => {
    setName(data.label);
    setDeclaration(data.declaration ?? '');
    setConditions(data.conditions ?? null);
    setBlocks(data.progression ?? []);
    setChoices(data.choices?.items ?? []);
    setChoicesLabel(data.choices?.label ?? '');
    setShowChoices(data.choices !== null && data.choices !== undefined);
  }, [nodeId, data]);

  // ── 블럭 핸들러 ──
  const handleBlockChange = (index: number, updated: ProgressionBlock) => {
    setBlocks((prev) => prev.map((b, i) => (i === index ? updated : b)));
  };

  const handleBlockDelete = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBlockAdd = (type: ProgressionBlock['type'] = 'text') => {
    setBlocks((prev) => [...prev, { type, content: '' }]);
  };

  // ── 드래그 앤 드롭 ──
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (dragIndex === null) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const newInsert = e.clientY < midY ? index : index + 1;
    setInsertIndex(newInsert);
  };

  const handleDrop = () => {
    if (dragIndex === null || insertIndex === null) {
      setDragIndex(null);
      setInsertIndex(null);
      return;
    }
    if (insertIndex === dragIndex || insertIndex === dragIndex + 1) {
      setDragIndex(null);
      setInsertIndex(null);
      return;
    }
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(dragIndex, 1);
    const adjustedInsert = insertIndex > dragIndex ? insertIndex - 1 : insertIndex;
    newBlocks.splice(adjustedInsert, 0, moved);
    setBlocks(newBlocks);
    setDragIndex(null);
    setInsertIndex(null);
  };

  // ── 저장 ──
  const handleSave = async () => {
    setSaving(true);

    const progression: ProgressionBlock[] | null =
      blocks.length > 0 ? blocks : null;
    const choicesData: ChoicesData | null =
      choices.length > 0 || showChoices
        ? { label: choicesLabel.trim() || undefined, items: choices }
        : null;

    await onSave(nodeId, {
      name,
      node_data: {
        declaration: declaration.trim() || undefined,
        conditions: conditions ?? null,
        progression,
        choices: choicesData,
      },
    });

    // 선택지 → 나가는 엣지 라벨 동기화 (items만 넘김)
    if (onSyncChoices) {
      await onSyncChoices(nodeId, choices.length > 0 ? choices : null);
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (confirm('이 이벤트를 삭제할까?')) {
      await onDelete(nodeId);
      onClose();
    }
  };

  return (
    <div className="w-[440px] bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-y-auto">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
            {data.displayId}
          </span>
          <h3 className="text-sm font-bold text-gray-800">이벤트 상세</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      {/* 폼 */}
      <div className="p-4 space-y-5 flex-1">
        {/* 이벤트 이름 */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            이벤트 이름
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 발생 조건 */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            발생 조건
          </label>
          <ConditionBuilder
            conditions={conditions}
            onChange={setConditions}
            variableKeys={variableKeys}
          />
        </div>

        {/* 이벤트 진행 블럭 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              이벤트 진행
            </label>
            <AddBlockButton
              hasChoices={showChoices}
              onAddBlock={handleBlockAdd}
              onAddChoices={() => setShowChoices(true)}
            />
          </div>

          {/* 타입 범례 */}
          <div className="flex gap-3 text-[10px] text-gray-400">
            <span style={{ borderLeft: '2px solid #60a5fa', paddingLeft: 4 }}>
              시스템
            </span>
            <span style={{ borderLeft: '2px solid #4ade80', paddingLeft: 4 }}>
              텍스트
            </span>
            <span style={{ borderLeft: '2px solid #c084fc', paddingLeft: 4 }}>
              배경
            </span>
            <span style={{ borderLeft: '2px solid #f59e0b', paddingLeft: 4 }}>
              선택지
            </span>
          </div>

          <div
            className="flex flex-col gap-0"
            onDragEnd={() => {
              setDragIndex(null);
              setInsertIndex(null);
            }}
          >
            {/* insertIndex === 0 일 때 맨 위 인디케이터 */}
            {dragIndex !== null && insertIndex === 0 && (
              <div className="h-[2px] bg-blue-500 rounded-full my-[-1px] mx-0.5" />
            )}

            {blocks.map((block, i) => (
              <div key={i} className="flex flex-col gap-0">
                <BlockItem
                  block={block}
                  index={i}
                  total={blocks.length}
                  onChange={handleBlockChange}
                  onDelete={handleBlockDelete}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  isDragging={dragIndex === i}
                />
                {/* 각 블럭 아래 insertion indicator */}
                {dragIndex !== null && insertIndex === i + 1 ? (
                  <div className="h-[2px] bg-blue-500 rounded-full my-[-1px] mx-0.5" />
                ) : (
                  <div className="h-2" />
                )}
              </div>
            ))}

            {/* 선택지 카드 — 드래그 대상 아님, 항상 맨 끝 고정 */}
            {showChoices && (
              <>
                <ChoicesBlock
                  label={choicesLabel}
                  onLabelChange={setChoicesLabel}
                  choices={choices}
                  onChange={setChoices}
                  onRemove={() => {
                    setShowChoices(false);
                    setChoices([]);
                    setChoicesLabel('');
                  }}
                />
                <div className="h-2" />
              </>
            )}

            {/* 끝에 추가 버튼 박스 */}
            <AddBlockButton
              hasChoices={showChoices}
              onAddBlock={handleBlockAdd}
              onAddChoices={() => setShowChoices(true)}
            />
          </div>
        </div>
      </div>

      {/* 액션 */}
      <div className="p-4 border-t border-gray-100 flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {saving ? '저장중...' : '저장'}
        </button>
        <button
          onClick={handleDelete}
          className="px-3 py-2 text-red-500 text-sm border border-red-200 rounded-lg hover:bg-red-50 transition"
        >
          삭제
        </button>
        <button
          onClick={onClose}
          className="px-3 py-2 text-gray-500 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
