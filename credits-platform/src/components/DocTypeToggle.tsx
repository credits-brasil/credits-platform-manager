import type { DocType } from "@/types";

type DocTypeToggleComponentProps = {
  value: DocType;
  disabled?: boolean;
  onChange: (type: DocType) => void;
};

export function DocTypeToggleComponent({
  value,
  disabled,
  onChange,
}: DocTypeToggleComponentProps) {
  return (
    <div className="flex items-center h-[37.5px] gap-0.5 rounded-lg border border-gray-200 bg-gray-100 p-0.5 flex-shrink-0">
      {(["CPF", "CNPJ"] as DocType[]).map((type) => (
        <button
          key={type}
          type="button"
          disabled={disabled}
          onClick={() => onChange(type)}
          className="rounded-md px-3 py-1.5 text-xs font-semibold transition-all"
          style={{
            backgroundColor: value === type ? "#243871" : "transparent",
            color: value === type ? "white" : "#6b7280",
          }}
        >
          {type}
        </button>
      ))}
    </div>
  );
}