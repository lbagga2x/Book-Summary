'use client';

import { ArrowRight, BookOpen, CheckCircle, Clock, FileText, Lightbulb, Loader2, Sparkles, Target, Upload, XCircle, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

const API_BASE_URL = 'https://i3v3f347n3.execute-api.us-east-1.amazonaws.com/prod';

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

// {
//     "summaries": [
//         {
//             "filename": "The Time Machine.pdf",
//             "summary": {
//                 "phase1": "The story is fundamentally about the Time Traveller's discovery of the fourth dimension - time. He proposes that time is a dimension akin to the three spatial dimensions, and that it is possible to travel through time just as we can move through space. The core thesis is that time is not a fixed, linear progression, but a dimension that can be navigated and experienced in new ways.",
//                 "phase2": "The main concepts introduced include the idea of time as a fourth dimension, the construction of a machine capable of traversing this dimension, and the potential implications of time travel for fields like history, science, and personal investment. The Time Traveller presents these ideas through a Socratic dialogue, engaging his guests in thought-provoking discussions about the nature of space, time, and perception.",
//                 "title": "Unveiling the Fourth Dimension: A Journey Through Time",
//                 "phase3": "The practical takeaways from this story are the new perspectives it offers on the human experience of time and the vast, unexplored potential of time travel. The Time Traveller's experimental device suggests that with the right scientific knowledge and technological innovation, humanity may one day be able to manipulate and navigate the fourth dimension, opening up extraordinary possibilities for discovery, exploration, and even the alteration of the past and future. The story encourages readers to consider the profound implications of such a capability.",
//                 "readingTimeMinutes": 5
//             },
//             "completedAt": 1762569546672,
//             "updatedAt": 1762569546672,
//             "status": "completed",
//             "extractedTextKey": "extracted/7a8c9e65-b437-4cbc-ba38-019479649a72/text.txt",
//             "createdAt": 1762565003705,
//             "textLength": 98742,
//             "numPages": 25,
//             "id": "7a8c9e65-b437-4cbc-ba38-019479649a72",
//             "s3Key": "uploads/7a8c9e65-b437-4cbc-ba38-019479649a72/The Time Machine.pdf",
//             "summaryKey": "summaries/7a8c9e65-b437-4cbc-ba38-019479649a72/summary.json"
//         }
//     ],
//     "count": 1
// }


export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/summaries`);
      const data = await response.json();
      //Objects are not valid as a React child (found: object with keys {phase1, phase2, title, phase3, readingTimeMinutes}). If you meant to render a collection of children, use an array instead.
      setDocuments(data.summaries || []);

    } catch (error) {
      console.error('Error loading documents:', error);
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
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        alert('Please upload a PDF file');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        alert('Please upload a PDF file');
      }
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: selectedFile.name }),
      });
      const uploadData = await uploadResponse.json();

      await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/pdf' },
        body: selectedFile,
      });

      alert(`Upload successful! Document ID: ${uploadData.id}\n\nProcessing will take about 30-60 seconds.`);
      
      setSelectedFile(null);
      setTimeout(() => {
        loadDocuments();
      }, 40000);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const summarizeDocument = async (doc: Document) => {
    if (doc.status !== 'extracted') {
      alert(`Document is not ready. Status: ${doc.status}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/summaries/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id }),
      });
      const data = await response.json();
      
      if (data.error) {
        alert(`Error: ${data.error}`);
      } else {
        setSelectedDoc(data.summaries);
        loadDocuments();
      }
    } catch (error) {
      console.error('Summarization error:', error);
      alert('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; color: string; icon: any }> = {
      pending_upload: { text: 'Pending', color: 'bg-gray-500', icon: Loader2 },
      processing: { text: 'Processing', color: 'bg-blue-500', icon: Loader2 },
      extracted: { text: 'Ready', color: 'bg-green-500', icon: CheckCircle },
      summarizing: { text: 'Summarizing', color: 'bg-purple-500', icon: Loader2 },
      completed: { text: 'Completed', color: 'bg-emerald-500', icon: CheckCircle },
      failed: { text: 'Failed', color: 'bg-red-500', icon: XCircle },
    };
    
    const badge = badges[status] || badges.pending_upload;
    const Icon = badge.icon;
    
    return (
      <span className={`${badge.color} text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
        <Icon className={`w-3 h-3 ${badge.icon === Loader2 ? 'animate-spin' : ''}`} />
        {badge.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-purple-400" />
            <h1 className="text-5xl font-bold text-white">PDF Summarizer</h1>
          </div>
          <p className="text-gray-300 text-lg">Upload PDFs and get AI-powered summaries in seconds</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Upload New PDF</h2>
          
          <div
            className={`border-3 border-dashed rounded-xl p-12 text-center transition-all ${
              dragActive 
                ? 'border-purple-400 bg-purple-400/20' 
                : 'border-gray-400 bg-white/5'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            
            {selectedFile ? (
              <div className="mb-4">
                <p className="text-white font-semibold text-lg mb-2">{selectedFile.name}</p>
                <p className="text-gray-300 text-sm">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-white text-lg mb-2">Drag and drop your PDF here</p>
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
              onClick={loadDocuments}
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
              <p className="text-gray-400">No documents yet. Upload your first PDF!</p>
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
                      <h3 className="text-white font-semibold text-lg mb-2">{doc.filename}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        {/* {doc.numPages && <span>{doc.numPages} pages</span>}
                        {doc.textLength && <span>{(doc.textLength / 1000).toFixed(1)}k characters</span>} */}
                        {/* <span>{new Date(doc.createdAt).toLocaleDateString()}</span> */}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(doc.status)}
                    </div>
                  </div>
                  
                  {/* {doc.errorMessage && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                      <p className="text-red-200 text-sm">{doc.errorMessage}</p>
                    </div>
                  )} */}
                  
                  {doc.status === 'extracted' && (
                    <button
                      onClick={() => summarizeDocument(doc)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
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
    {/* Header */}
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

    {/* Phases */}
    <div className="p-6 space-y-4">
      {/* Phase 1 */}
      <div className="relative">
        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full opacity-60" />
        <div className="pl-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-purple-300 text-xs font-bold">1</span>
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

      {/* Phase 2 */}
      <div className="relative">
        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full opacity-60" />
        <div className="pl-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-blue-300 text-xs font-bold">2</span>
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

      {/* Phase 3 */}
      <div className="relative">
        <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full opacity-60" />
        <div className="pl-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-green-300 text-xs font-bold">3</span>
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

    {/* Read More */}
    <div className="px-6 pb-6">
      <div className="flex items-center justify-center gap-2 text-purple-400 hover:text-purple-300 transition-colors group">
        <span className="text-sm font-semibold">Read Full Summary</span>
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

        {/* Selected Document Modal */}
{selectedDoc && selectedDoc.summary && (
  <div 
    className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
    onClick={() => setSelectedDoc(null)}
  >
    <div 
      className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-purple-500/30 shadow-2xl shadow-purple-500/20 animate-in zoom-in-95 duration-300"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
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

      {/* Content - Scrollable */}
      <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-8">
        <div className="space-y-6">
          {/* Phase 1 */}
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-2xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-purple-300 font-bold text-sm uppercase tracking-wider">
                    Phase 1
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400 text-sm">
                    Core Message & Thesis
                  </span>
                </div>
                <p className="text-gray-200 leading-relaxed text-base">
                  {selectedDoc.summary.phase1}
                </p>
              </div>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-2xl p-6 border border-blue-500/30 hover:border-blue-500/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-blue-300 font-bold text-sm uppercase tracking-wider">
                    Phase 2
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400 text-sm">
                    Main Concepts & Frameworks
                  </span>
                </div>
                <p className="text-gray-200 leading-relaxed text-base">
                  {selectedDoc.summary.phase2}
                </p>
              </div>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 rounded-2xl p-6 border border-green-500/30 hover:border-green-500/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-green-300 font-bold text-sm uppercase tracking-wider">
                    Phase 3
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400 text-sm">
                    Practical Takeaways & Insights
                  </span>
                </div>
                <p className="text-gray-200 leading-relaxed text-base">
                  {selectedDoc.summary.phase3}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-purple-500/30 bg-slate-900/50 p-6">
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Summary generated by Claude AI
          </p>
          <button
            onClick={() => setSelectedDoc(null)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-purple-500/50"
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