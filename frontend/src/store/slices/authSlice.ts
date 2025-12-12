import {
	createSlice,
	createAsyncThunk,
	type PayloadAction,
} from "@reduxjs/toolkit"
import api from "../../lib/api"

export interface User {
	id: string
	email: string
	firstName?: string
	lastName?: string
	role: string
}

interface AuthState {
	user: User | null
	isAuthenticated: boolean
	isLoading: boolean
	error: string | null
}

const initialState: AuthState = {
	user: null,
	isAuthenticated: false,
	isLoading: true,
	error: null,
}

export const checkAuth = createAsyncThunk("auth/checkAuth", async () => {
	const response = await api.get("/users/me")
	return response.data.data.user
})

const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		login: (state, action: PayloadAction<{ user: User }>) => {
			const { user } = action.payload
			state.user = user
			state.isAuthenticated = true
			state.error = null
		},
		logout: (state) => {
			state.user = null
			state.isAuthenticated = false
			state.error = null
		},
		clearError: (state) => {
			state.error = null
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(checkAuth.pending, (state) => {
				state.isLoading = true
			})
			.addCase(checkAuth.fulfilled, (state, action) => {
				state.isLoading = false
				state.user = action.payload
				state.isAuthenticated = true
				state.error = null
			})
			.addCase(checkAuth.rejected, (state) => {
				state.isLoading = false
				state.isAuthenticated = false
				state.user = null
			})
	},
})

export const { login, logout, clearError } = authSlice.actions
export default authSlice.reducer
