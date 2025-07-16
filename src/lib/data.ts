import type { Team } from './types';

export const initialTeams: [Team, Team] = [
  {
    id: 1,
    name: 'Bengaluru Bulls',
    coach: 'Randhir Singh',
    city: 'Bengaluru',
    score: 0,
    players: Array.from({ length: 12 }, (_, i) => ({
      id: 100 + i + 1,
      name: `Player ${i + 1}`,
      raidPoints: 0,
      tacklePoints: 0,
      bonusPoints: 0,
      totalPoints: 0,
    })),
  },
  {
    id: 2,
    name: 'Patna Pirates',
    coach: 'Ram Mehar Singh',
    city: 'Patna',
    score: 0,
    players: Array.from({ length: 12 }, (_, i) => ({
      id: 200 + i + 1,
      name: `Raider ${i + 1}`,
      raidPoints: 0,
      tacklePoints: 0,
      bonusPoints: 0,
      totalPoints: 0,
    })),
  },
];
