import { configureStore } from "@reduxjs/toolkit";
import authSliceReducer from "./authSlice";
import onboardingSliceReducer from "./onboardingSlice";

export const store = configureStore({
  reducer: {
    auth: authSliceReducer,
    onboarding: onboardingSliceReducer
  },
});
