// src/components/VehicleForm.tsx
import {
  Form,
  Button,
  Card,
  FloatingLabel,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import type { VehicleInputs } from "../types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ExcelUploader from "./ExcelUploader";

// Valeurs suggérées (modifiées selon les nouvelles exigences)
const SUGGESTED_VALUES = {
  category: "Catégorie 1 (Véhicule léger)",
  load: 750,
  speed: 45,
  desiredRange: 80,
  efficiency: 0.93, // Modifié pour correspondre aux nouveaux calculs
  slope: 16,
  acceleration: 1.3, // Modifié pour correspondre aux nouveaux calculs
  reductionRatio: 15.12,
  V_batt_max: 51,
  V_batt_min: 42,
};

// Constantes fixes comme spécifié
const FIXED_CONSTANTS = {
  area: 2.1, // Surface frontale (m²)
  dragCoef: 0.35, // Coef. de traînée aérodynamique
  rollingCoef: 0.015, // Coefficient de roulage
};

function VehicleForm() {
  const [formData, setFormData] = useState({
    category: "L6E",
    load: "750",
    speed: "45",
    desiredRange: "80",
    efficiency: SUGGESTED_VALUES.efficiency.toString(),
    slope: "16",
    acceleration: "1.3",
    reductionRatio: "15.12",
    V_batt_max: "51",
    V_batt_min: "42",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const [cycleData, setCycleData] = useState<any[]>([]);

  const handleDataUpload = (data: any[]) => {
    setCycleData(data);
  };

  const validateField = (name: string, value: string): string => {
    if (!value) return "Ce champ est requis";

    const numValue = parseFloat(value);
    if (isNaN(numValue) && name != "category")
      return "Valeur numérique requise";

    switch (name) {
      case "load":
        return numValue >= 0 ? "" : "Doit être positif";
      case "speed":
        return numValue > 0 ? "" : "Doit être > 0";
      case "desiredRange":
        return numValue > 0 ? "" : "Doit être > 0";
      case "dragCoef":
        return numValue > 0 ? "" : "Doit être > 0";
      case "rollingCoef":
        return numValue >= 0 ? "" : "Doit être ≥ 0";
      case "efficiency":
        return numValue > 0 && numValue <= 1 ? "" : "Doit être entre 0 et 1";
      case "reductionRatio":
        return numValue > 0 ? "" : "Doit être > 0";
      case "V_batt_max":
        return numValue > 0 ? "" : "Doit être > 0";
      case "V_batt_min":
        return numValue > 0 && numValue < parseFloat(formData.V_batt_max || "0")
          ? ""
          : "Doit être > 0 et < tension max";
      default:
        return "";
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation globale
    const newErrors: Record<string, string> = {};
    Object.entries(formData).forEach(([key, value]) => {
      newErrors[key] = validateField(key, value);
    });

    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err)) {
      return;
    }

    const numericData: VehicleInputs = {
      category: formData.category,
      load: parseFloat(formData.load),
      area: FIXED_CONSTANTS.area, // Utilisation de la constante fixe
      speed: parseFloat(formData.speed),
      desiredRange: parseFloat(formData.desiredRange),
      dragCoef: FIXED_CONSTANTS.dragCoef, // Utilisation de la constante fixe
      rollingCoef: FIXED_CONSTANTS.rollingCoef, // Utilisation de la constante fixe
      efficiency: parseFloat(formData.efficiency),
      slope: parseFloat(formData.slope),
      acceleration: parseFloat(formData.acceleration),
      reductionRatio: parseFloat(formData.reductionRatio),
      V_batt_max: parseFloat(formData.V_batt_max),
      V_batt_min: parseFloat(formData.V_batt_min),
    };
    console.log("Form data submitted:", numericData);

    navigate("/resultats", {
      state: {
        inputs: numericData,
        cycleData,
        category: formData.category,
      },
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundImage: "url('IMAGES/stellantis.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        overflow: "auto",
      }}
      aria-label="Stellantis company logo forms the background"
    >
      <div
        style={{
          display: "flex",
          top: "100",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          padding: "20px",
          backgroundColor: "rgba(0,0,0,0.5)", // Fond semi-transparent pour améliorer la lisibilité
        }}
      >
        <Card
          className="mb-4"
          style={{
            width: "100%",
            maxWidth: "800px",
            opacity: 0.9,
            background: "rgba(255, 255, 255, 0.25)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)", // support Safari
            border: "none",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          }}
        >
          <Card.Header
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              color: "white",
              borderBottom: "none",
            }}
          >
            Paramètres du Véhicule
          </Card.Header>
          <Card.Body>
            {Object.values(errors).some((err) => err) && (
              <Alert variant="danger" className="mb-4">
                Veuillez corriger les erreurs avant de soumettre
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <FloatingLabel label="Catégorie du véhicule" className="mb-3">
                    <Form.Select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      isInvalid={!!errors.category}
                      required
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                        backdropFilter: "blur(5px)",
                        WebkitBackdropFilter: "blur(5px)", // support Safari
                      }}
                    >
                      <option value="">Sélectionnez une catégorie</option>
                      <option value="L5E">L5E</option>
                      <option value="L6E">L6E</option>
                      <option value="L7E">L7E</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.category}
                    </Form.Control.Feedback>
                  </FloatingLabel>
                </Col>
                <Col md={6}>
                  <FloatingLabel label="Charge maximale (kg)" className="mb-3">
                    <Form.Control
                      type="number"
                      name="load"
                      value={formData.load}
                      onChange={handleChange}
                      placeholder={`Ex: ${SUGGESTED_VALUES.load}`}
                      isInvalid={!!errors.load}
                      required
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                        backdropFilter: "blur(5px)",
                        WebkitBackdropFilter: "blur(5px)", // support Safari
                      }}
                      min="0"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.load}
                    </Form.Control.Feedback>
                  </FloatingLabel>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <FloatingLabel
                    label="Vitesse maximale (km/h)"
                    className="mb-3"
                  >
                    <Form.Control
                      type="number"
                      name="speed"
                      value={formData.speed}
                      onChange={handleChange}
                      placeholder={`Ex: ${SUGGESTED_VALUES.speed}`}
                      isInvalid={!!errors.speed}
                      required
                      min="1"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                        backdropFilter: "blur(5px)",
                        WebkitBackdropFilter: "blur(5px)", // support Safari
                      }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.speed}
                    </Form.Control.Feedback>
                  </FloatingLabel>
                </Col>

                <Col md={6}>
                  <FloatingLabel label="Rapport de réduction" className="mb-3">
                    <Form.Control
                      type="number"
                      step="0.01"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                        backdropFilter: "blur(5px)",
                        WebkitBackdropFilter: "blur(5px)", // support Safari
                      }}
                      name="reductionRatio"
                      value={formData.reductionRatio}
                      onChange={handleChange}
                      placeholder={`Ex: ${SUGGESTED_VALUES.reductionRatio}`}
                      isInvalid={!!errors.reductionRatio}
                      required
                      min="0.01"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.reductionRatio}
                    </Form.Control.Feedback>
                  </FloatingLabel>
                </Col>

                {/* Modifier le champ efficacité pour utiliser la valeur fixe */}
                <Col md={6}>
                  <FloatingLabel label="Efficacité" hidden className="mb-3">
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="efficiency"
                      value={formData.efficiency}
                      onChange={handleChange}
                      placeholder="0.93"
                      isInvalid={!!errors.efficiency}
                      required
                      hidden
                      min="0.01"
                      max="1"
                      readOnly // Rendre le champ en lecture seule
                      style={{
                        backgroundColor: "rgba(200, 200, 200, 0.5)",
                        backdropFilter: "blur(5px)",
                      }}
                    />
                  </FloatingLabel>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <FloatingLabel
                    label="Autonomie désirée (km)"
                    className="mb-3"
                  >
                    <Form.Control
                      type="number"
                      name="desiredRange"
                      value={formData.desiredRange}
                      onChange={handleChange}
                      placeholder={`Ex: ${SUGGESTED_VALUES.desiredRange}`}
                      isInvalid={!!errors.desiredRange}
                      required
                      min="1"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                        backdropFilter: "blur(5px)",
                        WebkitBackdropFilter: "blur(5px)", // support Safari
                      }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.desiredRange}
                    </Form.Control.Feedback>
                  </FloatingLabel>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <FloatingLabel label="Pente (%)" hidden className="mb-3">
                    <Form.Control
                      type="number"
                      step="0.1"
                      name="slope"
                      value={formData.slope}
                      onChange={handleChange}
                      placeholder={`Ex: ${SUGGESTED_VALUES.slope}`}
                      isInvalid={!!errors.slope}
                      hidden
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                        backdropFilter: "blur(5px)",
                        WebkitBackdropFilter: "blur(5px)", // support Safari
                      }}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.slope}
                    </Form.Control.Feedback>
                  </FloatingLabel>
                </Col>

                <Col md={6}>
                  <FloatingLabel
                    label="Accélération (m/s²)"
                    hidden
                    className="mb-3"
                  >
                    <Form.Control
                      type="number"
                      step="0.1"
                      name="acceleration"
                      value={formData.acceleration}
                      onChange={handleChange}
                      hidden
                      placeholder={`Ex: ${SUGGESTED_VALUES.acceleration}`}
                      isInvalid={!!errors.acceleration}
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.5)",
                        backdropFilter: "blur(5px)",
                        WebkitBackdropFilter: "blur(5px)", // support Safari
                      }}
                    />
                  </FloatingLabel>
                </Col>
              </Row>

              <ExcelUploader onDataUpload={handleDataUpload} />

              <div className="d-grid mt-4">
                <Button
                  style={{
                    background: "black",
                    display: "flex",
                    justifySelf: "end",
                    border: "black",
                  }}
                  type="submit"
                >
                  Calculer les paramètres
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default VehicleForm;
