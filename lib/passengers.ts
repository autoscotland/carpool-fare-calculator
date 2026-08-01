export type Passenger = { id: string; name: string; weight: number };

export function syncPassengersToPeople(passengers: Passenger[], totalPeople: number) {
  const passengerCount = Math.max(1, Math.floor(totalPeople) - 1);
  return Array.from({ length: passengerCount }, (_, index) =>
    passengers[index] ?? {
      id: crypto.randomUUID(),
      name: `乘客 ${index + 1}`,
      weight: 100,
    },
  );
}
