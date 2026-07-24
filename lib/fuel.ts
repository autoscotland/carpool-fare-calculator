export type MileageRate = 5 | 6 | 7 | 8;

export type FuelPriceData = {
  source: string;
  fuelType: string;
  price: number;
  effectiveDate: string;
  updatedAt: string;
};

export type FuelRateState = FuelPriceData & {
  rate: MileageRate;
};

export function initialMileageRate(price: number): MileageRate {
  if (price > 34) return 8;
  if (price > 29) return 7;
  if (price > 24) return 6;
  return 5;
}

export function nextMileageRate(previous: MileageRate, price: number): MileageRate {
  if (previous === 5 && price > 24) return 6;
  if (previous === 6 && price < 22) return 5;
  if (previous === 6 && price > 29) return 7;
  if (previous === 7 && price < 27) return 6;
  if (previous === 7 && price > 34) return 8;
  if (previous === 8 && price < 32) return 7;
  return previous;
}

export function isValidFuelPriceData(value: unknown): value is FuelPriceData {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<FuelPriceData>;
  return (
    item.source === "台灣中油" &&
    item.fuelType === "95無鉛汽油" &&
    typeof item.price === "number" &&
    item.price >= 10 &&
    item.price <= 60 &&
    typeof item.effectiveDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.effectiveDate) &&
    typeof item.updatedAt === "string"
  );
}
