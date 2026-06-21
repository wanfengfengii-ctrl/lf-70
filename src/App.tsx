import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DesignPage } from "@/pages/DesignPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { PreviewPage } from "@/pages/PreviewPage";
import { ProjectComparisonView } from "@/components/projects/ProjectComparison";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DesignPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/preview/:id" element={<PreviewPage />} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="/compare/:idA/:idB" element={<ProjectComparisonView />} />
        <Route path="/compare" element={<ProjectComparisonView />} />
      </Routes>
    </Router>
  );
}
