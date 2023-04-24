'use strict';
import { fetch, startMsxBrowser } from './Puppeteer';
import { DynamicsResponse, MsxData } from './Dynamics';
import { randomUUID } from 'crypto';
import { fetchTerritoryDataFromMsx } from './MsxTerritoryFetch'
import { fetchAccountDataFromMsxUsingSalesId, fetchAccountDataFromMsx } from './MsxAccountFetch'
import { fetchUserDataFromMsx } from './MsxUserFetch'
import { fetchUnknownFromMsx } from './MsxUnknownIdFetch';

export namespace Xrm.WebApi {
    export function retrieveMultipleRecords<T>(entityName: string, odata: string): DynamicsResponse<T> {
        return {
            entities: []
        }
    }
}

let cache = localStorage
let tasks: MsxTask[] = []


export interface FetchResult {
    taskId: string
    fetchPromise: Promise<void>
}

export function fetchForAccount(accountId: string, forceFetch: boolean): FetchResult {
    return fetchData(accountId, MsxFetchType.Account, forceFetch)
}

export function fetchForAccountRawId(accountIds: string, forceFetch: boolean): FetchResult {
    return fetchData(accountIds, MsxFetchType.AccountUsingRawId, forceFetch)
}

export function fetchForUser(userIds: string, forceFetch: boolean): FetchResult {
    return fetchData(userIds, MsxFetchType.User, forceFetch)
}

export function fetchForTerritory(territories: string, forceFetch: boolean): FetchResult {
    return fetchData(territories, MsxFetchType.Territory, forceFetch)
}

export function fetchForUnknownId(rawIds: string, forceFetch: boolean): FetchResult {
    return fetchData(rawIds, MsxFetchType.Unknown, forceFetch)
}


//Either return existing fetch task, or add a new fetch task.
function fetchData(msxId: string, fetchType: MsxFetchType, forceFetch: boolean): FetchResult {

    //if comma separated create a wrapping cache-key to represent the task, then fire off the individuals
    const cacheEntryKey = buildCacheKey(msxId, fetchType)
    const cacheEntry: MsxData | undefined = cache.get(cacheEntryKey)
    if (cacheEntry === undefined || forceFetch) {
        const newTaskId = randomUUID()

        var resolver: (() => void) | undefined = undefined
        var rejector: ((e: any) => void) | undefined = undefined
        const promise = new Promise<void>((resolve, reject) => {
            resolver = resolve
            reject = reject
        })

        const taskMetadata = {
            fetchAtttempts: 0,
            id: newTaskId,
            msxId: msxId,
            state: MsxFetchState.Pending,
            type: fetchType,
            reason: undefined,
            forceFetch: forceFetch,
            resolver: resolver!,
            rejector: rejector!,
        }

        tasks.push(taskMetadata)

        const msxData: MsxData = {
            Milestones: [],
            Opportunities: [],
            taskId: newTaskId,
            fetchPromise: promise,
        }
        cache.set(cacheEntryKey, msxData)
        return {
            taskId: newTaskId,
            fetchPromise: msxData.fetchPromise
        }
    }
    return {
        taskId: cacheEntry.taskId,
        fetchPromise: cacheEntry.fetchPromise
    }
}

export async function fetchOpportunity(opportunityId: string): Promise<DynamicsResponse<any>> {
    var singleOpportunityFilter = `?$filter=opportunityid eq ${opportunityId}`

    //Execute the query in the browser
    return await fetch(filter => Xrm.WebApi.retrieveMultipleRecords<any>('opportunity', filter), singleOpportunityFilter) as DynamicsResponse<any>
}

export async function fetchOpportunityMilestones(opportunityId: string): Promise<DynamicsResponse<any>> {
    var singleOpportunityFilter = `?$filter=_msp_opportunityid_value eq ${opportunityId}`

    //Execute the query in the browser
    return await fetch(filter =>
        Xrm.WebApi.retrieveMultipleRecords<any>('msp_engagementmilestone', filter), singleOpportunityFilter
    ) as any
}

export function fetchTaskStatus(taskId: string): MsxTask | undefined {
    return tasks.find(t => t.id === taskId)
}

export function fetchTaskResult(taskId: string): MsxData | undefined {
    const task = tasks.find(t => t.id === taskId)
    if (task !== undefined) {
        const cacheEntryKey = buildCacheKey(task.msxId, task.type)
        const cacheEntry: MsxData | undefined = cache.get(cacheEntryKey)
        return cacheEntry
    }
}



//spin up the browser to speed up first access. Don't bother about awaiting this task
const browserPromise = startMsxBrowser()

process.on('exit', async function () {
    console.log('Detected node exit. Closing down browser')
    await backgroundPromise
    if (browserPromise !== undefined) {

        browserPromise.then(p => p.close());
    }
});


let runBackground = true
let backgroundPromise = createBackgroundProcessor()

enum MsxFetchType {
    User,
    Account,
    AccountUsingRawId,
    Territory,
    Unknown
}

enum MsxFetchState {
    Pending,
    Fetching,
    Finished,
    Abandoned
}
interface MsxTask {
    id: string
    type: MsxFetchType,
    msxId: string,
    forceFetch: boolean,
    fetchAtttempts: number,
    state: MsxFetchState
    reason: string | undefined,
    resolver: () => void,
    rejector: (e: any) => void,
}

function buildCacheKey(key: string, type: MsxFetchType) {
    let sortedParts = key.split(',').sort()
    let sortedKey = sortedParts.join(',')
    return `${type.toString()}-${sortedKey}`
}

async function createBackgroundProcessor(): Promise<void> {
    console.log('Starting Background Processor')
    while (runBackground) {
        await sleep(250)
        if (tasks.length > 0) {
            let firstTask = tasks.find(x => x.state === MsxFetchState.Pending)
            if (firstTask !== undefined) {

                const cacheEntryKey = buildCacheKey(firstTask.msxId, firstTask.type)
                console.log(`Fetching task key: ${cacheEntryKey}`)
                const msxResult = cache.get<MsxData>(cacheEntryKey)!

                const handleResult = () => {
                    console.log(`Fetched task key: ${cacheEntryKey}`)
                    cache.set(cacheEntryKey, msxResult, 60 * 120)
                    firstTask!.state = MsxFetchState.Finished
                    firstTask!.resolver()
                }

                const handleError = (e: Error) => {
                    console.log(e)
                    console.log(`Error fetching ${firstTask!.msxId}/${firstTask?.type}`)
                    firstTask!.fetchAtttempts = firstTask!.fetchAtttempts + 1
                    if (firstTask!.fetchAtttempts === 5) {
                        firstTask!.state = MsxFetchState.Abandoned
                        firstTask!.reason = e.message
                        firstTask!.resolver()
                    } else {
                        firstTask!.state = MsxFetchState.Pending
                    }
                }

                firstTask.state = MsxFetchState.Fetching
                runTask(firstTask, msxResult, handleResult, handleError)
            }
        }
    }
    console.log('Stopping Background Processor')
}

async function runTask(task: MsxTask, result: MsxData, handleResult: () => void, handleError: (e: Error) => void): Promise<void> {

    //handle multi-task:
    if (task.msxId.indexOf(',') === -1) {
        return runSingleTask(task, result, handleResult, handleError)
    } else {
        const subTasks = task.msxId.split(',').map(msxId => {
            let newTask: FetchResult | undefined = undefined
            switch (task.type) {
                case MsxFetchType.Account:
                    //used to await, but this blocks the process loop meaning we cannot initiate sub-searches to fulfill requests for territories which in-turn request accounts
                    newTask = fetchForAccount(msxId, task.forceFetch)
                    break;
                case MsxFetchType.AccountUsingRawId:
                    newTask = fetchForAccountRawId(msxId, task.forceFetch)
                    break;
                case MsxFetchType.User:
                    newTask = fetchForUser(msxId, task.forceFetch)
                    break;
                case MsxFetchType.Territory:
                    newTask = fetchForTerritory(msxId, task.forceFetch)
                    break;
                case MsxFetchType.Unknown:
                    newTask = fetchForUnknownId(msxId, task.forceFetch)
                    break;

            }
            return newTask
        })
        return Promise.all(subTasks.map(x => x.fetchPromise)).then(() => {

            const allMilestones = subTasks.flatMap(x => fetchTaskResult(x.taskId)!.Milestones)
            const allOpportunities = subTasks.flatMap(x => fetchTaskResult(x.taskId)!.Opportunities)

            const distinctMilestones = allMilestones.map(x => x.msp_engagementmilestoneid).filter(onlyUnique)
            const distinctOpportunities = allOpportunities.map(x => x.opportunityid).filter(onlyUnique)

            result.Milestones = distinctMilestones.map(x => allMilestones.find(m => m.msp_engagementmilestoneid == x)!)
            result.Opportunities = distinctOpportunities.map(x => allOpportunities.find(m => m.opportunityid == x)!)

        }).then(handleResult).catch(handleError)
    }

    function onlyUnique<T, S>(value: T, index: number, array: T[]) {
        return array.indexOf(value) === index;
    }
}


async function runSingleTask(task: MsxTask, result: MsxData, handleResult: () => void, handleError: (e: Error) => void): Promise<void> {
    switch (task.type) {
        case MsxFetchType.Account:
            //used to await, but this blocks the process loop meaning we cannot initiate sub-searches to fulfill requests for territories which in-turn request accounts
            fetchAccountDataFromMsxUsingSalesId(task.msxId, result, true).then(handleResult).catch(handleError)
            break;
        case MsxFetchType.AccountUsingRawId:
            fetchAccountDataFromMsx(task.msxId, result).then(handleResult).catch(handleError)
            break;
        case MsxFetchType.User:
            fetchUserDataFromMsx(task.msxId, result).then(handleResult).catch(handleError)
            break;
        case MsxFetchType.Territory:
            fetchTerritoryDataFromMsx(task.msxId, result).then(handleResult).catch(handleError)
            break;
        case MsxFetchType.Unknown:
            fetchUnknownFromMsx(task.msxId, result).then(handleResult).catch(handleError)
            break;
        }
}

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
