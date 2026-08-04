import { useState } from "react";
import { Link } from "react-router-dom";
import { Terminal, Shield, Package, Key, Users, ArrowLeft, ExternalLink, Cpu } from "lucide-react";
import { Card, Badge, Separator } from "../../components/ui/index";

export function ApiReferencePage() {
  const [activeSection, setActiveSection] = useState("auth");

  const endpoints = {
    auth: [
      {
        method: "POST",
        path: "/api/auth/signup",
        desc: "Register a new platform user.",
        authRequired: false,
        reqBody: `{
  "name": "Jane Doe",
  "email": "jane@test.com",
  "password": "password123",
  "role": "developer" // optional: 'developer', 'admin'
}`,
        resBody: `{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d07e618e47f7344c8b4567",
    "name": "Jane Doe",
    "email": "jane@test.com",
    "role": "developer"
  }
}`
      },
      {
        method: "POST",
        path: "/api/auth/login",
        desc: "Authenticate user and receive a JWT token.",
        authRequired: false,
        reqBody: `{
  "email": "jane@test.com",
  "password": "password123"
}`,
        resBody: `{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d07e618e47f7344c8b4567",
    "name": "Jane Doe",
    "email": "jane@test.com",
    "role": "developer"
  }
}`
      },
      {
        method: "GET",
        path: "/api/auth/profile",
        desc: "Get profile data of the logged-in user.",
        authRequired: true,
        reqBody: "None",
        resBody: `{
  "user": {
    "id": "60d07e618e47f7344c8b4567",
    "name": "Jane Doe",
    "email": "jane@test.com",
    "role": "developer",
    "createdAt": "2026-06-19T08:35:46Z"
  }
}`
      }
    ],
    modules: [
      {
        method: "GET",
        path: "/api/modules",
        desc: "Retrieve all modules. Filterable by search, category, and status.",
        authRequired: true,
        reqBody: "Query parameters: ?search=auth&category=Utility&status=approved",
        resBody: `[
  {
    "_id": "60d07e618e47f7344c8b4588",
    "title": "Auth Core",
    "description": "Secure JWT auth hook and middleware",
    "category": "Utility",
    "technology": "React, Node.js",
    "repositoryUrl": "https://github.com/org/auth-core",
    "status": "approved",
    "downloads": 42,
    "owner": "60d07e618e47f7344c8b4567"
  }
]`
      },
      {
        method: "POST",
        path: "/api/modules",
        desc: "Create a new module. The creation is allowed for developers and admins. Supports multipart file uploads for package artifacts.",
        authRequired: true,
        reqBody: "Multipart Form Data: title, description, category, technology, repositoryUrl, and file (the zip package artifact)",
        resBody: `{
  "success": true,
  "module": {
    "_id": "60d07e618e47f7344c8b4588",
    "title": "Auth Core",
    "description": "Secure JWT auth hook",
    "category": "Utility",
    "technology": "React, Node.js",
    "repositoryUrl": "https://github.com/org/auth-core",
    "status": "submitted",
    "downloads": 0,
    "owner": "60d07e618e47f7344c8b4567"
  }
}`
      },
      {
        method: "GET",
        path: "/api/modules/:id",
        desc: "Get details of a single module by database ID.",
        authRequired: true,
        reqBody: "None",
        resBody: `{
  "_id": "60d07e618e47f7344c8b4588",
  "title": "Auth Core",
  "description": "Secure JWT auth hook",
  "category": "Utility",
  "technology": "React, Node.js",
  "repositoryUrl": "https://github.com/org/auth-core",
  "status": "approved",
  "downloads": 42,
  "owner": {
    "_id": "60d07e618e47f7344c8b4567",
    "name": "Jane Doe"
  }
}`
      },
      {
        method: "PATCH",
        path: "/api/modules/:id/submit",
        desc: "Submit a module draft for admin approval review.",
        authRequired: true,
        reqBody: "None",
        resBody: `{
  "message": "Module submitted successfully for review.",
  "status": "submitted"
}`
      },
      {
        method: "PATCH",
        path: "/api/modules/:id/approve",
        desc: "Approve a submitted module. Admin role only.",
        authRequired: true,
        reqBody: `{ "comment": "Verified dependency security audit" }`,
        resBody: `{
  "message": "Module approved and published to the active registry.",
  "status": "approved"
}`
      },
      {
        method: "PATCH",
        path: "/api/modules/:id/reject",
        desc: "Reject a submitted module. Admin role only.",
        authRequired: true,
        reqBody: `{ "comment": "GPL licensed dependencies are not allowed" }`,
        resBody: `{
  "message": "Module rejected.",
  "status": "rejected"
}`
      }
    ],
    versions: [
      {
        method: "POST",
        path: "/api/modules/:moduleId/versions",
        desc: "Add a new version release to an existing module.",
        authRequired: true,
        reqBody: `{
  "versionNumber": "1.1.0",
  "changelog": "Fix token expiration bug and optimize React hook render iterations",
  "repositoryUrl": "https://github.com/org/auth-core/releases/tag/v1.1.0"
}`,
        resBody: `{
  "success": true,
  "version": {
    "_id": "60d07e618e47f7344c8b4999",
    "module": "60d07e618e47f7344c8b4588",
    "versionNumber": "1.1.0",
    "changelog": "Fix token expiration bug...",
    "repositoryUrl": "https://github.com/org/auth-core/releases/tag/v1.1.0",
    "createdAt": "2026-06-19T08:40:00Z"
  }
}`
      },
      {
        method: "GET",
        path: "/api/modules/:moduleId/versions",
        desc: "Retrieve all version releases for a module.",
        authRequired: true,
        reqBody: "None",
        resBody: `[
  {
    "_id": "60d07e618e47f7344c8b4999",
    "versionNumber": "1.1.0",
    "changelog": "Fix token expiration bug...",
    "createdAt": "2026-06-19T08:40:00Z"
  }
]`
      }
    ]
  };

  const badgeColorMap = {
    GET: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    POST: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    PATCH: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    DELETE: "bg-red-50 text-red-700 ring-1 ring-red-200",
    PUT: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#4B5563] flex flex-col justify-between font-sans selection:bg-gold-500/30 selection:text-white">
      {/* Decorative grids */}
      <div className="absolute inset-0 bg-hero-grid bg-grid opacity-5 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu className="text-gold-500 h-5 w-5" />
            <span className="font-mono text-sm font-bold tracking-tight text-gray-900">
              ModuleLib <span className="text-gold-600">Docs</span>
            </span>
          </div>
          <Link
            to="/"
            onClick={() => console.log("Back to Home clicked from API Reference")}
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
          <Badge variant="primary" className="text-[10px] tracking-wider uppercase font-semibold bg-gold-500/10 text-gold-700 border border-gold-500/20">
            Technical Docs
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#111827]">
            API Reference
          </h1>
          <p className="text-sm text-[#4B5563] max-w-2xl leading-relaxed">
            Developer API integrations for querying scopes, version histories, download registries, and orchestrating deployment reviews.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Nav */}
          <aside className="w-full lg:w-60 flex-shrink-0">
            <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-4 space-y-1 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] px-3 mb-2">
                API Categories
              </div>
              <button
                onClick={() => { console.log("API Reference section -> Auth"); setActiveSection("auth"); }}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all duration-150 ${
                  activeSection === "auth"
                    ? "bg-gold-500/10 text-gold-700 border-l-2 border-gold-500"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Key size={14} />
                Authentication API
              </button>
              <button
                onClick={() => { console.log("API Reference section -> Modules"); setActiveSection("modules"); }}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all duration-150 ${
                  activeSection === "modules"
                    ? "bg-gold-500/10 text-gold-700 border-l-2 border-gold-500"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Package size={14} />
                Modules Core API
              </button>
              <button
                onClick={() => { console.log("API Reference section -> Versions"); setActiveSection("versions"); }}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all duration-150 ${
                  activeSection === "versions"
                    ? "bg-gold-500/10 text-gold-700 border-l-2 border-gold-500"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Terminal size={14} />
                Module Versions API
              </button>
            </div>
          </aside>

          {/* Endpoints Main list */}
          <section className="flex-1 space-y-8">
            <div className="border border-gray-200 bg-white p-6 rounded-2xl shadow-sm">
              <h2 className="text-xl font-bold capitalize text-[#1F2937] mb-1 flex items-center gap-2">
                {activeSection === "auth" && <Key className="text-gold-500" size={18} />}
                {activeSection === "modules" && <Package className="text-gold-500" size={18} />}
                {activeSection === "versions" && <Terminal className="text-gold-500" size={18} />}
                {activeSection} Endpoints
              </h2>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Endpoints listed below accept and produce JSON formats. Ensure the header `Content-Type: application/json` is present.
              </p>
            </div>

            <div className="space-y-6">
              {endpoints[activeSection].map((ep, idx) => (
                <Card key={idx} className="border border-gray-200 bg-white p-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 font-mono text-sm">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-sans uppercase ${badgeColorMap[ep.method]}`}>
                        {ep.method}
                      </span>
                      <span className="font-bold text-[#111827]">{ep.path}</span>
                    </div>
                    {ep.authRequired ? (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1 self-start">
                        <Shield size={10} /> JWT Bearer Token Required
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded self-start">
                        Public Access
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#4B5563] leading-relaxed">
                    {ep.desc}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Request payload example</label>
                      <pre className="text-[11px] font-mono p-3 bg-[#1e1e1e] rounded-xl border border-gray-300 text-gold-300 overflow-x-auto max-h-60 leading-normal shadow-inner">
                        {ep.reqBody}
                      </pre>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">Successful JSON response</label>
                      <pre className="text-[11px] font-mono p-3 bg-[#1e1e1e] rounded-xl border border-gray-300 text-emerald-400 overflow-x-auto max-h-60 leading-normal shadow-inner">
                        {ep.resBody}
                      </pre>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 bg-white text-center text-[10px] text-[#9CA3AF] relative z-10 mt-12">
        &copy; 2026 Module Library Platform. All rights reserved. Secure developer portal documentation.
      </footer>
    </div>
  );
}
