import { Card } from "react-bootstrap";
type VehicleDiagramProps = {
  inputs: any;
  results: any;
};

function VehicleDiagram({ inputs, results }: VehicleDiagramProps) {
  return (
    <Card className="mb-4">
      <Card.Header>Diagramme du Véhicule</Card.Header>
      <Card.Body className="text-center">
        <div className="vehicle-diagram mb-3">
          {/* Simple vehicle representation */}
          <div className="vehicle-body">
            <div className="vehicle-window"></div>
            <div className="vehicle-wheel front"></div>
            <div className="vehicle-wheel back"></div>
          </div>
        </div>

        <div className="vehicle-specs">
          <div>
            <strong>Catégorie:</strong> {inputs.category}
          </div>
          <div>
            <strong>Masse Totale:</strong> {results.totalMass} kg
          </div>
          <div>
            <strong>Vitesse Max:</strong> {inputs.speed} km/h
          </div>
          <div>
            <strong>Autonomie:</strong> {inputs.desiredRange} km
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

export default VehicleDiagram;
