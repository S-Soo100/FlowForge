import { SearchBar } from './SearchBar';

interface Props {
  onAddEvent: () => void;
  onExport: () => void;
  onImport: () => void;
  onAutoLayout: () => void;
  onValidate: () => void;
  onSettings: () => void;
  onVariables: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isReadOnly: boolean;
  projectName: string;
  onBack: () => void;
}

export function Toolbar({
  onAddEvent, onExport, onImport, onAutoLayout, onValidate, onSettings, onVariables,
  onUndo, onRedo, canUndo, canRedo, isReadOnly,
  projectName, onBack,
}: Props) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-sm">
          ← 목록
        </button>
        <h2 className="text-base font-semibold text-gray-800">{projectName}</h2>
      </div>

      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30 transition"
          title="되돌리기 (Ctrl+Z)"
        >
          ↩
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded disabled:opacity-30 transition"
          title="다시 실행 (Ctrl+Y)"
        >
          ↪
        </button>

        <div className="w-px h-6 bg-gray-200" />

        <SearchBar />

        <div className="w-px h-6 bg-gray-200" />

        {!isReadOnly && (
          <button
            onClick={onAddEvent}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
          >
            + 이벤트
          </button>
        )}
        <button
          onClick={onAutoLayout}
          className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
          title="자동 정렬"
        >
          🔀 정렬
        </button>
        <button
          onClick={onValidate}
          className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
          title="검증"
        >
          ✅ 검증
        </button>
        <button
          onClick={onVariables}
          className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
          title="프로젝트 데이터 관리"
        >
          📦 데이터
        </button>

        <div className="w-px h-6 bg-gray-200" />

        <button
          onClick={onImport}
          className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
        >
          📤 Import
        </button>
        <button
          onClick={onExport}
          className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
        >
          📥 Export
        </button>

        <div className="w-px h-6 bg-gray-200" />

        <button
          onClick={onSettings}
          className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
          title="프로젝트 설정"
        >
          ⚙
        </button>
      </div>
    </div>
  );
}
