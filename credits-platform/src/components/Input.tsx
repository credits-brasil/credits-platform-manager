import { AlertCircle, CheckCircle2 } from "lucide-react";

type InputComponentProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  showError?: boolean;
  showSuccess?: boolean;
  className?: string;
};

export function InputComponent({
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  disabled,
  required,
  showError = false,
  showSuccess = false,
  className,
}: InputComponentProps) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        required={required}
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
        <AlertCircle
          size={15}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none"
        />
      )}

      {showSuccess && (
        <CheckCircle2
          size={15}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none"
        />
      )}
    </div>
  );
}