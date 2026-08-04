import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, CheckCircle, XCircle, ArrowUpRight, Shield, RefreshCw, AlertTriangle, Eye } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import { Badge, Card, Separator } from "../../components/ui/index";

export function ComponentReviewsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState("pending"); // 'pending' | 'approved' | 'rejected'
  
  const [pendingQueue, setPendingQueue] = useState([]);
  const [approvedList, setApprovedList] = useState([]);
  const [rejectedList, setRejectedList] = useState([]);
  const [securityReports, setSecurityReports] = useState({});
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState(null); // ID of component being approved/rejected
  const [rejectComment, setRejectComment] = useState("");
  const [rejectTargetId, setRejectTargetId] = useState(null);

  const fetchReviewsData = async () => {
    setLoading(true);
    setError("");
    try {
      const [pendingData, approvedData, rejectedData] = await Promise.all([
        api.get("/api/components?status=submitted&limit=100"),
        api.get("/api/components?status=approved&limit=100"),
        api.get("/api/components?status=rejected&limit=100"),
      ]);
      
      const pList = pendingData?.modules || [];
      const aList = approvedData?.modules || [];
      const rList = rejectedData?.modules || [];
      setPendingQueue(pList);
      setApprovedList(aList);
      setRejectedList(rList);

      const allList = [...pList, ...aList, ...rList];
      if (allList.length > 0) {
        const reports = await Promise.all(
          allList.map(async (comp) => {
            try {
              const repRes = await api.get(`/api/security/report/component/${comp._id}`);
              return { componentId: comp._id, report: repRes.report };
            } catch (e) {
              return { componentId: comp._id, report: null };
            }
          })
        );
        const secMap = {};
        reports.forEach(r => {
          if (r.report) {
            secMap[r.componentId] = r.report;
          }
        });
        setSecurityReports(secMap);
      }
    } catch (err) {
      setError(err.message || "Failed to retrieve reviews registry data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewsData();
  }, []);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await api.patch(`/api/components/${id}/approve`, { comment: "Approved by administrator" });
      await fetchReviewsData();
    } catch (err) {
      setError(err.message || "Failed to approve component.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectComment.trim()) {
      setError("A feedback comment is required to reject a component.");
      return;
    }
    setActionLoading(rejectTargetId);
    try {
      await api.patch(`/api/components/${rejectTargetId}/reject`, { comment: rejectComment });
      setRejectTargetId(null);
      setRejectComment("");
      await fetchReviewsData();
    } catch (err) {
      setError(err.message || "Failed to reject component.");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <AlertTriangle size={32} className="text-amber-500" />
        <h2 className="text-lg font-bold text-gray-900">Access Forbidden</h2>
        <p className="text-xs text-gray-500">Only system administrators have access to the component reviews dashboard.</p>
      </div>
    );
  }

  const currentList = 
    activeTab === "pending" 
      ? pendingQueue 
      : activeTab === "approved" 
      ? approvedList 
      : rejectedList;

  return (
    <div className="space-y-6 max-w-6xl mx-auto bg-[#FAFAFA] min-h-screen p-6 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Component Review Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Audit, approve, or reject reusable frontend and backend component submissions.
          </p>
        </div>
        <button
          onClick={fetchReviewsData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all disabled:opacity-40 shadow-sm"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh Registry
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 border border-gray-200 p-1 rounded-lg w-full sm:w-auto self-start inline-flex">
        <button
          onClick={() => { setActiveTab("pending"); setRejectTargetId(null); }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeTab === "pending" ? "bg-white text-gray-900 shadow-sm font-bold" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Pending Components ({pendingQueue.length})
        </button>
        <button
          onClick={() => { setActiveTab("approved"); setRejectTargetId(null); }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeTab === "approved" ? "bg-white text-gray-900 shadow-sm font-bold" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Approved ({approvedList.length})
        </button>
        <button
          onClick={() => { setActiveTab("rejected"); setRejectTargetId(null); }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeTab === "rejected" ? "bg-white text-gray-900 shadow-sm font-bold" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Rejected ({rejectedList.length})
        </button>
      </div>

      {/* Main Review Card list */}
      <Card className="border-gray-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-10 text-center bg-white">
            <RefreshCw size={20} className="animate-spin text-[#D4A017] mx-auto mb-2" />
            <span className="text-xs text-gray-500">Syncing dashboard...</span>
          </div>
        ) : currentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 bg-white">
            <CheckCircle size={32} className="mb-2 text-emerald-500 opacity-60" />
            <p className="text-sm font-semibold text-gray-900">No components found</p>
            <p className="text-xs mt-1">There are no component records in the "{activeTab}" state.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-700 font-semibold">
                  <th className="p-4">Component Name</th>
                  <th className="p-4">Publisher</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Submission Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Security</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-gray-700 bg-white">
                {currentList.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    {/* Component Name */}
                    <td className="p-4 font-semibold text-gray-900 text-base">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
                        <span>{item.title}</span>
                      </div>
                    </td>
                    {/* Publisher */}
                    <td className="p-4 text-gray-700">
                      {item.owner?.name || "System"}
                      <span className="block text-[10px] text-gray-500">{item.owner?.email || ""}</span>
                    </td>
                    {/* Category */}
                    <td className="p-4">
                      <Badge variant={item.category === "UI Components" ? "violet" : "cyan"}>
                        {item.category}
                      </Badge>
                    </td>
                    {/* Submission Date */}
                    <td className="p-4 text-gray-600">
                      {new Date(item.createdAt).toLocaleDateString()}
                      <span className="block text-[10px] text-gray-500">{new Date(item.createdAt).toLocaleTimeString()}</span>
                    </td>
                    {/* Status */}
                    <td className="p-4">
                      <Badge variant={item.status === "approved" ? "stable" : item.status === "rejected" ? "deprecated" : "beta"}>
                        {item.status}
                      </Badge>
                    </td>
                    {/* Security */}
                    <td className="p-4">
                      {(() => {
                        const rep = securityReports[item._id];
                        if (!rep) return <span className="text-[10px] text-gray-400 font-mono">NO REPORT</span>;
                        if (rep.scanStatus === 'pending' || rep.scanStatus === 'running') {
                          return <span className="text-[10px] text-yellow-600 font-mono bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200 animate-pulse font-semibold">SCANNING</span>;
                        }
                        if (rep.scanStatus === 'failed') {
                          return <span className="text-[10px] text-red-650 font-mono bg-red-50 px-2 py-0.5 rounded border border-red-200">FAILED</span>;
                        }
                        if (rep.malwareResult?.detected) {
                          return <span className="text-[10px] text-red-700 font-mono bg-red-100 px-2 py-0.5 rounded border border-red-300 font-bold">🚨 INFECTED</span>;
                        }
                        return (
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                            rep.riskScore < 80 
                              ? "bg-red-50 text-red-650 border-red-255"
                              : "bg-emerald-50 text-emerald-650 border-emerald-255"
                          }`}>
                            SCORE: {rep.riskScore}
                          </span>
                        );
                      })()}
                    </td>
                    {/* Actions */}
                    <td className="p-4 text-right">
                      {rejectTargetId === item._id ? (
                        <div className="inline-flex items-center gap-2">
                          <input
                            type="text"
                            value={rejectComment}
                            onChange={(e) => setRejectComment(e.target.value)}
                            placeholder="Rejection reason..."
                            className="bg-white border border-red-300 rounded px-2.5 py-1 text-xs text-gray-900 placeholder-gray-400 w-48 focus:outline-none focus:ring-1 focus:ring-red-500/20"
                          />
                          <button
                            onClick={handleReject}
                            disabled={actionLoading === item._id}
                            className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] transition-all"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => { setRejectTargetId(null); setRejectComment(""); }}
                            className="px-2.5 py-1 rounded border border-gray-200 bg-white text-[10px] text-gray-600 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <Link
                            to={`/components/${item._id}`}
                            className="p-1 text-gray-500 hover:text-gray-950 border border-gray-200 rounded bg-white shadow-sm hover:scale-[1.03] transition-all"
                            title="View Spec Details"
                          >
                            <Eye size={13} />
                          </Link>
                          
                          {activeTab === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(item._id)}
                                disabled={actionLoading !== null}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-all inline-flex items-center gap-1"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectTargetId(item._id)}
                                disabled={actionLoading !== null}
                                className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] transition-all inline-flex items-center gap-1"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
