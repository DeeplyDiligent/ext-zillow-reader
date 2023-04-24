import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { MsxData } from '../components/Dynamics'
import { RootState } from '../store'
import { search } from '@/data'

export interface Msx {
  rawData: MsxData
  fetching: boolean,
  failedFetchMessage: string | undefined,
  hasSearched: boolean
}

const initialState: Msx = {
  rawData: {
    Milestones: [],
    Opportunities: []
  },
  fetching: false,
  failedFetchMessage: undefined,
  hasSearched: false
}

export interface FetchCriteria {
  entities: string
  force: boolean
}

export const fetchData = createAsyncThunk<Msx, FetchCriteria, { state: RootState }>(
  'msx/fetch',
  async (critera, thunkApi) => {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 20000)

    const qs = new URLSearchParams()
    qs.append('searchTerms', critera.entities)
    qs.append('forceRefresh', critera.force.toString())
    return await search(qs.toString(),)
      .then(async r => {
        if (r.status === 202) {
          let poll = true
          let taskId = await (r.text() as Promise<string>)
          while (poll) {
            const result = await fetch(`http://localhost:5678/msxdata/task/${taskId}`)
            if (result.ok) {
              const taskResult = await (result.json() as Promise<MsxFetchResult>)
              if (taskResult.state >= 2) {
                return fetch(`http://localhost:5678/msxdata/task/${taskId}/data`)
              } else {
                await sleep(200)
              }
            } else {
              throw new Error(`${r.status} - ${r.statusText}`)
            }
          }
        } else {
          throw new Error(`${r.status} - ${r.statusText}`)
        }
      })
      .then(r => {
        if (r === undefined) {
          throw new Error('No results returned')
        }
        if (r.ok) {
          return r.json() as Promise<MsxData>
        } else {
          throw new Error(`${r.status} - ${r.statusText}`)
        }
      })
      .then(r => {
        r.Opportunities.forEach(o => o.milestones = r.Milestones.filter(m => m._msp_opportunityid_value === o.opportunityid) ?? [])
        return {
          rawData: r,
          fetching: false,
          failedFetchMessage: undefined,
          hasSearched: true
        }
      })
      .catch((e: Error) => {
        return {
          rawData: {
            Milestones: [],
            Opportunities: []
          },
          fetching: false,
          failedFetchMessage: e.message,
          hasSearched: true
        } as Msx
      })
  })

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

interface MsxFetchResult {
  state: number
}


export const msxSlice = createSlice({
  name: 'msx',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder.addCase(fetchData.fulfilled, (state, action) => {
      state.failedFetchMessage = action.payload.failedFetchMessage
      state.rawData = action.payload.rawData
      state.fetching = false
      state.hasSearched = true
    })
    builder.addCase(fetchData.pending, (state, action) => {
      state.fetching = true
    })

  }
})


export default msxSlice.reducer
