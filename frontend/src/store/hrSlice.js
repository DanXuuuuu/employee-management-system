import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../api"; 

// Async Thunks - for api call 


// Hiring Management  
// get token history 
export const fetchTokenHistory = createAsyncThunk(
  "hr/fetchTokenHistory",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/hr/token-history");
      return res.data.data; // return the data become - fulfilled action payload
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch token history");
    }
  }
);

// fetch all onboarding applications
export const fetchOnboardingApplications = createAsyncThunk(
  "hr/fetchOnboardingApplications",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/hr/onboarding-applications");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch applications");
    }
  }
);

// approve onboarding
export const approveApplication = createAsyncThunk(
  "hr/approveApplication",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/hr/onboarding/${id}/approve`);
      return res.data.data; // return updated application 
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to approve");
    }
  }
);

// reject onboarding application 
export const rejectApplication = createAsyncThunk(
  "hr/rejectApplication",
  async ({ id, feedback }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/hr/onboarding/${id}/reject`, { feedback });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to reject");
    }
  }
);

// generate token
export const generateToken = createAsyncThunk(
  "hr/generateToken",
  async ({ name, email }, { rejectWithValue }) => {
    try {
      const res = await api.post("/registration/generate", { name, email });
      return res.data; //return token 
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.response?.data?.error || "Failed to generate token");
    }
  }
);

//  Employee Profiles 
// fetch all employees 
export const fetchEmployees = createAsyncThunk(
  "hr/fetchEmployees",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/hr/employees");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch employees");
    }
  }
);

// search employees
export const searchEmployees = createAsyncThunk(
  "hr/searchEmployees",
  async (query, { rejectWithValue }) => {
    try {
      const res = await api.get(`/hr/employees/search?q=${query}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to search employees");
    }
  }
);

// fetch employee detail 
export const fetchEmployeeDetail = createAsyncThunk(
  "hr/fetchEmployeeDetail",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/hr/employees/${id}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch employee detail");
    }
  }
);

// Visa Management 
// fetch inprogress visa applications
export const fetchVisaInProgress = createAsyncThunk(
  "hr/fetchVisaInProgress",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/hr/visa/in-progress");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch in-progress");
    }
  }
);

// fetch all visa employees
export const fetchAllVisa = createAsyncThunk(
  "hr/fetchAllVisa",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/hr/visa/all");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch all visa");
    }
  }
);

// approve visa docs
export const approveVisaDoc = createAsyncThunk(
  "hr/approveVisaDoc",
  async ({ userId, docType }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/hr/visa/${userId}/${docType}/approve`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to approve document");
    }
  }
);

// reject visa docs
export const rejectVisaDoc = createAsyncThunk(
  "hr/rejectVisaDoc",
  async ({ userId, docType, feedback }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/hr/visa/${userId}/${docType}/reject`, { feedback });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to reject document");
    }
  }
);

// send visa reminder 
export const sendVisaReminder = createAsyncThunk(
  "hr/sendVisaReminder",
  async ({ userId, email }, { rejectWithValue }) => {
    try {
      await api.post(`/hr/visa/${userId}/send-reminder`);
      return { userId, email }; // return message shows success 
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to send reminder");
    }
  }
);

//  Initial State 
const initialState = {
  // Hiring Management
  tokenHistory: [],
  onboardingApplications: [],
  
  // Employee Profiles
  employees: [],
  selectedEmployee: null,
  
  // Visa Management
  visaInProgress: [],
  allVisa: [],
  
  // Loading states each page each loading state
  loading: {
    hiring: false,
    employees: false,
    visa: false,
  },
  
  // Error states
  error: {
    hiring: null,
    employees: null,
    visa: null,
  },
  
  // Success messages 
  successMessage: null,
};

//  Slice 
const hrSlice = createSlice({
  name: "hr",
  initialState,
  reducers: {
    // clear what selected employee 
    clearSelectedEmployee: (state) => {
      state.selectedEmployee = null;
    },
    
    // clear message 
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    

    clearError: (state, action) => {
      // action.payload should be - 'hiring', 'employees', or  'visa'
      const section = action.payload;
      if (section && state.error[section] !== undefined) {
        state.error[section] = null;
      }
    },
  },
  extraReducers: (builder) => {
    // extraReducers dealwith  thunk state: pending, fulfilled, rejected
    
    // Hiring Management  
    builder
      // fetchTokenHistory
      .addCase(fetchTokenHistory.pending, (state) => {
        state.loading.hiring = true;
        state.error.hiring = null;
      })
      .addCase(fetchTokenHistory.fulfilled, (state, action) => {
        state.loading.hiring = false;
        state.tokenHistory = action.payload;
      })
      .addCase(fetchTokenHistory.rejected, (state, action) => {
        state.loading.hiring = false;
        state.error.hiring = action.payload;
      })
      
      // fetchOnboardingApplications
      .addCase(fetchOnboardingApplications.pending, (state) => {
        state.loading.hiring = true;
        state.error.hiring = null;
      })
      .addCase(fetchOnboardingApplications.fulfilled, (state, action) => {
        state.loading.hiring = false;
        state.onboardingApplications = action.payload;
      })
      .addCase(fetchOnboardingApplications.rejected, (state, action) => {
        state.loading.hiring = false;
        state.error.hiring = action.payload;
      })
      
      // approveApplication
      .addCase(approveApplication.pending, (state) => {
        state.loading.hiring = true;
      })
      .addCase(approveApplication.fulfilled, (state, action) => {
        state.loading.hiring = false;
        // update list of application states 
        const index = state.onboardingApplications.findIndex(
          app => app._id === action.payload._id
        );
        if (index !== -1) {
          state.onboardingApplications[index] = action.payload;
        }
        state.successMessage = "Application approved successfully";
      })
      .addCase(approveApplication.rejected, (state, action) => {
        state.loading.hiring = false;
        state.error.hiring = action.payload;
      })
      
      // rejectApplication
      .addCase(rejectApplication.pending, (state) => {
        state.loading.hiring = true;
      })
      .addCase(rejectApplication.fulfilled, (state, action) => {
        state.loading.hiring = false;
        const index = state.onboardingApplications.findIndex(
          app => app._id === action.payload._id
        );
        if (index !== -1) {
          state.onboardingApplications[index] = action.payload;
        }
        state.successMessage = "Application rejected";
      })
      .addCase(rejectApplication.rejected, (state, action) => {
        state.loading.hiring = false;
        state.error.hiring = action.payload;
      })
      
      // generateToken
      .addCase(generateToken.pending, (state) => {
        state.loading.hiring = true;
      })
      .addCase(generateToken.fulfilled, (state, action) => {
        state.loading.hiring = false;
        // add new token to list 
        state.successMessage = action.payload?.message || "Invitation sent";
      })
      .addCase(generateToken.rejected, (state, action) => {
        state.loading.hiring = false;
        state.error.hiring = action.payload;
      })
      
    //  Employee Profiles 
      // fetchEmployees
      .addCase(fetchEmployees.pending, (state) => {
        state.loading.employees = true;
        state.error.employees = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading.employees = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading.employees = false;
        state.error.employees = action.payload;
      })
      
      // searchEmployees
      .addCase(searchEmployees.pending, (state) => {
        state.loading.employees = true;
        state.error.employees = null;
      })
      .addCase(searchEmployees.fulfilled, (state, action) => {
        state.loading.employees = false;
        state.employees = action.payload;
      })
      .addCase(searchEmployees.rejected, (state, action) => {
        state.loading.employees = false;
        state.error.employees = action.payload;
      })
      
      // fetchEmployeeDetail
      .addCase(fetchEmployeeDetail.pending, (state) => {
        state.loading.employees = true;
        state.error.employees = null;
      })
      .addCase(fetchEmployeeDetail.fulfilled, (state, action) => {
        state.loading.employees = false;
        state.selectedEmployee = action.payload;
      })
      .addCase(fetchEmployeeDetail.rejected, (state, action) => {
        state.loading.employees = false;
        state.error.employees = action.payload;
      })
      
    // ---------- Visa Management ----------
      // fetchVisaInProgress
      .addCase(fetchVisaInProgress.pending, (state) => {
        state.loading.visa = true;
        state.error.visa = null;
      })
      .addCase(fetchVisaInProgress.fulfilled, (state, action) => {
        state.loading.visa = false;
        state.visaInProgress = action.payload;
      })
      .addCase(fetchVisaInProgress.rejected, (state, action) => {
        state.loading.visa = false;
        state.error.visa = action.payload;
      })
      
      // fetchAllVisa
      .addCase(fetchAllVisa.pending, (state) => {
        state.loading.visa = true;
        state.error.visa = null;
      })
      .addCase(fetchAllVisa.fulfilled, (state, action) => {
        state.loading.visa = false;
        state.allVisa = action.payload;
      })
      .addCase(fetchAllVisa.rejected, (state, action) => {
        state.loading.visa = false;
        state.error.visa = action.payload;
      })
      
      // approveVisaDoc
      .addCase(approveVisaDoc.pending, (state) => {
        state.loading.visa = true;
      })
      .addCase(approveVisaDoc.fulfilled, (state) => {
        state.loading.visa = false;
        state.successMessage = "Document approved successfully";
      })
      .addCase(approveVisaDoc.rejected, (state, action) => {
        state.loading.visa = false;
        state.error.visa = action.payload;
      })
      
      // rejectVisaDoc
      .addCase(rejectVisaDoc.pending, (state) => {
        state.loading.visa = true;
      })
      .addCase(rejectVisaDoc.fulfilled, (state) => {
        state.loading.visa = false;
        state.successMessage = "Document rejected";
      })
      .addCase(rejectVisaDoc.rejected, (state, action) => {
        state.loading.visa = false;
        state.error.visa = action.payload;
      })
      
      // sendVisaReminder
      .addCase(sendVisaReminder.pending, (state) => {
        state.loading.visa = true;
      })
      .addCase(sendVisaReminder.fulfilled, (state, action) => {
        state.loading.visa = false;
        state.successMessage = `Reminder email sent to ${action.payload.email}`;
      })
      .addCase(sendVisaReminder.rejected, (state, action) => {
        state.loading.visa = false;
        state.error.visa = action.payload;
      });
  },
});

export const { clearSelectedEmployee, clearSuccessMessage, clearError } = hrSlice.actions;

export default hrSlice.reducer;