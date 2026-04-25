import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  School,
  Users,
  FileVideo,
  FileText,
  Settings,
  UserCog,
  LogOut,
  Menu,
  X,
  Home,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { path: "/schools", label: "Okullar", icon: School, roles: ["Admin", "Advisor", "SchoolAdmin", "Teacher"] },
  { path: "/teachers", label: "Öğretmenler", icon: Users, roles: ["Admin", "Advisor", "SchoolAdmin", "Teacher"] },
  { path: "/videos", label: "Videolar", icon: FileVideo, roles: ["Admin", "Advisor", "SchoolAdmin", "Teacher"] },
  { path: "/reports", label: "Raporlar", icon: FileText, roles: ["Admin", "Advisor", "SchoolAdmin", "Teacher"] },
  { path: "/working-groups", label: "Çalışma Grupları", icon: Users, roles: ["Admin", "SchoolAdmin"] },
  { path: "/councils", label: "Kurullar", icon: Users, roles: ["Admin", "SchoolAdmin"] },
  { path: "/team", label: "Ekip", icon: UserCog, roles: ["Admin"] },
  { path: "/settings", label: "Tanimlar", icon: Settings, roles: ["Admin"] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(user?.role || "")
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 lg:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link to="/" className="text-xl font-bold text-blue-600">
            Insyte
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => {
              navigate("/profile");
              setSidebarOpen(false);
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-sm font-medium flex-shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cikis Yap
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1 rounded hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <Link
            to="/schools"
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Ana sayfa"
          >
            <Home className="w-5 h-5" />
            <span className="text-sm font-medium">Ana Sayfa</span>
          </Link>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
