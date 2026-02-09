import { useState, useEffect } from 'react';
import { prdApi, jiraApi, exportApi } from '../api/client';

export default function Creator() {
  const [inputType, setInputType] = useState<'text' | 'jira'>('text');
  const [input, setInput] = useState('');
  const [jiraTicketId, setJiraTicketId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prdResult, setPrdResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [jiraConfigured, setJiraConfigured] = useState(false);
  const [exportStatus, setExportStatus] = useState({ confluence: false, notion: false });

  // New state for improved Jira flow
  const [jiraSummary, setJiraSummary] = useState<string>('');
  const [jiraFetched, setJiraFetched] = useState(false);
  const [jiraFullInput, setJiraFullInput] = useState<string>('');
  const [additionalContext, setAdditionalContext] = useState<string>('');
  const [jiraTicketData, setJiraTicketData] = useState<any>(null);
  const [jiraTicketsData, setJiraTicketsData] = useState<any[]>([]);

  // Check integration status
  useEffect(() => {
    checkIntegrations();
  }, []);

  const checkIntegrations = async () => {
    try {
      const [jiraStatus, exportStatusData] = await Promise.all([
        jiraApi.status(),
        exportApi.status(),
      ]);
      setJiraConfigured(jiraStatus.configured);
      setExportStatus(exportStatusData);
    } catch (err) {
      console.error('Error checking integrations:', err);
    }
  };

  const handleFetchJira = async () => {
    if (!jiraTicketId.trim()) {
      setError('Please enter a Jira ticket ID');
      return;
    }

    setIsLoading(true);
    setError('');
    setJiraFetched(false);

    try {
      // Parse ticket IDs (support comma-separated)
      const ticketIds = jiraTicketId
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);

      if (ticketIds.length === 0) {
        setError('Please enter valid Jira ticket ID(s)');
        setIsLoading(false);
        return;
      }

      // Send single string if one ticket, array if multiple
      const ticketIdParam = ticketIds.length === 1 ? ticketIds[0] : ticketIds;

      const response = await jiraApi.transform({ ticketId: ticketIdParam });
      if (response.success) {
        // Store the data but don't auto-generate PRD yet
        setJiraSummary(response.summary || '');
        setJiraFullInput(response.prdInput || '');
        setJiraTicketData(response.ticket || null);
        setJiraTicketsData(response.tickets || [response.ticket]);
        setJiraFetched(true);
        setAdditionalContext(''); // Reset additional context
        setError('');
      } else {
        setError(response.error || 'Failed to fetch Jira ticket(s)');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch Jira ticket(s)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePRDFromJira = () => {
    // Combine Jira data with additional context
    let combinedInput = jiraFullInput;

    if (additionalContext.trim()) {
      combinedInput += `\n\n## Additional Context\n${additionalContext.trim()}`;
    }

    setInput(combinedInput);
    setInputType('text');

    // Clear Jira state and trigger PRD generation
    setJiraFetched(false);

    // Auto-trigger generation after setting input
    setTimeout(() => handleGenerate(), 100);
  };

  const handleGenerate = async () => {
    if (!input.trim()) {
      setError('Please enter some input or fetch a Jira ticket first');
      return;
    }

    setIsLoading(true);
    setError('');
    setPrdResult('');

    try {
      const response = await prdApi.create({
        input: input.trim(),
        inputType,
      });

      if (response.success && response.markdown) {
        setPrdResult(response.markdown);
        setError('');
      } else {
        setError(response.error || 'Failed to generate PRD');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to generate PRD');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (platform: 'confluence' | 'notion') => {
    if (!prdResult) {
      setError('No PRD to export');
      return;
    }

    const titleMatch = prdResult.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'Untitled PRD';

    let spaceKey = '';
    let parentPageId = '';

    if (platform === 'confluence') {
      spaceKey = prompt('Enter Confluence space key (e.g., PROJ):') || '';
      if (!spaceKey) return;
      parentPageId = prompt('Enter parent page ID (optional):') || '';
    } else {
      parentPageId = prompt('Enter Notion parent page ID:') || '';
      if (!parentPageId) return;
    }

    setIsLoading(true);
    try {
      const response = await exportApi.export({
        platform,
        title,
        content: prdResult,
        ...(platform === 'confluence' && { spaceKey }),
        parentPageId: parentPageId || undefined,
      });

      if (response.success) {
        alert(`Successfully exported to ${platform}!\n\nURL: ${response.url}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || `Failed to export to ${platform}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportDocument = async (format: 'pdf' | 'docx') => {
    if (!prdResult) {
      setError('No PRD to export');
      return;
    }

    const titleMatch = prdResult.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'PRD';

    setIsLoading(true);
    try {
      const blob = await prdApi.exportDocument(prdResult, format, title);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || `Failed to export as ${format.toUpperCase()}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostSummaryToJira = async () => {
    if (!jiraSummary || !jiraTicketsData.length) {
      setError('No summary or tickets available');
      return;
    }

    // For multiple tickets, post to the first one (or we could post to all)
    const ticketKey = jiraTicketsData[0].key;

    const commentText = `🤖 AI-Generated Summary\n\n${jiraSummary}\n\n---\nGenerated by PRD System on ${new Date().toLocaleString()}`;

    setIsLoading(true);
    try {
      const response = await jiraApi.addComment(ticketKey, commentText);

      if (response.success) {
        alert(`✅ Summary posted successfully to ${ticketKey}!`);
        setError('');
      } else {
        setError('Failed to post summary to Jira');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to post summary to Jira');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttachPRDToJira = async (format: 'pdf' | 'docx') => {
    if (!prdResult || !jiraTicketsData.length) {
      setError('No PRD or tickets available');
      return;
    }

    const titleMatch = prdResult.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'PRD';

    // For multiple tickets, attach to the first one
    const ticketKey = jiraTicketsData[0].key;
    const filename = `PRD-${ticketKey}.${format}`;

    setIsLoading(true);
    try {
      // First, export the PRD to the desired format
      const blob = await prdApi.exportDocument(prdResult, format, title);

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);

      await new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64data = (reader.result as string).split(',')[1]; // Remove data:...;base64, prefix

            // Upload to Jira
            const response = await jiraApi.addAttachment(ticketKey, filename, base64data);

            if (response.success) {
              alert(`✅ PRD attached successfully to ${ticketKey}!\n\nFile: ${filename}`);
              setError('');
            } else {
              setError('Failed to attach PRD to Jira');
            }
            resolve(true);
          } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Failed to attach PRD to Jira');
            reject(err);
          }
        };
        reader.onerror = reject;
      });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || `Failed to attach PRD to Jira`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Write awesome PRD</h2>
        <p className="text-gray-600">
          Transform rough notes, ideas, or Jira tickets into structured PRDs
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
            <h3 className="text-lg font-semibold mb-4">Input</h3>

            {/* Input Type Selector */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setInputType('text')}
                className={`btn ${
                  inputType === 'text' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                Text / Notes
              </button>
              <button
                onClick={() => setInputType('jira')}
                className={`btn ${
                  inputType === 'jira' ? 'btn-primary' : 'btn-secondary'
                }`}
                disabled={!jiraConfigured}
                title={!jiraConfigured ? 'Jira integration not configured' : ''}
              >
                Jira Ticket
                {!jiraConfigured && ' 🔒'}
              </button>
            </div>

            {/* Jira Input */}
            {inputType === 'jira' && !jiraFetched && (
              <div className="mb-4 space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Enter Jira ticket ID(s) - e.g., PROJ-123 or PROJ-123, PROJ-124, PROJ-125"
                    value={jiraTicketId}
                    onChange={(e) => setJiraTicketId(e.target.value)}
                    className="input"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Tip: Enter multiple ticket IDs separated by commas to create a combined PRD
                  </p>
                </div>
                <button
                  onClick={handleFetchJira}
                  className="btn btn-secondary w-full"
                  disabled={isLoading || !jiraTicketId.trim()}
                >
                  {isLoading ? 'Fetching...' : 'Fetch Jira Ticket(s)'}
                </button>
              </div>
            )}

            {/* Jira Summary Section - shown after fetch */}
            {inputType === 'jira' && jiraFetched && (
              <div className="mb-4 space-y-4">
                {/* Multiple Tickets Overview */}
                {jiraTicketsData.length > 1 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-purple-900 mb-2">
                      📋 Multiple Tickets ({jiraTicketsData.length})
                    </h4>
                    <div className="space-y-2">
                      {jiraTicketsData.map((ticket, index) => (
                        <div key={ticket.key} className="flex items-start space-x-2 text-sm">
                          <span className="font-medium text-purple-700">{index + 1}.</span>
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">{ticket.key}:</span>
                            <span className="text-gray-700 ml-1">{ticket.summary}</span>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {ticket.issueType} • {ticket.priority} • {ticket.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Single Ticket Metadata Card */}
                {jiraTicketsData.length === 1 && jiraTicketData && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {jiraTicketData.key}: {jiraTicketData.summary}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Type:</span>
                        <span className="ml-2 text-gray-900">{jiraTicketData.issueType}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Status:</span>
                        <span className="ml-2 text-gray-900">{jiraTicketData.status}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Priority:</span>
                        <span className="ml-2 text-gray-900">{jiraTicketData.priority}</span>
                      </div>
                      {jiraTicketData.assignee && (
                        <div>
                          <span className="font-medium text-gray-600">Assignee:</span>
                          <span className="ml-2 text-gray-900">{jiraTicketData.assignee}</span>
                        </div>
                      )}
                      {jiraTicketData.reporter && (
                        <div>
                          <span className="font-medium text-gray-600">Reporter:</span>
                          <span className="ml-2 text-gray-900">{jiraTicketData.reporter}</span>
                        </div>
                      )}
                      {jiraTicketData.comments && jiraTicketData.comments.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-600">Comments:</span>
                          <span className="ml-2 text-gray-900">{jiraTicketData.comments.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Summary Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-semibold text-blue-900">
                      🤖 AI Summary {jiraTicketsData.length > 1 && `(${jiraTicketsData.length} tickets combined)`}
                    </h4>
                    <button
                      onClick={handlePostSummaryToJira}
                      className="btn btn-secondary text-xs"
                      disabled={isLoading}
                      title="Post this summary as a comment to the Jira ticket"
                    >
                      📤 Post to Jira
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {jiraSummary}
                  </p>
                </div>

                {/* Additional Context Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Context (Optional)
                  </label>
                  <textarea
                    placeholder="Add any additional context, requirements, or notes that should be included in the PRD..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    className="textarea min-h-[120px] text-sm"
                    disabled={isLoading}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreatePRDFromJira}
                    className="btn btn-primary flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating PRD...' : 'Create PRD'}
                  </button>
                  <button
                    onClick={() => {
                      setJiraFetched(false);
                      setJiraSummary('');
                      setJiraFullInput('');
                      setAdditionalContext('');
                      setJiraTicketData(null);
                      setJiraTicketsData([]);
                    }}
                    className="btn btn-secondary"
                    disabled={isLoading}
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* Text Input */}
            {inputType === 'text' && (
              <>
                <textarea
                  placeholder="Enter your rough notes, feature idea, or problem statement here...

Example:
- Problem: Users are having trouble finding the logout button
- Idea: Add a user settings page with logout, profile, and preferences
- Context: Support tickets show 20% of users contact us asking how to logout"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="textarea min-h-[300px] font-mono text-sm"
                  disabled={isLoading}
                />

                <button
                  onClick={handleGenerate}
                  className="btn btn-primary w-full mt-4"
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? 'Generating PRD...' : 'Generate PRD'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Output Panel */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Generated PRD</h3>
              {prdResult && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(prdResult)}
                    className="btn btn-secondary text-sm"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => handleExportDocument('pdf')}
                    className="btn btn-secondary text-sm"
                    disabled={isLoading}
                  >
                    📄 PDF
                  </button>
                  <button
                    onClick={() => handleExportDocument('docx')}
                    className="btn btn-secondary text-sm"
                    disabled={isLoading}
                  >
                    📝 DOCX
                  </button>
                  {jiraTicketsData.length > 0 && (
                    <>
                      <button
                        onClick={() => handleAttachPRDToJira('pdf')}
                        className="btn btn-primary text-sm"
                        disabled={isLoading}
                      >
                        📎 Attach to Jira (PDF)
                      </button>
                      <button
                        onClick={() => handleAttachPRDToJira('docx')}
                        className="btn btn-primary text-sm"
                        disabled={isLoading}
                      >
                        📎 Attach to Jira (DOCX)
                      </button>
                    </>
                  )}
                  {exportStatus.confluence && (
                    <button
                      onClick={() => handleExport('confluence')}
                      className="btn btn-secondary text-sm"
                      disabled={isLoading}
                    >
                      → Confluence
                    </button>
                  )}
                  {exportStatus.notion && (
                    <button
                      onClick={() => handleExport('notion')}
                      className="btn btn-secondary text-sm"
                      disabled={isLoading}
                    >
                      → Notion
                    </button>
                  )}
                </div>
              )}
            </div>

            {prdResult ? (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-50 p-4 rounded border overflow-auto max-h-[500px]">
                  {prdResult}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">📄</div>
                <p>Your generated PRD will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
