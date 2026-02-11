import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
const USER_KEY = "user";
const TOKEN_KEY = "token";
const BASE_URL = "http://localhost:8080";

// helper function - restore the user from localStorage, protect the page fresh stable 
const getUserFromStorage = () => {
    try {
        const user = JSON.parse(localStorage.getItem(USER_KEY));
        const token = localStorage.getItem(TOKEN_KEY);
        if (user && token) {
            return { user, token, isAuthenticated: true };
        }
    } catch (e) {
        console.error("Failed to load user from storage", e);
    }
    return { user: null, token: null, isAuthenticated: false };
};


export const login = createAsyncThunk(
    "auth/login",
    async ({ email, password }, { rejectWithValue }) => {
      try {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
  
        const data = await res.json().catch(() => ({}));
  
        if (!res.ok) {
          return rejectWithValue(data?.message || "Invalid credentials");
        }
  
        const token = data?.token || data?.accessToken || data?.jwt;
        if (!token) {
          return rejectWithValue("Login succeeded but token is missing in response");
        }
  
        return { token, user: data?.user || null };;
      } catch (e) {
        return rejectWithValue(e?.message || "Network error");
      }
    }
  );
  
  export const signup = createAsyncThunk(
  "auth/signup",
  async ({ token, username, email, password, confirmPassword }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, username, email, password, confirmPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return rejectWithValue(data?.message || data?.error || "Registration failed");
      }

      const authToken = data?.token || data?.accessToken || data?.jwt;
      const user = data?.user || null;

      if (!authToken || !user) {
        return rejectWithValue(data?.message || "Registration succeeded but token/user missing");
      }

      return { token: authToken, user, message: data?.message || "Registration successful" };
    } catch (e) {
      return rejectWithValue(e?.message || "Network error");
    }
  }
);

//  after page refresh, verify token and restore user from backend
export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      const token = getState()?.auth?.token || localStorage.getItem(TOKEN_KEY);

      if (!token) return rejectWithValue("No token");

      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        dispatch(logout());
        return rejectWithValue(data?.message || "Session expired");
      }

      return { token, user: data?.user|| null  };
    } catch (e) {
      dispatch(logout());
      return rejectWithValue(e?.message || "Network error");
    }
  }
);

  const savedAuth = getUserFromStorage();

  const initialState = {

    token: savedAuth.token || "",
    user: savedAuth.user,
    isAuthenticated: savedAuth.isAuthenticated,
  
    signIn: {
      loading: false,
      error: "",
    },
    signUp: {
      loading: false,
      success: false,
      error: "",
      message: "",
    },
    restore: {
      loading: false,
      error: "",
    },
  };


const authSlice = createSlice({
    name:"auth",
    initialState,
    reducers:{
        logout: (state) => {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
      
            state.token = "";
            state.user = null;
            state.isAuthenticated = false;
      
            state.signIn.loading = false;
            state.signIn.error = "";
      
            state.signUp.loading = false;
            state.signUp.success = false;
            state.signUp.error = "";
            state.signUp.message = "";
          },
          clearSignInError: (state) => {
            state.signIn.error = "";
          },
      
          clearSignUpStatus: (state) => {
            state.signUp.success = false;
            state.signUp.error = "";
            state.signUp.message = "";
          }
    },
    extraReducers: (builder) => {
        builder
          // ---- login ----
          .addCase(login.pending, (state) => {
            state.signIn.loading = true;
            state.signIn.error = "";
          })
          .addCase(login.fulfilled, (state, action) => {
            state.signIn.loading = false;
            state.signIn.error = "";
    
            state.token = action.payload.token;
            state.user = action.payload.user;
            state.isAuthenticated = true;
    
            localStorage.setItem(TOKEN_KEY, action.payload.token);
            localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user || {}));
          })
          .addCase(login.rejected, (state, action) => {
            state.signIn.loading = false;
            state.signIn.error = action.payload || "Login failed";
          })
    
          // ---- signup ----
          .addCase(signup.pending, (state) => {
            state.signUp.loading = true;
            state.signUp.success = false;
            state.signUp.error = "";
            state.signUp.message = "";
          })
          .addCase(signup.fulfilled, (state, action) => {
            state.signUp.loading = false;
            state.signUp.success = true;
            state.signUp.error = "";
            state.signUp.message = action.payload?.message || "";

            // auto-login after signup
            state.token = action.payload.token;
            state.user = action.payload.user;
            state.isAuthenticated = true;

            localStorage.setItem(TOKEN_KEY, action.payload.token);
            localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user || {}));
          })
          .addCase(signup.rejected, (state, action) => {
            state.signUp.loading = false;
            state.signUp.success = false;
            state.signUp.error = action.payload || "Registration failed";
          })
          
          .addCase(restoreSession.pending, (state) => {
            state.restore.loading = true;
            state.restore.error = "";
          })
          .addCase(restoreSession.fulfilled, (state, action) => {
            state.restore.loading = false;
            state.restore.error = "";
    
            state.token = action.payload.token;
            state.user = action.payload.user;
            state.isAuthenticated = true;
    
            localStorage.setItem(TOKEN_KEY, action.payload.token);
            localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user || {}));
          })
          .addCase(restoreSession.rejected, (state, action) => {
            state.restore.loading = false;
            state.restore.error = action.payload || "Restore session failed";
          });
             
      },
})

export const {
    logout,
    clearSignInError,
    clearSignUpStatus,
  } = authSlice.actions;
  
  export default authSlice.reducer;