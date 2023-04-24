export interface DynamicsResponse<T> {
    entities: T[]
}

export interface MsxData {
    taskId: string
    Opportunities: Opportunity[]
    Milestones: Milestone[]
    fetchPromise: Promise<void>
}

export interface SystemUser {
    ownerid: string
}

export interface Territory {
    territoryid: string
    name: string
}

export interface Account {
    accountid: string
    msp_mstopparentid: string
    msp_mssalesid: string
}

export interface Opportunity {
    opportunityid: string
}

export interface Milestone {
    msp_engagementmilestoneid: string
}

