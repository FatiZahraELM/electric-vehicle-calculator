// src/types.ts
export interface VehicleInputs {
  category: string;
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

export interface VehicleResults {
  category: string;
  totalMass: number;
  speed: number;
  maxSpeedMps: number;
  desiredRange: number;
  aeroPower: number;
  rollingPower: number;
  totalPowerKw: number;
  efficiency: number;
  energyConsumption: number;
  batteryCapacity: number;
  totalCells: number;
  packVoltage: number;
  reducer: string;
  converter: string;
  recommendations: string[];
  motorTorque?: number;
  rpmMotor?: number;
  acceleration?: number;
  batteryCurrent?: number;
  performanceCurves?: {
    time: number[];
    power: number[];
    capacity: number[];
    temperature: number[];
  };

  degradation?: {
    at1000: number;
    at2000: number;
  };

  batteryParams: BatteryParams;

  thermalResults?: {
    time: number[];
    temp: number[];
    maxTemp: number;
    cellMass: number;
    totalMass: number;
  };

  motorParams?: MotorParams;

  forces?: {
    motor: number;
    rolling: number;
    aero: number;
    slope: number;
    acceleration: number;
  };
}

export interface ThermalCalculationParams {
  nSeries?: number;
  nParallel?: number;
  mass?: number;
  heatCapacity?: number;
  heatTransferCoeff?: number;
  ambientTemp?: number;
}

export interface CycleData {
  t: number; // s
  v: number; // km/h
}
export interface MotorParams {
  Pcontinue: number;
  ratio: number;
  wheelRadius: number;
  rpm1: number;
  rpm2: number;
  T1: number;
  T2: number;
  P_max: number;
  // Ajoutez ces propriétés optionnelles
  efficiency?: number;
  maxTorque?: number;
  nominalVoltage?: number;
}

export interface ThermalResults {
  time: number[];
  temp: number[];
  current: number[];
  maxTemp: number;
  maxChargeCurrent: number;
  maxDischargeCurrent: number;
  batteryMass: number;
  cellConfig?: string;
  capacityProfile: number[];
  powerProfile: number[];
  performanceCurves: {
    time: number[];
    power: number[];
    capacity: number[];
    temperature: number[];
  };
}

export interface BatteryParams {
  V_batt_max: number;
  V_batt_min: number;
  capacityAh?: number;
  capacityWh?: number;
  voltage?: number;
  nSeries?: number;
  nParallel?: number;
  totalCells?: number;
  maxChargeCurrent?: number;
  maxDischargeCurrent?: number;
  internalResistance?: number;
}
export interface PerformanceCurves {
  time: number[];
  power: number[];
  capacity: number[];
}

export interface DegradationResults {
  at500: number;
  at1000: number;
  at1500: number;
  at2000: number;
}
