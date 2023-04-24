import { configureStore } from '@reduxjs/toolkit'
import filterSlice from './state/filterSlice'
import msxSlice from './state/msxSlice'

export const store = configureStore({
  reducer: {
    filter: filterSlice,
    msx: msxSlice
  }
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
