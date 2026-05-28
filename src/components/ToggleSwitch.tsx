interface ToggleSwitchProps {
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

const ToggleSwitch = ({ label, sublabel, checked, onChange, id }: ToggleSwitchProps) => {
  const inputId = id ?? `toggle-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <label htmlFor={inputId} className="font-medium text-(--text-secondary) cursor-pointer select-none">
          {label}
        </label>
        {sublabel && (
          <p className="text-xs text-(--text-secondary) opacity-75">{sublabel}</p>
        )}
      </div>
      <input
        id={inputId}
        title={label}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-6 h-6 shrink-0 rounded-lg appearance-none bg-primary/10 border border-primary/20 checked:bg-primary checked:border-primary transition-all cursor-pointer relative shadow-inner after:content-[''] after:absolute after:hidden checked:after:block after:start-2 after:top-1 after:w-1.5 after:h-3 after:border-e-2 after:border-b-2 after:border-white after:rotate-45"
      />
    </div>
  );
};

export default ToggleSwitch;
