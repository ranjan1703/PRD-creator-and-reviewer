import React, { useState, useEffect } from 'react';
import { researchApi } from '../api/client';
import type {
  CreateResearchSessionRequest,
  ProblemEvaluation,
  SurveyQuestion,
  InterviewGuide,
  SurveyAnalysis,
  InterviewAnalysis,
  ResearchReport,
} from '../../../shared/types/research';

type ResearchType = 'survey' | 'interview';
type ResearchTone = 'exploratory' | 'validation' | 'pricing';
type ResearchDepth = 'quick' | 'standard' | 'comprehensive';

interface ResearchSession {
  id: string;
  problemStatement: string;
  productContext: string;
  targetUserSegment: string;
  expectedOutcome?: string;
  researchType: ResearchType;
  status: string;
}

const STORAGE_KEY = 'research_session_id';

export default function ResearchPlanner() {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);

  // Session data
  const [session, setSession] = useState<ResearchSession | null>(null);
  const [evaluation, setEvaluation] = useState<ProblemEvaluation | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[] | InterviewGuide | null>(null);
  const [analysis, setAnalysis] = useState<SurveyAnalysis | InterviewAnalysis | null>(null);
  const [report, setReport] = useState<ResearchReport | null>(null);

  // Form inputs
  const [problemStatement, setProblemStatement] = useState('');
  const [productContext, setProductContext] = useState('');
  const [targetSegment, setTargetSegment] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [researchType, setResearchType] = useState<ResearchType>('survey');

  // Question generation options
  const [tone, setTone] = useState<ResearchTone>('exploratory');
  const [depth, setDepth] = useState<ResearchDepth>('standard');

  // File upload
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<any>(null);

  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session resumption
  const [isResuming, setIsResuming] = useState(true);
  const [hasExistingSession, setHasExistingSession] = useState(false);

  // Function to start new research (with confirmation if session exists)
  const handleStartNewResearch = () => {
    if (hasExistingSession) {
      const confirmed = window.confirm(
        '⚠️ You have an ongoing research session.\n\nStarting a new session will discard all current progress including:\n• Problem statement and evaluation\n• Generated questions\n• Uploaded data\n• Analysis results\n• Report\n\nAre you sure you want to start over?'
      );

      if (!confirmed) {
        return; // User cancelled, keep current session
      }
    }

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Session cleared from localStorage');

    // Reset all state
    setCurrentStep(1);
    setSession(null);
    setEvaluation(null);
    setQuestions(null);
    setAnalysis(null);
    setReport(null);
    setProblemStatement('');
    setProductContext('');
    setTargetSegment('');
    setExpectedOutcome('');
    setUploadedFile(null);
    setUploadPreview(null);
    setError(null);
    setHasExistingSession(false);
  };

  // Load existing session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionId = localStorage.getItem(STORAGE_KEY);
        if (!sessionId) {
          setIsResuming(false);
          return;
        }

        console.log('🔄 Resuming session:', sessionId);
        const response = await researchApi.getSession(sessionId);

        if (response.success && response.session) {
          const { session: loadedSession, plan, results } = response;

          // Restore session data
          setSession(loadedSession);
          setProblemStatement(loadedSession.problemStatement);
          setProductContext(loadedSession.productContext);
          setTargetSegment(loadedSession.targetUserSegment);
          setExpectedOutcome(loadedSession.expectedOutcome || '');
          setResearchType(loadedSession.researchType);

          // Restore plan data
          if (plan) {
            const evalData = typeof plan.evaluation === 'string' ? JSON.parse(plan.evaluation) : plan.evaluation;
            const questionsData = typeof plan.questions === 'string' ? JSON.parse(plan.questions) : plan.questions;

            setEvaluation(evalData);
            setQuestions(questionsData);
            setTone(plan.tone as ResearchTone);
            setDepth(plan.depth as ResearchDepth);
          }

          // Restore results data
          if (results) {
            const parsedData = typeof results.parsedData === 'string' ? JSON.parse(results.parsedData) : results.parsedData;
            setUploadPreview(parsedData);

            if (results.analysis) {
              const analysisData = typeof results.analysis === 'string' ? JSON.parse(results.analysis) : results.analysis;
              setAnalysis(analysisData);
            }

            if (results.reportMarkdown) {
              setReport({
                markdown: results.reportMarkdown,
                metadata: {
                  sessionId: loadedSession.id,
                  title: loadedSession.problemStatement.substring(0, 50),
                  researchType: loadedSession.researchType,
                  conductedDate: loadedSession.createdAt,
                  respondentCount: parsedData?.rowCount || parsedData?.transcriptCount || 0,
                },
              });
            }
          }

          // Determine current step based on progress
          if (results?.reportMarkdown) {
            setCurrentStep(7);
          } else if (results?.analysis) {
            setCurrentStep(6);
          } else if (results?.parsedData) {
            setCurrentStep(6); // Ready to analyze
          } else if (plan?.questions) {
            setCurrentStep(4); // Questions generated, ready for export
          } else if (plan?.evaluation) {
            setCurrentStep(2); // Evaluation complete
          } else {
            setCurrentStep(1);
          }

          console.log('✅ Session resumed successfully');
          setHasExistingSession(true); // Mark that we have an existing session
        } else {
          // Session not found or error, clear storage
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsResuming(false);
      }
    };

    loadSession();
  }, []);

  // Step 1: Create session and evaluate problem
  const handleCreateSession = async () => {
    if (problemStatement.length < 20) {
      setError('Problem statement must be at least 20 characters');
      return;
    }
    if (productContext.length < 10) {
      setError('Product context must be at least 10 characters');
      return;
    }
    if (!targetSegment) {
      setError('Target user segment is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: CreateResearchSessionRequest = {
        problemStatement,
        productContext,
        targetUserSegment: targetSegment,
        expectedOutcome: expectedOutcome || undefined,
        researchType,
      };

      const response = await researchApi.createSession(request);
      if (response.success && response.session && response.evaluation) {
        setSession(response.session);
        setEvaluation(response.evaluation);
        setCurrentStep(2);

        // Save session ID to localStorage for persistence
        localStorage.setItem(STORAGE_KEY, response.session.id);
        console.log('💾 Session saved to localStorage:', response.session.id);

        // Mark that we now have an existing session
        setHasExistingSession(true);
      } else {
        setError(response.error || 'Failed to create research session');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Generate questions
  const handleGenerateQuestions = async () => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const response = await researchApi.generateQuestions(session.id, { tone, depth });
      if (response.success && response.plan) {
        setQuestions(response.plan.questions);
        setCurrentStep(4);
      } else {
        setError(response.error || 'Failed to generate questions');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Download Excel template
  const handleDownloadTemplate = async () => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const blob = await researchApi.exportTemplate(session.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `research-template-${session.id.substring(0, 8)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to download template');
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Upload results
  const handleUploadResults = async () => {
    if (!session || !uploadedFile) return;

    setLoading(true);
    setError(null);

    try {
      const response = await researchApi.uploadResults(session.id, uploadedFile);
      if (response.success && response.parsedData) {
        setUploadPreview(response.parsedData);
        setCurrentStep(6);
      } else {
        setError(response.error || 'Failed to upload results');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Analyze results
  const handleAnalyze = async () => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const response = await researchApi.analyze(session.id);
      if (response.success && response.analysis) {
        setAnalysis(response.analysis);
        setCurrentStep(6); // Go to Step 6 to display analysis results
      } else {
        setError(response.error || 'Failed to analyze results');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 7: Generate report
  const handleGenerateReport = async () => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const response = await researchApi.getReport(session.id);
      if (response.success && response.report) {
        setReport(response.report);
      } else {
        setError(response.error || 'Failed to generate report');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Export report in different formats
  const handleExportReport = async (format: 'pdf' | 'markdown' | 'docx') => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const blob = await researchApi.exportReport(session.id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = format === 'markdown' ? 'md' : format;
      a.download = `research-report-${session.id.substring(0, 8)}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to export ${format.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (20MB limit)
      if (file.size > 20 * 1024 * 1024) {
        setError('File size exceeds 20MB limit');
        return;
      }
      // Validate file extension
      const validExtensions = ['.xlsx', '.xls', '.csv', '.txt'];
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExtensions.includes(extension)) {
        setError('Invalid file type. Please upload .xlsx, .xls, .csv, or .txt files');
        return;
      }
      setUploadedFile(file);
      setError(null);
    }
  };

  // Stepper UI
  const steps = [
    { number: 1, label: 'Problem Input' },
    { number: 2, label: 'Evaluation' },
    { number: 3, label: 'Questions' },
    { number: 4, label: 'Export Template' },
    { number: 5, label: 'Upload Data' },
    { number: 6, label: 'Analysis' },
    { number: 7, label: 'Report' },
  ];

  // Show loading while resuming session
  if (isResuming) {
    return (
      <div className="research-planner">
        <div className="container">
          <div className="header">
            <h1>AI Product Research Planner</h1>
            <p>7-step guided workflow from problem to insights</p>
          </div>
          <div className="card text-center py-12">
            <div className="spinner inline-block w-12 h-12 border-4 mb-4" aria-hidden="true"></div>
            <p className="text-gray-600">Loading your research session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="research-planner">
      <div className="container">
        <div className="header">
          <h1>AI Product Research Planner</h1>
          <p>7-step guided workflow from problem to insights</p>
        </div>

        {/* Stepper */}
        <nav className="stepper" aria-label="Research progress" role="navigation">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`step ${currentStep === step.number ? 'active' : ''} ${
                currentStep > step.number ? 'completed' : ''
              }`}
              aria-current={currentStep === step.number ? 'step' : undefined}
            >
              <div className="step-number" aria-label={`Step ${step.number}`}>{step.number}</div>
              <div className="step-label">{step.label}</div>
            </div>
          ))}
        </nav>

        {/* Existing Session Banner */}
        {hasExistingSession && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 text-xl" aria-hidden="true">ℹ️</span>
              <div>
                <p className="text-blue-900 font-medium">You have an ongoing research session</p>
                <p className="text-blue-700 text-sm">Continue where you left off or start a new research project.</p>
              </div>
            </div>
            <button
              onClick={handleStartNewResearch}
              className="btn-secondary whitespace-nowrap"
              type="button"
            >
              <span aria-hidden="true">➕</span> Start New Research
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-banner" role="alert" aria-live="assertive">
            <span><span aria-hidden="true">⚠️</span> {error}</span>
            <button
              onClick={() => setError(null)}
              aria-label="Close error message"
              type="button"
            >
              ✕
            </button>
          </div>
        )}

        {/* Step 1: Problem Input */}
        {currentStep === 1 && (
          <div className="step-content card">
            <h2>Step 1: Define Your Research Problem</h2>
            <p>Provide context about the problem you want to research.</p>

            <div className="form-group">
              <label htmlFor="problemStatement">Problem Statement *</label>
              <textarea
                id="problemStatement"
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="What problem are you trying to understand? (min 20 characters)"
                rows={4}
                className={`textarea ${error && problemStatement.length < 20 ? 'error' : ''}`}
                aria-required="true"
                aria-invalid={problemStatement.length > 0 && problemStatement.length < 20}
              />
              <small className={problemStatement.length < 20 && problemStatement.length > 0 ? 'text-red-600' : ''}>
                {problemStatement.length} / 20 characters minimum
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="productContext">Product Context *</label>
              <textarea
                id="productContext"
                value={productContext}
                onChange={(e) => setProductContext(e.target.value)}
                placeholder="What's the product or feature context? (min 10 characters)"
                rows={3}
                className={`textarea ${error && productContext.length < 10 ? 'error' : ''}`}
                aria-required="true"
                aria-invalid={productContext.length > 0 && productContext.length < 10}
              />
            </div>

            <div className="form-group">
              <label htmlFor="targetSegment">Target User Segment *</label>
              <input
                id="targetSegment"
                type="text"
                value={targetSegment}
                onChange={(e) => setTargetSegment(e.target.value)}
                placeholder="e.g., 'B2B SaaS power users' or 'First-time homebuyers'"
                className={`input ${error && !targetSegment ? 'error' : ''}`}
                aria-required="true"
                aria-invalid={!targetSegment}
              />
            </div>

            <div className="form-group">
              <label htmlFor="expectedOutcome">Expected Outcome (Optional)</label>
              <textarea
                id="expectedOutcome"
                value={expectedOutcome}
                onChange={(e) => setExpectedOutcome(e.target.value)}
                placeholder="What do you hope to learn or achieve with this research?"
                rows={2}
                className="textarea"
              />
            </div>

            <div className="form-group">
              <label>Research Type *</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    value="survey"
                    checked={researchType === 'survey'}
                    onChange={(e) => setResearchType(e.target.value as ResearchType)}
                  />
                  <span>Survey (Quantitative)</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    value="interview"
                    checked={researchType === 'interview'}
                    onChange={(e) => setResearchType(e.target.value as ResearchType)}
                  />
                  <span>Interview (Qualitative)</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleCreateSession}
              disabled={loading}
              className="btn-primary"
              aria-busy={loading}
            >
              {loading && <span className="spinner mr-2" aria-hidden="true"></span>}
              {loading ? 'Creating Session...' : 'Create Session & Evaluate Problem'}
            </button>
          </div>
        )}

        {/* Step 2: Evaluation Display */}
        {currentStep === 2 && evaluation && (
          <div className="step-content card">
            <h2>Step 2: Problem Evaluation</h2>
            <p>AI analysis of your problem statement and research readiness.</p>

            <div className="evaluation-section">
              <div className="clarity-score">
                <h3>Clarity Score</h3>
                <div
                  className={`score-badge ${
                    evaluation.clarityScore >= 80
                      ? 'high'
                      : evaluation.clarityScore >= 60
                      ? 'medium'
                      : 'low'
                  }`}
                >
                  {evaluation.clarityScore}/100
                </div>
              </div>

              {evaluation.missingInformation && evaluation.missingInformation.length > 0 && (
                <div className="evaluation-card">
                  <h4>Missing Information</h4>
                  <ul>
                    {evaluation.missingInformation.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluation.riskAreas && evaluation.riskAreas.length > 0 && (
                <div className="evaluation-card warning">
                  <h4>⚠️ Risk Areas</h4>
                  <ul>
                    {evaluation.riskAreas.map((risk, idx) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluation.suggestedResearchGoals && evaluation.suggestedResearchGoals.length > 0 && (
                <div className="evaluation-card">
                  <h4>Suggested Research Goals</h4>
                  <ul>
                    {evaluation.suggestedResearchGoals.map((goal, idx) => (
                      <li key={idx}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}

              {evaluation.recommendedMethod && (
                <div className="evaluation-card">
                  <h4>Recommended Method</h4>
                  <p><strong>{evaluation.recommendedMethod.method}</strong></p>
                  <p>{evaluation.recommendedMethod.rationale}</p>
                </div>
              )}
            </div>

            <div className="button-group">
              <button onClick={() => setCurrentStep(1)} className="btn-secondary">
                ← Back
              </button>
              <button onClick={() => setCurrentStep(3)} className="btn-primary">
                Proceed to Questions →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Question Generation */}
        {currentStep === 3 && (
          <div className="step-content card">
            <h2>Step 3: Generate Research Questions</h2>
            <p>Customize the tone and depth of your {researchType === 'survey' ? 'survey questions' : 'interview guide'}.</p>

            <div className="question-options">
              <div className="form-group">
                <label htmlFor="researchTone">Research Tone</label>
                <select
                  id="researchTone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as ResearchTone)}
                  className="input"
                >
                  <option value="exploratory">Exploratory (Discovery)</option>
                  <option value="validation">Validation (Hypothesis Testing)</option>
                  <option value="pricing">Pricing (Willingness to Pay)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="researchDepth">Research Depth</label>
                <select
                  id="researchDepth"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value as ResearchDepth)}
                  className="input"
                >
                  <option value="quick">Quick (8-12 questions)</option>
                  <option value="standard">Standard (15-20 questions)</option>
                  <option value="comprehensive">Comprehensive (20-25 questions)</option>
                </select>
              </div>
            </div>

            {!questions && (
              <button
                onClick={handleGenerateQuestions}
                disabled={loading}
                className="btn-primary"
                aria-busy={loading}
              >
                {loading && <span className="spinner mr-2" aria-hidden="true"></span>}
                {loading ? 'Generating Questions...' : 'Generate Questions'}
              </button>
            )}

            {questions && researchType === 'survey' && Array.isArray(questions) && (
              <div className="questions-display">
                <h3>Generated Survey Questions ({questions.length})</h3>
                <div className="question-list">
                  {questions.map((q: SurveyQuestion, idx) => (
                    <div key={q.id} className="question-item">
                      <div className="question-header">
                        <span className="question-number">Q{idx + 1}</span>
                        <span className="question-type">{q.type}</span>
                      </div>
                      <p className="question-text">{q.text}</p>
                      {q.options && q.options.length > 0 && (
                        <div className="question-options-list">
                          {q.options.map((opt, optIdx) => (
                            <span key={optIdx} className="option-chip">{opt}</span>
                          ))}
                        </div>
                      )}
                      <p className="question-objective"><em>Objective: {q.objective}</em></p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {questions && researchType === 'interview' && !Array.isArray(questions) && (
              <div className="interview-guide-display">
                <h3>Generated Interview Guide</h3>

                <div className="guide-section">
                  <h4>Opening Script</h4>
                  <p className="script-text">{(questions as InterviewGuide).openingScript}</p>
                </div>

                <div className="guide-section">
                  <h4>Interview Questions ({(questions as InterviewGuide).questions?.length || 0})</h4>
                  {(questions as InterviewGuide).questions?.map((q, idx) => (
                    <div key={q.id} className="question-item">
                      <p className="question-text"><strong>Q{idx + 1}:</strong> {q.question}</p>
                      {q.probes && q.probes.length > 0 && (
                        <div className="probes">
                          <em>Probes:</em>
                          <ul>
                            {q.probes.map((probe, pIdx) => (
                              <li key={pIdx}>{probe}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {(questions as InterviewGuide).observationChecklist && (
                  <div className="guide-section">
                    <h4>Observation Checklist</h4>
                    <ul>
                      {(questions as InterviewGuide).observationChecklist.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(questions as InterviewGuide).biasAvoidanceTips && (
                  <div className="guide-section">
                    <h4>Bias Avoidance Tips</h4>
                    <ul>
                      {(questions as InterviewGuide).biasAvoidanceTips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="button-group">
              <button onClick={() => setCurrentStep(2)} className="btn-secondary">
                ← Back
              </button>
              {questions && (
                <button onClick={() => setCurrentStep(4)} className="btn-primary">
                  Proceed to Export →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Export Template */}
        {currentStep === 4 && (
          <div className="step-content card">
            <h2>Step 4: Download Research Template</h2>
            <p>Download an Excel template to collect your {researchType === 'survey' ? 'survey responses' : 'interview transcripts'}.</p>

            <div className="export-instructions">
              <h3>Instructions:</h3>
              <ol>
                <li>Click the button below to download the Excel template</li>
                <li>The template includes all your {researchType === 'survey' ? 'survey questions as columns' : 'interview guide structure'}</li>
                <li>{researchType === 'survey' ? 'Fill in one response per row' : 'Paste interview transcripts in the provided format'}</li>
                <li>Save the file and come back to upload it in the next step</li>
              </ol>
            </div>

            <button
              onClick={handleDownloadTemplate}
              disabled={loading}
              className="btn-primary btn-large"
              aria-busy={loading}
            >
              {loading && <span className="spinner mr-2" aria-hidden="true"></span>}
              <span aria-hidden="true">📥</span> {loading ? 'Generating Template...' : 'Download Excel Template'}
            </button>

            <div className="button-group">
              <button onClick={() => setCurrentStep(3)} className="btn-secondary">
                ← Back
              </button>
              <button onClick={() => setCurrentStep(5)} className="btn-primary">
                I've Collected Data →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Upload Results */}
        {currentStep === 5 && (
          <div className="step-content card">
            <h2>Step 5: Upload Research Results</h2>
            <p>Upload your completed {researchType === 'survey' ? 'survey responses' : 'interview transcripts'}.</p>

            <div className="upload-zone">
              <input
                type="file"
                id="file-upload"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={handleFileChange}
                className="sr-only"
                aria-label="Upload research results file"
              />
              <label htmlFor="file-upload" className="upload-label" tabIndex={0} role="button">
                {uploadedFile ? (
                  <div className="file-selected">
                    <span><span aria-hidden="true">📄</span> {uploadedFile.name}</span>
                    <small>
                      ({uploadedFile.size >= 1024 * 1024
                        ? `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB`
                        : `${(uploadedFile.size / 1024).toFixed(1)} KB`})
                    </small>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <span className="upload-icon" aria-hidden="true">📤</span>
                    <p>Click to select file or drag and drop</p>
                    <small>Accepts: .xlsx, .xls, .csv, .txt (max 20MB)</small>
                  </div>
                )}
              </label>
            </div>

            {uploadedFile && !uploadPreview && (
              <button
                onClick={handleUploadResults}
                disabled={loading}
                className="btn-primary"
                aria-busy={loading}
              >
                {loading && <span className="spinner mr-2" aria-hidden="true"></span>}
                {loading ? 'Uploading & Parsing...' : 'Upload & Parse Results'}
              </button>
            )}

            {uploadPreview && (
              <div className="upload-success">
                <h3>✓ File Uploaded Successfully</h3>
                <p><strong>Row Count:</strong> {uploadPreview.rowCount || uploadPreview.transcriptCount || 'N/A'}</p>
                {uploadPreview.preview && (
                  <div className="data-preview">
                    <h4>Data Preview:</h4>
                    <pre>{JSON.stringify(uploadPreview.preview, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}

            <div className="button-group">
              <button onClick={() => setCurrentStep(4)} className="btn-secondary">
                ← Back
              </button>
              {uploadPreview && (
                <button onClick={handleAnalyze} disabled={loading} className="btn-primary" aria-busy={loading}>
                  {loading && <span className="spinner mr-2" aria-hidden="true"></span>}
                  {loading ? 'Analyzing...' : 'Analyze Results →'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 6: Analysis Display */}
        {currentStep === 6 && !analysis && (
          <div className="step-content card">
            <h2>Step 6: Research Analysis</h2>
            <p>Analyzing your {researchType === 'survey' ? 'survey data' : 'interview transcripts'}...</p>

            <div className="text-center py-8">
              <div className="spinner inline-block w-12 h-12 border-4" aria-hidden="true"></div>
              <p className="mt-4 text-gray-600">Please wait while AI analyzes your data. This may take 20-30 seconds.</p>
            </div>

            <div className="button-group">
              <button onClick={() => setCurrentStep(5)} className="btn-secondary">
                ← Back to Upload
              </button>
            </div>
          </div>
        )}

        {currentStep === 6 && analysis && (
          <div className="step-content card">
            <h2>Step 6: Research Analysis</h2>
            <p>AI-powered insights from your {researchType === 'survey' ? 'survey data' : 'interview transcripts'}.</p>

            {researchType === 'survey' && 'keyTrends' in analysis && (
              <div className="analysis-display">
                {(analysis as SurveyAnalysis).keyTrends && (
                  <div className="analysis-section">
                    <h3>Key Trends</h3>
                    <ul>
                      {(analysis as SurveyAnalysis).keyTrends.map((trend, idx) => (
                        <li key={idx}>{trend}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(analysis as SurveyAnalysis).topPainPoints && (
                  <div className="analysis-section">
                    <h3>Top Pain Points</h3>
                    <div className="pain-points-list">
                      {(analysis as SurveyAnalysis).topPainPoints.map((pp, idx) => (
                        <div key={idx} className="pain-point-card">
                          <div className="pain-header">
                            <span className="pain-rank">#{idx + 1}</span>
                            <span className="pain-frequency">{pp.frequency}% mentioned</span>
                          </div>
                          <p>{pp.pain}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(analysis as SurveyAnalysis).recommendationSummary && (
                  <div className="analysis-section">
                    <h3>Recommendations</h3>
                    <ol>
                      {(analysis as SurveyAnalysis).recommendationSummary.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            {researchType === 'interview' && 'themes' in analysis && (
              <div className="analysis-display">
                {(analysis as InterviewAnalysis).themes && (
                  <div className="analysis-section">
                    <h3>Major Themes</h3>
                    {(analysis as InterviewAnalysis).themes.map((theme, idx) => (
                      <div key={idx} className="theme-card">
                        <h4>{theme.theme} <span className="frequency-badge">({theme.frequency} mentions)</span></h4>
                        {theme.quotes && theme.quotes.length > 0 && (
                          <div className="quotes">
                            {theme.quotes.map((quote, qIdx) => (
                              <blockquote key={qIdx}>{quote}</blockquote>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(analysis as InterviewAnalysis).opportunityAreas && (
                  <div className="analysis-section">
                    <h3>Opportunity Areas</h3>
                    <ul>
                      {(analysis as InterviewAnalysis).opportunityAreas.map((opp, idx) => (
                        <li key={idx}>{opp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(analysis as InterviewAnalysis).productDecisionInputs && (
                  <div className="analysis-section">
                    <h3>Product Decision Inputs</h3>
                    <ul>
                      {(analysis as InterviewAnalysis).productDecisionInputs.map((input, idx) => (
                        <li key={idx}>{input}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="button-group">
              <button onClick={() => setCurrentStep(5)} className="btn-secondary" type="button">
                ← Back
              </button>
              <button
                onClick={() => { handleGenerateReport(); setCurrentStep(7); }}
                disabled={loading}
                className="btn-primary"
                aria-busy={loading}
                type="button"
              >
                {loading && <span className="spinner mr-2" aria-hidden="true"></span>}
                {loading ? 'Generating Report...' : 'Generate Report →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Report */}
        {currentStep === 7 && (
          <div className="step-content card">
            <h2>Step 7: Research Report</h2>
            <p>Comprehensive research report ready for export.</p>

            {!report && (
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="btn-primary"
                aria-busy={loading}
                type="button"
              >
                {loading && <span className="spinner mr-2" aria-hidden="true"></span>}
                {loading ? 'Generating Report...' : 'Generate Report'}
              </button>
            )}

            {report && (
              <>
                <div className="report-preview" role="region" aria-label="Research report preview">
                  <pre className="markdown-content whitespace-pre-wrap">{report.markdown || 'No report content available'}</pre>
                </div>

                <div className="export-buttons">
                  <button
                    onClick={() => handleExportReport('pdf')}
                    disabled={loading}
                    className="btn-primary"
                    aria-busy={loading}
                    type="button"
                  >
                    {loading && <span className="spinner mr-2" aria-hidden="true"></span>}
                    <span aria-hidden="true">📄</span> Download PDF
                  </button>
                  <button
                    onClick={() => handleExportReport('markdown')}
                    disabled={loading}
                    className="btn-primary"
                    aria-busy={loading}
                    type="button"
                  >
                    {loading && <span className="spinner mr-2" aria-hidden="true"></span>}
                    <span aria-hidden="true">📝</span> Download Markdown
                  </button>
                  <button
                    onClick={() => handleExportReport('docx')}
                    disabled={loading}
                    className="btn-primary"
                    aria-busy={loading}
                    type="button"
                  >
                    {loading && <span className="spinner mr-2" aria-hidden="true"></span>}
                    <span aria-hidden="true">📘</span> Download DOCX
                  </button>
                </div>

                <button
                  onClick={handleStartNewResearch}
                  className="btn-secondary btn-large mt-8"
                  type="button"
                >
                  <span aria-hidden="true">🔄</span> Start New Research
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
