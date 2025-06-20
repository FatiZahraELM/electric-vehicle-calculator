// src/utils/chartUtils.ts
import { Chart, type ChartConfiguration } from "chart.js/auto";

export async function generateChartImage(
  data: any,
  chartType: "temp" | "performance" | "degradation"
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 400;
    document.body.appendChild(canvas); // Nécessaire pour le rendu

    const ctx = canvas.getContext("2d");
    if (!ctx || !data) {
      document.body.removeChild(canvas);
      resolve("");
      return;
    }

    try {
      const config = getChartConfig(data, chartType);
      new Chart(ctx, config);

      setTimeout(() => {
        const image = canvas.toDataURL("image/png");
        document.body.removeChild(canvas);
        resolve(image);
      }, 500);
    } catch (error) {
      console.error(`Erreur génération graphique ${chartType}:`, error);
      document.body.removeChild(canvas);
      resolve("");
    }
  });
}

function getChartConfig(data: any, chartType: string): ChartConfiguration {
  const commonOptions = {
    responsive: false,
    animation: { duration: 0 },
    maintainAspectRatio: false,
  };

  switch (chartType) {
    case "temp":
      return {
        type: "line",
        data: {
          labels: data.time.map((t: number) => `${t.toFixed(1)} h`),
          datasets: [
            {
              label: "Température (°C)",
              data: data.temperature,
              borderColor: "rgb(255, 99, 132)",
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              tension: 1,
              fill: false,
            },
          ],
        },
        options: {
          ...commonOptions,
          scales: {
            x: {
              title: { display: true, text: "Temps (heures)" },
            },
            y: {
              title: { display: true, text: "Température (°C)" },
            },
          },
        },
      };

    case "performance":
      return {
        type: "line",
        data: {
          labels: data.rpm.map((r: number) => `${r}`),
          datasets: [
            {
              label: "Puissance (W)",
              data: data.power,
              borderColor: "rgb(75, 192, 192)",
              yAxisID: "y",
              tension: 0.1,
            },
            {
              label: "Couple (Nm)",
              data: data.current,
              borderColor: "rgb(54, 162, 235)",
              yAxisID: "y1",
              tension: 0.1,
            },
            {
              label: "Efficacité (%)",
              data: data.efficiency,
              borderColor: "rgb(255, 99, 132)",
              yAxisID: "y2",
              tension: 0.1,
            },
          ],
        },
        options: {
          ...commonOptions,
          scales: {
            y: {
              type: "linear",
              display: true,
              position: "left",
              title: { display: true, text: "Puissance (W)" },
            },
            y1: {
              type: "linear",
              display: true,
              position: "right",
              title: { display: true, text: "Couple (Nm)" },
              grid: { drawOnChartArea: false },
            },
            y2: {
              type: "linear",
              display: true,
              position: "right",
              title: { display: true, text: "Efficacité (%)" },
              grid: { drawOnChartArea: false },
              min: 0,
              max: 100,
            },
          },
        },
      };

    case "degradation":
      return {
        type: "line",
        data: {
          labels: data.cycles.map((c: number) => `${c}`),
          datasets: [
            {
              label: "Capacité (%)",
              data: data.capacity,
              borderColor: "rgb(153, 102, 255)",
              tension: 0.1,
            },
          ],
        },
        options: {
          ...commonOptions,
          scales: {
            y: {
              min: 88,
              max: 100,
              title: { display: true, text: "Capacité (%)" },
            },
            x: {
              title: { display: true, text: "Nombre de cycles" },
            },
          },
        },
      };

    default:
      return {
        type: "line",
        data: { datasets: [] },
        options: commonOptions,
      };
  }
}
