import moment from "moment"
import { Milestone, MsxData, Opportunity } from "../components/Dynamics"
import { CommitmentFilter, FilterState, ProgressFilter } from "./filterSlice"

function showOpportunity(opportunity: Opportunity, filter: FilterState): ShowOpportunityResult {

    //treat stage 5 as 'Completed'
    if (!filter.stagesToShow.includes(getMsxStage(opportunity).msxStage.toString())) return {
        showOpportunity: false
    }

    if (filter.freeText.length > 2) {
        const owner = opportunity['_ownerid_value@OData.Community.Display.V1.FormattedValue'] as string
        const dataToSearch = [
            owner.toLowerCase(),
            opportunity.opportunityid.toLowerCase(),
            opportunity.msp_opportunitynumber.toLowerCase(),
            opportunity.name.toLowerCase()
        ]
        const searchResult = executeFreeTextSearch(filter.freeText, dataToSearch)
        if (!searchResult) {
            return {
                showOpportunity: false
            }
        }
    }

    return {
        showOpportunity: opportunity.milestones.length > 0 ? true : !filter.hideOpportunitiesWithZeroVisibleMilestones
    }

}

enum SearchStringQualifier {
    MustHave,
    MustNotHave,
    Or
}
interface SearchStringWithQualifier {
    qualifier: SearchStringQualifier | undefined,
    word: string
}
function executeFreeTextSearch(freeText: string, potentialMatches: string[]): boolean {

    const splitFreeText = splitString(freeText.toLowerCase())

    const potentialMatchWords = potentialMatches.flatMap(x => splitString(x).map(y => y.word))
    const distinctPotentialMatchWords = potentialMatchWords.filter((x, idx) => idx === potentialMatchWords.indexOf(x))
    const isMatch = (word: string) => {
        if (word.indexOf(' ') === -1) 
            return distinctPotentialMatchWords.find(x => x.startsWith(word)) !== undefined
        else
            //searching for a phrase with spaces in. Simpler search
            return potentialMatches.find(x => x.indexOf(word) !== -1) !== undefined

    }

    if (splitFreeText.find(x => x.qualifier === SearchStringQualifier.MustNotHave)) {
        //look for anything with the must not have words. Return false if we find any
        const notHaves = splitFreeText.filter(x => x.qualifier === SearchStringQualifier.MustNotHave)
        const mustNotHave = notHaves.find(w => isMatch(w.word)) !== undefined
        if (mustNotHave) {
            return false;
        }
    }

    if (splitFreeText.find(x => x.qualifier === SearchStringQualifier.MustHave)) {
        //look for any mention of the must have words. Return false if we don't have any
        const mustHaves = splitFreeText.filter(x => x.qualifier === SearchStringQualifier.MustHave)
        if (mustHaves.filter(w => isMatch(w.word)).length !== mustHaves.length) {
            return false;
        }
    }

    //return anything with the must-have, or the 'or' words
    const filtersOtherThanMustNotHave = splitFreeText.filter(x => x.qualifier !== SearchStringQualifier.MustNotHave)
    const passesFilter = filtersOtherThanMustNotHave.find(w => isMatch(w.word)) !== undefined
    return filtersOtherThanMustNotHave.length === 0 || passesFilter 
}

//written by Chat GPT :D
function splitString(str: string): SearchStringWithQualifier[] {
    let words: SearchStringWithQualifier[] = [];
    let sentence = '';
    let isInSentence = false;
    let qualifier: SearchStringQualifier | undefined = undefined

    const pushSentence = (sentence: string) => {
        words.push({
            qualifier: qualifier === undefined ? SearchStringQualifier.Or : qualifier,
            word: sentence
        });
    }

    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '+' && qualifier === undefined) {
            qualifier = SearchStringQualifier.MustHave
        } else if (char === '-' && qualifier === undefined) {
            qualifier = SearchStringQualifier.MustNotHave
        } else if (char === '"') {
            isInSentence = !isInSentence;
            if (isInSentence) {
                sentence = '';
            } else {
                pushSentence(sentence)
                sentence = '';
            }
        } else if (char === ' ' && !isInSentence) {
            if (sentence !== '') {
                pushSentence(sentence)
                sentence = '';
                qualifier = undefined
            }
        } else {
            qualifier = qualifier ?? SearchStringQualifier.Or
            sentence += char;
        }
    }

    if (sentence !== '') {
        pushSentence(sentence)
    }

    return words;
}


function showMilestone(milestone: Milestone, filter: FilterState): boolean {

    const status = milestone['msp_milestonestatus@OData.Community.Display.V1.FormattedValue' as keyof Milestone] as string

    const hideBecauseCompleted = status === 'Completed' && filter.progressFilter.includes(ProgressFilter.Completed)
    if (hideBecauseCompleted) return false

    const hideBecauseCancelled = status === 'Cancelled' &&  filter.progressFilter.includes(ProgressFilter.Cancelled)
    if (hideBecauseCancelled) return false

    const hideBecauseOnTrack = status === 'On Track' &&  filter.progressFilter.includes(ProgressFilter.OnTrack)
    if (hideBecauseOnTrack) return false

    const commitment = milestone['msp_commitmentrecommendation@OData.Community.Display.V1.FormattedValue' as keyof Milestone] as string
    
    const hideBecauseCommitted = commitment === 'Committed' && filter.commitmentFilter.includes(CommitmentFilter.Committed)
    if (hideBecauseCommitted) return false

    const hideBecauseUncommitted = commitment === 'Uncommitted' &&  filter.commitmentFilter.includes(CommitmentFilter.Uncommitted)
    if (hideBecauseUncommitted) return false

    const hideBecauseOlderThanLowPass = new Date(milestone.msp_milestonedate).getTime() <= filter.hideAnythingBefore
    const hideBecauseNewerThenHighLowPass = new Date(milestone.msp_milestonedate).getTime() >= filter.hideAnythingAfter
    if (hideBecauseOlderThanLowPass || hideBecauseNewerThenHighLowPass) return false


    if (filter.milestoneFreeText.length > 2) {
        const owner = milestone['_ownerid_value@OData.Community.Display.V1.FormattedValue' as keyof Milestone] as string
        const type = milestone['_msp_workloadlkid_value@OData.Community.Display.V1.FormattedValue']
        const dataToSearch = [
            owner.toLowerCase(),
            milestone.msp_name.toLowerCase(),
            milestone.msp_milestonenumber.toLowerCase(),
            type.toLowerCase()
        ]

        return executeFreeTextSearch(filter.milestoneFreeText, dataToSearch)
    }

    return true
}

export function getMsxStage(opportunity: Opportunity): Stage {
    const stageRegex = /(\d)-(\d)-(.*)/
    const stage = stageRegex.exec(opportunity.stepname)?.[1] ?? '?'
    return stages[stage] ?? {
        msxStage: 9999, name: 'Unknown', internalStage: stage
    }
}

export const stages: Record<string, Stage> = {
    '3': { msxStage: 1, name: 'Listen & Consult', internalStage: '3' },
    '4': { msxStage: 2, name: 'Inspire & Design', internalStage: '4' },
    '5': { msxStage: 3, name: 'Empower & Achieve', internalStage: '5' },
    '6': { msxStage: 4, name: 'Realise Value', internalStage: '6' },
    '7': { msxStage: 5, name: 'Manage & Optimise', internalStage: '7' },
}

interface Stage {
    name: string
    msxStage: number
    internalStage: string
}

export function filterData(raw: MsxData, filter: FilterState): MsxData {
    var filteredMilestones: Milestone[] = []
    var filteredOps: Opportunity[] = []
    raw.Opportunities.forEach(o => {
        const clonedOp = { ...o }
        clonedOp.milestones = o.milestones.filter(m => showMilestone(m, filter))
 
        const filterResult = showOpportunity(clonedOp, filter)
        if (filterResult.showOpportunity) {
            const clonedOp = { ...o }
            filteredOps.push(clonedOp)
            clonedOp.milestones = o.milestones.filter(m => showMilestone(m, filter))
            filteredMilestones = filteredMilestones.concat(clonedOp.milestones)
        }
    })
    return {
        Milestones: filteredMilestones,
        Opportunities: filteredOps
    }
}

interface ShowOpportunityResult {
    showOpportunity: boolean
}

export function sortMilestones(milestones: Milestone[]): Milestone[] {
    return milestones.sort((a, b) => moment(a.msp_milestonedate, 'YYYY-MM-DD') < moment(b.msp_milestonedate, 'YYYY-MM-DD') ? -1 : 1)
}