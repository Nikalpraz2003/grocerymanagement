import { useEffect, useState } from "react"
import { heroSectionData } from "../assets/assets"
import { Link, useLocation } from "react-router-dom"
import { BikeIcon, Loader2Icon } from "lucide-react"
import authService from "../services/authServices"

const homeFor = (user: { isAdmin?: boolean; isVendor?: boolean; roles?: string[] } | null) =>
  user?.isAdmin || user?.roles?.includes("Admin") ? "/admin"
    : user?.isVendor || user?.roles?.includes("Vendor") ? "/vendor"
    : "/"

const Login = () => {
  const [isLoginState, setIsLoginState] = useState(true)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const location = useLocation()

  // Page the user tried to open before being sent to /login (set by ProtectedRoute)
  const from = (location.state as { from?: string } | null)?.from

  // Full page load so every part of the app (Navbar, cart, admin guard) reads the new login
  const goAfterLogin = (user: { isAdmin?: boolean; roles?: string[] } | null) => {
    window.location.replace(from ?? homeFor(user))
  }

  // Already logged in? Skip the form.
  useEffect(() => {
    if (authService.isAuthenticated()) goAfterLogin(authService.getCurrentUser())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle Login
  const handleLogin = async () => {
    const response = await authService.login(email.trim(), password)
    goAfterLogin(response.user)
  }

  // Handle Register (the API logs the new user in straight away)
  const handleRegister = async () => {
    if (!name.trim()) throw new Error("Full name is required")
    if (password.length < 6) throw new Error("Password must be at least 6 characters")
    if (password !== confirmPassword) throw new Error("Passwords do not match")

    const response = await authService.register(email.trim(), password, name.trim())
    goAfterLogin(response.user)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      if (isLoginState) await handleLogin()
      else await handleRegister()
    } catch (err: unknown) {
      const message =
        (err as { message?: string })?.message ||
        (isLoginState ? "Login failed" : "Registration failed")
      setError(message)
      setLoading(false)
    }
  }

  const switchMode = () => {
    setIsLoginState(!isLoginState)
    setError("")
    setName("")
    setPassword("")
    setConfirmPassword("")
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
          <h2 className="text-4xl font-semibold text-white mb-4">
            Welcome back to Pasalmandu
          </h2>
          <p className="text-white/60 font-serif text-xl max-w-sm mx-auto">
            Get fresh organic produce, delivered to your doorstep
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-app-cream">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <BikeIcon className="size-8 text-app-green" />
              <span className="text-2xl font-semibold text-app-green">Pasalmandu</span>
            </Link>
            <h1 className="text-3xl font-bold mb-2">{isLoginState ? "Login" : "Register"}</h1>
            <p className="text-gray-600">
              {isLoginState ? "Access your account" : "Create a new account"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Login / Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginState && (
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-app-green"
                  required
                  disabled={loading}
                />
              </div>
            )}

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

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete={isLoginState ? "current-password" : "new-password"}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-app-green"
                required
                disabled={loading}
              />
            </div>

            {!isLoginState && (
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-app-green"
                  required
                  disabled={loading}
                />
              </div>
            )}

            {isLoginState && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm font-medium text-app-green hover:underline"
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-app-green text-white py-2 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2Icon className="animate-spin size-4" />
                  {isLoginState ? "Logging in..." : "Registering..."}
                </>
              ) : isLoginState ? (
                "Login"
              ) : (
                "Register"
              )}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isLoginState ? "Don't have an account?" : "Already have an account?"}
              <button
                type="button"
                onClick={switchMode}
                disabled={loading}
                className="text-app-green font-semibold ml-1 hover:underline disabled:opacity-50"
              >
                {isLoginState ? "Register" : "Login"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
