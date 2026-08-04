import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Layers, Cpu, Code2, ArrowRight, ArrowLeft, RefreshCw, AlertTriangle, Copy, Check, Download, ExternalLink, Library } from "lucide-react";
import { Separator } from "../components/ui/index";
import { api } from "../lib/api";

export function ComponentsPage() {
  const navigate = useNavigate();
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all"); // 'all' | 'ui' | 'backend'
  const [copiedId, setCopiedId] = useState(null);

  // Fetch approved components from backend
  const fetchComponents = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/api/components?status=approved&limit=100");
      setComponents(data?.modules || []);
    } catch (err) {
      setError(err.message || "Failed to load components from registry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  // Filter components based on search and category tab
  const filteredComponents = useMemo(() => {
    return components.filter((item) => {
      const isUI = item.category === "UI Components";
      const isBackend = item.category === "Backend Components";

      let matchesCategory = true;
      if (categoryFilter === "ui") matchesCategory = isUI;
      else if (categoryFilter === "backend") matchesCategory = isBackend;

      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())));

      return matchesCategory && matchesSearch;
    });
  }, [components, searchQuery, categoryFilter]);

  // Statistics calculations
  const stats = useMemo(() => {
    const total = components.length;
    const uiCount = components.filter(c => c.category === "UI Components").length;
    const backendCount = components.filter(c => c.category === "Backend Components").length;
    
    // Simulate total downloads based on fake items and mock values
    const downloadsCount = components.reduce((acc, c) => acc + (c.downloadsCount || 12), 0);

    return { total, uiCount, backendCount, downloadsCount };
  }, [components]);

  // Action helpers
  const handleCopyCode = (e, item) => {
    e.stopPropagation();
    e.preventDefault();
    const code = item.frontendCode || item.backendCode || "// Code spec snippet";
    navigator.clipboard.writeText(code);
    setCopiedId(item._id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadCode = async (e, item) => {
    e.stopPropagation();
    e.preventDefault();
    const code = item.frontendCode || item.backendCode || "// Code spec snippet";
    const extension = item.category === "UI Components" ? "jsx" : "js";
    const filename = `${item.title.toLowerCase().replace(/\s+/g, "-")}.${extension}`;

    try {
      await api.get(`/api/components/${item._id}/download`);
    } catch (err) {
      console.error("Failed to register download count:", err);
    }

    const blob = new Blob([code], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Increment local state download count
    setComponents(prev => prev.map(c => c._id === item._id ? { ...c, downloadsCount: (c.downloadsCount || 12) + 1 } : c));
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111827] flex flex-col justify-between font-sans selection:bg-[#3b82f6]/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Code2 size={16} className="text-white" />
            </div>
            <span className="font-mono text-sm font-bold tracking-tight text-[#111827]">
              ModuleLib <span className="text-blue-600">Registry</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors py-2 px-3 rounded-lg border border-gray-200 bg-white shadow-sm"
            >
              <ArrowLeft size={13} />
              Back to Home
            </Link>
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 text-xs rounded-lg font-bold transition-all shadow-sm"
            >
              Console Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Intro */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8 border-b border-gray-200 w-full bg-white rounded-b-2xl shadow-sm">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 uppercase tracking-wider border border-blue-100">
            shadcn Component Registry
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#111827] leading-none">
            Reusable Code Blocks <br />
            <span className="text-blue-600">Copy. Paste. Compile.</span>
          </h1>
          <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
            Beautifully designed UI elements styled with Tailwind CSS and pre-configured backend connection layers. Clean code blocks to easily build clean enterprise software architectures.
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100 mt-6">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
              <div className="text-[10px] uppercase font-bold text-gray-400">Total Components</div>
              <div className="text-xl font-bold text-gray-900 mt-0.5">{stats.total}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
              <div className="text-[10px] uppercase font-bold text-blue-500">UI Components</div>
              <div className="text-xl font-bold text-blue-600 mt-0.5">{stats.uiCount}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
              <div className="text-[10px] uppercase font-bold text-indigo-500">Backend Components</div>
              <div className="text-xl font-bold text-indigo-600 mt-0.5">{stats.backendCount}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
              <div className="text-[10px] uppercase font-bold text-emerald-500">Total Downloads</div>
              <div className="text-xl font-bold text-emerald-600 mt-0.5">{stats.downloadsCount}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search controls */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-8">
        
        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertTriangle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 p-1 rounded-lg w-full md:w-auto">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`flex-1 md:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                categoryFilter === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-blue-600"
              }`}
            >
              All Registry
            </button>
            <button
              onClick={() => setCategoryFilter("ui")}
              className={`flex-1 md:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                categoryFilter === "ui"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-blue-600"
              }`}
            >
              <Layers size={12} />
              UI Components
            </button>
            <button
              onClick={() => setCategoryFilter("backend")}
              className={`flex-1 md:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                categoryFilter === "backend"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-blue-600"
              }`}
            >
              <Cpu size={12} />
              Backend Components
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search components or tags..."
              className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs text-[#111827] focus:outline-none focus:border-blue-500 placeholder-gray-400 transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Found {filteredComponents.length} registry components</span>
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-blue-600 hover:underline">
              Clear search
            </button>
          )}
        </div>

        {/* Catalog Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw size={24} className="animate-spin text-blue-600" />
            <span className="ml-3 text-sm text-gray-500 font-semibold">Querying registry...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComponents.map((item) => (
              <div
                key={item._id}
                className="border border-gray-200 bg-white p-5 flex flex-col justify-between h-72 rounded-xl hover:scale-[1.01] hover:shadow-md transition-all duration-300 group"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      item.category === "UI Components"
                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                        : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                    }`}>
                      {item.category === "UI Components" ? "UI Component" : "Backend Component"}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">{item.technology || "React"}</span>
                  </div>

                  {/* Component Preview Block (Placeholders matching shadcn) */}
                  <div className="h-16 bg-gray-50 rounded-lg border border-gray-150 flex items-center justify-center text-[10px] text-gray-400 font-semibold group-hover:bg-blue-50/20 group-hover:border-blue-200 transition-all duration-300 shadow-inner">
                    <Library size={12} className="mr-1 text-gray-300 group-hover:text-blue-400" />
                    <span>{item.category === "UI Components" ? "Visual Component Mockup" : "Logic Flow Endpoint"}</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#111827] group-hover:text-blue-600 transition-colors duration-200 truncate">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-1 leading-normal line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Separator />

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/components/${item._id}`}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-0.5"
                    >
                      View Details
                      <ExternalLink size={10} />
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleCopyCode(e, item)}
                        className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-all"
                        title="Copy Code"
                      >
                        {copiedId === item._id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                      </button>
                      <button
                        onClick={(e) => handleDownloadCode(e, item)}
                        className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-all"
                        title="Download Component"
                      >
                        <Download size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredComponents.length === 0 && (
              <div className="col-span-full border border-dashed border-gray-200 p-12 text-center rounded-2xl space-y-2 bg-white shadow-sm">
                <div className="text-sm font-semibold text-gray-500">No registry matches found</div>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">Try typing another query or clearing category tabs.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 bg-white text-center text-[10px] text-gray-400 relative z-10">
        &copy; 2026 Module Library Platform. All rights reserved. Secure developer portal documentation.
      </footer>
    </div>
  );
}
