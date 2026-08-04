import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "../ui/index";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] p-6 text-white">
          <div className="relative w-full max-w-lg rounded-2xl border border-red-500/20 bg-[#121212] p-8 shadow-2xl">
            {/* Warning Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-6">
              <AlertTriangle size={32} />
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-center text-foreground tracking-tight">
              Application Render Crash
            </h1>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              An unexpected runtime error occurred within this view.
            </p>

            {/* Error Message Panel */}
            <div className="mt-6 rounded-lg bg-black/40 border border-white/[0.04] p-4 font-mono text-xs text-red-300 overflow-x-auto max-h-48 whitespace-pre-wrap">
              <strong>Error:</strong> {this.state.error?.toString() || "Unknown Error"}
              {this.state.errorInfo?.componentStack && (
                <div className="mt-3 text-muted-foreground/60 leading-relaxed text-[10px]">
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <Button
                onClick={this.handleReset}
                variant="primary"
                size="sm"
                className="gap-2 h-10 px-6 font-bold shadow-[0_2px_10px_rgba(212,166,79,0.15)]"
              >
                <RefreshCw size={14} />
                Reset & Return Home
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
                size="sm"
                className="h-10 px-6"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
