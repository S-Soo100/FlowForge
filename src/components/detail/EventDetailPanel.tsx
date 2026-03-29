import { useEffect, useRef, useState } from 'react';
import type { EventNodeData, ProgressionBlock } from '../../types';

interface Props {
  nodeId: string;
  data: EventNodeData;
  onSave: (
    nodeId: string,
    updates: { name?: string; node_data?: Record<string, unknown> }
  ) => Promise<void>;
  onSyncChoices?: (nodeId: string, choices: string[] | null) => Promise<void>;
  onDelete: (nodeId: string) => Promise<void>;
  onClose: () => void;
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
  onDragOver: (index: number) => void;
  onDrop: () => void;
  isDragging: boolean;
  isDropTarget: boolean;
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
  isDropTarget,
}: BlockItemProps) {
  const meta = BLOCK_TYPE_META[block.type];

  return (
    <div
      className={`relative rounded border border-gray-200 bg-white transition-all ${
        isDragging ? 'opacity-40' : 'opacity-100'
      } ${isDropTarget ? 'border-blue-400 border-dashed border-2' : ''}`}
      style={{ borderLeft: `3px solid ${meta.borderColor}` }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-2 px-2 pt-2 pb-1">
        {/* 드래그 핸들 */}
        <div
          draggable
          onDragStart={() => onDragStart(index)}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 select-none flex-shrink-0 text-base leading-none"
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

// ── 선택지 태그 입력 ──
interface ChoicesInputProps {
  choices: string[];
  onChange: (choices: string[]) => void;
}

function ChoicesInput({ choices, onChange }: ChoicesInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addChoice = (text: string) => {
    const trimmed = text.trim();
    if (trimmed && !choices.includes(trimmed)) {
      onChange([...choices, trimmed]);
    }
  };

  const removeChoice = (index: number) => {
    onChange(choices.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && inputValue === '' && choices.length > 0) {
      // 빈 상태에서 백스페이스 → 마지막 태그 삭제
      removeChoice(choices.length - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // ", " (콤마+스페이스)로 태그 확정
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
    // 포커스 아웃 시 남은 내용이 있으면 태그로 확정
    if (inputValue.trim()) {
      addChoice(inputValue);
      setInputValue('');
    }
  };

  return (
    <div
      className="min-h-[38px] w-full border border-gray-300 rounded px-2 py-1.5 flex flex-wrap gap-1.5 items-center cursor-text focus-within:ring-1 focus-within:ring-blue-400 focus-within:border-blue-400"
      onClick={() => inputRef.current?.focus()}
    >
      {choices.map((choice, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 text-gray-700 text-xs rounded-full px-2.5 py-0.5"
        >
          {choice}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeChoice(i);
            }}
            className="text-gray-400 hover:text-red-400 leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={choices.length === 0 ? '선택지 입력 (콤마+스페이스로 구분)' : ''}
        className="flex-1 min-w-[120px] text-xs outline-none bg-transparent"
      />
    </div>
  );
}

// ── 메인 컴포넌트 ──
export function EventDetailPanel({
  nodeId,
  data,
  onSave,
  onSyncChoices,
  onDelete,
  onClose,
}: Props) {
  const [name, setName] = useState(data.label);
  const [declaration, setDeclaration] = useState(data.declaration ?? '');
  const [blocks, setBlocks] = useState<ProgressionBlock[]>(
    data.progression ?? []
  );
  const [choices, setChoices] = useState<string[]>(data.choices ?? []);
  const [saving, setSaving] = useState(false);

  // 드래그 상태
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  // 노드 변경 시 폼 리셋
  useEffect(() => {
    setName(data.label);
    setDeclaration(data.declaration ?? '');
    setBlocks(data.progression ?? []);
    setChoices(data.choices ?? []);
  }, [nodeId, data]);

  // ── 블럭 핸들러 ──
  const handleBlockChange = (index: number, updated: ProgressionBlock) => {
    setBlocks((prev) => prev.map((b, i) => (i === index ? updated : b)));
  };

  const handleBlockDelete = (index: number) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBlockAdd = () => {
    setBlocks((prev) => [...prev, { type: 'text', content: '' }]);
  };

  // ── 드래그 앤 드롭 ──
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setDropIndex(index);
  };

  const handleDrop = () => {
    if (dragIndex === null || dropIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDropIndex(null);
      return;
    }
    const newBlocks = [...blocks];
    const [moved] = newBlocks.splice(dragIndex, 1);
    newBlocks.splice(dropIndex, 0, moved);
    setBlocks(newBlocks);
    setDragIndex(null);
    setDropIndex(null);
  };

  // ── 저장 ──
  const handleSave = async () => {
    setSaving(true);

    const progression: ProgressionBlock[] | null =
      blocks.length > 0 ? blocks : null;
    const choicesData: string[] | null = choices.length > 0 ? choices : null;

    await onSave(nodeId, {
      name,
      node_data: {
        declaration: declaration.trim() || undefined,
        progression,
        choices: choicesData,
      },
    });

    // 선택지 → 나가는 엣지 라벨 동기화
    if (onSyncChoices) {
      await onSyncChoices(nodeId, choicesData);
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

        {/* 이벤트 발생 선언 */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            이벤트 발생 선언
          </label>
          <input
            type="text"
            value={declaration}
            onChange={(e) => setDeclaration(e.target.value)}
            placeholder="예: 촌장이 주인공에게 다가온다"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 이벤트 진행 블럭 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              이벤트 진행
            </label>
            <button
              onClick={handleBlockAdd}
              className="text-xs text-blue-500 hover:text-blue-700 font-medium"
            >
              + 블럭 추가
            </button>
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
          </div>

          <div
            className="space-y-2"
            onDragEnd={() => {
              setDragIndex(null);
              setDropIndex(null);
            }}
          >
            {blocks.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded">
                진행 블럭 없음
                <br />
                <button
                  onClick={handleBlockAdd}
                  className="mt-1 text-blue-400 hover:text-blue-600 underline"
                >
                  블럭 추가
                </button>
              </div>
            ) : (
              blocks.map((block, i) => (
                <BlockItem
                  key={i}
                  block={block}
                  index={i}
                  total={blocks.length}
                  onChange={handleBlockChange}
                  onDelete={handleBlockDelete}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  isDragging={dragIndex === i}
                  isDropTarget={dropIndex === i}
                />
              ))
            )}
          </div>
        </div>

        {/* 이벤트 선택지 */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            이벤트 선택지
          </label>
          <ChoicesInput choices={choices} onChange={setChoices} />
          {choices.length > 0 && (
            <p className="text-[10px] text-gray-400">
              나가는 엣지 라벨이 선택지 순서대로 자동 업데이트됩니다.
            </p>
          )}
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
