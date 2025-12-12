import axios from "axios"

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || "http://localhost:30700/api/v1",
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
})

let isRefreshing = false
let failedQueue: Array<{
	resolve: (value?: any) => void
	reject: (reason?: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
	failedQueue.forEach((prom) => {
		if (error) {
			prom.reject(error)
		} else {
			prom.resolve(token)
		}
	})

	failedQueue = []
}

api.interceptors.request.use(
	async (config) => {
		config.withCredentials = true

		return config
	},
	(error) => {
		return Promise.reject(error)
	}
)

api.interceptors.response.use(
	(response) => {
		return response
	},
	async (error) => {
		const originalRequest = error.config

		const isAuthEndpoint =
			originalRequest.url?.includes("/auth/login") ||
			originalRequest.url?.includes("/auth/register") ||
			originalRequest.url?.includes("/auth/refresh") ||
			originalRequest.url?.includes("/auth/logout")

		if (error.response?.status === 401 && !isAuthEndpoint) {
			// Don't attempt refresh if user is not authenticated
			if (!isAuthenticated()) {
				stopTokenRefreshMonitor()
				localStorage.removeItem("user")
				localStorage.removeItem("accessToken")
				return Promise.reject(error)
			}

			if (isRefreshing) {
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject })
				})
					.then(() => {
						return api(originalRequest)
					})
					.catch((err) => {
						return Promise.reject(err)
					})
			}

			originalRequest._retry = true
			isRefreshing = true

			try {
				await axios.post(
					`${
						import.meta.env.VITE_API_URL || "http://localhost:30700/api/v1"
					}/auth/refresh`,
					{},
					{
						withCredentials: true,
					}
				)

				processQueue(null, null)
				return api(originalRequest)
			} catch (refreshError) {
				processQueue(refreshError, null)
				stopTokenRefreshMonitor()
				localStorage.removeItem("user")
				localStorage.removeItem("accessToken")

				if (!window.location.pathname.includes("/login")) {
					window.location.href = "/login"
				}
				return Promise.reject(refreshError)
			} finally {
				isRefreshing = false
			}
		}

		return Promise.reject(error)
	}
)

let refreshInterval: number | null = null

const isAuthenticated = () => {
	// Check if user is authenticated by checking localStorage or Redux store
	const accessToken = localStorage.getItem("accessToken")
	const user = localStorage.getItem("user")
	return !!(accessToken || user)
}

export const startTokenRefreshMonitor = () => {
	if (refreshInterval) {
		clearInterval(refreshInterval)
	}

	/* Check every 2 minutes if token needs refresh - only if user is authenticated */
	refreshInterval = window.setInterval(async () => {
		// Only attempt refresh if user is authenticated
		if (!isAuthenticated()) {
			stopTokenRefreshMonitor()
			return
		}

		try {
			/* The backend will check if token is expiring soon and refresh if needed */
			await axios.post(
				`${
					import.meta.env.VITE_API_URL || "http://localhost:30700/api/v1"
				}/auth/refresh`,
				{},
				{
					withCredentials: true,
				}
			)
		} catch (error) {
			// If refresh fails, user is likely logged out - stop the monitor
			if (error && typeof error === "object" && "response" in error) {
				const axiosError = error as any
				if (
					axiosError.response?.status === 401 ||
					axiosError.response?.status === 400
				) {
					stopTokenRefreshMonitor()
				}
			}
		}
	}, 2 * 60 * 1000) // Check every 2 minutes
}

export const stopTokenRefreshMonitor = () => {
	if (refreshInterval) {
		clearInterval(refreshInterval)
		refreshInterval = null
	}
}

export default api
