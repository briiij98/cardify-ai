import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import TemplateDetail from "./pages/TemplateDetail";
import Customize from "./pages/Customize";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import { Terms, Privacy } from "./pages/Legal";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="invitations" element={<Browse group="all" />} />
        <Route path="hindu-wedding" element={<Browse group="hindu-wedding" />} />
        <Route path="christian-wedding" element={<Browse group="christian-wedding" />} />
        <Route path="muslim-wedding" element={<Browse group="muslim-wedding" />} />
        <Route path="birthday" element={<Browse group="birthday" />} />
        <Route path="other-events" element={<Browse group="other-events" />} />
        <Route path="invitation/:id" element={<TemplateDetail />} />
        <Route path="customize/:id" element={<Customize />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="payment-success" element={<PaymentSuccess />} />
        <Route path="payment-failure" element={<PaymentFailure />} />
        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
