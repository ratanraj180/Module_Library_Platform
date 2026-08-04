import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Users,
  GitBranch,
  Shield,
  Settings,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Upload,
  CheckSquare,
  BookOpen,
  User,
  Code,
  FileCode,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";

export function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role === "Administrator" || user?.role?.toLowerCase() === "admin";

  const sections = isAdmin
    ? [
        {
          label: "PLATFORM",
          items: [
            { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
            { icon: Package, label: "Modules", path: "/dashboard/modules" },
            { icon: Code, label: "Components", path: "/dashboard/components" },
            { icon: Sparkles, label: "ModuleAI Assistant", path: "/dashboard/module-ai" },
            { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
          ],
        },
        {
          label: "MANAGEMENT",
          items: [
            { icon: Users, label: "Teams", path: "/dashboard/teams" },
            { icon: GitBranch, label: "Pipelines", path: "/dashboard/pipelines" },
            { icon: Shield, label: "Security", path: "/dashboard/security" },
          ],
        },
        {
          label: "DEVELOPMENT",
          items: [
            { icon: CheckSquare, label: "Module Reviews", path: "/dashboard/reviews" },
            { icon: FileCode, label: "Component Reviews", path: "/dashboard/component-reviews" },
            { icon: Upload, label: "Publish Component", path: "/dashboard/publish-component" },
          ],
        },
        {
          label: "ACCOUNT",
          items: [
            { icon: User, label: "Profile", path: "/dashboard/profile" },
            { icon: Settings, label: "Settings", path: "/dashboard/settings" },
          ],
        },
      ]
    : [
        {
          label: "PLATFORM",
          items: [
            { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
            { icon: Package, label: "Modules", path: "/dashboard/modules" },
            { icon: Code, label: "Components", path: "/dashboard/components" },
            { icon: Sparkles, label: "ModuleAI Assistant", path: "/dashboard/module-ai" },
            { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
          ],
        },
        {
          label: "DEVELOPMENT",
          items: [
            { icon: BookOpen, label: "Documentation", path: "/documentation" },
            { icon: Upload, label: "Publish Module", path: "/dashboard/publish" },
            { icon: Upload, label: "Publish Component", path: "/dashboard/publish-component" },
          ],
        },
        {
          label: "ACCOUNT",
          items: [
            { icon: User, label: "Profile", path: "/dashboard/profile" },
            { icon: Settings, label: "Settings", path: "/dashboard/settings" },
          ],
        },
      ];

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Workspace switcher */}
      <div
        className={cn(
          "flex items-center gap-2.5 border-b border-gray-200 px-3 py-3.5",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gold-500 to-gold-700 text-[11px] font-bold text-white">
          ML
        </div>
        {!collapsed && (
          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-gray-900 leading-tight">
                ModuleLib
              </span>
              <span className="text-[10px] text-gray-500 leading-tight">
                Enterprise
              </span>
            </div>
            <ChevronDown size={14} className="text-gray-400" />
          </div>
        )}
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 overflow-y-auto py-3 px-1.5 bg-white">
        {sections.map((section) => (
          <div key={section.label} className="mb-4">
            {!collapsed && (
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-3 mb-1 block">
                {section.label}
              </span>
            )}
            <ul className="mt-1 space-y-px">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => {
                      const isDashboardActive =
                        item.path === "/dashboard" &&
                        (location.pathname === "/dashboard" ||
                          location.pathname === "/dashboard/overview");
                      const active = isActive || isDashboardActive;
                      return cn(
                        "group flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-600 transition-all duration-150",
                        "hover:bg-gray-50 hover:text-gray-900",
                        active && "border-l-2 border-gold-500 text-gray-900 bg-gray-50",
                        !active && "border-l-2 border-transparent",
                        collapsed && "justify-center px-0"
                      );
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    {({ isActive }) => {
                      const isDashboardActive =
                        item.path === "/dashboard" &&
                        (location.pathname === "/dashboard" ||
                          location.pathname === "/dashboard/overview");
                      const active = isActive || isDashboardActive;
                      return (
                        <>
                          <item.icon
                            size={16}
                            className={cn(
                              "flex-shrink-0 transition-colors",
                              active
                                ? "text-gold-500"
                                : "text-gray-450 group-hover:text-gray-900"
                            )}
                          />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </>
                      );
                    }}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom section (Collapse only) */}
      <div className="border-t border-gray-200 py-2 px-1.5 bg-white">
        <button
          onClick={onToggle}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-600 transition-all duration-150 hover:bg-gray-50 hover:text-gray-900",
            collapsed && "justify-center px-0"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
