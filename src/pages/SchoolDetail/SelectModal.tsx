import { X } from "lucide-react";

type Props = {
  title: string;
  labels: Record<string, string>;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  pending: boolean;
};

export function SelectModal({ title, labels, value, onChange, onSubmit, onClose, pending }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Seçiniz</option>
          {Object.keys(labels).map((key) => (
            <option key={key} value={key}>
              {labels[key]}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={onSubmit}
            disabled={!value || pending}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {pending ? "Ekleniyor..." : "Ekle"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}
