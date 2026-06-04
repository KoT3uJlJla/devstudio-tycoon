type ProgressBarProps = {
  value: number;
  label?: string;
};

export function ProgressBar({ value, label }: ProgressBarProps) {
  return (
    <div className={label ? 'progress progress-labeled' : 'progress'}>
      <i style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
      {label && <b>{label}</b>}
    </div>
  );
}
