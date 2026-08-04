import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export function AccessDeniedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message || "You do not have permission to view this enterprise asset.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] text-[#111827] px-4 font-sans">
      <div className="max-w-md w-full text-center space-y-6 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-200">
            <ShieldAlert size={28} />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-xl font-bold">Access Denied</h1>
          <p className="text-xs text-gray-500 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-black font-semibold transition-all"
          >
            <ArrowLeft size={13} /> Go Back
          </button>
          
          <Link
            to="/"
            className="w-full text-center text-xs text-[#D4A017] hover:underline font-medium"
          >
            Return to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
