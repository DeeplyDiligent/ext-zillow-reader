import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import moment, { Moment } from 'moment'

export enum CommitmentFilter {
    Committed = 1,
    Uncommitted = 2
}

export enum ProgressFilter {
    OnTrack,
    Completed,
    Cancelled,
    Blocked,
    AtRisk
}

export interface FilterState {
    commitmentFilter: CommitmentFilter[]
    progressFilter: ProgressFilter[]
    hideOpportunitiesWithZeroVisibleMilestones: boolean
    freeText: string
    milestoneFreeText: string
    hideAnythingBefore: number
    hideAnythingAfter: number
    stagesToShow: string[]
}

const initialState: FilterState = {
    commitmentFilter: [],
    progressFilter: [ProgressFilter.Completed, ProgressFilter.Cancelled],
    hideOpportunitiesWithZeroVisibleMilestones: true,
    freeText: '',
    milestoneFreeText: '',
    hideAnythingBefore: moment().subtract(2, 'months').toDate().getTime(),
    hideAnythingAfter: moment().add(2, 'years').toDate().getTime(),
    stagesToShow: ['2', '3', '4']
}

export const filterSlice = createSlice({
    name: 'filter',
    initialState,
    reducers: {
        setProgressFilter: (state, action: PayloadAction<ProgressFilter[]>) => {
            state.progressFilter = action.payload
        },
        setCommitmentFilter: (state, action: PayloadAction<CommitmentFilter[]>) => {
            state.commitmentFilter = action.payload
        },
        setFreeText: (state, action: PayloadAction<string>) => {
            state.freeText = action.payload
        },
        setMilestoneFreeText: (state, action: PayloadAction<string>) => {
            state.milestoneFreeText = action.payload
        },
        setHideAnythingBefore: (state, action: PayloadAction<Moment>) => {
            state.hideAnythingBefore = action.payload.toDate().getTime()
        },
        setHideAnythingAfter: (state, action: PayloadAction<Moment>) => {
            state.hideAnythingAfter = action.payload.toDate().getTime()
        },
        setStageToShow: (state, action: PayloadAction<string>) => {
            state.stagesToShow = state.stagesToShow.concat(action.payload)
        },
        setStageToHide: (state, action: PayloadAction<string>) => {
            state.stagesToShow = state.stagesToShow.filter(x => x !== action.payload)
        },
        setHideOpportunitiesWithZeroVisibleMilestones: (state, action: PayloadAction<boolean>) => {
            state.hideOpportunitiesWithZeroVisibleMilestones = action.payload
        },
    },
})

// Action creators are generated for each case reducer function
export const { setFreeText, setMilestoneFreeText, setHideAnythingAfter, setHideAnythingBefore, setStageToShow, setStageToHide, setHideOpportunitiesWithZeroVisibleMilestones, setCommitmentFilter, setProgressFilter } = filterSlice.actions

export default filterSlice.reducer
