interface Props {
  choices: string[];
  onSelect: (choice: string | null) => void;
  onClose: () => void;
}

export function ChoiceSelectPopup({ choices, onSelect, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-xl shadow-xl p-5 flex flex-col items-center gap-3"
        style={{ minWidth: 240, maxWidth: 320 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-semibold text-gray-700">
          이 연결에 선택지를 지정하세요
        </p>
        <div className="w-full flex flex-col gap-1.5 max-h-[240px] overflow-y-auto">
          {choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => onSelect(choice)}
              className="w-full px-3 py-2 rounded-lg text-sm text-left font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition"
            >
              {choice}
            </button>
          ))}
        </div>
        <button
          onClick={() => onSelect(null)}
          className="w-full px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
        >
          선택 안 함
        </button>
      </div>
    </div>
  );
}
