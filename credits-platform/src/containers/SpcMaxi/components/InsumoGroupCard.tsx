import { useState } from "react";
import { Info, X } from "lucide-react";
import { FilterCheckboxComponent } from "@/components";
import type { InsumoGroup } from "@/constants/insumo-groups";

type InsumoGroupCardProps = {
  group: InsumoGroup;
  selected: Set<string>;
  onToggleInsumo: (id: string) => void;
};

export function InsumoGroupCard({
  group,
  selected,
  onToggleInsumo,
}: InsumoGroupCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const Icon = group.icon;

  return (
    <>
      <div className="h-full rounded-xl border border-gray-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={15} className="text-gray-500" />

            <span className="text-sm font-semibold text-gray-700">{group.title}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-gray-300 hover:text-gray-500 transition-colors"
          >
            <Info size={15} />
          </button>
        </div>

        <hr className="mb-2 border-gray-100" />

        <div className="space-y-2">
          {group.items.map((item) => {
            const checked = selected.has(item.id);

            return (
              <FilterCheckboxComponent
                key={item.id}
                checked={checked}
                onChange={() => onToggleInsumo(item.id)}
                label={item.label}
              />
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Icon size={16} className="text-gray-500" />
                <span className="text-sm font-semibold text-gray-800">{group.title}</span>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-3">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <p className="text-sm font-medium text-gray-700">{item.label}</p>
                  <p className="mt-1 text-xs text-gray-400 italic">Conteúdo a definir.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}