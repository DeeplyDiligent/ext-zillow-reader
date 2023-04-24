'use strict';
import { fetch } from './Puppeteer'
import { DynamicsResponse, MsxData, Account } from './Dynamics'
import { fetchForAccountRawId, fetchTaskResult } from './MsxStore';


export namespace Xrm.WebApi {
    export function retrieveMultipleRecords<T>(entityName: string, odata: string): DynamicsResponse<T> {
        return {
            entities: []
        }
    }
}

export async function fetchAccountDataFromMsx(accountId: string, msxData: MsxData): Promise<void> {

    const opportunities = await fetch(opId =>
        Xrm.WebApi.retrieveMultipleRecords<any>('opportunity', `?$filter=_accountid_value eq ${opId} and statecode eq 0 and statuscode eq 1`), accountId
    ) as DynamicsResponse<any>

    console.log(`Fetched ${opportunities.entities.length} opportunities`)
    if (opportunities.entities.length === 0) {
        msxData.Milestones = []
        msxData.Opportunities = []
        return
    }

    //build up an OData query to pass to the Dynamics javascript sdk
    var populatedFilter = opportunities.entities.reduce((p, c) => `${p} _msp_opportunityid_value eq ${c.opportunityid} or`, '?$filter=')
    populatedFilter = populatedFilter.substring(0, populatedFilter.length - 2)

    //Execute the query in the browser
    const milestones = await fetch(filter =>
        Xrm.WebApi.retrieveMultipleRecords<any>('msp_engagementmilestone', filter), populatedFilter
    ) as DynamicsResponse<any>
    console.log(`Fetched ${milestones.entities.length} milestones`)
    msxData.Milestones = milestones.entities
    msxData.Opportunities = opportunities.entities
}

export async function fetchAccountDataFromMsxUsingSalesId(salesId: string, msxData: MsxData, forceFetch: boolean): Promise<void> {

    console.log(`Querying account ${salesId}`)

    const topParentAccount = await fetch(sid =>
        Xrm.WebApi.retrieveMultipleRecords<any>('account', `?$filter=msp_mstopparentid eq '${sid}' or msp_mssalesid eq '${sid}'`), salesId
    ) as DynamicsResponse<Account>

    if (topParentAccount.entities.length === 0) {
        msxData.Milestones = []
        msxData.Opportunities = []
        return
    }

    const accountFetchTasks = topParentAccount.entities.map(x => fetchForAccountRawId(x.accountid, true))
    await Promise.all(accountFetchTasks.map(x => x.fetchPromise))

    msxData.Milestones = accountFetchTasks.flatMap(x => fetchTaskResult(x.taskId)!.Milestones)
    msxData.Opportunities = accountFetchTasks.flatMap(x => fetchTaskResult(x.taskId)!.Opportunities)
}

