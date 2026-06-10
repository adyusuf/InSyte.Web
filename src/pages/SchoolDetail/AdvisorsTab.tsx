import { Users } from "lucide-react";
import type { SchoolTeacher } from "../../types";

type Props = {
  advisors: SchoolTeacher[] | undefined;
};

export function AdvisorsTab({ advisors }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
        <Users className="w-5 h-5 text-blue-600" />
        <h2 className="font-semibold text-gray-900">Danışmanlar ({advisors?.length || 0})</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {advisors?.map((a) => (
          <div key={a.id} className="px-6 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {a.firstName} {a.lastName}
              </p>
              <p className="text-xs text-gray-500">{a.email}</p>
            </div>
          </div>
        ))}
        {(!advisors || advisors.length === 0) && (
          <p className="px-6 py-4 text-sm text-gray-500">Danışman atanmamış</p>
        )}
      </div>
    </div>
  );
}
