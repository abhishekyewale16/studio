
"use client";

import { useState, useEffect, useCallback } from 'react';
import { initialTeams } from '@/lib/data';
import type { Team } from '@/lib/types';
import { Scoreboard } from '@/components/scoreboard';
import { PlayerStatsTable } from '@/components/player-stats-table';
import { ScoringControls } from '@/components/scoring-controls';
import { FoulPlayAnalyzer } from '@/components/foul-play-analyzer';
import { Toaster } from "@/components/ui/toaster";

const MATCH_DURATION_MINUTES = 20; // Per half

export default function Home() {
  const [teams, setTeams] = useState<[Team, Team]>(initialTeams);
  const [timer, setTimer] = useState({
    minutes: MATCH_DURATION_MINUTES,
    seconds: 0,
    isRunning: false,
    half: 1 as 1 | 2,
  });

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timer.isRunning) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev.seconds > 0) {
            return { ...prev, seconds: prev.seconds - 1 };
          }
          if (prev.minutes > 0) {
            return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
          }
          // Timer ends
          const isEndOfFirstHalf = prev.half === 1;
          const matchEnded = prev.half === 2;
          
          if (matchEnded) {
              return { ...prev, isRunning: false };
          }

          return {
            ...prev,
            isRunning: false, // Pause timer between halves
            minutes: MATCH_DURATION_MINUTES,
            seconds: 0,
            half: 2,
          };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning]);

  const handleToggleTimer = () => {
    if(timer.minutes === 0 && timer.seconds === 0 && timer.half === 2) return;
    setTimer(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const handleResetTimer = () => {
    setTimer({
      minutes: MATCH_DURATION_MINUTES,
      seconds: 0,
      isRunning: false,
      half: 1,
    });
    // A deep copy is needed to reset players too
    setTeams(JSON.parse(JSON.stringify(initialTeams)));
  };
  
  const handleAddScore = useCallback((data: { teamId: number; playerId?: number; pointType: string; points: number }) => {
    setTeams(currentTeams => {
        let teamScoreIncrement = 0;
        if(data.pointType === 'lona') teamScoreIncrement = 2;
        else if(data.pointType === 'bonus') teamScoreIncrement = 1;
        else teamScoreIncrement = data.points;

        return currentTeams.map(team => {
            if (team.id === data.teamId) {
                const updatedTeam = { ...team, score: team.score + teamScoreIncrement };

                if (data.playerId && data.pointType !== 'lona') {
                    updatedTeam.players = team.players.map(player => {
                        if (player.id === data.playerId) {
                            const newPlayer = { ...player };
                            let playerPointIncrement = 0;
                            
                            switch (data.pointType) {
                                case 'raid':
                                    newPlayer.raidPoints += data.points;
                                    playerPointIncrement = data.points;
                                    break;
                                case 'tackle':
                                    newPlayer.tacklePoints += data.points;
                                    playerPointIncrement = data.points;
                                    break;
                                case 'bonus':
                                    newPlayer.bonusPoints += 1;
                                    playerPointIncrement = 1;
                                    break;
                            }
                            newPlayer.totalPoints += playerPointIncrement;
                            return newPlayer;
                        }
                        return player;
                    });
                }
                return updatedTeam;
            }
            return team;
        }) as [Team, Team];
    });
  }, []);

  return (
    <>
      <main className="min-h-screen bg-background text-foreground font-body">
        <div className="container mx-auto p-4 md:p-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">Kabaddi Score Master</h1>
            <p className="text-muted-foreground mt-2">The ultimate tool for managing Kabaddi matches.</p>
          </header>

          <Scoreboard
            teams={teams}
            timer={timer}
            onToggleTimer={handleToggleTimer}
            onResetTimer={handleResetTimer}
          />

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <PlayerStatsTable team={teams[0]} />
              <PlayerStatsTable team={teams[1]} />
            </div>
            
            <div className="space-y-8 lg:sticky lg:top-8">
              <ScoringControls teams={teams} onAddScore={handleAddScore} />
              <FoulPlayAnalyzer />
            </div>
          </div>
        </div>
      </main>
      <Toaster />
    </>
  );
}
