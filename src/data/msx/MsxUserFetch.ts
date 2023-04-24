'use strict';
import { fetch } from './Puppeteer'
import { DynamicsResponse, MsxData, SystemUser } from './Dynamics'


export namespace Xrm.WebApi {
    export function retrieveMultipleRecords<T>(entityName: string, odata: string): DynamicsResponse<T> {
        return {
            entities: []
        }
    }
}

export async function fetchUserDataFromMsx(userEmail: string, msxData: MsxData): Promise<void> {

    console.log(`Querying user ${userEmail}`)

    const user = await fetch(uem =>
        Xrm.WebApi.retrieveMultipleRecords<any>('systemuser', `?$filter=internalemailaddress eq '${uem}'`), userEmail
    ) as DynamicsResponse<SystemUser>

    if (user.entities.length === 0) {
        msxData.Milestones = []
        msxData.Opportunities = []
        return
    }

    const userId = user.entities[0].ownerid

    const opportunitiesByOwnedMilestones = await fetch(uId =>
        Xrm.WebApi.retrieveMultipleRecords<any>('msp_engagementmilestone', `?$filter=_ownerid_value eq ${uId}`), userId
    ) as DynamicsResponse<any>

    
    if (opportunitiesByOwnedMilestones.entities.length === 0) {
        msxData.Milestones = []
        msxData.Opportunities = []
        return
    }

    const distinctIds = opportunitiesByOwnedMilestones.entities.reduce((p, c) => { p[c._msp_opportunityid_value] = ''; return p; }, {})
    console.log(`Fetched ${Object.keys(distinctIds).length} opportunity ids`)

    var populatedFilter = Object.keys(distinctIds).reduce((p, c) => `${p} opportunityid eq ${c} or`, '')
    populatedFilter = populatedFilter.substring(0, populatedFilter.length - 2)

    //any owned opportunities
    populatedFilter = `?$filter=(${populatedFilter} or _ownerid_value eq ${userId}) and statecode eq 0 and statuscode eq 1`
    console.log(populatedFilter)

    //Execute the query in the browser
    const opportunities = await fetch(filter =>
        Xrm.WebApi.retrieveMultipleRecords<any>('opportunity', filter), populatedFilter
    ) as DynamicsResponse<any>

    console.log(`Fetched ${opportunities.entities.length} opportunities`)

    populatedFilter = opportunities.entities.reduce((p, c) => `${p} _msp_opportunityid_value eq ${c.opportunityid} or`, '?$filter=')
    populatedFilter = populatedFilter.substring(0, populatedFilter.length - 2)
    const milestones = await fetch(filter =>
        Xrm.WebApi.retrieveMultipleRecords<any>('msp_engagementmilestone', filter), populatedFilter
    )
    console.log(`Fetched ${milestones.entities.length} milestones`)

    msxData.Milestones = milestones.entities
    msxData.Opportunities = opportunities.entities
}

