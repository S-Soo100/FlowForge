import type { EventTrigger } from '../../types';

interface Props {
  trigger?: EventTrigger;
  onChange: (trigger: EventTrigger) => void;
}

export function TriggerEditor({ trigger, onChange }: Props) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        호출 조건 (Trigger)
      </h4>
      <input
        type="text"
        placeholder="조건 타입 (예: quest_complete, manual)"
        value={trigger?.type ?? ''}
        onChange={(e) =>
          onChange({ type: e.target.value, value: trigger?.value ?? '' })
        }
        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <input
        type="text"
        placeholder="조건 값 (예: tutorial_end)"
        value={trigger?.value ?? ''}
        onChange={(e) =>
          onChange({ type: trigger?.type ?? '', value: e.target.value })
        }
        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
