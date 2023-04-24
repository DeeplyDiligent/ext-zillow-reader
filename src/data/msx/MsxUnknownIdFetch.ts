'use strict';
import { DynamicsResponse, MsxData } from './Dynamics'
import { fetchForAccount, fetchForUser, fetchForTerritory, fetchTaskResult } from './MsxStore';

export namespace Xrm.WebApi {
    export function retrieveMultipleRecords<T>(entityName: string, odata: string): DynamicsResponse<T> {
        return {
            entities: []
        }
    }
}

//generic google style search. Take a guess at what type of id it is, then fetch
export async function fetchUnknownFromMsx(id: string, msxData: MsxData): Promise<void> {

    const isEmailCrude = id.indexOf('@') !== -1
    let tasks =isEmailCrude
        ? [fetchForUser(id, true)]
        : [
            fetchForAccount(id, true),
            fetchForTerritory(id, true),
        ]

    await Promise.all(tasks.map(x => x.fetchPromise))

    msxData.Milestones = tasks.flatMap(x => fetchTaskResult(x.taskId)!.Milestones)
    msxData.Opportunities = tasks.flatMap(x => fetchTaskResult(x.taskId)!.Opportunities)
}
