type AssetCheckboxProps = {
  label: string;
  checked: boolean;
  mixed?: boolean;
  disabled?: boolean;
  onChange: () => void;
};

export function AssetCheckbox({ label, checked, mixed = false, disabled, onChange }: AssetCheckboxProps) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      aria-checked={mixed ? "mixed" : checked}
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      ref={(node) => { if (node) node.indeterminate = mixed; }}
      className="size-4 shrink-0 cursor-pointer opacity-0 transition-opacity group-hover/selection:opacity-100 group-focus-within/selection:opacity-100 checked:opacity-100 aria-[checked=mixed]:opacity-100 focus-visible:opacity-100 [@media(pointer:coarse)]:opacity-100 accent-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-50"
    />
  );
}
