import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { ApiResponse } from "../types";
import { Edit2, Trash2 } from "lucide-react";
import { apiEndpoints } from "../lib/endpoints";
import BackButton from "../components/BackButton";
import SearchInput from "../components/SearchInput";
import { LABELS } from "../lib/constants";

interface EvaluationQuestion {
  id: string;
  question: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

interface CriteriaWithQuestions {
  id: string;
  name: string;
  description: string;
  instructions: string;
  subject: string;
  isActive: boolean;
  createdAt: string;
  questions: EvaluationQuestion[];
}

export default function QuestionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [expandedCriteria, setExpandedCriteria] = useState<string | null>(null);

  // Batch fetch: Single query instead of N+1
  const { data: groupedQuestions } = useQuery({
    queryKey: ["criteria-with-questions"],
    queryFn: () =>
      api
        .get<ApiResponse<{ items: CriteriaWithQuestions[] }>>(
          apiEndpoints.criteria.withQuestions()
        )
        .then((r) => r.data.data?.items || []),
  });

  const deleteQuestion = useMutation({
    mutationFn: (q: { criteriaId: string; id: string }) =>
      api.delete(apiEndpoints.questions.delete(q.criteriaId, q.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["criteria-with-questions"] });
    },
  });

  const filteredGroups = search
    ? groupedQuestions?.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.questions.some((q) =>
          q.question.toLowerCase().includes(search.toLowerCase())
        )
      ) || []
    : groupedQuestions || [];

  return (
    <div>
      <BackButton />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{LABELS.EVALUATION_QUESTIONS}</h1>
        <SearchInput value={search} onChange={setSearch} placeholder={LABELS.SEARCH} />
      </div>

      <div className="space-y-4">
        {filteredGroups.map((criteria) => (
          <div key={criteria.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() =>
                setExpandedCriteria(
                  expandedCriteria === criteria.id ? null : criteria.id
                )
              }
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{criteria.name}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {criteria.questions.length} soru
                </p>
              </div>
            </button>

            {expandedCriteria === criteria.id && (
              <div className="border-t border-gray-200 divide-y divide-gray-200">
                {criteria.questions.map((q, idx) => (
                  <div key={q.id} className="px-6 py-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {idx + 1}. {q.question}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {q.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            Sıra: {q.order}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            deleteQuestion.mutate({
                              criteriaId: criteria.id,
                              id: q.id,
                            })
                          }
                          disabled={deleteQuestion.isPending}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
