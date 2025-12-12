import { Routes, Route, Navigate, Outlet } from "react-router-dom"
import { useAppSelector, useAppDispatch } from "../store/hooks"
import { useEffect } from "react"
import { checkAuth } from "../store/slices/authSlice"
import LoginPage from "../pages/auth/LoginPage"
import RegisterPage from "../pages/auth/RegisterPage"
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage"
import ResetPasswordPage from "../pages/auth/ResetPasswordPage"
import DashboardPage from "../pages/dashboard/DashboardPage"
import AlbumListPage from "../pages/albums/AlbumListPage"
import CreateAlbumPage from "../pages/albums/CreateAlbumPage"
import AlbumDetailsPage from "../pages/albums/AlbumDetailsPage"
import AnalyticsPage from "../pages/albums/AnalyticsPage"
import PublicAlbumPage from "../pages/public/PublicAlbumPage"
import PublicAlbumsPage from "../pages/public/PublicAlbumsPage"
import ProfilePage from "../pages/profile/ProfilePage"
import SubscriptionPage from "../pages/subscription/SubscriptionPage"
import HomePage from "../pages/home/HomePage"
import AboutPage from "../pages/about/AboutPage"
import TermsPage from "../pages/legal/TermsPage"
import PrivacyPage from "../pages/legal/PrivacyPage"
import ContactPage from "../pages/contact/ContactPage"
import SpecialRequestPage from "../pages/special-request/SpecialRequestPage"
import LandingLayout from "../components/layout/LandingLayout"

const ProtectedRoute = () => {
	const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth)
	const dispatch = useAppDispatch()

	useEffect(() => {
		dispatch(checkAuth())
	}, [dispatch])

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-[#FDF8F3]">
				<div className="text-center space-y-4">
					<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#8B2E3C] border-r-transparent"></div>
					<p className="text-[#6B5A42]">Loading...</p>
				</div>
			</div>
		)
	}

	return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

const PublicRoute = () => {
	const { isAuthenticated } = useAppSelector((state) => state.auth)
	return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />
}

export default function AppRoutes() {
	return (
		<Routes>
			{/* Public Landing Pages */}
			<Route
				element={
					<LandingLayout>
						<Outlet />
					</LandingLayout>
				}>
				<Route path="/" element={<HomePage />} />
				<Route path="/about" element={<AboutPage />} />
				<Route path="/terms" element={<TermsPage />} />
				<Route path="/privacy" element={<PrivacyPage />} />
				<Route path="/contact" element={<ContactPage />} />
				<Route path="/special-request" element={<SpecialRequestPage />} />
			</Route>

			{/* Public Routes (Auth) */}
			<Route element={<PublicRoute />}>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/register" element={<RegisterPage />} />
				<Route path="/forgot-password" element={<ForgotPasswordPage />} />
				<Route path="/reset-password" element={<ResetPasswordPage />} />
			</Route>

			{/* Protected Routes */}
			<Route element={<ProtectedRoute />}>
				<Route path="/dashboard" element={<DashboardPage />} />
				<Route path="/albums" element={<AlbumListPage />} />
				<Route path="/albums/create" element={<CreateAlbumPage />} />
				<Route path="/albums/:id" element={<AlbumDetailsPage />} />
				<Route path="/albums/:id/analytics" element={<AnalyticsPage />} />
				<Route path="/profile" element={<ProfilePage />} />
				<Route path="/subscription" element={<SubscriptionPage />} />
			</Route>

			{/* Public Album Views (Accessible by anyone) */}
			<Route path="/public/albums" element={<PublicAlbumsPage />} />
			<Route path="/public/albums/:id" element={<PublicAlbumPage />} />

			{/* Catch all */}
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	)
}
