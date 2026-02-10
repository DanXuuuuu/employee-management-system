import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const BASE_URL = "http://localhost:8080";

const pickErrorMessage = (payload, fallback) => {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  return payload.message || payload.error || fallback;
};

// 辅助函数：格式化日期字符串为 YYYY-MM-DD 以适配 input[type="date"]
const formatDate = (dateStr) => (dateStr ? String(dateStr).slice(0, 10) : "");

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
      return json.data;
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
      const form = state.personalInfo.form;

      let payload = {};
      // 构造对应 section 的 payload
      if (section === "name") {
        payload = {
          firstName: form.firstName, lastName: form.lastName, middleName: form.middleName,
          preferredName: form.preferredName, profilePicture: form.profilePicture,
          gender: form.gender, dob: form.dob
        };
      } else if (section === "address") {
        payload = { ...form.address };
      } else if (section === "contact") {
        payload = { phoneNumber: form.phoneNumber, workPhoneNumber: form.workPhoneNumber };
      } else if (section === "employment") {
        payload = {
          visaTitle: form.residencyStatus.workAuthorization.type,
          startDate: form.residencyStatus.workAuthorization.startDate,
          endDate: form.residencyStatus.workAuthorization.endDate,
          otherType: form.residencyStatus.workAuthorization.otherType
        };
      } else if (section === "emergency") {
        payload = { emergencyContact: form.emergencyContact };
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
      return { section, employee: json.data, message: json.message };
    } catch (err) {
      return rejectWithValue(err?.message || "Network error");
    }
  }
);

const initialState = {
  status: "idle",
  error: null,
  savingSection: null,
  saveMessage: "",
  form: {
    firstName: "", lastName: "", address: {},
    residencyStatus: { workAuthorization: {} },
    emergencyContact: {},
  },
};

const personalInfoSlice = createSlice({
  name: "personalInfo",
  initialState,
  reducers: {
    clearPersonalInfoError: (state) => {
      state.error = null;
      state.saveMessage = "";
    },
    setField: (state, action) => { state.form[action.payload.name] = action.payload.value; },
    setAddressField: (state, action) => { state.form.address[action.payload.name] = action.payload.value; },
    setWorkAuthField: (state, action) => { state.form.residencyStatus.workAuthorization[action.payload.name] = action.payload.value; },
    setEmergencyField: (state, action) => { state.form.emergencyContact[action.payload.name] = action.payload.value; },
  },
  extraReducers: (builder) => {
    const handleDataSuccess = (state, action) => {
      state.status = "succeeded";
      const emp = action.payload.employee || action.payload;
      const ec0 = emp.emergencyContacts?.[0] || {};
      
      // 数据注水并处理日期
      state.form = {
        ...state.form,
        ...emp,
        dob: formatDate(emp.dob),
        residencyStatus: {
          ...emp.residencyStatus,
          workAuthorization: {
            ...emp.residencyStatus?.workAuthorization,
            startDate: formatDate(emp.residencyStatus?.workAuthorization?.startDate),
            endDate: formatDate(emp.residencyStatus?.workAuthorization?.endDate),
          }
        },
        emergencyContact: { ...ec0 }
      };
      if (action.payload.message) state.saveMessage = action.payload.message;
    };

    builder
      .addCase(fetchPersonalInfo.fulfilled, handleDataSuccess)
      .addCase(savePersonalInfoSection.fulfilled, handleDataSuccess)
      .addCase(savePersonalInfoSection.pending, (state, action) => {
        state.savingSection = action.meta.arg.section;
      })
      .addCase(savePersonalInfoSection.rejected, (state, action) => {
        state.savingSection = null;
        state.error = action.payload;
      });
  },
});

export const { 
  clearPersonalInfoError, setField, setAddressField, setWorkAuthField, setEmergencyField 
} = personalInfoSlice.actions;

export default personalInfoSlice.reducer;