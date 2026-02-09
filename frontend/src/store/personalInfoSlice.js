import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const BASE_URL = "http://localhost:8080";

const pickErrorMessage = (payload, fallback) => {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  return payload.message || payload.error || fallback;
};

// GET /api/personal-info
export const fetchPersonalInfo = createAsyncThunk(
  "personalInfo/fetchPersonalInfo",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState()?.auth?.token;

      const res = await fetch(`${BASE_URL}/api/personal-info`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) {
        return rejectWithValue(pickErrorMessage(json, "Failed to fetch personal info"));
      }

      return json.data; // employee object
    } catch (err) {
      return rejectWithValue(err?.message || "Network error");
    }
  }
);

// PUT /api/personal-info/:section
export const savePersonalInfoSection = createAsyncThunk(
  "personalInfo/savePersonalInfoSection",
  async ({ section }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const token = state?.auth?.token;
      const form = state?.personalInfo?.form || {};

      let payload = {};
      if (section === "name") {
        payload = {
          firstName: form.firstName || "",
          lastName: form.lastName || "",
          middleName: form.middleName || "",
          preferredName: form.preferredName || "",
          profilePicture: form.profilePicture || "",
          email: form.email || "",
          ssn: form.ssn || "",
          dob: form.dob || "",
          gender: form.gender || "",
        };
      }

      if (section === "address") {
        payload = {
          building: form?.address?.building || "",
          street: form?.address?.street || "",
          city: form?.address?.city || "",
          state: form?.address?.state || "",
          zip: form?.address?.zip || "",
        };
      }

      if (section === "contact") {
        payload = {
          phoneNumber: form.phoneNumber || "",
          workPhoneNumber: form.workPhoneNumber || "",
        };
      }

      if (section === "employment") {
        payload = {
          visaTitle: form?.residencyStatus?.workAuthorization?.type || "",
          otherType: form?.residencyStatus?.workAuthorization?.otherType || "",
          startDate: form?.residencyStatus?.workAuthorization?.startDate || "",
          endDate: form?.residencyStatus?.workAuthorization?.endDate || "",
        };
      }

      if (section === "emergency") {
        payload = {
          emergencyContact: form.emergencyContact || {
            firstName: "",
            lastName: "",
            middleName: "",
            phone: "",
            email: "",
            relationship: "",
          },
        };
      }

      const res = await fetch(`${BASE_URL}/api/personal-info/${section}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) {
        return rejectWithValue(pickErrorMessage(json, `Failed to update ${section}`));
      }

      return { section, employee: json.data, message: json.message || "" };
    } catch (err) {
      return rejectWithValue(err?.message || "Network error");
    }
  }
);

const initialState = {
  status: "idle",
  error: null,

  savingSection: null, 
  saveError: null,
  saveMessage: "",


  form: {
    firstName: "",
    lastName: "",
    middleName: "",
    preferredName: "",
    profilePicture: "",
    email: "",
    ssn: "",
    dob: "",
    gender: "I do not wish to answer",

    address: { building: "", street: "", city: "", state: "", zip: "" },

    phoneNumber: "",
    workPhoneNumber: "",

    residencyStatus: {
      workAuthorization: { type: "F1(CPT/OPT)", otherType: "", startDate: "", endDate: "" },
    },
    // fetch emergencyContacts[0] if more than 1
    emergencyContact: { firstName: "", lastName: "", middleName: "", phone: "", email: "", relationship: "" },
  },
};

const personalInfoSlice = createSlice({
  name: "personalInfo",
  initialState,
  reducers: {
    clearPersonalInfoError: (state) => {
      state.error = null;
      state.saveError = null;
      state.saveMessage = "";
    },

    setField: (state, action) => {
      const { name, value } = action.payload;
      state.form[name] = value;
    },
    setAddressField: (state, action) => {
      const { name, value } = action.payload;
      state.form.address[name] = value;
    },
    setWorkAuthField: (state, action) => {
      const { name, value } = action.payload;
      state.form.residencyStatus.workAuthorization[name] = value;
    },
    setReferenceField: (state, action) => {
      const { name, value } = action.payload;
      state.form.reference[name] = value;
    },
    setEmergencyField: (state, action) => {
      const { name, value } = action.payload;
      state.form.emergencyContact[name] = value;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchPersonalInfo.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPersonalInfo.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.error = null;

        const employee = action.payload || {};
        const emergency0 = Array.isArray(employee.emergencyContacts) ? employee.emergencyContacts[0] : null;

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
          reference: { ...state.form.reference, ...(employee.reference || {}) },
          emergencyContact: {
            ...state.form.emergencyContact,
            ...(emergency0 || {}),
          },
        };
      })
      .addCase(fetchPersonalInfo.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })

      // save section
      .addCase(savePersonalInfoSection.pending, (state, action) => {
        state.savingSection = action.meta.arg?.section || null;
        state.saveError = null;
        state.saveMessage = "";
      })
      .addCase(savePersonalInfoSection.fulfilled, (state, action) => {
        state.savingSection = null;
        state.saveError = null;

        const employee = action.payload?.employee || {};
        const emergency0 = Array.isArray(employee.emergencyContacts) ? employee.emergencyContacts[0] : null;

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
          reference: { ...state.form.reference, ...(employee.reference || {}) },
          emergencyContact: {
            ...state.form.emergencyContact,
            ...(emergency0 || {}),
          },
        };

        state.saveMessage = action.payload?.message || "Saved.";
      })
      .addCase(savePersonalInfoSection.rejected, (state, action) => {
        state.savingSection = null;
        state.saveError = action.payload || action.error.message;
      });
  },
});

export const {
  clearPersonalInfoError,
  setField,
  setAddressField,
  setWorkAuthField,
  setReferenceField,
  setEmergencyField,
} = personalInfoSlice.actions;

export default personalInfoSlice.reducer;
