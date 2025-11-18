import React from 'react';
import Clarifier from './pages/Clarifier';
export default function App(){
  return (<div>
    <div className="header">
      <div className="logo">Ticket Clarifier — v1 (Hackathon)</div>
      <div className="small">Real-time LLM-assisted ticket writing</div>
    </div>
    <div className="container">
      <Clarifier/>
    </div>
  </div>)
}
