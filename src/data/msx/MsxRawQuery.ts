'use strict';
import { startMsxBrowser } from './Puppeteer';
import { DynamicsResponse, MsxData } from './Dynamics'

export namespace Xrm.WebApi {
    export function retrieveMultipleRecords<T>(entityName: string, odata: string): DynamicsResponse<T> {
        return {
            entities: []
        }
    }
}

export async function fetchQuery(entity: string, query: string): Promise<DynamicsResponse<any> | Error> {
    try {
        const results = await (await startMsxBrowser()).evaluate((et, q) => {
            console.log(`Entity: ${et}`)
            console.log(`?$filter=${q}`)
            return Xrm.WebApi.retrieveMultipleRecords<any>(et, `?$filter=${q}`)
        }, entity, query
        )
        return results
    } catch (e) {
        return e as Error
    }
}