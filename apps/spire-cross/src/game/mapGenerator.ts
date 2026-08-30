import { NodeType, RunNode } from '../types';
import { pickBoss, pickRandomElite, pickRandomEnemy } from '../data/enemies';

interface FloorLayout {
  count: number;
  types: NodeType[];
}

const FLOOR_LAYOUT: FloorLayout[] = [
  { count: 1, types: ['battle'] },
  { count: 3, types: ['battle', 'battle', 'event'] },
  { count: 3, types: ['battle', 'shop', 'event'] },
  { count: 3, types: ['battle', 'elite', 'rest'] },
  { count: 3, types: ['event', 'battle', 'battle'] },
  { count: 2, types: ['rest', 'elite'] },
  { count: 1, types: ['boss'] },
];

function enemyForType(type: NodeType, floor: number): string | undefined {
  if (type === 'battle') return pickRandomEnemy(floor).id;
  if (type === 'elite') return pickRandomElite().id;
  if (type === 'boss') return pickBoss().id;
  return undefined;
}

export function generateRun(): RunNode[] {
  const nodes: RunNode[] = [];
  const floorsCols: string[][] = [];

  FLOOR_LAYOUT.forEach((layout, floor) => {
    const cols: string[] = [];
    for (let col = 0; col < layout.count; col++) {
      const type = layout.types[col % layout.types.length];
      const id = `f${floor}c${col}`;
      nodes.push({
        id,
        floor,
        col,
        type,
        enemyId: enemyForType(type, floor),
        connections: [],
        visited: false,
      });
      cols.push(id);
    }
    floorsCols.push(cols);
  });

  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));

  for (let floor = 0; floor < floorsCols.length - 1; floor++) {
    const current = floorsCols[floor];
    const next = floorsCols[floor + 1];
    const incoming = new Set<string>();

    current.forEach((fromId) => {
      const fromNode = nodeById[fromId];
      const candidates = next.filter((toId) => Math.abs(nodeById[toId].col - fromNode.col) <= 1);
      const pool = candidates.length > 0 ? candidates : next;
      const linkCount = pool.length > 1 && Math.random() < 0.4 ? 2 : 1;
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const targets = shuffled.slice(0, Math.min(linkCount, pool.length));
      targets.forEach((t) => {
        fromNode.connections.push(t);
        incoming.add(t);
      });
    });

    next.forEach((toId) => {
      if (!incoming.has(toId)) {
        const fromId = current[Math.floor(Math.random() * current.length)];
        nodeById[fromId].connections.push(toId);
      }
    });
  }

  return nodes;
}

export function getAvailableNodes(nodes: RunNode[], currentNodeId: string | null): RunNode[] {
  if (currentNodeId === null) {
    return nodes.filter((n) => n.floor === 0);
  }
  const current = nodes.find((n) => n.id === currentNodeId);
  if (!current) return [];
  return nodes.filter((n) => current.connections.includes(n.id));
}
