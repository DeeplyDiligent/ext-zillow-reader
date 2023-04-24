'use strict';
import { fetch } from './Puppeteer'
import { Account, DynamicsResponse, MsxData, Territory } from './Dynamics'
import { fetchForAccountRawId, fetchTaskResult } from './MsxStore';

export namespace Xrm.WebApi {
    export function retrieveMultipleRecords<T>(entityName: string, odata: string): DynamicsResponse<T> {
        return {
            entities: []
        }
    }
}

export async function fetchTerritoryDataFromMsx(territory: string, msxData: MsxData): Promise<void> {

    console.log(`Querying territory ${territory}`)

    const territories = await fetch(t =>
        Xrm.WebApi.retrieveMultipleRecords<any>('territory', `?$filter=msp_accountteamunitname eq '${t}' or name eq '${t}' &$select=name`), territory
    ) as DynamicsResponse<Territory>

    if (territories.entities.length === 0) {
        msxData.Milestones = []
        msxData.Opportunities = []
        return
    }

    const distinctIds = territories.entities.map(x => x.territoryid)
    console.log(`Fetched ${distinctIds.length} territory ids`)

    var populatedFilter = distinctIds.reduce((p, c) => `${p} _territoryid_value eq '${c}' or`, '')
    populatedFilter = populatedFilter.substring(0, populatedFilter.length - 2)

    //Execute the query in the browser
    const territoryAccounts = await fetch(filter =>
        Xrm.WebApi.retrieveMultipleRecords<any>('account', `?$filter=${filter}`), populatedFilter
    ) as DynamicsResponse<Account>

    console.log(`Fetched ${territoryAccounts.entities.length} accounts`)

    //need to fetch all the data for these accounts. Makes sense to leverage the account fetch
    const accountFetchTasks = territoryAccounts.entities.map(x => fetchForAccountRawId(x.accountid, true))
    await Promise.all(accountFetchTasks.map(x => x.fetchPromise))

    msxData.Milestones = accountFetchTasks.flatMap(x => fetchTaskResult(x.taskId)!.Milestones)
    msxData.Opportunities = accountFetchTasks.flatMap(x => fetchTaskResult(x.taskId)!.Opportunities)
}
