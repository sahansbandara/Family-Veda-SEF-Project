// ⚠ SHARED — coordinated by S3. Add lines inside your own labelled block;
// never reorder or reformat existing lines. See agent/MEMORY.md:63.
import { configureStore } from '@reduxjs/toolkit'

import authReducer from './slices/authSlice'

export const store = configureStore({
  reducer: {
    // ===== S1 — Identity foundation =====
    auth: authReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
