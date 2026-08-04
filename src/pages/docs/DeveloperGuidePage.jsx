import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Terminal, Database, Server, FolderTree, AlertTriangle } from "lucide-react";
import { Card, Badge, Separator } from "../../components/ui/index";

export function DeveloperGuidePage() {
  const structure = [
    { name: "module-library/", type: "root", desc: "Monorepo workspace containing client and backend server codebases." },
    { name: "  server/", type: "dir", desc: "Express / Node.js backend server code." },
    { name: "    src/", type: "dir", desc: "Main source directory for controllers, routing, middleware, and schemas." },
    { name: "      controllers/", type: "dir", desc: "Database query logic for modules, versions, users, and reviews." },
    { name: "      models/", type: "dir", desc: "Mongoose database schemas (User, Module, Version, Review)." },
    { name: "      routes/", type: "dir", desc: "Express router endpoint maps." },
    { name: "      middleware/", type: "dir", desc: "Auth guards and role validations." },
    { name: "    .env.example", type: "file", desc: "Sample environment keys configuration." },
    { name: "  src/", type: "dir", desc: "React / Vite frontend application." },
    { name: "    components/", type: "dir", desc: "Shared layout containers (Sidebar, TopBar) and Radix UI elements." },
    { name: "    pages/", type: "dir", desc: "Dashboard interfaces and public view routing templates." },
    { name: "    App.jsx", type: "file", desc: "Frontend React router configuration." }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#4B5563] flex flex-col justify-between font-sans selection:bg-gold-500/30 selection:text-white">
      <div className="absolute inset-0 bg-hero-grid bg-grid opacity-5 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="text-gold-500 h-5 w-5" />
            <span className="font-mono text-sm font-bold tracking-tight text-gray-900">
              ModuleLib <span className="text-gold-600">Docs</span>
            </span>
          </div>
          <Link
            to="/"
            onClick={() => console.log("Back to Home clicked from Developer Guide")}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#4B5563] hover:text-gold-600 transition-colors py-2 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 shadow-sm"
          >
            <ArrowLeft size={13} className="text-[#4B5563]" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-8 border-b border-gray-200 w-full">
        <div className="space-y-4">
          <Badge variant="cyan" className="text-[10px] tracking-wider uppercase font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            Setup Guide
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#111827]">
            Developer Guide
          </h1>
          <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
            Configure local systems, initialize development databases, set environment files, and start up Vite server routes.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-12">
        {/* Step-by-Step setup */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Setup commands */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
              <Terminal className="text-gold-500" size={16} /> 1. Package Installation & Startup
            </h2>
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="text-[#4B5563] font-semibold">Step 1: Install workspace dependencies</label>
                <p className="text-[11px] text-[#6B7280]">Run npm install inside the project root folder to install frontend client dependencies. Then do the same for the backend server directory.</p>
                <pre className="rounded-lg border border-gray-300 bg-[#1e1e1e] p-3 font-mono text-[11px] text-gold-300 overflow-x-auto leading-normal shadow-inner">
                  # In project root folder<br />
                  npm install<br /><br />
                  # Navigate to server directory and install backend packages<br />
                  cd server<br />
                  npm install
                </pre>
              </div>

              <div className="space-y-2">
                <label className="text-[#4B5563] font-semibold">Step 2: Run frontend and backend servers</label>
                <p className="text-[11px] text-[#6B7280]">Run the vite hot-reloading development server on the frontend workspace, and node server in the backend workspace.</p>
                <pre className="rounded-lg border border-gray-300 bg-[#1e1e1e] p-3 font-mono text-[11px] text-gold-300 overflow-x-auto leading-normal shadow-inner">
                  # To run frontend client (listens on localhost:5173)<br />
                  # (In project root directory)<br />
                  npm run dev<br /><br />
                  # To run Express server (listens on localhost:5000)<br />
                  # (In server directory)<br />
                  npm run dev
                </pre>
              </div>
            </div>
          </div>

          {/* Database & Config */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
              <Database className="text-gold-500" size={16} /> 2. Database & Environment Variables
            </h2>
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="text-[#4B5563] font-semibold">MongoDB Database Setup</label>
                <p className="text-[11px] text-[#6B7280]">Ensure MongoDB daemon is running locally on port `27017` or obtain a remote MongoDB Atlas connection URI string. The application will automatically create the database `module_library` upon initial connection.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[#4B5563] font-semibold">Server Environment Keys (`server/.env`)</label>
                <p className="text-[11px] text-[#6B7280]">Create a `.env` file in the `server` directory and copy the contents from `.env.example`. Modify details as required:</p>
                <div className="border border-gray-200 bg-white rounded-lg overflow-hidden font-mono text-[10px] shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-[#4B5563] font-semibold">
                        <th className="p-2">Key Name</th>
                        <th className="p-2">Default value</th>
                        <th className="p-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[#4B5563]">
                      <tr>
                        <td className="p-2 text-[#111827] font-bold">PORT</td>
                        <td className="p-2">5000</td>
                        <td className="p-2">Backend server listening port.</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-[#111827] font-bold">NODE_ENV</td>
                        <td className="p-2">development</td>
                        <td className="p-2">Environment setting.</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-[#111827] font-bold">MONGO_URI</td>
                        <td className="p-2 text-[9px]">mongodb://localhost:27017/module_library</td>
                        <td className="p-2">Database connection string.</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-[#111827] font-bold">JWT_SECRET</td>
                        <td className="p-2">replace-with-a-...</td>
                        <td className="p-2">Key for signing JWT auth tokens.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator className="opacity-40" />

        {/* Directory Structure */}
        <section className="space-y-6">
          <h2 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
            <FolderTree className="text-gold-500" size={16} /> 3. Codebase Directory Structure
          </h2>
          <div className="border border-gray-200 bg-white rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[#4B5563] font-semibold">
                  <th className="p-3">Path Segment</th>
                  <th className="p-3">Component Type</th>
                  <th className="p-3">Functional Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[#4B5563]">
                {structure.map((item) => (
                  <tr key={item.name} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 font-mono text-[#111827] font-bold whitespace-pre">{item.name}</td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-semibold">
                        {item.type}
                      </Badge>
                    </td>
                    <td className="p-3 leading-normal text-[#4B5563]">{item.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Architecture Summary */}
        <section className="border border-gray-200 bg-white rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
            <Server className="text-gold-500" size={18} /> Monorepo Architectural Setup
          </h2>
          <p className="text-xs text-[#4B5563] leading-relaxed max-w-4xl">
            The workspace consists of a React client application created with Vite, compiling code into standard ES bundles. The backend API is constructed on Express routing parameters, establishing connections using mongoose database interfaces. Requests execute CORS configurations and verify sessions via JSON Web Token bearer parameters.
          </p>
          <div className="flex items-center gap-2 text-[10px] text-gold-600 bg-gold-500/5 border border-gold-500/10 p-3 rounded-lg max-w-2xl">
            <AlertTriangle size={14} className="flex-shrink-0 text-gold-500" />
            <span className="text-[#4B5563]">Note: Local setups require node runtime versions matching v18.0.0 or higher. Dev processes utilize automatic reload modules.</span>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 bg-white text-center text-[10px] text-[#9CA3AF] relative z-10">
        &copy; 2026 ModuleLib Documentation. All rights reserved. Secure developer portal guide.
      </footer>
    </div>
  );
}
