import { AlertCircle, CheckCircle2 } from "lucide-react";

type InputComponentProps = {
  id?: string;
  type?: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  min?: number;
  className?: string;
  showError?: boolean;
  showSuccess?: boolean;
};

export function InputComponent({
  id,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  disabled,
  readOnly = false,
  required,
  min,
  showError = false,
  showSuccess = false,
  className,
}: InputComponentProps) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange ?? (() => undefined)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        min={min}
        className={`w-full max-w-[100%] rounded-lg border px-3.5 py-2 pr-9 text-sm text-gray-800 placeholder-gray-400 outline-none transition ${className ?? ""}`}
        style={{
          borderColor: showError ? "#ef4444" : showSuccess ? "#22c55e" : "#d1d5db",
          boxShadow: showError
            ? "0 0 0 2px rgba(239,68,68,0.12)"
            : showSuccess
              ? "0 0 0 2px rgba(34,197,94,0.12)"
              : undefined,
        }}
      />

      {showError && (
        <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />
      )}
      {showSuccess && (
        <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
      )}
    </div>
  );
}
