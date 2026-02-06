import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
const USER_KEY = "user";
const TOKEN_KEY = "token";

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
        const res = await fetch("/api/auth/login", {
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
    async ({ token, username, email, password,confirmPassword }, { rejectWithValue }) => {
      try {
        const res = await fetch(`/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, username, email, password,confirmPassword }),
        });
  
        const data = await res.json().catch(() => ({}));
  
        if (!res.ok) {
          return rejectWithValue(data?.message || "Registration failed");
        }
        return { message: data?.message || "Registration completed. Please login." }; // { success:true, message }
      } catch (e) {
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
          })
          .addCase(signup.rejected, (state, action) => {
            state.signUp.loading = false;
            state.signUp.success = false;
            state.signUp.error = action.payload || "Registration failed";
          });
      },
})

export const {
    logout,
    clearSignInError,
    clearSignUpStatus,
  } = authSlice.actions;
  
  export default authSlice.reducer;