import moment from "moment"

export type Opportunity = {
    name: string
    opportunityid: string
    _customerid_value: string
    _ownerid_value: string
    msp_opportunitynumber: string
    stepname: string
    statuscode: number
    totalamount_base: number
    salesstagecode: number
    createdon: string
    modifiedon: string
    msp_estcompletiondate: string
    estimatedclosedate: string
    msp_forecastcommentsjsonfield: string
    "_ownerid_value@OData.Community.Display.V1.FormattedValue": string
    "_customerid_value@OData.Community.Display.V1.FormattedValue": string
    "msp_salesplay@OData.Community.Display.V1.FormattedValue": string
    "msp_solutionarea@OData.Community.Display.V1.FormattedValue": string
    milestones: Milestone[]
}

export interface OpportunityComments {
    userId: string
    modifiedOn: string
    comment: string
}

export type Milestone = {
    msp_engagementmilestoneid: string
    msp_milestonedate: string
    msp_milestonenumber: string
    msp_name: string
    msp_monthlyuse: number
    msp_nonrecurring: number | null
    msp_milestonecomments: string
    statuscode: number
    _ownerid_value: string
    msp_committedon: string
    modifiedon: string
    msp_healthescalationcreatedate: string
    _msp_opportunityid_value: string
    "msp_milestonestatus@OData.Community.Display.V1.FormattedValue": string
    "_ownerid_value@OData.Community.Display.V1.FormattedValue": string
    "_modifiedby_value@OData.Community.Display.V1.FormattedValue": string
    "_modifiedby_value@Microsoft.Dynamics.CRM.lookuplogicalname": string
    "msp_commitmentrecommendation@OData.Community.Display.V1.FormattedValue": string
    "_msp_workloadlkid_value@OData.Community.Display.V1.FormattedValue": string
}



export interface MsxData {
    Opportunities: Opportunity[]
    Milestones: Milestone[]
}

export function getOpportunityComments(op: Opportunity): OpportunityComments[] | undefined {
    if (!op.msp_forecastcommentsjsonfield) return undefined
    return (JSON.parse(op.msp_forecastcommentsjsonfield) as OpportunityComments[])
        .sort((a, b) => moment(a.modifiedOn) < moment(b.modifiedOn) ? 1 : -1)
}

