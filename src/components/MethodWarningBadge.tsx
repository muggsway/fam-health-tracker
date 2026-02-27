import Tooltip from './Tooltip';

interface MethodWarningBadgeProps {
  methods: string[];
}

export default function MethodWarningBadge({ methods }: MethodWarningBadgeProps) {
  const tooltipText = `Multiple methods used: ${methods.join(', ')}. Values may not be directly comparable.`;
  return (
    <Tooltip content={tooltipText} position="above-left">
      <span className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 border border-orange-200 rounded px-1.5 py-0.5 cursor-help">
        ⚠ Multiple methods
      </span>
    </Tooltip>
  );
}
