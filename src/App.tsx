// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import VehicleForm from "./components/VehiculeForm";
import ResultsPage from "./components/ResultsPage";
import Welcome from "./components/welcome";

function App() {
  return (
    <Router>
      <div className="container mt-4">
        <h1 className="text-center mb-4">
          Calculateur pour Véhicules Électriques
        </h1>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/form" element={<VehicleForm />} />
          <Route path="/resultats" element={<ResultsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
