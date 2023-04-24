import { fetchForAccount, fetchForUser, fetchOpportunity, fetchOpportunityMilestones, fetchTaskStatus, fetchTaskResult, fetchForTerritory, fetchForUnknownId } from './msx/MsxStore'
import { fetchQuery } from './msx/MsxRawQuery';

export const getUser = (userid:string,forceRefresh: string) => {
    const taskId = fetchForUser(userid, forceRefresh === 'true').taskId
    return (taskId)
};

export const query = async (entity: string, query: string) => {
    return await fetchQuery(entity, query);
}

export const search = async (searchTerms: string, forceRefresh: string) => {
    const taskId = fetchForUnknownId(searchTerms, forceRefresh === 'true').taskId
    return (taskId)
};

export const getAccount = (accountid: string, forceRefresh: string) => {
    const taskId = fetchForAccount(accountid, forceRefresh === 'true').taskId
    return (taskId)
};

export const getTerritory = (territoryName: string, forceRefresh: string) => {
    const taskId = fetchForTerritory(territoryName, forceRefresh === 'true').taskId
    return (taskId)
};

export const getTaskData = (taskid: string) => {
    const result = fetchTaskResult(taskid)
    return (result)
};

export const getTaskStatus = (taskid: string) => {
    const status = fetchTaskStatus(taskid)
    return (status)
};

export const getOpportunity = (opportunityId: string) => {
    const msxData = fetchOpportunity(opportunityId)
    return (msxData)
};

export const getOpportunityMilestones = async (opportunityId: string) => {
    const msxData = await fetchOpportunityMilestones(opportunityId)
    return (msxData)
};