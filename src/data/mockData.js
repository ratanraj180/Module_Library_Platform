// ─── Mock Data for Module Library Platform ────────────────────────────────────

export const mockStats = [
  { label: "Total Modules", value: "1,284", change: "+12%", trend: "up" },
  { label: "Downloads This Month", value: "58,432", change: "+8%", trend: "up" },
  { label: "Active Contributors", value: "247", change: "+3%", trend: "up" },
  { label: "Issues Resolved", value: "98.7%", change: "+0.5%", trend: "up" },
];

export const landingStats = [
  { label: "Open Source Modules", value: "1,000+", icon: "Package" },
  { label: "Monthly Downloads", value: "50K+", icon: "Download" },
  { label: "Contributors", value: "200+", icon: "Users" },
  { label: "Uptime SLA", value: "99.9%", icon: "Shield" },
];

export const features = [
  {
    id: 1,
    icon: "Package",
    title: "Modular Architecture",
    description:
      "Compose complex applications from small, reusable, well-tested modules. Build faster with enterprise-grade building blocks.",
  },
  {
    id: 2,
    icon: "GitBranch",
    title: "Version Control",
    description:
      "Semantic versioning out of the box. Track changes, roll back safely, and maintain full audit history.",
  },
  {
    id: 3,
    icon: "Shield",
    title: "Security Scanning",
    description:
      "Automated vulnerability scanning for every module. Stay ahead of CVEs with real-time alerts and automated patches.",
  },
  {
    id: 4,
    icon: "Zap",
    title: "Instant Publishing",
    description:
      "Publish modules to the registry in seconds. CI/CD integrations with GitHub, GitLab, and Bitbucket included.",
  },
  {
    id: 5,
    icon: "Users",
    title: "Team Collaboration",
    description:
      "Manage permissions, review contributions, and collaborate across teams with fine-grained access controls.",
  },
  {
    id: 6,
    icon: "BarChart3",
    title: "Analytics & Insights",
    description:
      "Deep usage analytics, download trends, and dependency graphs give your team full visibility.",
  },
];

export const recentModules = [
  {
    id: 1,
    name: "auth-core",
    version: "2.3.1",
    category: "Authentication",
    downloads: "12,450",
    status: "stable",
    author: "system",
    updatedAt: "2 hours ago",
  },
  {
    id: 2,
    name: "ui-components",
    version: "5.1.0",
    category: "UI",
    downloads: "8,920",
    status: "stable",
    author: "design-team",
    updatedAt: "5 hours ago",
  },
  {
    id: 3,
    name: "data-fetcher",
    version: "1.0.4",
    category: "Utilities",
    downloads: "4,310",
    status: "beta",
    author: "backend-team",
    updatedAt: "1 day ago",
  },
  {
    id: 4,
    name: "logger-pro",
    version: "3.0.0",
    category: "DevOps",
    downloads: "6,780",
    status: "stable",
    author: "devops",
    updatedAt: "2 days ago",
  },
  {
    id: 5,
    name: "form-validator",
    version: "1.2.0",
    category: "Utilities",
    downloads: "3,200",
    status: "deprecated",
    author: "frontend-team",
    updatedAt: "1 week ago",
  },
];

export const notifications = [
  {
    id: 1,
    type: "success",
    title: "Module Published",
    message: "auth-core v2.3.1 was published successfully.",
    time: "2 min ago",
    read: false,
  },
  {
    id: 2,
    type: "warning",
    title: "Security Alert",
    message: "Vulnerability CVE-2024-1234 found in lodash@4.17.0.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    type: "info",
    title: "New Contributor",
    message: "sarah_dev joined the ui-components team.",
    time: "3 hours ago",
    read: true,
  },
  {
    id: 4,
    type: "info",
    title: "Build Completed",
    message: "Pipeline #482 completed in 1m 23s.",
    time: "5 hours ago",
    read: true,
  },
];

export const sidebarNavItems = [
  { icon: "LayoutDashboard", label: "Overview", path: "/dashboard", end: true },
  { icon: "Package", label: "Modules", path: "/dashboard/modules" },
  { icon: "BarChart3", label: "Analytics", path: "/dashboard/analytics" },
  { icon: "Users", label: "Teams", path: "/dashboard/teams" },
  { icon: "GitBranch", label: "Pipelines", path: "/dashboard/pipelines" },
  { icon: "Shield", label: "Security", path: "/dashboard/security" },
  { icon: "Settings", label: "Settings", path: "/dashboard/settings" },
];

export const mockUser = {
  name: "Algo Helper",
  email: "algo@modulelib.dev",
  role: "Platform Admin",
  avatar: null,
  initials: "AH",
};
