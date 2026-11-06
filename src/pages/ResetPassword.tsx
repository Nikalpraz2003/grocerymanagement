import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { BikeIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react"
import { heroSectionData } from "../assets/assets"
import authService from "../services/authServices"

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // This page opens as /reset-password?email=...
  const email = searchParams.get("email") ?? ""

  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code from your email")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      await authService.resetPassword(email, code.trim(), password)
      setDone(true)
      setTimeout(() => navigate("/login", { replace: true }), 2500)
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Could not reset your password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side */}
      <div className="hidden lg:flex lg:w-1/2 bg-app-green relative items-center justify-center">
        <img
          src={heroSectionData.hero_image}
          alt=""
          className="absolute inset-0 object-cover h-full bg-center opacity-10"
        />
        <div className="relative text-center px-12 z-10">
          <h2 className="text-4xl font-semibold text-white mb-4">Choose a new password</h2>
          <p className="text-white/60 font-serif text-xl max-w-sm mx-auto">
            Enter the code we emailed you, then pick a new password.
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-app-cream">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <BikeIcon className="size-8 text-app-green" />
              <span className="text-2xl font-semibold text-app-green">Pasalmandu</span>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Reset password</h1>
          </div>

          {!email ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center space-y-3">
              <p className="text-gray-700">Start by asking for a code to your email.</p>
              <Link
                to="/forgot-password"
                className="inline-block bg-app-green text-white px-5 py-2 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Send me a code
              </Link>
            </div>
          ) : done ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center space-y-3">
              <CheckCircle2Icon className="size-10 text-app-green mx-auto" />
              <p className="text-gray-700">Your password has been reset. Taking you to login...</p>
              <Link to="/login" className="text-app-green font-semibold hover:underline">
                Go to login now
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-center mb-4">
                We sent a 6-digit code to <span className="font-semibold">{email}</span>. It
                expires in 15 minutes.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">6-digit code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    autoComplete="one-time-code"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-app-green tracking-widest text-center text-lg"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">New password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-app-green"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Confirm new password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Type it again"
                    autoComplete="new-password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-app-green"
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-app-green text-white py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2Icon className="animate-spin size-4" />
                      Saving...
                    </>
                  ) : (
                    "Save new password"
                  )}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-gray-500">
                No code yet?{" "}
                <Link to="/forgot-password" className="text-app-green font-semibold hover:underline">
                  Send a new code
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPassword