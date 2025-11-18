// import React, {useEffect, useState, useRef} from 'react';
// import axios from 'axios';
// import {API_BASE} from '../api';

// function useDebounced(value:string, delay=600){
//   const [deb, setDeb] = useState(value);
//   useEffect(()=>{
//     const id = setTimeout(()=>setDeb(value), delay);
//     return ()=>clearTimeout(id);
//   },[value,delay]);
//   return deb;
// }

// export default function Clarifier(){
//   const [title,setTitle] = useState('');
//   const [description,setDescription] = useState('');
//   const [acceptance,setAcceptance] = useState('');
//   const debDesc = useDebounced(description, 700);
//   const debTitle = useDebounced(title, 700);
//   const debAcceptance = useDebounced(acceptance, 700);
//   const [questions,setQuestions] = useState<string[]>([]);
//   const [score,setScore] = useState<number>(0);
//   const [refined,setRefined] = useState<any>({});
//   const [loading,setLoading] = useState(false);
//   const [tickets,setTickets] = useState<any[]>([]);
//   const [creating,setCreating] = useState(false);

//   // auto analyze on debounce of any fields
//   useEffect(()=>{
//     let mounted=true;
//     const analyze = async ()=>{
//       setLoading(true);
//       try{
//         const res = await axios.post(`${API_BASE}/api/analyze`, { title: debTitle, description: debDesc, acceptance_criteria: debAcceptance });
//         if(!mounted) return;
//         setQuestions(res.data.questions || []);
//         setScore(res.data.score || 0);
//         setRefined(res.data.refined || {});
//       }catch(err){
//         console.error(err);
//       }finally{ if(mounted) setLoading(false) }
//     };
//     if(debTitle.trim() || debDesc.trim() || debAcceptance.trim()){
//       analyze();
//     }else{
//       setQuestions([]);
//       setScore(0);
//       setRefined({});
//     }
//     return ()=>{ mounted=false }
//   },[debTitle, debDesc, debAcceptance]);

//   // when user types answers into description or acceptance, remove questions that are answered
//   useEffect(()=>{
//     if(questions.length===0) return;
//     const lower = (description + '\n' + acceptance).toLowerCase();
//     const remaining = questions.filter(q=> !lower.includes(q.toLowerCase().split('?')[0]));
//     if(remaining.length !== questions.length){
//       setQuestions(remaining);
//     }
//   },[description, acceptance]);

//   const createTicket = async ()=>{
//     setCreating(true);
//     try{
//       const payload = { title, description, acceptance_criteria: acceptance, refined };
//       const res = await axios.post(`${API_BASE}/api/create`, payload);
//       alert('Ticket created: ' + res.data.ticket.id);
//       setTitle(''); setDescription(''); setAcceptance('');
//       fetchTickets();
//     }catch(e){ console.error(e); alert('Failed to create') }finally{ setCreating(false) }
//   };

//   const fetchTickets = async ()=>{
//     try{
//       const r = await axios.get(`${API_BASE}/api/tickets`);
//       setTickets(r.data || []);
//     }catch(e){ console.error(e) }
//   };

//   useEffect(()=>{ fetchTickets() },[]);

//   return (<div className="layout">
//     <div className="card left">
//       <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
//         <div>
//           <div style={{fontSize:18,fontWeight:700}}>{title || 'Untitled ticket'}</div>
//           <div className="small">Start typing to get live clarifications</div>
//         </div>
//         <div className="score">{score}/10</div>
//       </div>
//       <div style={{marginBottom:8}}>
//         <input className="input" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
//       </div>
//       <div style={{marginBottom:8}}>
//         <textarea className="textarea input" placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
//       </div>
//       <div style={{marginBottom:8}}>
//         <textarea className="textarea input" placeholder="Acceptance Criteria (optional)" value={acceptance} onChange={e=>setAcceptance(e.target.value)} />
//       </div>
//       <div className="footer">
//         <button className="btn" onClick={()=>{
//           if(refined && refined.summary){
//             const newDesc = refined.description || refined.summary || description;
//             setDescription(newDesc);
//             if(refined.acceptance_criteria) setAcceptance(refined.acceptance_criteria);
//             alert('Inserted rewritten content into description. You can edit before submitting.');
//           }
//         }}>Apply Rewrite</button>
//         <button className="btn" disabled={score < 9 || creating} onClick={createTicket}>{creating ? 'Creating...' : 'Create Ticket'}</button>
//       </div>

//       <div style={{marginTop:16}}>
//         <h4 style={{margin:0}}>Recent created tickets</h4>
//         <div className="small">Tickets created via this tool</div>
//         <ul>
//           {tickets.slice().reverse().map(t=><li key={t.id}><a target="_blank" href={t.jira_url} rel="noreferrer">{t.id}</a> - {t.title}</li>)}
//         </ul>
//       </div>
//     </div>

//     <div className="card right">
//       <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
//         <div>
//           <div style={{fontWeight:700}}>LLM Assistant</div>
//           <div className="small">It asks simple questions and rewrites your ticket for developers</div>
//         </div>
//         <div className="tag">{loading ? 'Analyzing...' : 'Live'}</div>
//       </div>

//       <div style={{marginBottom:12}}>
//         <div style={{fontWeight:600}}>Detected Questions</div>
//         <div className="small">Answer these in your description or acceptance criteria and they will disappear</div>
//         <div style={{marginTop:8}}>
//           {questions.length===0 && <div className="small">No outstanding questions — good job!</div>}
//           {questions.map((q,i)=><div className="question" key={i}>{q}</div>)}
//         </div>
//       </div>

//       <div style={{marginBottom:12}}>
//         <div style={{fontWeight:600}}>Rewritten Preview</div>
//         <div className="preview small">
//           {refined && (typeof refined === 'string' ? refined : JSON.stringify(refined, null, 2))}
//         </div>
//       </div>

//       <div style={{marginBottom:12}}>
//         <div style={{fontWeight:600}}>Developer interpretation</div>
//         <div className="preview small">{refined && refined.developer_interpretation ? refined.developer_interpretation : '...'}</div>
//       </div>

//       <div style={{marginBottom:6}}>
//         <div style={{fontWeight:600}}>Ambiguity / Missing Items</div>
//         <div className="small">{refined && refined.missing ? refined.missing.join(', ') : '—'}</div>
//       </div>
//     </div>
//   </div>)
// }

import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../api";

export default function Clarifier() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [acceptance, setAcceptance] = useState("");

  const [questions, setQuestions] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [refined, setRefined] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // ----------- RUN ANALYSIS ONLY WHEN USER CLICKS --------------
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
      setRefined(res.data.refined || {});
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  // --------------- AUTO REMOVE QUESTIONS WHEN ANSWERED -------------------
  useEffect(() => {
    if (questions.length === 0) return;
    const lower = (description + "\n" + acceptance).toLowerCase();

    const remaining = questions.filter((q) => {
      const key = q.toLowerCase().split("?")[0];
      return !lower.includes(key);
    });

    if (remaining.length !== questions.length) {
      setQuestions(remaining);
    }
  }, [description, acceptance]);

  // ---------------- CREATE TICKET ----------------
  const createTicket = async () => {
    setCreating(true);
    try {
      const payload = {
        title,
        description,
        acceptance_criteria: acceptance,
        refined,
      };
      const res = await axios.post(`${API_BASE}/api/create`, payload);
      alert("Ticket created: " + res.data.ticket.id);

      setTitle("");
      setDescription("");
      setAcceptance("");

      fetchTickets();
    } catch (e) {
      console.error(e);
      alert("Failed to create");
    } finally {
      setCreating(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const r = await axios.get(`${API_BASE}/api/tickets`);
      setTickets(r.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <div className="layout">
      {/* ---------------- LEFT SIDE ---------------- */}
      <div className="card left">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {title || "Untitled ticket"}
            </div>
          </div>
          <div className="score">{score}/10</div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <input
            className="input"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 8 }}>
          <textarea
            className="textarea input"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 8 }}>
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
            onClick={() => {
              if (refined && refined.summary) {
                const newDesc =
                  refined.description || refined.summary || description;
                setDescription(newDesc);
                if (refined.acceptance_criteria)
                  setAcceptance(refined.acceptance_criteria);
                alert(
                  "Inserted rewritten content. You can edit it before submitting."
                );
              }
            }}
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

        <div style={{ marginTop: 32 }}>
          <h4 style={{ margin: 0 }}>Recent created tickets</h4>
          <div className="small">Tickets created via this tool</div>
          <ul>
            {tickets
              .slice()
              .reverse()
              .map((t) => (
                <li key={t.id}>
                  <a target="_blank" href={t.jira_url} rel="noreferrer">
                    {t.id}
                  </a>{" "}
                  - {t.title}
                </li>
              ))}
          </ul>
        </div>
      </div>

      {/* ---------------- RIGHT SIDE ---------------- */}
      <div className="card right">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>LLM Assistant</div>
          </div>
          <div className="tag">{loading ? "Analyzing..." : "Idle"}</div>
        </div>

        <div style={{ marginTop: 32, marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>Detected Questions</div>
          <div style={{ marginTop: 8 }}>
            {questions.length === 0 && (
              <div className="small">No outstanding questions — good job!</div>
            )}
            {questions.map((q, i) => (
              <div className="question" key={i}>
                {q}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 32, marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>Rewritten Preview</div>
          <div className="preview small">
            {refined &&
              (typeof refined === "string"
                ? refined
                : JSON.stringify(refined, null, 2))}
          </div>
        </div>

        <div style={{ marginTop: 32, marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>Developer interpretation</div>
          <div className="preview small">
            {refined?.developer_interpretation || "..."}
          </div>
        </div>
      </div>
    </div>
  );
}
