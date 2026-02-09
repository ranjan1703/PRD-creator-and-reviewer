import { useState } from 'react';
import { prdApi } from '../api/client';
import type { ReviewResult } from '../../../shared/types/review';

export default function Reviewer() {
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text');
  const [prdContent, setPrdContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const validExtensions = ['pdf', 'docx', 'txt', 'md', 'xlsx', 'xls', 'csv'];
      const extension = file.name.toLowerCase().split('.').pop() || '';

      if (!validExtensions.includes(extension)) {
        setError(`Unsupported file type. Please upload: ${validExtensions.join(', ')}`);
        return;
      }

      setSelectedFile(file);
      setError('');
    }
  };

  const handleReview = async () => {
    if (inputMethod === 'text') {
      if (!prdContent.trim()) {
        setError('Please enter or paste a PRD to review');
        return;
      }

      setIsLoading(true);
      setError('');
      setReview(null);

      try {
        const response = await prdApi.review({
          prdContent: prdContent.trim(),
        });

        if (response.success && response.review) {
          setReview(response.review);
          setError('');
        } else {
          setError(response.error || 'Failed to review PRD');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to review PRD');
      } finally {
        setIsLoading(false);
      }
    } else {
      // File upload review
      if (!selectedFile) {
        setError('Please select a file to review');
        return;
      }

      setIsLoading(true);
      setError('');
      setReview(null);

      try {
        const formData = new FormData();
        formData.append('document', selectedFile);

        const response = await prdApi.reviewDocument(formData);

        if (response.success && response.review) {
          setReview(response.review);
          setError('');
        } else {
          setError(response.error || 'Failed to review document');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Failed to review document');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getSeverityColor = (severity: 'critical' | 'important' | 'suggestion') => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'important':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suggestion':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">PRD Reviewer</h2>
        <p className="text-gray-600">
          Get comprehensive feedback on your PRD to identify gaps and risks
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">PRD to Review</h3>

            {/* Input Method Selector */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setInputMethod('text')}
                className={`btn ${
                  inputMethod === 'text' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                Paste Text
              </button>
              <button
                onClick={() => setInputMethod('file')}
                className={`btn ${
                  inputMethod === 'file' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                Upload Document
              </button>
            </div>

            {/* Text Input */}
            {inputMethod === 'text' && (
              <textarea
                placeholder="Paste your PRD content here...

The review will check for:
- Missing sections
- Unclear requirements
- Edge cases
- Technical risks
- Compliance gaps
- Metrics gaps
- UX gaps
- Go-to-market gaps"
                value={prdContent}
                onChange={(e) => setPrdContent(e.target.value)}
                className="textarea min-h-[400px] font-mono text-sm"
                disabled={isLoading}
              />
            )}

            {/* File Upload */}
            {inputMethod === 'file' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="prd-file-upload"
                    accept=".pdf,.docx,.txt,.md,.xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="prd-file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <div className="text-5xl mb-3">📄</div>
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      Click to upload or drag and drop
                    </div>
                    <div className="text-xs text-gray-500">
                      PDF, DOCX, TXT, Excel (Max 10MB)
                    </div>
                  </label>
                </div>

                {selectedFile && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">📎</div>
                        <div>
                          <div className="font-medium text-sm text-gray-900">
                            {selectedFile.name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        disabled={isLoading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
                  <div className="font-semibold mb-2">Supported formats:</div>
                  <ul className="space-y-1">
                    <li>• PDF - Portable Document Format</li>
                    <li>• DOCX - Microsoft Word Document</li>
                    <li>• TXT/MD - Plain Text / Markdown</li>
                    <li>• XLSX/XLS/CSV - Excel Spreadsheets</li>
                  </ul>
                </div>
              </div>
            )}

            <button
              onClick={handleReview}
              className="btn btn-primary w-full mt-4"
              disabled={
                isLoading ||
                (inputMethod === 'text' && !prdContent.trim()) ||
                (inputMethod === 'file' && !selectedFile)
              }
            >
              {isLoading ? 'Reviewing PRD...' : 'Review PRD'}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {review ? (
            <>
              {/* Overall Score */}
              <div className="card">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Overall Score</h3>
                  <div className={`text-4xl font-bold ${getScoreColor(review.overallScore)}`}>
                    {review.overallScore}
                    <span className="text-2xl text-gray-400">/100</span>
                  </div>
                </div>
                <p className="text-gray-600 mt-2">{review.summary}</p>
              </div>

              {/* Missing Sections */}
              {review.sections.missingSections.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <span className="mr-2">🚫</span>
                    Missing Sections ({review.sections.missingSections.length})
                  </h3>
                  <ul className="space-y-1">
                    {review.sections.missingSections.map((section, i) => (
                      <li key={i} className="text-gray-700 text-sm">
                        • {section}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Unclear Requirements */}
              {review.sections.unclearRequirements.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <span className="mr-2">❓</span>
                    Unclear Requirements ({review.sections.unclearRequirements.length})
                  </h3>
                  <div className="space-y-3">
                    {review.sections.unclearRequirements.map((item, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border ${getSeverityColor(item.severity)}`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-medium text-sm">{item.section}</span>
                          <span className="text-xs uppercase font-bold">{item.severity}</span>
                        </div>
                        <p className="text-sm">{item.issue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Edge Cases */}
              {review.sections.edgeCases.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <span className="mr-2">⚠️</span>
                    Edge Cases ({review.sections.edgeCases.length})
                  </h3>
                  <div className="space-y-2">
                    {review.sections.edgeCases.map((item, i) => (
                      <div key={i} className="border-l-4 border-orange-400 pl-3 py-2">
                        <p className="font-medium text-sm">{item.scenario}</p>
                        <p className="text-sm text-gray-600 mt-1">{item.concern}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Risks */}
              {review.sections.technicalRisks.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <span className="mr-2">🔧</span>
                    Technical Risks ({review.sections.technicalRisks.length})
                  </h3>
                  <div className="space-y-3">
                    {review.sections.technicalRisks.map((item, i) => (
                      <div key={i} className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium text-sm mb-1">{item.risk}</p>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Impact:</span> {item.impact}
                        </p>
                        {item.mitigation && (
                          <p className="text-sm text-green-700">
                            <span className="font-medium">Mitigation:</span> {item.mitigation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compliance Gaps */}
              {review.sections.complianceGaps.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <span className="mr-2">📋</span>
                    Compliance Gaps ({review.sections.complianceGaps.length})
                  </h3>
                  <ul className="space-y-1">
                    {review.sections.complianceGaps.map((gap, i) => (
                      <li key={i} className="text-gray-700 text-sm">
                        • {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Metrics Gaps */}
              {review.sections.metricsGaps.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <span className="mr-2">📊</span>
                    Metrics Gaps ({review.sections.metricsGaps.length})
                  </h3>
                  <ul className="space-y-1">
                    {review.sections.metricsGaps.map((gap, i) => (
                      <li key={i} className="text-gray-700 text-sm">
                        • {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* UX Gaps */}
              {review.sections.uxGaps.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <span className="mr-2">🎨</span>
                    UX Gaps ({review.sections.uxGaps.length})
                  </h3>
                  <ul className="space-y-1">
                    {review.sections.uxGaps.map((gap, i) => (
                      <li key={i} className="text-gray-700 text-sm">
                        • {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Go-to-Market Gaps */}
              {review.sections.goToMarketGaps.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <span className="mr-2">🚀</span>
                    Go-to-Market Gaps ({review.sections.goToMarketGaps.length})
                  </h3>
                  <ul className="space-y-1">
                    {review.sections.goToMarketGaps.map((gap, i) => (
                      <li key={i} className="text-gray-700 text-sm">
                        • {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {review.recommendations.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <span className="mr-2">💡</span>
                    Recommendations ({review.recommendations.length})
                  </h3>
                  <ul className="space-y-2">
                    {review.recommendations.map((rec, i) => (
                      <li key={i} className="text-gray-700 text-sm flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="card">
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">🔍</div>
                <p>Your PRD review will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
