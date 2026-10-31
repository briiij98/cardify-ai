import { Link } from "react-router-dom";
import { useSeo } from "../lib/useSeo";

export default function NotFound() {
  useSeo("Page not found", "The page you are looking for does not exist.");
  return (
    <div className="container-x py-24 text-center">
      <h1 className="text-5xl font-medium">Page not found</h1>
      <p className="mt-3 text-muted">We couldn't find what you were looking for.</p>
      <Link to="/invitations" className="btn-primary mt-6">Browse invitations</Link>
    </div>
  );
}
