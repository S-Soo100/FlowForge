interface Props {
  onAddEvent: () => void;
  onExport: () => void;
  projectName: string;
  onBack: () => void;
}

export function Toolbar({ onAddEvent, onExport, projectName, onBack }: Props) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ← 목록
        </button>
        <h2 className="text-base font-semibold text-gray-800">{projectName}</h2>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onAddEvent}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
        >
          + 이벤트 추가
        </button>
        <button
          onClick={onExport}
          className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition"
        >
          📥 JSON Export
        </button>
      </div>
    </div>
  );
}
