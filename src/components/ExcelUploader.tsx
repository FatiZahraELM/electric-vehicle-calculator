// src/components/ExcelUploader.tsx
import { useState, useEffect } from "react";
import { Button, Card, Form, Spinner } from "react-bootstrap";
import * as XLSX from "xlsx";

interface ExcelUploaderProps {
  onDataUpload: (data: any[]) => void;
}

function ExcelUploader({ onDataUpload }: ExcelUploaderProps) {
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Charger le fichier par défaut au montage du composant
  useEffect(() => {
    loadDefaultCycle();
  }, []);

  // src/components/ExcelUploader.tsx
  const loadDefaultCycle = async () => {
    try {
      const response = await fetch("/WMTC_Cycle_3.xlsx");

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();

      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      if (jsonData.length === 0) {
        console.warn("Le fichier est vide ou mal formaté !");
      }

      onDataUpload(jsonData);
      setFileName("WMTC_Cycle_3.xlsx (par défaut)");
    } catch (error) {
      console.error("Échec critique :", error); // 6. Capturez toutes les erreurs
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        onDataUpload(jsonData);
      } catch (error) {
        console.error("Erreur de lecture du fichier:", error);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Card className="mb-4">
      <Card.Header>Cycle de conduite</Card.Header>
      <Card.Body>
        {isLoading ? (
          <div className="text-center">
            <Spinner animation="border" />
            <p>Chargement du cycle de conduite...</p>
          </div>
        ) : (
          <>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label>Utiliser un fichier personnalisé</Form.Label>
              <Form.Control
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
            </Form.Group>

            <div className="d-flex justify-content-between align-items-center">
              <div>
                {fileName && (
                  <div className="text-muted">
                    Fichier actuel: <strong>{fileName}</strong>
                  </div>
                )}
              </div>
              <Button
                variant="outline-primary"
                onClick={loadDefaultCycle}
                disabled={isLoading}
              >
                Recharger le cycle par défaut
              </Button>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}

export default ExcelUploader;
