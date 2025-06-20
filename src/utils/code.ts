// Interfaces et types
export interface VehicleParameters {
  category: string;
  mass: number;
  load: number;
  area: number;
  speed: number;
  desiredRange: number;
  dragCoef: number;
  rollingCoef: number;
  efficiency: number;
  slope: number;
  acceleration: number;
  reductionRatio: number;
  V_batt_max: number;
  V_batt_min: number;
}

interface ThermalSimulationResult {
  fig: any;
  T_max_c: number;
  T_max_d: number;
  timeHours: number[];
  temperatures: number[];
}

interface CapacityDegradationResult {
  fig: any;
  cap_1000: number;
  cap_2000: number;
}

interface WMTCData {
  t: number[];
  v: number[];
}

// Classe utilitaire
export class MathUtils {
  static arange(start: number, stop: number, step: number = 1): number[] {
    return Array.from(
      { length: Math.ceil((stop - start) / step) },
      (_, i) => start + i * step
    );
  }

  static zeros(length: number): number[] {
    return new Array(length).fill(0);
  }

  static max(arr: number[]): number {
    return Math.max(...arr);
  }

  static interp(x: number, xp: number[], fp: number[]): number {
    if (x <= xp[0]) return fp[0];
    if (x >= xp[xp.length - 1]) return fp[fp.length - 1];

    const i = xp.findIndex((val, idx) => x >= val && x < xp[idx + 1]);
    return fp[i] + (fp[i + 1] - fp[i]) * ((x - xp[i]) / (xp[i + 1] - xp[i]));
  }
}

// Classe principale de simulation
export class VehicleSimulation {
  private params: VehicleParameters;
  private wheelRadius = 0.287;
  private g = 9.81;
  private rhoAir = 1.225;

  constructor(params: VehicleParameters) {
    this.params = params;
  }

  // 1. Simulation thermique
  public runThermalSimulation(): ThermalSimulationResult {
    const dt = 1;
    const capacity_Ah = 210;

    // Paramètres thermiques
    const thermalParams = {
      m: 45, ///a voir
      c_p: 1000,
      R_int: 0.02,
      hA: 5,
      T_amb: 298.15,
    };

    // Simulation charge (4h)
    const t_charge = MathUtils.arange(0, 4 * 3600, dt);
    const T_charge = MathUtils.zeros(t_charge.length);
    T_charge[0] = thermalParams.T_amb;
    const I_charge = 0.25 * capacity_Ah;

    for (let i = 1; i < t_charge.length; i++) {
      const P_joule = I_charge ** 2 * thermalParams.R_int;
      const dT =
        (P_joule - thermalParams.hA * (T_charge[i - 1] - thermalParams.T_amb)) /
        (thermalParams.m * thermalParams.c_p);
      T_charge[i] = T_charge[i - 1] + dT * dt;
    }

    // Simulation décharge (1h)
    const t_discharge = MathUtils.arange(0, 3600, dt);
    const T_discharge = MathUtils.zeros(t_discharge.length);
    T_discharge[0] = T_charge[T_charge.length - 1];
    const I_discharge = -0.5 * capacity_Ah;

    for (let i = 1; i < t_discharge.length; i++) {
      const P_joule = I_discharge ** 2 * thermalParams.R_int;
      const dT =
        (P_joule -
          thermalParams.hA * (T_discharge[i - 1] - thermalParams.T_amb)) /
        (thermalParams.m * thermalParams.c_p);
      T_discharge[i] = T_discharge[i - 1] + dT * dt;
    }

    // Formatage des résultats
    const timeHours = [
      ...t_charge.map((t) => t / 3600),
      ...t_discharge.map(
        (t) => (t + t_charge[t_charge.length - 1] + dt) / 3600
      ),
    ];

    const temperatures = [
      ...T_charge.map((T) => T - 273.15),
      ...T_discharge.map((T) => T - 273.15),
    ];

    return {
      fig: this.createThermalChart(
        t_charge,
        T_charge,
        t_discharge,
        T_discharge
      ),
      T_max_c: MathUtils.max(T_charge.map((T) => T - 273.15)),
      T_max_d: MathUtils.max(T_discharge.map((T) => T - 273.15)),
      timeHours,
      temperatures,
    };
  }

  private createThermalChart(
    t_charge: number[],
    T_charge: number[],
    t_discharge: number[],
    T_discharge: number[]
  ) {
    return {
      data: [
        {
          x: t_charge.map((t) => t / 3600),
          y: T_charge.map((T) => T - 273.15),
          type: "scatter",
          mode: "lines",
          name: "Charge (0.25C, 4h)",
        },
        {
          x: t_discharge.map(
            (t) => (t + t_charge[t_charge.length - 1] + 1) / 3600
          ),
          y: T_discharge.map((T) => T - 273.15),
          type: "scatter",
          mode: "lines",
          name: "Décharge (0.5C, 1h)",
        },
      ],
      layout: {
        title: "Évolution de la température",
        xaxis: { title: "Temps (h)" },
        yaxis: { title: "Température (°C)" },
      },
    };
  }

  // 2. Simulation dégradation capacité
  public runCapacityDegradation(
    maxCycles: number = 2000
  ): CapacityDegradationResult {
    const cycles = MathUtils.arange(0, maxCycles + 1);
    const k = 0.0006;
    const beta = 0.65;
    const capacity = cycles.map((c) => 100 * Math.exp(-k * Math.pow(c, beta)));

    return {
      fig: {
        data: [
          {
            x: cycles,
            y: capacity,
            type: "scatter",
            mode: "lines",
          },
        ],
        layout: {
          title: "Dégradation de capacité",
          xaxis: { title: "Cycles" },
          yaxis: { title: "Capacité (%)" },
        },
      },
      cap_1000: MathUtils.interp(1000, cycles, capacity),
      cap_2000: MathUtils.interp(2000, cycles, capacity),
    };
  }

  public runBatterySimulation() {
    // Calcul des paramètres moteur
    const { rpm1, rpm2, T1, Pcontinue, F_accel, F_roll, F_slope, F_aero } =
      this.calculateMotorParameters();

    const T2 = (Pcontinue * 60) / (2 * Math.PI * rpm2);

    const results = [];
    let PMaxObs = 0;
    let IMaxObs = 0;
    let rpmPMax = 0;
    let rpmIMax = 0;
    let TMaxObs = 0;
    let rpmTMax = 0;
    const V_max_kmh = this.params.speed;
    // Parcourir toutes les vitesses de rotation possibles
    for (let vKmh = 0; vKmh <= V_max_kmh; vKmh += 1) {
      const v = vKmh / 3.6;

      const rpm_wheel = (v / (2 * Math.PI * this.wheelRadius)) * 60;

      const rpmMotor = rpm_wheel * this.params.reductionRatio;

      // Calcul tension batterie (linéaire entre Vmax et Vmin)
      const V =
        this.params.V_batt_max -
        (this.params.V_batt_max - this.params.V_batt_min) * (vKmh / V_max_kmh);

      // Calcul du couple disponible
      const T = this.calculateTorque(rpmMotor, rpm1, rpm2, T1, T2);

      // Calcul de l'efficacité (variable avec RPM)
      const eff = this.calculateEfficiency(rpmMotor, rpm1, rpm2);
      // Calcul de la puissance mécanique
      const Fm =
        (T * this.params.reductionRatio * this.params.efficiency) /
        this.wheelRadius;
      const P = Fm * v;
      const I = P / V;
      // Mise à jour des maxima
      if (P > PMaxObs && rpmMotor >= rpm1) {
        PMaxObs = P;
        rpmPMax = rpmMotor;
      }
      if (I > IMaxObs) {
        IMaxObs = I;
        rpmIMax = rpmMotor;
      }
      if (T > TMaxObs) {
        TMaxObs = T;
        rpmTMax = rpmMotor;
      }

      results.push({
        rpmMotor: Number(rpmMotor.toFixed(0)),
        V,
        P,
        I,
        T,
        vKmh,
        efficiency: eff, // Efficacité constante pour simplifier
      });
    }

    return {
      results,
      motorParams: { rpm1, rpm2, T1, Pcontinue, T2 },

      maxValues: {
        PMaxObs,
        IMaxObs,
        rpmPMax,
        rpmIMax,
        TMaxObs,
        rpmTMax,
      },
      forces: {
        F_accel,
        F_roll,
        F_slope,
        F_aero,
      },
    };
  }

  private calculateMotorParameters() {
    const totalMass = this.params.load;
    const slopeRad = Math.atan(this.params.slope / 100);
    const v_max = this.params.speed / 3.6;
    const own_rpm = (v_max * 30) / (Math.PI * this.wheelRadius);
    const motor_rpm_at_vmax =
      (own_rpm * this.params.reductionRatio) / this.params.efficiency;

    // Calcul T1 (couple démarrage)
    const F_roll =
      totalMass * this.g * this.params.rollingCoef * Math.cos(slopeRad);
    const F_slope = totalMass * this.g * Math.sin(slopeRad);
    const F_accel = totalMass * this.params.acceleration;
    const T1 =
      ((F_roll + F_slope + F_accel) * this.wheelRadius) /
      (this.params.reductionRatio * this.params.efficiency);

    // Calcul rpm2 et Pmax (vitesse max)
    const wheelRpm =
      (25 * this.params.speed) / (3 * Math.PI * this.wheelRadius);
    const rpm2 =
      (wheelRpm * this.params.reductionRatio) / this.params.efficiency;
    const F_aero =
      0.5 * this.rhoAir * this.params.dragCoef * this.params.area * v_max ** 2;
    const omega2 = (2 * Math.PI * motor_rpm_at_vmax) / 60;

    let usedSlope = 5;
    if (this.params.category === "L7E") {
      usedSlope = 0; // L7E utilise une pente de 10% pour le calcul
    }

    const F_total2 =
      F_aero +
      this.params.load * 9.81 * 0.015 * Math.cos(Math.atan(usedSlope / 100)) +
      this.params.load * 9.81 * Math.sin(Math.atan(usedSlope / 100));

    const T2 =
      (F_total2 * this.wheelRadius) /
      (this.params.reductionRatio * this.params.efficiency);
    const Pcontinue = T2 * omega2;

    return {
      rpm1: 500, // RPM minimum fixe
      rpm2,
      T1,
      Pcontinue,
      F_accel,
      F_roll,
      F_slope,
      F_aero,
    };
  }

  private calculateTorque(
    rpm: number,
    rpm1: number,
    rpm2: number,
    T1: number,
    T2: number
  ): number {
    if (rpm <= rpm1) return T1;
    if (rpm >= rpm2) return T2;
    // Interpolation linéaire entre rpm1 et rpm2
    return T1 + ((T2 - T1) * (rpm - rpm1)) / (rpm2 - rpm1);
  }

  private calculateEfficiency(rpm: number, rpm1: number, rpm2: number): number {
    // Efficacité qui diminue avec les RPM (exemple)
    const baseEff = 0.93; // Efficacité maximale
    const minEff = 0.75; // Efficacité minimale à haut régime
    if (rpm <= rpm1) return baseEff;
    if (rpm >= rpm2) return minEff;
    return baseEff - (baseEff - minEff) * ((rpm - rpm1) / (rpm2 - rpm1));
  }

  // 4. Simulation RK4
  public runRK4Simulation() {
    const scenarios = [
      { time: 2.0, desc: "V₂ₛ" },
      { time: 3.0, desc: "V₃ₛ" },
      { time: 10.0, desc: "V₁₀ₛ" },
      { time: null, desc: `0→${this.params.speed} km/h` },
    ];

    return scenarios.map((scenario) => {
      if (scenario.time) {
        const v = this.simulateRk4Time(scenario.time);
        return `${scenario.desc}: ${v.toFixed(1)} km/h`;
      } else {
        const { t, v } = this.simulateRk4Speed(this.params.speed);
        return `${scenario.desc}: t = ${t.toFixed(2)} s, v = ${v.toFixed(
          1
        )} km/h`;
      }
    });
  }

  private simulateRk4Speed(vTargetKmh: number, dt: number = 0.1) {
    let v = 0;
    let t = 0;
    const vTarget = vTargetKmh / 3.6;

    while (v < vTarget && t < 60) {
      const k1 = this.calculateAcceleration(v);
      const k2 = this.calculateAcceleration(v + (dt / 2) * k1);
      const k3 = this.calculateAcceleration(v + (dt / 2) * k2);
      const k4 = this.calculateAcceleration(v + dt * k3);
      v += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      t += dt;
    }

    return { t, v: v * 3.6 };
  }

  private simulateRk4Time(tLimit: number, dt: number = 0.1) {
    let v = 0;
    let t = 0;

    while (t < tLimit && t < 60) {
      const k1 = this.calculateAcceleration(v);
      const k2 = this.calculateAcceleration(v + (dt / 2) * k1);
      const k3 = this.calculateAcceleration(v + (dt / 2) * k2);
      const k4 = this.calculateAcceleration(v + dt * k3);
      v += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      t += dt;
    }

    return v * 3.6;
  }

  private calculateAcceleration(
    v: number,
    slopePercent: number = this.params.slope
  ) {
    const omega =
      (v * 60 * this.params.reductionRatio) / (2 * Math.PI * this.wheelRadius);
    const { rpm1, rpm2, T1, Pcontinue } = this.calculateMotorParameters();
    const T2 = (Pcontinue * 60) / (2 * Math.PI * rpm2);
    const T = this.calculateTorque(omega, rpm1, rpm2, T1, T2);
    const eff = this.calculateEfficiency(omega, rpm1, rpm2);
    const Fm = (T * this.params.reductionRatio * eff) / this.wheelRadius;
    const Fr = this.calculateRollingResistance(v);
    const Fa = this.calculateAerodynamicDrag(v);
    const Fp = this.calculateSlopeForce(slopePercent);
    return (Fm - Fr - Fa - Fp) / this.params.load;
  }

  private calculateRollingResistance(v: number) {
    const vRef = this.params.speed;
    const Crr = this.params.rollingCoef + 0.003 * ((v * 3.6) / vRef);
    return Crr * this.params.load * this.g;
  }

  private calculateAerodynamicDrag(v: number) {
    const vRef = this.params.speed;
    const Cd = this.params.dragCoef + 0.02 * Math.pow((v * 3.6) / vRef, 2);
    return 0.5 * this.rhoAir * Cd * this.params.area * v * v;
  }

  private calculateSlopeForce(slopePercent: number) {
    return this.params.load * this.g * Math.sin(Math.atan(slopePercent / 100));
  }

  // 5. Simulation WMTC
  public runWMTCSimulation(wmtcData: WMTCData) {
    const results = this.processWMTCData(wmtcData);
    const EMoeteurTotal = results.reduce((sum, r) => sum + r.EMoteur, 0);
    const ERegenTotal = results.reduce((sum, r) => sum + r.ERegen, 0);
    const ENetTotal = EMoeteurTotal - ERegenTotal;
    const distanceKm =
      results.reduce((sum, r, i) => sum + wmtcData.v[i] * r.dt, 0) / 3600;

    return {
      EMoeteurTotal,
      ERegenTotal,
      ENetTotal,
      distanceKm,
      consommationWhKm: (EMoeteurTotal - ERegenTotal) / distanceKm,
      ...this.calculateBatteryRequirements(
        EMoeteurTotal - ERegenTotal,
        distanceKm
      ),
    };
  }

  private processWMTCData(wmtcData: WMTCData) {
    return wmtcData.t.map((_t, i) => {
      const dt = i === 0 ? wmtcData.t[1] : wmtcData.t[i] - wmtcData.t[i - 1];
      const vMps = wmtcData.v[i] / 3.6;
      const aMps2 =
        i === 0 ? 0 : (wmtcData.v[i] - wmtcData.v[i - 1]) / 3.6 / dt;

      // Coefficients dépendants de la vitesse
      const Crr =
        this.params.rollingCoef + 0.003 * (wmtcData.v[i] / this.params.speed);
      const Cd =
        this.params.dragCoef +
        0.02 * Math.pow(wmtcData.v[i] / this.params.speed, 2);

      // Calcul des forces
      const FRoul = this.params.load * this.g * Crr;
      const FAero = 0.5 * this.rhoAir * Cd * this.params.area * vMps * vMps;
      const FInertie = this.params.load * aMps2;
      const FMot = FRoul + FAero + FInertie;

      // Calcul des puissances
      const PBrute = FMot * vMps;
      const PMoteur = Math.max(0, PBrute) / this.params.efficiency;
      const PRegen = Math.max(0, -PBrute) * 0.5; // Efficacité récupération

      return {
        dt,
        vMps,
        aMps2,
        Crr,
        Cd,
        FRoul,
        FAero,
        FInertie,
        FMot,
        PBrute,
        PMoteur,
        PRegen,
        EMoteur: (PMoteur * dt) / 3600,
        ERegen: (PRegen * dt) / 3600,
      };
    });
  }

  private calculateBatteryRequirements(ENetTotal: number, distanceKm: number) {
    // Capacité nécessaire
    const consommationWhKm = ENetTotal / distanceKm;
    const capWhNominal = consommationWhKm * this.params.desiredRange;
    const capAhNominal = capWhNominal / this.params.V_batt_min;

    // Avec marge de sécurité
    const capWhMarge = capWhNominal * 1.2;
    const capAhMarge = capWhMarge / this.params.V_batt_min;

    // Dimensionnement batterie
    const ahParCellule = 150; // Exemple pour cellules LFP
    const VCellule = 3.2;
    const nSeries = Math.ceil(this.params.V_batt_max / VCellule);
    const nParallel = Math.ceil(capAhMarge / ahParCellule);
    const mass_battery = 2.8 * nParallel * nSeries;
    return {
      capWhNominal,
      capAhNominal,
      capWhMarge,
      capAhMarge,
      nSeries,
      nParallel,
      mass_battery,
    };
  }
}
