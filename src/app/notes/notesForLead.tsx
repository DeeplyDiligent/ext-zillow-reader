import * as React from 'react';
import { Component } from 'react';
import Contacts from './contacts';
import { Annotation, Lead } from '../leads/leads';
import { FaSave } from 'react-icons/fa';


interface NotesForLeadProps {
    leadSelected: string | null
    leads: Lead[]
}

enum SubmitState {
    NOT_SUBMITTED,
    SUBMITTING
}

function strip(html: string) {
    let doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

const NotesForLead: React.FunctionComponent<NotesForLeadProps> = ({ leadSelected, leads }) => {
    const [note, setNote] = React.useState<string>("")
    const [noteid, setNoteId] = React.useState<string>("")
    const [contactsTable, setContactsTable] = React.useState<string>("")
    const [leadSelectedDetails, setLeadSelectedDetails] = React.useState<Lead>()
    const [submitState, setSubmitState] = React.useState<SubmitState>(SubmitState.NOT_SUBMITTED)

    const submitNotes = async (note: string, contacts: string, leadid: string, noteid: string, setSubmitState: React.Dispatch<React.SetStateAction<SubmitState>>) => {
        setSubmitState(SubmitState.SUBMITTING)
        if (noteid !== "") {

        } else {
            await fetch("https://microsoftsales.crm.dynamics.com/api/data/v9.0/annotations", {
                "headers":{
                    "content-type": "application/json",
                },
                "body": `{\"notetext\":"${note}\",\"objectid_lead@odata.bind\":\"/leads(${leadid})\"}`,
                "method": "POST"
            });
        }
        setSubmitState(SubmitState.NOT_SUBMITTED)
    }

    React.useEffect(() => {
        setLeadSelectedDetails(leads.filter((lead) => lead.leadid === leadSelected)[0])
    }, [leadSelected])

    React.useEffect(() => {
        setNote("")
        if (leadSelectedDetails && leads.length > 0 && leadSelected) {
            const noteList = leadSelectedDetails.Lead_Annotation.map((annotation: Annotation) => annotation)
            const signpostedNotes = noteList.filter(note => note.notetext.includes("msx-d"))
            if (signpostedNotes.length > 0) {
                setNote(signpostedNotes[0].notetext)
                setNoteId(signpostedNotes[0].annotationid)
            } else {
                setNote(strip(noteList!.map(x => x.notetext.replaceAll("\n\n", "\n")).join("\n")))
            }
        }
        // setNote()
    }, [leadSelectedDetails])

    if (!leadSelected) return null
    return <div className='flex flex-col p-5 flex-grow' >
        <div className="bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700 flex w-full">
            <div className="p-5 w-full flex flex-col">
                <a href="#">
                    <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{leadSelectedDetails?.msp_leadnumber}</h5>
                </a>
                <div className="flex items-center">
                    <textarea value={note} onChange={(change) => setNote(change.target.value)} placeholder="Notes" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 my-3" style={{ height: "400px" }} />
                </div>
                <Contacts />
                {submitState === SubmitState.NOT_SUBMITTED ? <button onClick={() => submitNotes(note, "", leadSelected, noteid, setSubmitState)} className="bg-blue-500 hover:bg-blue-400 text-white font-semibold mt-5 py-2 px-4 border rounded shadow flex-grow-0 mr-auto display-inline">
                    Save <FaSave className='inline ml-2 -mt-1' />
                </button> : null}
                {submitState === SubmitState.SUBMITTING ? <button className="bg-blue-500 text-white font-semibold mt-5 py-2 px-4 border rounded shadow flex-grow-0 mr-auto display-inline">
                    Saving...
                </button> : null}
            </div>

        </div>
    </div>;
}

export default NotesForLead;