import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const BASE_URL = "http://localhost:8080"; 

const pickErrorMessage = (payload, fallback) => {
    if (!payload) return fallback;
    if (typeof payload === "string") return payload;
    return payload.message || payload.error || fallback;
  };
  
  const upsertDocById = (docs, doc) => {
    if (!doc?._id) return docs;
    const idx = docs.findIndex((d) => d._id === doc._id);
    if (idx >= 0) {
      const next = docs.slice();
      next[idx] = doc;
      return next;
    }
    return [doc, ...docs];
  };


// GET /api/onboarding
// { ok:true, data:{ status, hrFeedback, employee|null, documents:[] } }
export const fetchOnboarding = createAsyncThunk(
    "onboarding/fetchOnboarding",
    async (_, { rejectWithValue, getState }) => {
      try {
        const token = getState()?.auth?.token; 
  
        const res = await fetch(`${BASE_URL}/api/onboarding`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` ,
          },
        });
  
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data?.ok === false) {
          return rejectWithValue(data?.message || "Fetch onboarding failed");
        }
  
        return data?.data; // {status, hrFeedback, employee, documents}
      } catch (err) {
        return rejectWithValue(err?.message || "Network error");
      }
    }
  );
  
  // POST /api/onboarding/submit
  // Body: { employee: {...} }
  // -> { ok:true, data:{ status, hrFeedback, employee } }
  export const submitOnboarding = createAsyncThunk(
    "onboarding/submitOnboarding",
    async (_, { rejectWithValue, getState }) => {
      try {
        const state = getState();
        const token = state?.auth?.token;
  
        const payload = state.onboarding.form;
  
        const res = await fetch(`${BASE_URL}/api/onboarding/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ employee: payload }),
        });
  
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.ok === false) {
          return rejectWithValue(pickErrorMessage(json, "Failed to submit onboarding"));
        }
  
        return json.data; // {status, hrFeedback, employee}
      } catch (err) {
        return rejectWithValue(err?.message || "Network error");
      }
    }
  );
  
  // POST /api/documents  (multipart)
  // -> { ok:true, data: doc }
  export const uploadDocument = createAsyncThunk(
    "onboarding/uploadDocument",
    async ({ type, file }, { rejectWithValue, getState }) => {
      try {
        const token = getState()?.auth?.token;
  
        const fd = new FormData();
        fd.append("type", type);
        fd.append("file", file);
  
        const res = await fetch(`${BASE_URL}/api/documents`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: fd,
        });
  
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.ok === false) {
          return rejectWithValue(pickErrorMessage(json, "Failed to upload document"));
        }
  
        return json.data; // doc
      } catch (err) {
        return rejectWithValue(err?.message || "Network error");
      }
    }
  );
  
  // PUT /api/documents/:id  (multipart)
  // -> { ok:true, data: doc }
  export const reuploadDocument = createAsyncThunk(
    "onboarding/reuploadDocument",
    async ({ id, file }, { rejectWithValue, getState }) => {
      try {
        const token = getState()?.auth?.token;
  
        const fd = new FormData();
        fd.append("file", file);
  
        const res = await fetch(`${BASE_URL}/api/documents/${id}`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: fd,
        });
  
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.ok === false) {
          return rejectWithValue(pickErrorMessage(json, "Failed to reupload document"));
        }
  
        return json.data; // doc
      } catch (err) {
        return rejectWithValue(err?.message || "Network error");
      }
    }
  );
  


  const initialState = {
    status: "idle",
    error: null,
  
    // backend: NOT_STARTED | PENDING | APPROVED | REJECTED
    applicationStatus: "NOT_STARTED",
    hrFeedback: "",
    employee: null,
    documents: [],
  
    // upload UI (per doc type)
    uploadStatusByType: {}, // { [type]: "idle"|"uploading"|"succeeded"|"failed" }
    uploadErrorByType: {}, // { [type]: string }
  
    form: {
      firstName: "",
      lastName: "",
      middleName: "",
      preferredName: "",
  
      profilePicture: "",
  
      address: {
        building: "",
        street: "",
        city: "",
        state: "",
        zip: "",
      },
  
      phoneNumber: "",
      workPhoneNumber: "",
  
      email: "",
  
      ssn: "",
      dob: "",
      gender: "I do not wish to answer",
  
      residencyStatus: {
        isCitizenOrPermanentResident: false,
        statusType: "No", // Citizen | Green Card | No
        workAuthorization: {
          type: "F1(CPT/OPT)",
          otherType: "",
          startDate: "",
          endDate: "",
        },
      },
  
      emergencyContacts: [
        {
          firstName: "",
          lastName: "",
          middleName: "",
          phone: "",
          email: "",
          relationship: "",
        },
      ],
    },
  };
  
 
  const onboardingSlice = createSlice({
    name: "onboarding",
    initialState,
    reducers: {
      clearOnboardingError: (state) => {
        state.error = null;
      },
      clearUploadErrorByType: (state, action) => {
        delete state.uploadErrorByType[action.payload];
      },
  
      setField: (state, action) => {
        const { name, value } = action.payload;
        state.form[name] = value;
      },
      setAddressField: (state, action) => {
        const { name, value } = action.payload;
        state.form.address[name] = value;
      },
  
      setResidencyCitizen: (state, action) => {
        const v = action.payload; // boolean
        state.form.residencyStatus.isCitizenOrPermanentResident = v;
        state.form.residencyStatus.statusType = v ? "Citizen" : "No";
      },
      setResidencyStatusType: (state, action) => {
        state.form.residencyStatus.statusType = action.payload; // Citizen | Green Card
      },
      setWorkAuthField: (state, action) => {
        const { name, value } = action.payload;
        state.form.residencyStatus.workAuthorization[name] = value;
      },
  
      setEmergencyContactField: (state, action) => {
        const { index, name, value } = action.payload;
        state.form.emergencyContacts[index][name] = value;
      },
      addEmergencyContact: (state) => {
        state.form.emergencyContacts.push({
          firstName: "",
          lastName: "",
          middleName: "",
          phone: "",
          email: "",
          relationship: "",
        });
      },
      removeEmergencyContact: (state, action) => {
        const index = action.payload;
        if (state.form.emergencyContacts.length <= 1) return;
        state.form.emergencyContacts.splice(index, 1);
      },
  
      hydrateFromEmployee: (state, action) => {
        const employee = action.payload;
        if (!employee) return;
  
        state.employee = employee;
        state.form = {
          ...state.form,
          ...employee,
          address: { ...state.form.address, ...(employee.address || {}) },
          residencyStatus: {
            ...state.form.residencyStatus,
            ...(employee.residencyStatus || {}),
            workAuthorization: {
              ...state.form.residencyStatus.workAuthorization,
              ...(employee?.residencyStatus?.workAuthorization || {}),
            },
          },
        };
      },
    },
  
    extraReducers: (builder) => {
      builder
        .addCase(fetchOnboarding.pending, (state) => {
          state.status = "loading";
          state.error = null;
        })
        .addCase(fetchOnboarding.fulfilled, (state, action) => {
          state.status = "succeeded";
          state.error = null;
  
          const { status, hrFeedback, employee, documents } = action.payload || {};
          state.applicationStatus = status || "NOT_STARTED";
          state.hrFeedback = hrFeedback || "";
          state.employee = employee || null;
          state.documents = Array.isArray(documents) ? documents : [];
  
          if (employee) {
            state.form = {
              ...state.form,
              ...employee,
              address: { ...state.form.address, ...(employee.address || {}) },
              residencyStatus: {
                ...state.form.residencyStatus,
                ...(employee.residencyStatus || {}),
                workAuthorization: {
                  ...state.form.residencyStatus.workAuthorization,
                  ...(employee?.residencyStatus?.workAuthorization || {}),
                },
              },
            };
          }
        })
        .addCase(fetchOnboarding.rejected, (state, action) => {
          state.status = "failed";
          state.error = action.payload || action.error.message;
        })
  
        // submit onboarding
        .addCase(submitOnboarding.pending, (state) => {
          state.status = "loading";
          state.error = null;
        })
        .addCase(submitOnboarding.fulfilled, (state, action) => {
          state.status = "succeeded";
          state.error = null;
  
          const { status, hrFeedback, employee } = action.payload || {};
          if (status) state.applicationStatus = status;
          state.hrFeedback = hrFeedback || "";
          state.employee = employee || state.employee;
  
          if (employee) {
            state.form = {
              ...state.form,
              ...employee,
              address: { ...state.form.address, ...(employee.address || {}) },
              residencyStatus: {
                ...state.form.residencyStatus,
                ...(employee.residencyStatus || {}),
                workAuthorization: {
                  ...state.form.residencyStatus.workAuthorization,
                  ...(employee?.residencyStatus?.workAuthorization || {}),
                },
              },
            };
          }
        })
        .addCase(submitOnboarding.rejected, (state, action) => {
          state.status = "failed";
          state.error = action.payload || action.error.message;
        })
  
        // upload document
        .addCase(uploadDocument.pending, (state, action) => {
          const type = action.meta.arg?.type;
          if (type) {
            state.uploadStatusByType[type] = "uploading";
            delete state.uploadErrorByType[type];
          }
        })
        .addCase(uploadDocument.fulfilled, (state, action) => {
          const doc = action.payload;
          const type = doc?.type;
  
          state.documents = upsertDocById(state.documents, doc);
          if (type) state.uploadStatusByType[type] = "succeeded";
        })
        .addCase(uploadDocument.rejected, (state, action) => {
          const type = action.meta.arg?.type;
          if (type) {
            state.uploadStatusByType[type] = "failed";
            state.uploadErrorByType[type] = action.payload || action.error.message;
          }
        })
  
        // reupload document 
        .addCase(reuploadDocument.pending, (state) => {
          state.status = "loading";
          state.error = null;
        })
        .addCase(reuploadDocument.fulfilled, (state, action) => {
          state.status = "succeeded";
          state.error = null;
  
          const doc = action.payload;
          state.documents = upsertDocById(state.documents, doc);
  
          if (doc?.type) state.uploadStatusByType[doc.type] = "succeeded";
        })
        .addCase(reuploadDocument.rejected, (state, action) => {
          state.status = "failed";
          state.error = action.payload || action.error.message;
        });
    },
  });
  
  export const {
    clearOnboardingError,
    clearUploadErrorByType,
    setField,
    setAddressField,
    setResidencyCitizen,
    setResidencyStatusType,
    setWorkAuthField,
    setEmergencyContactField,
    addEmergencyContact,
    removeEmergencyContact,
    hydrateFromEmployee,
  } = onboardingSlice.actions;
  
  export default onboardingSlice.reducer;