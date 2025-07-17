
"use client";

import { useState, useEffect, useCallback } from 'react';
import { initialTeams } from '@/lib/data';
import type { Team } from '@/lib/types';
import { Scoreboard } from '@/components/scoreboard';
import { PlayerStatsTable } from '@/components/player-stats-table';
import { ScoringControls } from '@/components/scoring-controls';
import { FoulPlayAnalyzer } from '@/components/foul-play-analyzer';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

const MATCH_DURATION_MINUTES = 20; // Per half

export type RaidState = {
  team1: number;
  team2: number;
}

export default function Home() {
  const { toast } = useToast();
  const [teams, setTeams] = useState<[Team, Team]>(initialTeams);
  const [raidState, setRaidState] = useState<RaidState>({ team1: 0, team2: 0 });
  const [raidingTeamId, setRaidingTeamId] = useState<number>(1);
  const [timer, setTimer] = useState({
    minutes: MATCH_DURATION_MINUTES,
    seconds: 0,
    isRunning: false,
    half: 1 as 1 | 2,
  });

  const switchRaidingTeam = useCallback(() => {
    setRaidingTeamId(prev => (prev === 1 ? 2 : 1));
  }, []);

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
    setRaidState({ team1: 0, team2: 0 });
    setRaidingTeamId(1);
    // A deep copy is needed to reset players too
    setTeams(JSON.parse(JSON.stringify(initialTeams)));
  }, []);
  
  const handleAddScore = useCallback((data: { teamId: number; playerId?: number; pointType: string; points: number }) => {
    const isRaidEvent = ['raid', 'bonus', 'raid-bonus', 'lona-points', 'lona-bonus-points'].includes(data.pointType);
    
    // Reset raid counter if the scoring team gets raid or bonus points
    if (isRaidEvent) {
      setRaidState(prev => data.teamId === 1 ? { ...prev, team1: 0 } : { ...prev, team2: 0 });
    }

    setTeams(currentTeams => {
        let teamScoreIncrement = 0;
        if (data.pointType === 'line-out') {
             // For line-out, the point goes to the OTHER team
        } else if (data.pointType === 'lona-points') {
            teamScoreIncrement = data.points + 2;
        } else if (data.pointType === 'bonus') {
            teamScoreIncrement = 1;
        } else if (data.pointType === 'raid-bonus') {
            teamScoreIncrement = data.points + 1;
        } else if (data.pointType === 'lona-bonus-points') {
            teamScoreIncrement = data.points + 1 + 2;
        } else if (data.pointType === 'tackle-lona') {
            teamScoreIncrement = data.points + 2;
        } else {
            teamScoreIncrement = data.points;
        }

        return currentTeams.map(team => {
            if (data.pointType === 'line-out') {
                // Award point to the team that did *not* commit the line out
                if (team.id !== data.teamId) {
                    return { ...team, score: team.score + data.points };
                }
                return team; // No change for the team that committed the line out
            }

            if (team.id === data.teamId) {
                const updatedTeam = { ...team, score: team.score + teamScoreIncrement };

                if (data.playerId) {
                    updatedTeam.players = team.players.map(player => {
                        if (player.id === data.playerId) {
                            const newPlayer = { ...player };
                            let playerPointIncrement = 0;
                            
                            const isSuccessfulRaid = data.pointType.includes('raid') || data.pointType.includes('bonus') || data.pointType.includes('lona');
                            if(isSuccessfulRaid) {
                                newPlayer.totalRaids += 1;
                                newPlayer.successfulRaids += 1;
                            }

                            const raidPointsScored = data.points;
                            const totalPointsInRaid = raidPointsScored + (data.pointType.includes('bonus') ? 1 : 0);
                            
                            if (isSuccessfulRaid && totalPointsInRaid >= 3) {
                                newPlayer.superRaids += 1;
                            }

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
                                case 'lona-bonus-points':
                                    newPlayer.raidPoints += data.points;
                                    newPlayer.bonusPoints += 1;
                                    playerPointIncrement = data.points + 1;
                                    break;
                                case 'tackle':
                                    newPlayer.tacklePoints += data.points;
                                    playerPointIncrement = data.points;
                                    break;
                                case 'tackle-lona':
                                    newPlayer.tacklePoints += data.points;
                                    newPlayer.superTacklePoints += data.points; // Assuming all points from this are super tackle points
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

    switchRaidingTeam();
  }, [switchRaidingTeam]);

  const handleEmptyRaid = useCallback((teamId: number) => {
    const isTeam1 = teamId === 1;
    const currentRaids = isTeam1 ? raidState.team1 : raidState.team2;
    
    // Find the currently raiding player to attribute the failed raid
    setTeams(currentTeams => {
        const raidingTeam = currentTeams.find(t => t.id === teamId);
        // This is a simplification; in a real app you'd know the specific raider.
        // We'll attribute it to the first player for demonstration.
        const raiderId = raidingTeam?.players[0].id; 

        return currentTeams.map(team => {
            if(team.id === teamId) {
                return {
                    ...team,
                    players: team.players.map(p => {
                        // In a real scenario, you'd have a way to select the current raider.
                        // Here, we just increment for the first player as an example.
                        // A more robust solution might involve a dropdown in the "Empty Raid" dialog.
                        if (p.id === raiderId) {
                            return {...p, totalRaids: p.totalRaids + 1}
                        }
                        return p;
                    })
                }
            }
            return team;
        }) as [Team, Team]
    });


    if (currentRaids === 2) { // This was a Do or Die raid that failed
      const opposingTeamId = isTeam1 ? 2 : 1;
      const raidingTeamName = teams.find(t => t.id === teamId)?.name;
      const scoringTeamName = teams.find(t => t.id === opposingTeamId)?.name;

      setTeams(currentTeams => currentTeams.map(team => 
        team.id === opposingTeamId ? { ...team, score: team.score + 1 } : team
      ) as [Team, Team]);
      
      toast({
          title: "Do or Die Raid Failed!",
          description: `1 point awarded to ${scoringTeamName} as ${raidingTeamName} failed to score.`,
          variant: "destructive"
      });

      // Reset the counter
      setRaidState(prev => isTeam1 ? { ...prev, team1: 0 } : { ...prev, team2: 0 });

    } else {
      // Increment the counter
      setRaidState(prev => isTeam1 ? { ...prev, team1: prev.team1 + 1 } : { ...prev, team2: prev.team2 + 1 });
      toast({
          title: "Empty Raid",
          description: `Raid count for ${teams.find(t => t.id === teamId)?.name} is now ${currentRaids + 1}.`,
      });
    }

    switchRaidingTeam();

  }, [raidState, teams, toast, switchRaidingTeam]);


  const handleTeamNameChange = (teamId: number, newName: string) => {
    setTeams(currentTeams =>
      currentTeams.map(team =>
        team.id === teamId ? { ...team, name: newName } : team
      ) as [Team, Team]
    );
  };
  
  const handleTeamCoachChange = (teamId: number, newCoach: string) => {
    setTeams(currentTeams =>
      currentTeams.map(team =>
        team.id === teamId ? { ...team, coach: newCoach } : team
      ) as [Team, Team]
    );
  };

  const handleTeamCityChange = (teamId: number, newCity: string) => {
    setTeams(currentTeams =>
      currentTeams.map(team =>
        team.id === teamId ? { ...team, city: newCity } : team
      ) as [Team, Team]
    );
  };


  const handlePlayerNameChange = (teamId: number, playerId: number, newName: string) => {
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
  };

  const handleExportStats = () => {
    const wb = XLSX.utils.book_new();

    teams.forEach(team => {
        const teamDataForSheet = team.players.map(p => ({
            "Player Name": p.name,
            "Total Points": p.totalPoints,
            "Raid Points": p.raidPoints,
            "Bonus Points": p.bonusPoints,
            "Tackle Points": p.tacklePoints,
            "Super Tackle Points": p.superTacklePoints,
            "Total Raids": p.totalRaids,
            "Successful Raids": p.successfulRaids,
            "Success Rate (%)": p.totalRaids > 0 ? ((p.successfulRaids / p.totalRaids) * 100).toFixed(2) : 0,
            "Super Raids": p.superRaids
        }));

        const teamHeader = [
            ["Team:", team.name],
            ["Coach:", team.coach],
            ["City:", team.city],
            ["Final Score:", team.score],
            [] // Empty row for spacing
        ];

        const ws = XLSX.utils.json_to_sheet(teamDataForSheet, { origin: "A6" });
        XLSX.utils.sheet_add_aoa(ws, teamHeader, { origin: "A1" });
        
        // Auto-fit columns
        const colWidths = Object.keys(teamDataForSheet[0] || {}).map(key => ({ wch: Math.max(key.length, ...teamDataForSheet.map(row => String(row[key as keyof typeof row]).length)) + 2 }));
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, team.name.substring(0, 31)); // Sheet names have a 31-char limit
    });
    
    const matchFileName = `${teams[0].name} vs ${teams[1].name} - Match Stats.xlsx`;
    XLSX.writeFile(wb, matchFileName);
  };

  return (
    <>
      <main className="min-h-screen bg-background text-foreground font-body">
        <div className="container mx-auto p-4 md:p-8">
          <header className="text-center mb-8">
            <h1 className="text-2xl font-headline font-bold text-primary">Kabaddi Score Master</h1>
            <p className="text-sm text-muted-foreground">The ultimate tool for managing Kabaddi matches.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
               <Scoreboard
                teams={teams}
                timer={timer}
                raidState={raidState}
                raidingTeamId={raidingTeamId}
                onToggleTimer={handleToggleTimer}
                onResetTimer={handleResetTimer}
                onExportStats={handleExportStats}
                onTeamNameChange={handleTeamNameChange}
                onTeamCoachChange={handleTeamCoachChange}
                onTeamCityChange={handleTeamCityChange}
              />
            </div>
            <div className="lg:col-start-3">
              <ScoringControls 
                teams={teams} 
                raidingTeamId={raidingTeamId}
                onAddScore={handleAddScore} 
                onEmptyRaid={handleEmptyRaid}
                onSwitchRaidingTeam={switchRaidingTeam}
              />
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
