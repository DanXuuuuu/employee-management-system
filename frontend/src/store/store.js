import { configureStore } from "@reduxjs/toolkit";
import authSliceReducer from "./authSlice";
import hrSliceReducer from "./hrSlice";


export const store = configureStore({
  reducer: {
    auth: authSliceReducer,
    hr: hrSliceReducer,
  },
});

