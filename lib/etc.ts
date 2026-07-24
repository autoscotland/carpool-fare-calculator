export type EtcNode = { id: string; road: string; name: string; km: number | null };
export type EtcEdge = {
  from: string;
  to: string;
  road: string;
  direction: string;
  distance: number;
  toll: number;
};
export type EtcNetwork = {
  meta: { source: string; downloadedAt: string; note: string };
  nodes: EtcNode[];
  edges: EtcEdge[];
};

export type EtcRoute = {
  distance: number;
  toll: number;
  roads: string[];
  stops: string[];
};

export function findEtcRoute(network: EtcNetwork, start: string, end: string): EtcRoute | null {
  if (!start || !end || start === end) return null;
  const adjacency = new Map<string, EtcEdge[]>();
  for (const edge of network.edges) {
    const list = adjacency.get(edge.from) ?? [];
    list.push(edge);
    adjacency.set(edge.from, list);
  }
  const costs = new Map<string, number>([[start, 0]]);
  const previous = new Map<string, EtcEdge>();
  const queue = new Set(network.nodes.map((node) => node.id));

  while (queue.size) {
    let current = "";
    let best = Number.POSITIVE_INFINITY;
    for (const id of queue) {
      const cost = costs.get(id) ?? Number.POSITIVE_INFINITY;
      if (cost < best) {
        best = cost;
        current = id;
      }
    }
    if (!current || !Number.isFinite(best)) break;
    queue.delete(current);
    if (current === end) break;
    for (const edge of adjacency.get(current) ?? []) {
      if (!queue.has(edge.to)) continue;
      const nextCost = best + edge.distance + edge.toll * 0.02;
      if (nextCost < (costs.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        costs.set(edge.to, nextCost);
        previous.set(edge.to, edge);
      }
    }
  }

  if (!previous.has(end)) return null;
  const path: EtcEdge[] = [];
  let cursor = end;
  while (cursor !== start) {
    const edge = previous.get(cursor);
    if (!edge) return null;
    path.unshift(edge);
    cursor = edge.from;
  }
  const nodeMap = new Map(network.nodes.map((node) => [node.id, node]));
  return {
    distance: path.reduce((sum, edge) => sum + edge.distance, 0),
    toll: path.reduce((sum, edge) => sum + edge.toll, 0),
    roads: [...new Set(path.map((edge) => edge.road).filter((road) => road !== "系統轉接"))],
    stops: [nodeMap.get(start)?.name ?? start, ...path.map((edge) => nodeMap.get(edge.to)?.name ?? edge.to)],
  };
}
