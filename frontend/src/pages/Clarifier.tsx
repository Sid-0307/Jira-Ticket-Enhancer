import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../api";

const toText = (value: unknown): string => {
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join("\n");
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export default function Clarifier() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [acceptance, setAcceptance] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [refined, setRefined] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const scoreClass =
    score >= 8 ? "high" : score >= 5 ? "mid" : score > 0 ? "low" : "";

  const runAnalysis = async () => {
    if (!title.trim() && !description.trim() && !acceptance.trim()) {
      alert("Please type something before analyzing.");
      return;
    }
    setAnalyzing(true);
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/analyze`, {
        title,
        description,
        acceptance_criteria: acceptance,
      });
      setQuestions(res.data.questions || []);
      setScore(res.data.score || 0);
      setRefined(res.data.refined || null);
      setHasAnalyzed(true);
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questions.length === 0) return;
    const lower = (description + "\n" + acceptance).toLowerCase();
    const remaining = questions.filter((q) => {
      const key = q.toLowerCase().split("?")[0];
      return !lower.includes(key);
    });
    if (remaining.length !== questions.length) setQuestions(remaining);
  }, [description, acceptance]);

  const createTicket = async () => {
    setCreating(true);
    try {
      const res = await axios.post(`${API_BASE}/api/create`, {
        title: toText(title),
        description: toText(description),
        acceptance_criteria: toText(acceptance),
        refined,
      });
      alert("Ticket created: " + res.data.ticket.id);
      setTitle("");
      setDescription("");
      setAcceptance("");
      setScore(0);
      setQuestions([]);
      setRefined(null);
      setHasAnalyzed(false);
    } catch (e) {
      console.error(e);
      alert("Failed to create ticket");
    } finally {
      setCreating(false);
    }
  };

  const applyRewrite = () => {
    if (refined?.summary) {
      setDescription(toText(refined.description || refined.summary || description));
      if (refined.acceptance_criteria)
        setAcceptance(toText(refined.acceptance_criteria));
    }
  };

  return (
    <div className="layout">
      {/* ── LEFT: ticket form ── */}
      <div className="card left">
        {/* Header row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              flex: 1,
              paddingRight: 16,
              lineHeight: 1.4,
            }}
          >
            {title || "Untitled ticket"}
          </div>
          <div className={`score ${scoreClass}`}>
            {hasAnalyzed ? `${score}/10` : "—/10"}
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <input
            className="input"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <textarea
            className="textarea input"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <textarea
            className="textarea input"
            placeholder="Acceptance Criteria (optional)"
            value={acceptance}
            onChange={(e) => setAcceptance(e.target.value)}
          />
        </div>

        <div className="footer">
          <button className="btn" onClick={runAnalysis} disabled={analyzing}>
            {analyzing ? "Analyzing..." : "Analyze Ticket"}
          </button>
          <button
            className="btn"
            onClick={applyRewrite}
            disabled={!refined?.summary}
          >
            Apply Rewrite
          </button>
          <button
            className="btn"
            disabled={score < 7 || creating}
            onClick={createTicket}
          >
            {creating ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </div>

      {/* ── RIGHT: 3 section cards ── */}
      <div className="right">
        {loading ? (
          <div className="section-card">
            <div className="loading-overlay">
              <div className="loading-bar-container">
                <div className="loading-bar" />
              </div>
              <div className="loading-text">Analyzing your ticket...</div>
              <div className="loading-steps">
                {[
                  "Evaluating clarity",
                  "Generating questions",
                  "Preparing rewrite",
                ].map((step, i) => (
                  <div className="loading-step" key={i}>
                    <div className="loading-dots">
                      <div className="loading-dot" />
                      <div className="loading-dot" />
                      <div className="loading-dot" />
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="right-panel">
            {/* Box 1: Questions */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-title">Detected Questions</div>
                {questions.length > 0 && (
                  <div className="tag">{questions.length} remaining</div>
                )}
              </div>
              {!hasAnalyzed ? (
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <div className="small">
                    Analyze a ticket to see clarifying questions
                  </div>
                </div>
              ) : questions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <div className="small">
                    No outstanding questions — good job!
                  </div>
                </div>
              ) : (
                questions.map((q, i) => (
                  <div className="question" key={i}>
                    {q}
                  </div>
                ))
              )}
            </div>

            {/* Box 2: Rewritten Preview */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-title">Rewritten Preview</div>
                {refined && <div className="tag">AI-enhanced</div>}
              </div>
              {!hasAnalyzed || !refined ? (
                <div className="empty-state">
                  <div className="empty-icon">✏️</div>
                  <div className="small">
                    AI-rewritten version will appear here
                  </div>
                </div>
              ) : (
                <div className="rewrite-block">
                  {refined.summary && (
                    <div className="rewrite-field">
                      <div className="rewrite-label">Summary</div>
                      <div className="rewrite-value">{refined.summary}</div>
                    </div>
                  )}
                  {refined.description && (
                    <div className="rewrite-field">
                      <div className="rewrite-label">Description</div>
                      <div className="rewrite-value">{refined.description}</div>
                    </div>
                  )}
                  {refined.acceptance_criteria && (
                    <div className="rewrite-field">
                      <div className="rewrite-label">Acceptance Criteria</div>
                      <div className="rewrite-value">
                        {refined.acceptance_criteria}
                      </div>
                    </div>
                  )}
                  {refined.missing && refined.missing.length > 0 && (
                    <div
                      className="rewrite-field"
                      style={{ borderColor: "rgba(255,107,107,0.3)" }}
                    >
                      <div
                        className="rewrite-label"
                        style={{ color: "var(--danger)" }}
                      >
                        Missing Info
                      </div>
                      {refined.missing.map((m: string, i: number) => (
                        <div
                          className="rewrite-value"
                          key={i}
                          style={{ color: "var(--muted)" }}
                        >
                          • {m}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Box 3: Developer Interpretation */}
            <div className="section-card">
              <div className="section-card-header">
                <div className="section-title">Developer Interpretation</div>
              </div>
              {!hasAnalyzed || !refined?.developer_interpretation ? (
                <div className="empty-state">
                  <div className="empty-icon">🧑‍💻</div>
                  <div className="small">
                    How a developer would read this ticket
                  </div>
                </div>
              ) : (
                <div className="interp-block">
                  {refined.developer_interpretation}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
