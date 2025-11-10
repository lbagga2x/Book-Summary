//dashboard/page.tsx
"use client";

import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
  Upload,
  XCircle,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { createUploadUrl, summarizeDocument } from "../actions";

interface Summary {
  phase1: string;
  phase2: string;
  title: string;
  phase3: string;
  readingTimeMinutes: number;
}

interface Document {
  id: string;
  filename: string;
  status: string;
  completedAt: number;
  summary?: Summary;
}

export default function Home() {
  const signOutRedirect = () => {
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const logoutUri = process.env.NEXT_PUBLIC_LOGOUT_URI ?? "";
    const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      if (!auth.isAuthenticated) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE_URL}/summaries`, {
        headers: {
          Authorization: `Bearer ${auth.user?.id_token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to load documents: ${response.statusText}`);
      }
      const data = await response.json();
      setDocuments(data.summaries || []);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        alert("Please upload a PDF file");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === "application/pdf") {
        setSelectedFile(file);
      } else {
        alert("Please upload a PDF file");
      }
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Step 1: Call Server Action to get presigned URL
      const uploadData = await createUploadUrl(selectedFile.name, auth);

      // Step 2: Upload directly to S3 (no auth needed, uses presigned URL)
      const uploadResponse = await fetch(uploadData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload to S3 failed");
      }

      alert(
        `Upload successful! Document ID: ${uploadData.id}\n\nProcessing will take about 30-60 seconds.`,
      );

      setSelectedFile(null);

      // Reload documents after a delay
      setTimeout(() => {
        fetchDocuments();
      }, 40000);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed: " + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSummarize = async (doc: Document) => {
    if (doc.status !== "extracted") {
      alert(`Document is not ready. Status: ${doc.status}`);
      return;
    }

    setLoading(true);
    try {
      // Call Server Action
      await summarizeDocument(doc.id, auth);

      // Reload documents to show updated summary
      await fetchDocuments();

      alert("Summary generated successfully!");
    } catch (error) {
      console.error("Summarization error:", error);
      alert("Failed to generate summary: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; color: string; icon: any }> = {
      pending_upload: { text: "Pending", color: "bg-gray-500", icon: Loader2 },
      processing: { text: "Processing", color: "bg-blue-500", icon: Loader2 },
      extracted: { text: "Ready", color: "bg-green-500", icon: CheckCircle },
      summarizing: {
        text: "Summarizing",
        color: "bg-purple-500",
        icon: Loader2,
      },
      completed: {
        text: "Completed",
        color: "bg-emerald-500",
        icon: CheckCircle,
      },
      failed: { text: "Failed", color: "bg-red-500", icon: XCircle },
    };

    const badge = badges[status] || badges.pending_upload;
    const Icon = badge.icon;

    return (
      <span
        className={`${badge.color} text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}
      >
        <Icon
          className={`w-3 h-3 ${badge.icon === Loader2 ? "animate-spin" : ""}`}
        />
        {badge.text}
      </span>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl max-w-md w-full text-center">
          <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">PDF Summarizer</h1>
          <p className="text-gray-300 mb-8">
            Sign in to upload PDFs and get AI-powered summaries
          </p>
          <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-xl font-bold text-lg transition-all shadow-lg">
            Sign In with Cognito
          </button>
        </div>
      </div>
    );
  }

  // Main authenticated UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-10 h-10 text-purple-400" />
              <h1 className="text-5xl font-bold text-white">PDF Summarizer</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-300">{auth.user?.profile.email}</span>
              <button
                onClick={() => signOutRedirect()}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg font-semibold border border-red-500/30 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
          <p className="text-gray-300 text-lg">
            Upload PDFs and get AI-powered summaries in seconds
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Upload New PDF</h2>

          <div
            className={`border-3 border-dashed rounded-xl p-12 text-center transition-all ${
              dragActive
                ? "border-purple-400 bg-purple-400/20"
                : "border-gray-400 bg-white/5"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />

            {selectedFile ? (
              <div className="mb-4">
                <p className="text-white font-semibold text-lg mb-2">
                  {selectedFile.name}
                </p>
                <p className="text-gray-300 text-sm">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-white text-lg mb-2">
                  Drag and drop your PDF here
                </p>
                <p className="text-gray-400 text-sm">or click to browse</p>
              </div>
            )}

            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />

            <label
              htmlFor="file-upload"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg cursor-pointer transition-colors font-semibold"
            >
              Choose File
            </label>
          </div>

          {selectedFile && (
            <button
              onClick={uploadFile}
              disabled={uploading}
              className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload & Process
                </>
              )}
            </button>
          )}
        </div>

        {/* Documents List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Your Documents</h2>
            <button
              onClick={fetchDocuments}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
              <p className="text-gray-300 mt-4">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">
                No documents yet. Upload your first PDF!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-purple-400/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2">
                        {doc.filename}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(doc.status)}
                    </div>
                  </div>

                  {doc.status === "extracted" && (
                    <button
                      onClick={() => handleSummarize(doc)}
                      disabled={loading}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate Summary
                    </button>
                  )}

                  {doc.summary && (
                    <div
                      className="mt-4 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-purple-500/30 p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                              <span className="text-purple-300 text-sm font-semibold uppercase tracking-wide">
                                AI Summary
                              </span>
                            </div>
                            <h4 className="text-white font-bold text-xl mb-3 leading-tight">
                              {doc.summary.title}
                            </h4>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 bg-purple-500/20 px-3 py-1.5 rounded-full">
                                <Clock className="w-3.5 h-3.5 text-purple-300" />
                                <span className="text-purple-200 text-xs font-medium">
                                  {doc.summary.readingTimeMinutes} min read
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="relative">
                          <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full opacity-60" />
                          <div className="pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <span className="text-purple-300 text-xs font-bold">
                                  1
                                </span>
                              </div>
                              <span className="text-purple-300 text-xs font-semibold uppercase tracking-wide">
                                Core Message
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
                              {doc.summary.phase1}
                            </p>
                          </div>
                        </div>

                        <div className="relative">
                          <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full opacity-60" />
                          <div className="pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <span className="text-blue-300 text-xs font-bold">
                                  2
                                </span>
                              </div>
                              <span className="text-blue-300 text-xs font-semibold uppercase tracking-wide">
                                Main Concepts
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
                              {doc.summary.phase2}
                            </p>
                          </div>
                        </div>

                        <div className="relative">
                          <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full opacity-60" />
                          <div className="pl-4">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                <span className="text-green-300 text-xs font-bold">
                                  3
                                </span>
                              </div>
                              <span className="text-green-300 text-xs font-semibold uppercase tracking-wide">
                                Key Takeaways
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
                              {doc.summary.phase3}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 pb-6">
                        <div className="flex items-center justify-center gap-2 text-purple-400 hover:text-purple-300 transition-colors group">
                          <span className="text-sm font-semibold">
                            Read Full Summary
                          </span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal (keeping your existing modal code) */}
        {selectedDoc && selectedDoc.summary && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedDoc(null)}
          >
            <div
              className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-purple-500/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 border-b border-purple-500/30 p-8">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="absolute top-6 right-6 text-gray-400 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all"
                >
                  <XCircle className="w-6 h-6" />
                </button>

                <div className="pr-12">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
                    <span className="text-purple-300 text-sm font-bold uppercase tracking-wider">
                      AI-Powered Summary
                    </span>
                  </div>

                  <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                    {selectedDoc.summary.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-purple-500/20 px-4 py-2 rounded-full border border-purple-500/30">
                      <Clock className="w-4 h-4 text-purple-300" />
                      <span className="text-purple-200 text-sm font-medium">
                        {selectedDoc.summary.readingTimeMinutes} min read
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-blue-500/20 px-4 py-2 rounded-full border border-blue-500/30">
                      <BookOpen className="w-4 h-4 text-blue-300" />
                      <span className="text-blue-200 text-sm font-medium">
                        {selectedDoc.filename}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-8">
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-2xl p-6 border border-purple-500/30">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-purple-300 font-bold text-sm uppercase">
                            Phase 1
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400 text-sm">
                            Core Message
                          </span>
                        </div>
                        <p className="text-gray-200 leading-relaxed">
                          {selectedDoc.summary.phase1}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl p-6 border border-blue-500/30">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                          <Lightbulb className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-blue-300 font-bold text-sm uppercase">
                            Phase 2
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400 text-sm">
                            Main Concepts
                          </span>
                        </div>
                        <p className="text-gray-200 leading-relaxed">
                          {selectedDoc.summary.phase2}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 rounded-2xl p-6 border border-green-500/30">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-green-300 font-bold text-sm uppercase">
                            Phase 3
                          </span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-400 text-sm">
                            Practical Takeaways
                          </span>
                        </div>
                        <p className="text-gray-200 leading-relaxed">
                          {selectedDoc.summary.phase3}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-purple-500/30 bg-slate-900/50 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-gray-400 text-sm">
                    Summary generated by Claude AI
                  </p>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
