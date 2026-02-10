import { configureStore } from "@reduxjs/toolkit";
import authSliceReducer from "./authSlice";
import onboardingSliceReducer from "./onboardingSlice";
import personalInfoSliceReducer from "./personalInfoSlice";

export const store = configureStore({
  reducer: {
    auth: authSliceReducer,
    onboarding: onboardingSliceReducer,
    personalInfo: personalInfoSliceReducer,
  },
});
