import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);
  const { isAuthenticated, isLoadingAuth } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-7xl font-light text-slate-300">404</h1>
            <div className="h-0.5 w-16 bg-slate-200 mx-auto"></div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-medium text-slate-800">
              Page Not Found
            </h2>
            <p className="text-slate-600 leading-relaxed">
              The page{" "}
              <span className="font-medium text-slate-700">"{pageName}"</span>{" "}
              could not be found in this application.
            </p>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {!isLoadingAuth && !isAuthenticated && (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-800 border border-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Log in
              </Link>
            )}
            <Link
              to={isAuthenticated ? "/" : "/login"}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
