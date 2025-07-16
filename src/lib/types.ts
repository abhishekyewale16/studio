export interface Player {
  id: number;
  name: string;
  raidPoints: number;
  tacklePoints: number;
  bonusPoints: number;
  totalPoints: number;
}

export interface Team {
  id: number;
  name:string;
  coach: string;
  city: string;
  score: number;
  players: Player[];
}
