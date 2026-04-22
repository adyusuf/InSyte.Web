import { useNavigate } from "react-router-dom";
import { Cpu, BookOpen, HelpCircle, ArrowRight } from "lucide-react";

export default function SettingsPage() {
  const navigate = useNavigate();

  const cards = [
    {
      id: "ai",
      icon: Cpu,
      title: "AI Tanımaları",
      description: "AI sağlayıcılarını ve modellerini yönet",
      color: "blue",
      onClick: () => navigate("/settings/ai"),
    },
    {
      id: "criteria",
      icon: BookOpen,
      title: "Değerlendirme Kriterleri",
      description: "Ders değerlendirme kriterlerini yönet",
      color: "green",
      onClick: () => navigate("/settings/criteria"),
    },
    {
      id: "questions",
      icon: HelpCircle,
      title: "Değerlendirme Soruları",
      description: "Kriterlere ait soruları yönet",
      color: "purple",
      onClick: () => navigate("/settings/questions"),
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    green: "bg-green-50 border-green-200 hover:bg-green-100",
    purple: "bg-purple-50 border-purple-200 hover:bg-purple-100",
  };

  const iconColors = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tanımlar</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={card.onClick}
              className={`p-6 rounded-xl border-2 transition-all text-left ${colorClasses[card.color as keyof typeof colorClasses]}`}
            >
              <div className="flex items-start justify-between mb-3">
                <Icon className={`w-8 h-8 ${iconColors[card.color as keyof typeof iconColors]}`} />
                <ArrowRight className={`w-5 h-5 ${iconColors[card.color as keyof typeof iconColors]} opacity-0 group-hover:opacity-100`} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h2>
              <p className="text-sm text-gray-600">{card.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
