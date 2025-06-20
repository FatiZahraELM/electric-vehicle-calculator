// src/pages/ResultPage.tsx
import { useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  Card,
  Alert,
  Row,
  Col,
  Table,
  Container,
  ListGroup,
  Badge,
  Button,
  Tabs,
  Tab,
  Image,
} from "react-bootstrap";
import Plot from "react-plotly.js";
import { VehicleSimulation } from "../utils/code";
import { generateVehicleReport } from "./PDFGenerator";

interface ResultData {
  inputs: any;
  cycleData: any[];
  category: string;
}

const CATEGORY_POSITIONS = {
  L5E: {
    mass: { top: "20%", left: "45%" },

    popup_engine: { top: "48%", left: "32%" },
    popup_reducer: { top: "48%", left: "23.5%" },
    popup_inverter: { top: "48%", left: "45%" },
    popup_batt_48: { top: "48%", left: "64%" },
    popup_batt_12: { top: "68%", left: "45%" },
    popup_obc_dc: { top: "70%", left: "69%" },
  },
  L6E: {
    mass: { top: "25%", left: "45%" },
    popup_engine: { top: "47%", left: "72%" },
    popup_reducer: { top: "47%", left: "81%" },
    popup_inverter: { top: "48%", left: "62%" },
    popup_batt_48: { top: "45%", left: "32%" },
    popup_batt_12: { top: "68%", left: "57%" },
    popup_obc_dc: { top: "68%", left: "32%" },
  },
  L7E: {
    mass: { top: "30%", left: "50%" },
    popup_engine: { top: "48%", left: "73%" },
    popup_reducer: { top: "48%", left: "81%" },
    popup_inverter: { top: "48%", left: "62%" },
    popup_batt_48: { top: "46%", left: "32%" },
    popup_batt_12: { top: "68%", left: "57%" },
    popup_obc_dc: { top: "68%", left: "32%" },
  },
};

// Dans votre composant ResultPage, ajoutez ce style dans une balise <style> ou dans votre fichier CSS global
const popupStyles = `
  .motor-popup {
    position: absolute;
    display: none;
    width: 300px;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 1000;
    padding: 10px;
  }
  
  .motor-popup img {
    width: 100%;
    height: auto;
    margin-bottom: 8px;
  }
  
  .motor-popup p {
    margin: 0;
    font-size: 14px;
    color: #333;
  }
  
  .popup-trigger {
    position: relative;
    cursor: pointer;
  }
  
  .popup-trigger:hover .motor-popup {
    display: block;
  }
`;

export default function ResultPage() {
  const location = useLocation();
  const { inputs, cycleData, category } = location.state as ResultData;
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Références pour la capture des graphiques
  const thermalGraphRef = useRef<HTMLDivElement>(null);
  const degradationGraphRef = useRef<HTMLDivElement>(null);
  const powerGraphRef = useRef<HTMLDivElement>(null);
  const torqueGraphRef = useRef<HTMLDivElement>(null);
  const combinedGraphRef = useRef<HTMLDivElement>(null);
  const efficiencyGraphRef = useRef<HTMLDivElement>(null);
  const categoryImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!inputs) {
      setError("Aucune donnée d'entrée trouvée");
      setLoading(false);
      return;
    }

    try {
      const sim = new VehicleSimulation(inputs);

      // Exécuter toutes les simulations
      const thermalResults = sim.runThermalSimulation();
      const degradationResults = sim.runCapacityDegradation();
      const rk4Results = sim.runRK4Simulation();
      const batteryResults = sim.runBatterySimulation();
      // const enhancedResults = sim.runEnhancedCalculations();

      // Pour WMTC, utilisez les données du cycle si disponibles
      let wmtcResults = null;
      if (cycleData && cycleData.length > 0) {
        const wmtcData = {
          t: cycleData.map((_, i) => i),
          v: cycleData.map((item) => item.v || 0),
        };
        wmtcResults = sim.runWMTCSimulation(wmtcData);
      }

      setResults({
        thermalResults,
        degradationResults,
        rk4Results,
        batteryResults,
        // enhancedResults,
        wmtcResults,
      });

      setLoading(false);
    } catch (err) {
      setError("Erreur lors de l'exécution des simulations");
      console.error(err);
      setLoading(false);
    }
  }, [inputs, cycleData]);

  const handleGeneratePDF = async () => {
    if (!results) return;

    try {
      // Préparer les données pour le PDF
      const pdfData = {
        inputs,
        category,
        results: {
          motorParams: {
            P_max: results.batteryResults.maxValues.PMaxObs.toFixed(2),
            Pcontinue: results.batteryResults.motorParams.Pcontinue.toFixed(2),
            T1: results.batteryResults.motorParams.T1.toFixed(2),
            T2: results.batteryResults.motorParams.T2.toFixed(2),
            rpm1: 500,
            rpm2: results.batteryResults.motorParams.rpm2.toFixed(2),
            wheelRadius: 0.287,
            ratio: inputs.reductionRatio, // Ajout du rapport de réduction requis
          },
          batteryParams: {
            capacityAh: results.wmtcResults.capAhMarge.toFixed(2),
            capacityWh: results.wmtcResults.capWhMarge.toFixed(2),
            // maxChargeCurrent:
            //   results.batteryResults.batteryInfo.INominal.toFixed(2),
            maxDischargeCurrent:
              results.batteryResults.maxValues.IMaxObs.toFixed(2),
            nSeries: Math.ceil(results.wmtcResults.nSeries),
            nParallel: Math.ceil(results.wmtcResults.nParallel),
            totalCells:
              Math.ceil(results.wmtcResults.nSeries) *
              Math.ceil(results.wmtcResults.nParallel),
            V_batt_max: inputs.V_batt_max,
            V_batt_min: inputs.V_batt_min,
          },
          mass_battery: results.wmtcResults.mass_battery,
          thermalResults: {
            maxChargeTemp: results.thermalResults.T_max_c.toFixed(2),
            maxDischargeTemp: results.thermalResults.T_max_d.toFixed(2),
            temperatures: results.thermalResults.temperatures,
            timeHours: results.thermalResults.timeHours,
          },
          degradation: {
            at1000: results.degradationResults.cap_1000.toFixed(2),
            at2000: results.degradationResults.cap_2000.toFixed(2),
          },
          performanceCurves: {
            rpm: results.batteryResults.results.map((r: any) => r.rpmMotor),
            power: results.batteryResults.results.map((r: any) => r.P),
            torque: results.batteryResults.results.map((r: any) => r.T),
            speed: results.batteryResults.results.map((r: any) => r.vKmh),
            efficiency: results.batteryResults.results.map(
              (r: any) => r.efficiency * 100
            ),
          },
          forces: {
            Roulage: results.batteryResults.forces.F_roll.toFixed(2),
            Aérodynamique: results.batteryResults.forces.F_aero.toFixed(2),
            Pente: results.batteryResults.forces.F_slope.toFixed(2),
            Accélération: results.batteryResults.forces.F_accel,
          },
          recommendations: [
            "Moteur: Moteur asynchrone à aimants permanents",
            "Batterie: Pack LiFePO4 avec refroidissement passif avec l'air",
          ],
        },
      };

      // Générer le PDF
      await generateVehicleReport(pdfData);
    } catch (err) {
      console.error("Erreur lors de la génération du PDF:", err);
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-3">Calcul des résultats en cours...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="m-3">
        {error}
      </Alert>
    );
  }

  if (!results) {
    return (
      <Alert variant="warning" className="m-3">
        Aucun résultat à afficher
      </Alert>
    );
  }

  console.log(results);

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
      <style>{popupStyles}</style>

      <Container
        className="py-4"
        style={{
          display: "flex",
          top: "100",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          minWidth: "100%",
          padding: "20px",
          backgroundColor: "rgba(0,0,0,0.5)", // Fond semi-transparent pour améliorer la lisibilité
        }}
      >
        <h2 className="mb-4 text-center">
          <Badge bg="black">Résultats de la simulation</Badge>
        </h2>

        {/* Section Résultats Principaux */}
        <Card className="mb-4 shadow-sm w-100">
          <Card.Header className="bg-black text-white">
            <h5>Résultats Principaux</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Table striped bordered>
                  <tbody>
                    <tr>
                      <td>
                        <strong>Catégorie</strong>
                      </td>
                      <td>{category}</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Charge max</strong>
                      </td>
                      <td>{inputs.load} kg</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Vitesse max</strong>
                      </td>
                      <td>{inputs.speed} km/h</td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Autonomie</strong>
                      </td>
                      <td>{inputs.desiredRange} km</td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
              <Col md={6}>
                <Table striped bordered>
                  <tbody>
                    <tr>
                      <td>
                        <strong>Puissance max</strong>
                      </td>
                      <td>
                        {results.batteryResults.maxValues.PMaxObs.toFixed(2)} W
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Puissance Continue</strong>
                      </td>
                      <td>
                        {results.batteryResults.motorParams.Pcontinue.toFixed(
                          2
                        )}{" "}
                        W
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>Couple max</strong>
                      </td>
                      <td>
                        {results.batteryResults.maxValues.TMaxObs.toFixed(2)} Nm
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <strong>RPM max</strong>
                      </td>
                      <td>
                        {results.batteryResults.motorParams.rpm2.toFixed(2)}{" "}
                        tr/min
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Image de la catégorie avec annotations */}
        <Card className="mb-4 shadow-sm w-100" ref={categoryImageRef}>
          <Card.Header className="bg-black text-white">
            <h5>Configuration {category}</h5>
          </Card.Header>
          <Card.Body>
            <div style={{ position: "relative", width: "100%" }}>
              <Image
                src={`/IMAGES/${category}.jpg`}
                alt={`Véhicule ${category}`}
                fluid
                rounded
              />

              {CATEGORY_POSITIONS[
                category as keyof typeof CATEGORY_POSITIONS
              ] && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      ...CATEGORY_POSITIONS[
                        category as keyof typeof CATEGORY_POSITIONS
                      ].mass,
                      transform: "translate(-50%, -50%)",
                      backgroundColor: "rgba(255,255,255,0.8)",
                      padding: "5px 10px",
                      borderRadius: "5px",
                      border: "1px solid #ddd",
                      fontWeight: "bold",
                    }}
                  >
                    Masse: {inputs.load} kg
                  </div>

                  {/* popup moteur*/}
                  <div
                    style={{
                      position: "absolute",
                      ...CATEGORY_POSITIONS[
                        category as keyof typeof CATEGORY_POSITIONS
                      ].popup_engine,
                      transform: "translate(-50%, -50%)",
                      width: "90px",
                      height: "70px",
                      padding: "5px 10px",
                      // borderRadius: "5px",
                      // border: "1px solid #ddd",
                      fontWeight: "bold",
                    }}
                    className="popup-trigger"
                  >
                    <div className="motor-popup">
                      <img src="/IMAGES/engine.png" alt="Moteur électrique" />
                      <p>Spécifications techniques:</p>
                      <ul>
                        <li>
                          Puissance max:{" "}
                          {results.batteryResults.maxValues.PMaxObs.toFixed(2)}{" "}
                          W
                        </li>
                        <li>
                          Couple max:{" "}
                          {results.batteryResults.maxValues.TMaxObs.toFixed(2)}{" "}
                          Nm
                        </li>
                        <li>
                          RPM max:{" "}
                          {results.batteryResults.motorParams.rpm2.toFixed(2)}{" "}
                          tr/min
                        </li>
                      </ul>
                    </div>
                  </div>
                  {/* popup reducer*/}
                  <div
                    style={{
                      position: "absolute",
                      ...CATEGORY_POSITIONS[
                        category as keyof typeof CATEGORY_POSITIONS
                      ].popup_reducer,
                      transform: "translate(-50%, -50%)",
                      width: "100px",
                      height: "65px",
                      padding: "5px 10px",
                      // borderRadius: "5px",
                      // border: "1px solid #ddd",
                      fontWeight: "bold",
                    }}
                    className="popup-trigger"
                  >
                    <div className="motor-popup">
                      <img
                        src="/IMAGES/reducer.png"
                        alt="Réducteur électrique"
                      />
                      <p>Spécifications techniques:</p>
                      <ul>
                        <li>Rapport de réduction : {inputs.reductionRatio} </li>
                      </ul>
                    </div>
                  </div>
                  {/* popup inverter*/}
                  <div
                    style={{
                      position: "absolute",
                      ...CATEGORY_POSITIONS[
                        category as keyof typeof CATEGORY_POSITIONS
                      ].popup_inverter,
                      transform: "translate(-50%, -50%)",
                      width: "70px",
                      height: "50px",
                      padding: "5px 10px",
                      // borderRadius: "5px",
                      // border: "1px solid #ddd",
                      fontWeight: "bold",
                    }}
                    className="popup-trigger"
                  >
                    <div className="motor-popup">
                      <img
                        src="/IMAGES/Inverter.png"
                        alt="Inverter électrique"
                      />
                    </div>
                  </div>
                  {/* popup BATTERIE 48V*/}
                  <div
                    style={{
                      position: "absolute",
                      ...CATEGORY_POSITIONS[
                        category as keyof typeof CATEGORY_POSITIONS
                      ].popup_batt_48,
                      transform: "translate(-50%, -50%)",
                      width: "80px",
                      height: "180px",
                      padding: "5px 10px",
                      // borderRadius: "5px",
                      // border: "1px solid #ddd",
                      fontWeight: "bold",
                    }}
                    className="popup-trigger"
                  >
                    <div className="motor-popup">
                      <img src="/IMAGES/batt_48V.png" alt="Batterie 48V" />
                      <p>Spécifications techniques</p>
                      <ul>
                        <li>
                          Batterie: {results.wmtcResults.capAhMarge.toFixed(2)}{" "}
                          Ah
                        </li>
                      </ul>
                    </div>
                  </div>
                  {/* popup BATTERIE 12V*/}
                  <div
                    style={{
                      position: "absolute",
                      ...CATEGORY_POSITIONS[
                        category as keyof typeof CATEGORY_POSITIONS
                      ].popup_batt_12,
                      transform: "translate(-50%, -50%)",
                      width: "58px",
                      height: "44px",
                      padding: "5px 10px",
                      // borderRadius: "5px",
                      // border: "1px solid #ddd",
                      fontWeight: "bold",
                    }}
                    className="popup-trigger"
                  >
                    <div className="motor-popup">
                      <img src="/IMAGES/batteriee_12V.png" alt="batterie 12V" />
                    </div>
                  </div>
                  {/* popup OBC_DC*/}
                  <div
                    style={{
                      position: "absolute",
                      ...CATEGORY_POSITIONS[
                        category as keyof typeof CATEGORY_POSITIONS
                      ].popup_obc_dc,
                      transform: "translate(-50%, -50%)",
                      width: "58px",
                      height: "55px",
                      padding: "5px 10px",
                      // borderRadius: "5px",
                      // border: "1px solid #ddd",
                      fontWeight: "bold",
                    }}
                    className="popup-trigger"
                  >
                    <div className="motor-popup">
                      <img src="/IMAGES/OBC_DC.png" alt="OBC DC" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Graphique Thermique */}
        <Card className="mb-4 shadow-sm w-100" ref={thermalGraphRef}>
          <Card.Header className="bg-black text-white">
            <h5>Comportement thermique</h5>
          </Card.Header>
          <Card.Body>
            <div className="graph-container" style={{ height: "500px" }}>
              <Plot
                data={results.thermalResults.fig.data}
                layout={{
                  ...results.thermalResults.fig.layout,
                  autosize: true,
                  margin: { l: 60, r: 30, b: 60, t: 80, pad: 4 },
                }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <Row className="mt-3">
              <Col md={6}>
                <Alert variant="info">
                  Température max en charge:{" "}
                  <strong>
                    {results.thermalResults.T_max_c.toFixed(2)} °C
                  </strong>
                </Alert>
              </Col>
              <Col md={6}>
                <Alert variant="warning">
                  Température max en décharge:{" "}
                  <strong>
                    {results.thermalResults.T_max_d.toFixed(2)} °C
                  </strong>
                </Alert>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Graphique Dégradation */}
        <Card className="mb-4 shadow-sm w-100" ref={degradationGraphRef}>
          <Card.Header className="bg-black text-white">
            <h5>Dégradation de capacité</h5>
          </Card.Header>
          <Card.Body>
            <div className="graph-container" style={{ height: "500px" }}>
              <Plot
                data={results.degradationResults.fig.data}
                layout={{
                  ...results.degradationResults.fig.layout,
                  autosize: true,
                  margin: { l: 60, r: 30, b: 60, t: 80, pad: 4 },
                }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <Row className="mt-3">
              <Col md={6}>
                <Alert variant="info">
                  Capacité après 1000 cycles:{" "}
                  <strong>
                    {results.degradationResults.cap_1000.toFixed(2)}%
                  </strong>
                </Alert>
              </Col>
              <Col md={6}>
                <Alert variant="warning">
                  Capacité après 2000 cycles:{" "}
                  <strong>
                    {results.degradationResults.cap_2000.toFixed(2)}%
                  </strong>
                </Alert>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Performances du moteur */}
        <Card className="mb-4 shadow-sm w-100">
          <Card.Header className="bg-black text-white">
            <h5>Performances du moteur</h5>
          </Card.Header>
          <Card.Body>
            <Tabs defaultActiveKey="power" className="mb-3">
              <Tab eventKey="power" title="Puissance">
                <div
                  ref={powerGraphRef}
                  className="graph-container"
                  style={{ height: "500px" }}
                >
                  <Plot
                    data={[
                      {
                        x: results.batteryResults.results.map(
                          (r: any) => r.rpmMotor
                        ),
                        y: results.batteryResults.results.map((r: any) => r.P),
                        type: "scatter",
                        mode: "lines",
                        name: "Puissance (W)",
                        line: { color: "#4CAF50", width: 3 },
                      },
                    ]}
                    layout={{
                      title: { text: "Courbe de puissance" },
                      xaxis: { title: { text: "RPM moteur" } },
                      yaxis: { title: { text: "Puissance (W)" } },
                      hovermode: "closest",
                      showlegend: true,
                      autosize: true,
                      margin: { l: 60, r: 30, b: 60, t: 80, pad: 4 },
                    }}
                    useResizeHandler={true}
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </Tab>

              <Tab eventKey="torque" title="Couple">
                <div
                  ref={torqueGraphRef}
                  className="graph-container"
                  style={{ height: "500px" }}
                >
                  <Plot
                    data={[
                      {
                        x: results.batteryResults.results.map(
                          (r: any) => r.rpmMotor
                        ),
                        y: results.batteryResults.results.map((r: any) => r.T),
                        type: "scatter",
                        mode: "lines",
                        name: "Couple (Nm)",
                        line: { color: "#2196F3", width: 3 },
                      },
                    ]}
                    layout={{
                      title: { text: "Courbe de couple" },
                      xaxis: { title: { text: "RPM moteur" } },
                      yaxis: { title: { text: "Couple (Nm)" } },
                      hovermode: "closest",
                      showlegend: true,
                      autosize: true,
                      margin: { l: 60, r: 30, b: 60, t: 80, pad: 4 },
                    }}
                    useResizeHandler={true}
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </Tab>

              <Tab eventKey="combined" title="Combined">
                <div
                  ref={combinedGraphRef}
                  className="graph-container"
                  style={{ height: "500px" }}
                >
                  <Plot
                    data={[
                      {
                        x: results.batteryResults.results.map(
                          (r: any) => r.rpmMotor
                        ),
                        y: results.batteryResults.results.map((r: any) => r.P),
                        type: "scatter",
                        mode: "lines",
                        name: "Puissance (W)",
                        line: { color: "#4CAF50", width: 3 },
                      },
                      {
                        x: results.batteryResults.results.map(
                          (r: any) => r.rpmMotor
                        ),
                        y: results.batteryResults.results.map((r: any) => r.T),
                        type: "scatter",
                        mode: "lines",
                        name: "Couple (Nm)",
                        yaxis: "y2",
                        line: { color: "#2196F3", width: 3 },
                      },
                    ]}
                    layout={{
                      title: { text: "Courbes de puissance et couple" },
                      xaxis: { title: { text: "RPM moteur" } },
                      yaxis: {
                        title: { text: "Puissance (W)" },
                        side: "left",
                        color: "#4CAF50",
                      },
                      yaxis2: {
                        title: { text: "Couple (Nm)" },
                        overlaying: "y",
                        side: "right",
                        color: "#2196F3",
                      },
                      hovermode: "x unified",
                      showlegend: true,
                      autosize: true,
                      margin: { l: 60, r: 60, b: 60, t: 80, pad: 4 },
                      legend: { orientation: "h", y: 1.1 },
                    }}
                    useResizeHandler={true}
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </Tab>

              <Tab eventKey="efficiency" title="Efficacité">
                <div
                  ref={efficiencyGraphRef}
                  className="graph-container"
                  style={{ height: "500px" }}
                >
                  <Plot
                    data={[
                      {
                        x: results.batteryResults.results.map(
                          (r: any) => r.rpmMotor
                        ),
                        y: results.batteryResults.results.map(
                          (r: any) => r.efficiency * 100
                        ),
                        type: "scatter",
                        mode: "lines",
                        name: "Efficacité (%)",
                        line: { color: "#9C27B0", width: 3 },
                      },
                    ]}
                    layout={{
                      title: { text: "Courbe d'efficacité" },
                      xaxis: { title: { text: "RPM moteur" } },
                      yaxis: { title: { text: "Efficacité (%)" } },
                      hovermode: "closest",
                      showlegend: true,
                      autosize: true,
                      margin: { l: 60, r: 30, b: 60, t: 80, pad: 4 },
                    }}
                    useResizeHandler={true}
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              </Tab>
            </Tabs>

            {/* Tableau des paramètres clés */}
            <Card className="mt-4">
              <Card.Header>
                <h6>Paramètres clés du moteur</h6>
              </Card.Header>
              <Card.Body>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Paramètre</th>
                      <th>Valeur</th>
                      <th>RPM</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Puissance maximale</td>
                      <td>
                        {results.batteryResults.maxValues.PMaxObs.toFixed(2)} W
                      </td>
                      <td>
                        {results.batteryResults.maxValues.rpmPMax.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td>Couple maximal</td>
                      <td>
                        {results.batteryResults.maxValues.TMaxObs.toFixed(2)} Nm
                      </td>
                      <td>{results.batteryResults.motorParams.rpm1}</td>
                    </tr>
                    <tr>
                      <td>Courant maximal</td>
                      <td>
                        {results.batteryResults.maxValues.IMaxObs.toFixed(1)} A
                      </td>
                      <td>
                        {results.batteryResults.maxValues.rpmIMax.toFixed(0)}
                      </td>
                    </tr>
                    <tr>
                      <td>Efficacité maximale</td>
                      <td>
                        {(
                          Math.max(
                            ...results.batteryResults.results.map(
                              (r: any) => r.efficiency
                            )
                          ) * 100
                        ).toFixed(1)}
                        %
                      </td>
                      <td>
                        {(() => {
                          const maxEff = Math.max(
                            ...results.batteryResults.results.map(
                              (r: any) => r.efficiency
                            )
                          );
                          const maxEffObj = results.batteryResults.results.find(
                            (r: any) => r.efficiency === maxEff
                          );
                          return maxEffObj
                            ? maxEffObj.rpmMotor.toFixed(0)
                            : "-";
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Card.Body>
        </Card>

        {/* Recommandations */}
        <Card className="mb-4 shadow-sm w-100">
          <Card.Header className="bg-black text-white">
            <h5>Autrs informations</h5>
          </Card.Header>
          <Card.Body>
            <ListGroup>
              <ListGroup.Item>
                <strong>Moteur</strong> : Moteur asynchrone à aimants permanents
              </ListGroup.Item>
              <ListGroup.Item>
                <strong>Batterie</strong> : Pack LiFePO4 avec refroidissement
                passif avec l'air
              </ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Card>

        {/* Export PDF */}
        <Card className="mb-4 shadow-sm w-100">
          <Card.Header className="bg-black text-white">
            <h5>Export du Rapport</h5>
          </Card.Header>
          <Card.Body className="text-center">
            <Button className="bg-black" size="lg" onClick={handleGeneratePDF}>
              <i className="bi bi-file-earmark-pdf me-2"></i>
              Générer PDF Complet
            </Button>
            <p className="mt-2 text-muted">
              Exportez un rapport détaillé avec tous les paramètres techniques
              et graphiques
            </p>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
