import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeftIcon, BikeIcon, Loader2Icon } from "lucide-react"
import { heroSectionData } from "../assets/assets"
import authService from "../services/authServices"

const ForgotPassword = () => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await authService.forgotPassword(email.trim())
      navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`)
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || "Could not send the code")
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
          <h2 className="text-4xl font-semibold text-white mb-4">Locked out?</h2>
          <p className="text-white/60 font-serif text-xl max-w-sm mx-auto">
            Enter your email and we will send you a 6-digit code to choose a new password.
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
            <h1 className="text-3xl font-bold mb-2">Forgot password</h1>
            <p className="text-gray-600">We will email you a 6-digit code</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
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
                  Sending...
                </>
              ) : (
                "Send code"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-app-green font-semibold hover:underline"
            >
              <ArrowLeftIcon className="size-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword