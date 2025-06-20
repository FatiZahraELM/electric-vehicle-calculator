// src/utils/pdfGenerator.ts
import jsPDF from "jspdf";
import "jspdf-autotable";
import type { VehicleInputs, MotorParams, BatteryParams } from "../types";
import autoTable from "jspdf-autotable";
import { generateChartImage } from "../utils/chartUtils";

interface PdfData {
  inputs: VehicleInputs;
  results: {
    motorParams: MotorParams;
    batteryParams: BatteryParams;
    forces: Record<string, string>;
    recommendations?: string[];
    [key: string]: any;
  };
  category: string;
}

export async function generateVehicleReport(pdfData: PdfData) {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString();

  // En-tête du document
  doc.setFontSize(18);
  doc.text("Rapport Technique - Dimensionnement Véhicule Électrique", 15, 35);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Catégorie: ${pdfData.category}`, 15, 45);
  doc.text(`Date: ${date}`, 160, 45);

  // Ajout du logo (optionnel)
  doc.addImage("Stellantis.svg.png", "PNG", 170, 10, 30, 15);

  // Section 1: Paramètres d'entrée
  doc.setFontSize(14);
  doc.text("1. Paramètres d'Entrée", 15, 60);

  const inputData = [
    ["Catégorie", pdfData.category],
    ["Charge max (kg)", pdfData.inputs.load],
    ["Vitesse max (km/h)", pdfData.inputs.speed],
    ["Autonomie (km)", pdfData.inputs.desiredRange],
    ["Pente (%)", pdfData.inputs.slope],
    ["Accélération (m/s²)", pdfData.inputs.acceleration],
    ["Rapport de réduction", pdfData.inputs.reductionRatio],
    ["Efficacité", pdfData.inputs.efficiency],
  ];

  autoTable(doc, {
    startY: 65,
    head: [["Paramètre", "Valeur"]],
    body: inputData,
    theme: "grid",
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
    },
  });
  // Section 2: Paramètres Fixes
  doc.setFontSize(14);
  doc.text(
    "2. Paramètres Fixes Utilisés",
    15,
    (doc as any).lastAutoTable.finalY + 15
  );

  const fixedParams = [
    ["Coefficient de traînée (Cx)", "0.35"],
    ["Coefficient de roulement (Crr)", "0.015"],
    ["Surface frontale (m²)", "2.1"],
    ["Densité de l'air (kg/m³)", "1.225"],
    ["RPM1 (tr/min)", "500"],
  ];

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [["Paramètre Fixe", "Valeur"]],
    body: fixedParams,
    theme: "grid",
    headStyles: { fillColor: [39, 174, 96], textColor: 255 },
  });

  // Section 3: Résultats Moteur
  doc.setFontSize(14);
  doc.text(
    "3. Paramètres Moteur Calculés",
    15,
    (doc as any).lastAutoTable.finalY + 15
  );

  const motorData = [
    ["Couple de démarrage (Nm)", pdfData.results.motorParams.T1],
    ["Couple à Vitesse max (Nm)", pdfData.results.motorParams.T2],
    ["Puissance max (W)", pdfData.results.motorParams.P_max],
    ["Puissance continue (W)", pdfData.results.motorParams.Pcontinue],
    ["RPM1 (tr/min)", pdfData.results.motorParams.rpm1.toString()],
    ["RPM2 (tr/min)", pdfData.results.motorParams.rpm2],
    ["Rapport de réduction", pdfData.inputs.reductionRatio.toString()],
    [
      "Rayon roue (m)",
      pdfData.results.motorParams.wheelRadius?.toFixed(3) || "0.287",
    ],
  ];

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [["Paramètre Moteur", "Valeur"]],
    body: motorData,
    theme: "grid",
    headStyles: { fillColor: [142, 68, 173], textColor: 255 },
  });

  // Section 4: Batterie
  doc.setFontSize(14);
  doc.text(
    "4. Paramètres Batterie",
    15,
    (doc as any).lastAutoTable.finalY + 15
  );

  const batteryData = [
    ["Capacité (Ah)", pdfData.results.batteryParams.capacityAh!],
    ["Capacité (Wh)", pdfData.results.batteryParams.capacityWh!],

    ["Nb cellules série", pdfData.results.batteryParams.nSeries!.toString()],
    [
      "Nb cellules parallèle",
      pdfData.results.batteryParams.nParallel!.toString(),
    ],
    ["Total cellules", pdfData.results.batteryParams.totalCells!.toString()],
    ["Masse batterie", pdfData.results.mass_battery],
  ];

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [["Paramètre Batterie", "Valeur"]],
    body: batteryData,
    theme: "grid",
    headStyles: { fillColor: [230, 126, 34], textColor: 255 },
  });

  // Section 5: Forces
  doc.setFontSize(14);
  doc.text("5. Analyse des Forces", 15, (doc as any).lastAutoTable.finalY + 15);

  const forcesData = Object.entries(pdfData.results.forces).map(
    ([key, value]) => [
      key,
      `${Number(value)} N`,
      `${((Number(value) / (pdfData.inputs.load * 9.81)) * 100).toFixed(
        2
      )} % du poids`,
    ]
  );

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [["Force", "Valeur", "% du poids"]],
    body: forcesData,
    theme: "grid",
    headStyles: { fillColor: [22, 160, 133], textColor: 255 },
  });

  // Section 6: Recommandations
  if (
    pdfData.results.recommendations &&
    pdfData.results.recommendations.length > 0
  ) {
    doc.setFontSize(14);
    doc.text(
      "6. Recommandations Techniques",
      15,
      (doc as any).lastAutoTable.finalY + 15
    );

    const recommendationsData = pdfData.results.recommendations.map((rec) => [
      rec,
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      body: recommendationsData,
      theme: "grid",
      headStyles: { fillColor: [44, 62, 80], textColor: 255 },
    });
  }

  doc.setFontSize(14);
  doc.text(
    "7. Paramètres thermiques",
    15,
    (doc as any).lastAutoTable.finalY + 15
  );
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [["Paramètre Thermique", "Valeur"]],
    body: [
      [
        "Température max en charge",
        `${pdfData.results.thermalResults?.maxChargeTemp ?? "N/A"} °C`,
      ],
      [
        "Température max décharge",
        `${pdfData.results.thermalResults?.maxDischargeTemp ?? "N/A"} °C`,
      ],

      // [
      //   "Courant max charge",
      //   `${pdfData.results.batteryParams?.maxChargeCurrent ?? "N/A"} A`,
      // ],
      [
        "Courant max décharge",
        `${pdfData.results.batteryParams?.maxDischargeCurrent ?? "N/A"} A`,
      ],
      [
        "Capacité à 1000 cycles",
        `${pdfData.results.degradation?.at1000 ?? "N/A"} %`,
      ],
      [
        "Capacité à 2000 cycles",
        `${pdfData.results.degradation?.at2000 ?? "N/A"} %`,
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [231, 76, 60], textColor: 255 },
  });

  // Ajout des graphiques
  await addPerformanceCharts(doc, pdfData.results);

  // Pied de page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Page ${i} / ${pageCount}`, 195, 285, { align: "right" });
    // doc.text("Rapport généré par EV Design Tool", 15, 285);
  }

  // Sauvegarde du PDF
  doc.save(
    `rapport_vehicule_${pdfData.category}_${date.replace(/\//g, "-")}.pdf`
  );
}

async function addPerformanceCharts(doc: jsPDF, results: any) {
  try {
    // 1. Graphique de Température
    if (results?.thermalResults) {
      // Formatage des données pour le graphique de température
      const tempData = {
        time: results.thermalResults.timeHours || [],
        temperature: results.thermalResults.temperatures || [],
        phases: results.thermalResults.phases || [
          { name: "Charge", color: "rgb(255, 99, 132)" },
          { name: "Décharge", color: "rgb(54, 162, 235)" },
        ],
      };

      const tempImg = await generateChartImage(tempData, "temp");
      if (tempImg) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text("Évolution de la Température", 15, 20);
        doc.addImage(tempImg, "PNG", 15, 30, 180, 80);

        // Ajout des informations complémentaires
        doc.setFontSize(10);
        doc.text(
          `Température max en charge: ${results.thermalResults.maxChargeTemp}°C`,
          15,
          120
        );
        doc.text(
          `Température max en décharge: ${results.thermalResults.maxDischargeTemp}°C`,
          15,
          130
        );
      }
    }

    // 2. Graphique de Performance
    if (results?.performanceCurves) {
      const perfData = {
        rpm: results.performanceCurves.rpm || [],
        power: results.performanceCurves.power || [],
        current: results.performanceCurves.torque || [],
        efficiency: results.performanceCurves.efficiency || [],
      };

      const perfImg = await generateChartImage(perfData, "performance");
      if (perfImg) {
        doc.addPage();
        doc.setFontSize(14);

        doc.text("Performance du Moteur", 15, 20);
        doc.addImage(perfImg, "PNG", 15, 30, 180, 80);

        // Légende
        doc.setFontSize(10);
        doc.text("Légende:", 15, 120);
        doc.setTextColor(75, 192, 192);
        doc.text("→ Puissance (W)", 40, 120);
        doc.setTextColor(54, 162, 235);
        doc.text("→ Couple (Nm)", 40, 130);
        doc.setTextColor(255, 99, 132);
        doc.text("→ Efficacité (%)", 40, 140);
        doc.setTextColor(0); // Reset color
      }
    }

    // 3. Graphique de Dégradation
    if (results?.degradation) {
      const degData = {
        cycles: [0, 1000, 2000],
        capacity: [100, results.degradation.at1000, results.degradation.at2000],
      };

      const degImg = await generateChartImage(degData, "degradation");
      if (degImg) {
        doc.addPage();
        doc.setFontSize(14);

        doc.text("Dégradation de la Batterie", 15, 20);
        doc.addImage(degImg, "PNG", 15, 30, 180, 80);

        // Ajout des valeurs clés
        doc.setFontSize(10);
        doc.text(
          `Capacité à 1000 cycles: ${results.degradation.at1000}%`,
          15,
          120
        );
        doc.text(
          `Capacité à 2000 cycles: ${results.degradation.at2000}%`,
          15,
          130
        );
      }
    }
  } catch (error) {
    console.error("Erreur génération graphiques:", error);
    doc.addPage();
    doc.text("Erreur lors de la génération des graphiques", 15, 20);
    doc.text(error instanceof Error ? error.message : String(error), 15, 30);
  }
}
