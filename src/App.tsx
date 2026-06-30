import { lazy, Suspense } from "react"
import { Routes, Route } from "react-router"
import { Toaster } from "@/components/ui/sonner"
import { Spinner } from "@/components/ui/spinner"
import LandingPage from "@/pages/landing"

const AdminLogin = lazy(() => import("@/pages/admin/login"))
const AdminLayout = lazy(() => import("@/pages/admin/layout"))
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"))
const AdminContent = lazy(() => import("@/pages/admin/content"))
const AdminReleases = lazy(() => import("@/pages/admin/releases"))
const AdminProducers = lazy(() => import("@/pages/admin/producers"))
const AdminVideos = lazy(() => import("@/pages/admin/videos"))
const AdminPhotos = lazy(() => import("@/pages/admin/photos"))
const AdminEvents = lazy(() => import("@/pages/admin/events"))
const AdminPartners = lazy(() => import("@/pages/admin/partners"))
const AdminMessages = lazy(() => import("@/pages/admin/messages"))

function LazyFallback() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <Spinner className="h-6 w-6 text-primary" />
    </div>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="font-mono text-6xl font-bold text-primary neon-text">404</h1>
      <p className="mt-4 font-mono text-lg text-muted-foreground">Page not found</p>
      <a href="/" className="mt-6 rounded-md border border-primary/50 px-6 py-2 font-mono text-sm text-primary transition-all hover:bg-primary/10">
        Back to home
      </a>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Suspense fallback={<LazyFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="releases" element={<AdminReleases />} />
            <Route path="producers" element={<AdminProducers />} />
            <Route path="videos" element={<AdminVideos />} />
            <Route path="photos" element={<AdminPhotos />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="partners" element={<AdminPartners />} />
            <Route path="messages" element={<AdminMessages />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  )
}
