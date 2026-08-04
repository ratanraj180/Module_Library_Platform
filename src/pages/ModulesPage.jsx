import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { ModuleListingPage } from "./dashboard/ModuleListingPage";

export function ModulesPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col justify-between">
      <div>
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
          <ModuleListingPage />
        </div>
      </div>
      <Footer />
    </div>
  );
}
