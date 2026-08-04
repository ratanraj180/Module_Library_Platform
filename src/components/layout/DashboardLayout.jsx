import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Upload,
  UploadCloud,
  User,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  BarChart3,
  Code,
  FileCode,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Avatar } from "../ui/index";

// ─── Navigation Config ─────────────────────────────────────────────────────────
const adminNav = [
  { icon: LayoutDashboard, label: "Overview",          path: "/dashboard/overview" },
  { icon: Package,         label: "Modules",           path: "/dashboard/modules" },
  { icon: CheckSquare,     label: "Module Reviews",    path: "/dashboard/reviews" },
  { icon: Code,            label: "Components",        path: "/dashboard/components" },
  { icon: FileCode,        label: "Component Reviews", path: "/dashboard/component-reviews" },
  { icon: UploadCloud,     label: "Publish Component", path: "/dashboard/publish-component" },
  { icon: Upload,          label: "Publish Module",    path: "/dashboard/publish" },
  { icon: BarChart3,       label: "Analytics",         path: "/dashboard/analytics" },
  { icon: User,            label: "Profile",           path: "/dashboard/profile" },
  { icon: Settings,        label: "Settings",          path: "/dashboard/settings" },
];

const developerNav = [
  { icon: LayoutDashboard, label: "Overview",          path: "/dashboard/overview" },
  { icon: Package,         label: "Modules",           path: "/dashboard/modules" },
  { icon: Upload,          label: "Publish Module",    path: "/dashboard/publish" },
  { icon: Code,            label: "Components",        path: "/dashboard/components" },
  { icon: UploadCloud,     label: "Publish Component", path: "/dashboard/publish-component" },
  { icon: BarChart3,       label: "Analytics",         path: "/dashboard/analytics" },
  { icon: User,            label: "Profile",           path: "/dashboard/profile" },
  { icon: Settings,        label: "Settings",          path: "/dashboard/settings" },
];

// ─── Logo ─────────────────────────────────────────────────────────────────────
function SidebarLogo() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-200">
      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#D4A017] to-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Package size={16} className="text-white" />
      </div>
      <div>
        <div className="text-sm font-bold text-[#111827] tracking-tight">ModuleLib</div>
        <div className="text-[10px] text-gray-500">Platform</div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────────────────────
function Sidebar({ open, onClose, role }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const navItems = role === "admin" ? adminNav : developerNav;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-56 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}
      >
        <SidebarLogo />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {navItems.map(({ icon: Icon, label, path }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150
                ${isActive
                  ? "bg-gray-100 text-[#111827] border-l-2 border-[#D4A017] pl-[10px]"
                  : "text-gray-500 hover:text-[#111827] hover:bg-gray-50"
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────
function TopBar({ onMenuClick, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Build breadcrumb from URL path
  const segments = location.pathname
    .replace("/dashboard/", "")
    .split("/")
    .filter(Boolean);
  const breadcrumb = ["Dashboard", ...segments.map((s) =>
    s.charAt(0).toUpperCase() + s.slice(1)
  )];

  let initials = "ML";
  try {
    if (user && user.name) {
      initials = user.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    } else if (user && user.email) {
      initials = user.email.slice(0, 2).toUpperCase();
    }
  } catch (e) {
    initials = "ML";
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-gray-200 bg-white flex-shrink-0 relative z-40">
      {/* Left: mobile menu + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden text-gray-500 hover:text-[#111827] transition-colors"
          onClick={onMenuClick}
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-1.5 text-[13px]">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={12} className="text-gray-400" />}
              <span className={i === breadcrumb.length - 1 ? "text-[#111827] font-medium" : "text-gray-500"}>
                {crumb}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Right: user info and dropdown trigger */}
      <div className="flex items-center gap-3 relative" ref={dropdownRef}>
        
        {/* Toggle Button Wrapping both Avatar and text */}
        <button
          onClick={() => setProfileOpen(p => !p)}
          className="flex items-center gap-3 text-left focus:outline-none hover:opacity-85 transition-opacity"
          aria-label="User menu"
        >
          <div className="hidden sm:block text-right">
            <div className="text-xs font-medium text-[#111827]">{user?.name || "User"}</div>
            <div className="text-[10px] text-gray-500 capitalize">{user?.role || "developer"}</div>
          </div>
          
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 hover:border-[#D4A017]/40 shadow-sm relative z-50">
            <Avatar initials={initials} size="sm" className="h-7 w-7 text-[11px] ring-1 ring-gold-500/10" />
          </div>
        </button>

        {/* Dropdown Menu block */}
        {profileOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-50 animate-scale-in text-left">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs font-bold text-[#111827] truncate">{user?.name || "User"}</p>
              <p className="text-[10px] text-gray-500 truncate mt-0.5">{user?.email}</p>
            </div>
            
            <div className="p-1 space-y-0.5">
              <Link
                to="/dashboard/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:text-[#111827] hover:bg-gray-50 rounded-lg transition-colors"
              >
                <User size={13} className="text-gray-400" />
                <span>View Profile</span>
              </Link>
              <Link
                to="/dashboard/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:text-[#111827] hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Settings size={13} className="text-gray-400" />
                <span>Settings</span>
              </Link>
            </div>

            <div className="border-t border-gray-100 p-1 mt-1">
              <button
                onClick={() => {
                  setProfileOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── DashboardLayout ──────────────────────────────────────────────────────────
import { Outlet, Navigate } from "react-router-dom";

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const token = localStorage.getItem("token");

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const role = (user.role || "").toLowerCase();
  if (role !== "developer" && role !== "admin" && role !== "administrator") {
    return <Navigate to="/access-denied" state={{ message: "You do not have permission to view the dashboard." }} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA] text-[#111827]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} role={role} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} user={user} />
        <main className="flex-1 overflow-y-auto p-5 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
