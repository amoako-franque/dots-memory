import { useEffect } from "react"
import { useAppSelector } from "./store/hooks"
import AppRoutes from "./routes"
import Layout from "./components/layout/Layout"
import { NotificationProvider } from "./components/notifications/NotificationSystem"
import { startTokenRefreshMonitor, stopTokenRefreshMonitor } from "./lib/api"

function App() {
	const { isAuthenticated } = useAppSelector((state) => state.auth)

	useEffect(() => {
		// Only start refresh monitor if user is authenticated
		if (isAuthenticated) {
			startTokenRefreshMonitor()
		} else {
			stopTokenRefreshMonitor()
		}

		return () => {
			stopTokenRefreshMonitor()
		}
	}, [isAuthenticated])

	return (
		<NotificationProvider>
			<div className="min-h-screen bg-[#FDF8F3] font-sans antialiased">
				<Layout>
					<AppRoutes />
				</Layout>
			</div>
		</NotificationProvider>
	)
}

export default App
