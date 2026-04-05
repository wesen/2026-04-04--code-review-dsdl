import { configureStore } from '@reduxjs/toolkit';
import { walkthroughsApi } from '@crs-cradle/cr-walkthrough';

export const store = configureStore({
  reducer: {
    [walkthroughsApi.reducerPath]: walkthroughsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(walkthroughsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
