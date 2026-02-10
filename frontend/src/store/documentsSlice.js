import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const BASE_URL = "http://localhost:8080"; 

const pickErrorMessage = (json, fallback) => {
  if (!json) return fallback;
  return (
    json.message ||
    json.error ||
    (Array.isArray(json.errors) ? json.errors.join(", ") : null) ||
    fallback
  );
};

// GET /api/documents
export const fetchMyDocuments = createAsyncThunk(
  "documents/fetchMyDocuments",
  async (_, { rejectWithValue, getState }) => {
    try {
      const token = getState()?.auth?.token;

      const res = await fetch(`${BASE_URL}/api/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) {
        return rejectWithValue(pickErrorMessage(json, "Failed to fetch documents"));
      }

      // 后端 { ok:true, data:[...] }
      return json.data || [];
    } catch (err) {
      return rejectWithValue(err?.message || "Network error");
    }
  }
);

// POST /api/documents (multipart)
export const uploadDocument = createAsyncThunk(
  "documents/uploadDocument",
  async ({ type, file }, { rejectWithValue, getState }) => {
    try {
      const token = getState()?.auth?.token;

      const fd = new FormData();
      fd.append("type", type);
      fd.append("file", file);

      const res = await fetch(`${BASE_URL}/api/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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

// PUT /api/documents/:id (multipart)
export const reuploadDocument = createAsyncThunk(
  "documents/reuploadDocument",
  async ({ id, file }, { rejectWithValue, getState }) => {
    try {
      const token = getState()?.auth?.token;

      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`${BASE_URL}/api/documents/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
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

const upsertById = (items, doc) => {
  const idx = items.findIndex((x) => x._id === doc._id);
  if (idx >= 0) items[idx] = doc;
  else items.unshift(doc); // 新的放最前
};

const documentsSlice = createSlice({
  name: "documents",
  initialState: {
    items: [],
    loading: false,
    uploading: false,
    error: null,
  },
  reducers: {
    clearDocumentsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchMyDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchMyDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch documents";
      })

      // upload
      .addCase(uploadDocument.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.uploading = false;
        if (action.payload) upsertById(state.items, action.payload);
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload || "Failed to upload document";
      })

      // reupload
      .addCase(reuploadDocument.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(reuploadDocument.fulfilled, (state, action) => {
        state.uploading = false;
        if (action.payload) upsertById(state.items, action.payload);
      })
      .addCase(reuploadDocument.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload || "Failed to reupload document";
      });
  },
});

export const { clearDocumentsError } = documentsSlice.actions;
export default documentsSlice.reducer;
