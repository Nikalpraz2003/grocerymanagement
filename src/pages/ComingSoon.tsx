import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeftIcon, BikeIcon, SmartphoneIcon } from "lucide-react"

const ComingSoon = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Which store the visitor clicked, e.g. /coming-soon?store=App%20Store
  const store = searchParams.get("store")

  // Go back to the page the visitor came from; if there is none, go home
  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-app-cream">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <BikeIcon className="size-8 text-app-green" />
          <span className="text-2xl font-semibold text-app-green">Pasalmandu</span>
        </Link>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-app-green/10">
            <SmartphoneIcon className="size-8 text-app-green" />
          </div>

          <h1 className="text-3xl font-bold mb-2">Coming soon</h1>
          <p className="text-gray-600 mb-6">
            {store
              ? `Our app for ${store} is on its way.`
              : "Our mobile app is on its way."}{" "}
            Until then, you can order everything on our website.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              <ArrowLeftIcon className="size-4" />
              Go back
            </button>
            <Link
              to="/products"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-app-green text-white font-semibold hover:opacity-90 transition"
            >
              Start shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComingSoon