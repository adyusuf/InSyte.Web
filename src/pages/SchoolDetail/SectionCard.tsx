import { Plus, Trash2 } from "lucide-react";

type Props = {
  title: string;
  addTitle: string;
  onAdd: () => void;
  emptyText: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  gridLayout?: boolean;
};

export function SectionCard({ title, addTitle, onAdd, emptyText, children, fullWidth, gridLayout }: Props) {
  const items = Array.isArray(children) ? children : [children];
  const isEmpty = items.filter(Boolean).length === 0;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${fullWidth ? "lg:col-span-2" : ""}`}>
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <button
          onClick={onAdd}
          className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
          title={addTitle}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {isEmpty ? (
          <p className="px-6 py-4 text-sm text-gray-500">{emptyText}</p>
        ) : gridLayout ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">{children}</div>
        ) : (
          <div className="divide-y divide-gray-200">{children}</div>
        )}
      </div>
    </div>
  );
}

type ListRowProps = {
  label: string;
  onRemove: () => void;
  disabled: boolean;
  compact?: boolean;
};

export function ListRow({ label, onRemove, disabled, compact }: ListRowProps) {
  const className = compact
    ? "px-4 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg"
    : "px-6 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors";

  return (
    <div className={className}>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <button
        onClick={onRemove}
        disabled={disabled}
        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
