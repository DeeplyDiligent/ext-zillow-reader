import React, { useState } from 'react';
import {FunctionComponent} from 'react';
import { Component } from 'react';
import { render } from 'react-dom';
import { Lead, Leads } from './app/leads/leads';
import NotesForLead from './app/notes/notesForLead';
import './index.css';
interface IndexProps {
  
}
 
const Index: FunctionComponent<IndexProps> = () => {
  const [leadSelected, setLeadSelected] = useState<string | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])

  return <div className='flex flex-row w-full' style={{minWidth:1500}}>    
    <Leads setLeadSelected = {setLeadSelected} leads={leads} setLeads={setLeads} />
    <NotesForLead leadSelected = {leadSelected} leads={leads}  />
  </div>;
}
 
render(<Index />, document.getElementById("app"));