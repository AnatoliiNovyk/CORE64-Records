import { Routes, Route } from "react-router"
import { Toaster } from "@/components/ui/sonner"
import LandingPage from "@/pages/landing"
import AdminLogin from "@/pages/admin/login"
import AdminLayout from "@/pages/admin/layout"
import AdminDashboard from "@/pages/admin/dashboard"
import AdminContent from "@/pages/admin/content"
import AdminReleases from "@/pages/admin/releases"
import AdminProducers from "@/pages/admin/producers"
import AdminVideos from "@/pages/admin/videos"
import AdminPhotos from "@/pages/admin/photos"
import AdminEvents from "@/pages/admin/events"
import AdminPartners from "@/pages/admin/partners"
import AdminMessages from "@/pages/admin/messages"

export default function App() {
  return (
    <>
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
      </Routes>
      <Toaster />
    </>
  )
}
