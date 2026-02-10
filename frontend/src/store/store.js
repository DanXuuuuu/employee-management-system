import { configureStore } from "@reduxjs/toolkit";
import authSliceReducer from "./authSlice";
import onboardingSliceReducer from "./onboardingSlice";
import personalInfoSliceReducer from "./personalInfoSlice";
import documentsReducer from "./documentsSlice";

export const store = configureStore({
  reducer: {
    auth: authSliceReducer,
    onboarding: onboardingSliceReducer,
    personalInfo: personalInfoSliceReducer,
    documents: documentsReducer,
  },
});
