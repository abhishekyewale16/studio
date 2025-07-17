
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

  const handleToggleTimer = useCallback(() => {
    if(timer.minutes === 0 && timer.seconds === 0 && timer.half === 2) return;
    setTimer(prev => ({ ...prev, isRunning: !prev.isRunning }));
  }, [timer.minutes, timer.seconds, timer.half]);

  const handleResetTimer = useCallback(() => {
    setTimer({
      minutes: MATCH_DURATION_MINUTES,
      seconds: 0,
      isRunning: false,
      half: 1,
    });
    // A deep copy is needed to reset players too
    setTeams(JSON.parse(JSON.stringify(initialTeams)));
  }, []);
  
  const handleAddScore = useCallback((data: { teamId: number; playerId?: number; pointType: string; points: number }) => {
    setTeams(currentTeams => {
        let teamScoreIncrement = 0;
        if (data.pointType === 'lona') teamScoreIncrement = 2;
        else if (data.pointType === 'lona-points') teamScoreIncrement = data.points + 2;
        else if (data.pointType === 'bonus') teamScoreIncrement = 1;
        else if (data.pointType === 'raid-bonus') teamScoreIncrement = data.points + 1;
        else teamScoreIncrement = data.points;

        return currentTeams.map(team => {
            if (team.id === data.teamId) {
                const updatedTeam = { ...team, score: team.score + teamScoreIncrement };

                if (data.playerId && (data.pointType !== 'lona')) {
                    updatedTeam.players = team.players.map(player => {
                        if (player.id === data.playerId) {
                            const newPlayer = { ...player };
                            let playerPointIncrement = 0;
                            
                            switch (data.pointType) {
                                case 'raid':
                                case 'lona-points':
                                    newPlayer.raidPoints += data.points;
                                    playerPointIncrement = data.points;
                                    break;
                                case 'raid-bonus':
                                    newPlayer.raidPoints += data.points;
                                    newPlayer.bonusPoints += 1;
                                    playerPointIncrement = data.points + 1;
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

  const handleTeamNameChange = useCallback((teamId: number, newName: string) => {
    setTeams(currentTeams =>
      currentTeams.map(team =>
        team.id === teamId ? { ...team, name: newName } : team
      ) as [Team, Team]
    );
  }, []);
  
  const handleTeamCoachChange = useCallback((teamId: number, newCoach: string) => {
    setTeams(currentTeams =>
      currentTeams.map(team =>
        team.id === teamId ? { ...team, coach: newCoach } : team
      ) as [Team, Team]
    );
  }, []);

  const handleTeamCityChange = useCallback((teamId: number, newCity: string) => {
    setTeams(currentTeams =>
      currentTeams.map(team =>
        team.id === teamId ? { ...team, city: newCity } : team
      ) as [Team, Team]
    );
  }, []);


  const handlePlayerNameChange = useCallback((teamId: number, playerId: number, newName: string) => {
    setTeams(currentTeams =>
      currentTeams.map(team => {
        if (team.id === teamId) {
          return {
            ...team,
            players: team.players.map(player =>
              player.id === playerId ? { ...player, name: newName } : player
            ),
          };
        }
        return team;
      }) as [Team, Team]
    );
  }, []);

  return (
    <>
      <main className="min-h-screen bg-background text-foreground font-body">
        <div className="container mx-auto p-4 md:p-8">
          <header className="flex flex-col md:flex-row md:items-baseline md:justify-center gap-2 mb-8 text-center">
            <h1 className="text-3xl font-headline font-bold text-primary">Kabaddi Score Master</h1>
            <p className="text-sm text-muted-foreground">The ultimate tool for managing Kabaddi matches.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
               <Scoreboard
                teams={teams}
                timer={timer}
                onToggleTimer={handleToggleTimer}
                onResetTimer={handleResetTimer}
                onTeamNameChange={handleTeamNameChange}
                onTeamCoachChange={handleTeamCoachChange}
                onTeamCityChange={handleTeamCityChange}
              />
            </div>
            <div className="lg:col-start-3">
              <ScoringControls teams={teams} onAddScore={handleAddScore} />
            </div>
          </div>


          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <PlayerStatsTable team={teams[0]} onPlayerNameChange={handlePlayerNameChange} />
              <PlayerStatsTable team={teams[1]} onPlayerNameChange={handlePlayerNameChange} />
            </div>
            
            <div className="space-y-8 lg:col-start-3">
              <FoulPlayAnalyzer />
            </div>
          </div>
        </div>
      </main>
      <Toaster />
    </>
  );
}
