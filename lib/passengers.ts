export type Passenger = { id: string; name: string; weight: number };

export function syncPassengersToPeople(passengers: Passenger[], totalPeople: number) {
  const peopleCount = Math.max(2, Math.floor(totalPeople));
  return Array.from({ length: peopleCount }, (_, index) =>
    passengers[index] ?? {
      id: crypto.randomUUID(),
      name: index === 0 ? "司機" : `乘客 ${index}`,
      weight: 100,
    },
  );
}

export function migrateLegacyPassengers(passengers: Passenger[], totalPeople: number) {
  const peopleCount = Math.max(2, Math.floor(totalPeople));
  const migrated =
    passengers.length === peopleCount - 1
      ? [{ id: crypto.randomUUID(), name: "司機", weight: 100 }, ...passengers]
      : passengers;
  return syncPassengersToPeople(migrated, peopleCount);
}
