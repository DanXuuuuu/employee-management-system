import { configureStore } from "@reduxjs/toolkit";
import authSliceReducer from "./authSlice";
import hrSliceReducer from "./hrSlice";

import onboardingSliceReducer from "./onboardingSlice";
import personalInfoSliceReducer from "./personalInfoSlice";
import documentsReducer from "./documentsSlice";

export const store = configureStore({
  reducer: {
    auth: authSliceReducer,
    hr: hrSliceReducer,
    onboarding: onboardingSliceReducer,
    personalInfo: personalInfoSliceReducer,
    documents: documentsReducer,
  },
});

