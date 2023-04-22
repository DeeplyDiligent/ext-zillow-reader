import React, { FunctionComponent, useEffect, useState } from 'react';
import { render } from 'react-dom';
import { ReactGrid, Column, Row, CellChange, TextCell, Id } from "@silevis/reactgrid";
import "@silevis/reactgrid/styles.css";

/**
 * Next steps:
 * * Make a page about each lead
 * use react router
 */

interface LeadsProps {
  setLeadSelected: React.Dispatch<React.SetStateAction<string|null>>
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>
  leads: Lead[]
}

export interface Lead {
  Lead_Annotation: Annotation[];
  address1_country: string,
  yomifullname: string,
  subject: string,
  leadid: string,
  revenue: number,
  msp_leadnumber: string,
  msp_subscriptionid: string,
  statecode: number,
  jobtitle: string,
  emailaddress1: string,
  companyname: string,
  createdon: Date,
  telephone1: string,
  _transactioncurrencyid_value: string,
  address1_composite: string
}

export interface Annotation {
  annotationid: string,
  createdon: string,
  notetext: string
}

const getColumns = (): Column[] => [
  { columnId: "msp_leadnumber",},
  { columnId: "subject" },
  { columnId: "yomifullname" },
  { columnId: "companyname" },
  { columnId: "address1_country" },
  { columnId: "emailaddress1" },
  { columnId: "telephone1" },
];

const headerRow: Row = {
  rowId: "header",
  cells: [
    { type: "header", text: "Lead Number" },
    { type: "header", text: "Topic" },
    { type: "header", text: "Name" },
    { type: "header", text: "Company" },
    { type: "header", text: "Country" },
    { type: "header", text: "Email" },
    { type: "header", text: "Phone Number" }
  ]
};

const getRows = (leads: Lead[]): Row[] => [
  headerRow,
  ...leads.map<Row>((lead, idx) => ({
    rowId: idx,
    cells: [
      { type: "text", text: lead.msp_leadnumber || "", },
      { type: "text", text: lead.subject || "" },
      { type: "text", text: lead.yomifullname || "" },
      { type: "text", text: lead.companyname || "" },
      { type: "text", text: lead.address1_country || "" },
      { type: "text", text: lead.emailaddress1 || "" },
      { type: "text", text: lead.telephone1 || "" }
    ]
  }))
];


export const Leads: FunctionComponent<LeadsProps> = ({setLeadSelected, setLeads, leads}) => {

  const fetches = async () => {
    const leadDetails = (await (await fetch(`https://microsoftsales.crm.dynamics.com/api/data/v9.0/leads?$filter=_ownerid_value%20eq%20A31A95C3-F494-EC11-8D20-002248307F71%20and%20(statecode%20eq%200%20or%20statecode%20eq%201)&$select=address1_country,yomifullname,subject,leadid,revenue,msp_leadnumber,msp_subscriptionid,statecode,jobtitle,emailaddress1,companyname,createdon,telephone1&$expand=Lead_Annotation`)).json());
    setLeads(leadDetails.value)
  }
  useEffect(() => {
    fetches()
  }, []);
  // const leadNotesExt = (await (await fetch(`https://microsoftsales.crm.dynamics.com/api/data/v9.0/annotations?$filter=_objectid_value%20eq%20${id}%20and%20contains(notetext,%27msx-d%27)`)).json());
  // const allLeadNotes = (await (await fetch(`https://microsoftsales.crm.dynamics.com/api/data/v9.0/annotations?$filter=_objectid_value%20eq%20${id}`)).json()).value.map(x=>x.notetext).join("\n");
  console.log(leads)
  const rows = getRows(leads);

  const applyChangesToleads = (
    changes: CellChange<TextCell>[],
    prevleads: Lead[]
  ): Lead[] => {
    changes.forEach((change) => {
      const personIndex: Id = change.rowId;
      const fieldName = change.columnId;
      //@ts-ignore
      prevleads[personIndex][fieldName] = change.newCell.text;
    });
    console.log('changed', prevleads)
    return [...prevleads];
  };

  const handleChanges = (changes: any) => {
    setLeads((prevleads) => {
      // console.log( applyChangesToleads(changes, prevleads))
      return applyChangesToleads(changes, prevleads)
    });
  };

  const handleFocusChange = (changes: any) => {
    setLeadSelected(leads[changes.rowId].leadid)
  }

  return <div className='p-5 overflow-auto h-screen'><ReactGrid rows={rows} columns={getColumns()} onCellsChanged={handleChanges} onFocusLocationChanged={handleFocusChange}/></div>;
}

export default Leads;