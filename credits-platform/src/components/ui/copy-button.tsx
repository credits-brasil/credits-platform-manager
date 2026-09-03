import { Check, Copy } from "lucide-react";
import { useState } from "react";

type CopyButtonProps = {
  value?: string;
  title: string;
  className?: string;
  iconSize?: number;
};

export function CopyButton({
  value,
  title,
  className = "text-gray-400 hover:text-[#243871] hover:cursor-pointer",
  iconSize = 14,
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={() => {
        void handleCopy();
      }}
      className={className}
      title={title}
      aria-label={title}
    >
      {isCopied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
    </button>
  );
}
