
"use client";

import { useState, useEffect, useCallback } from 'react';
import { initialTeams } from '@/lib/data';
import type { Team } from '@/lib/types';
import { Scoreboard } from '@/components/scoreboard';
import { PlayerStatsTable } from '@/components/player-stats-table';
import { ScoringControls } from '@/components/scoring-controls';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { LiveCommentary } from '@/components/live-commentary';
import { generateCommentary } from '@/ai/flows/generate-commentary';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';


const INITIAL_MATCH_DURATION = 20;

export type RaidState = {
  team1: number;
  team2: number;
}

export default function Home() {
  const { toast } = useToast();
  const [teams, setTeams] = useState<[Team, Team]>(initialTeams);
  const [raidState, setRaidState] = useState<RaidState>({ team1: 0, team2: 0 });
  const [raidingTeamId, setRaidingTeamId] = useState<number>(1);
  const [commentaryLog, setCommentaryLog] = useState<string[]>([]);
  const [isCommentaryLoading, setIsCommentaryLoading] = useState(false);
  const [matchDuration, setMatchDuration] = useState(INITIAL_MATCH_DURATION);
  const [timer, setTimer] = useState({
    minutes: INITIAL_MATCH_DURATION,
    seconds: 0,
    isRunning: false,
    half: 1 as 1 | 2,
  });

  const switchRaidingTeam = useCallback(() => {
    setRaidingTeamId(prev => (prev === 1 ? 2 : 1));
  }, []);

  const addCommentary = useCallback(async (eventData: any) => {
    setIsCommentaryLoading(true);
    try {
        const history = commentaryLog.slice(-3); // Keep last 3 for context
        
        const fullEventData = {
          ...eventData,
          commentaryHistory: history,
          timer: `${String(timer.minutes).padStart(2, '0')}:${String(timer.seconds).padStart(2, '0')}`,
        }

        const result = await generateCommentary(fullEventData);
        if (result.commentary) {
            setCommentaryLog(prev => [result.commentary, ...prev]);
        }
    } catch (error) {
        console.error("Error generating commentary:", error);
    } finally {
        setIsCommentaryLoading(false);
    }
  }, [commentaryLog, timer]);

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
          // Timer ends, stop running
          return { ...prev, isRunning: false };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning]);

  const handleToggleTimer = useCallback(() => {
    const isFirstHalfOver = timer.half === 1 && timer.minutes === 0 && timer.seconds === 0;
    const isSecondHalfOver = timer.half === 2 && timer.minutes === 0 && timer.seconds === 0;

    if (isSecondHalfOver) return; // Match is fully over

    if (isFirstHalfOver) {
      // Start the second half
      setTimer({
        minutes: matchDuration,
        seconds: 0,
        isRunning: true,
        half: 2,
      });
    } else {
      // Toggle pause/play
      setTimer(prev => ({ ...prev, isRunning: !prev.isRunning }));
    }
  }, [timer, matchDuration]);

  const handleResetTimer = useCallback(() => {
    setTimer({
      minutes: matchDuration,
      seconds: 0,
      isRunning: false,
      half: 1,
    });
    setRaidState({ team1: 0, team2: 0 });
    setRaidingTeamId(1);
    setCommentaryLog([]);
    // A deep copy is needed to reset players too
    setTeams(JSON.parse(JSON.stringify(initialTeams)));
  }, [matchDuration]);

  const handleMatchDurationChange = useCallback((newDuration: number) => {
    const duration = isNaN(newDuration) || newDuration < 1 ? 1 : newDuration;
    setMatchDuration(duration);
    // Only update timer if it's not currently running
    if (!timer.isRunning) {
        setTimer(prev => ({ ...prev, minutes: duration, seconds: 0 }));
    }
  }, [timer.isRunning]);
  
  const handleAddScore = useCallback((data: { teamId: number; playerId?: number; pointType: string; points: number }) => {
    let newTeams = JSON.parse(JSON.stringify(teams)) as [Team, Team];
    const isRaidEvent = !['tackle', 'tackle-lona', 'line-out'].includes(data.pointType);
    const isTackleEvent = data.pointType.includes('tackle');

    if (isRaidEvent) {
        const teamKey = data.teamId === 1 ? 'team1' : 'team2';
        setRaidState(prev => ({ ...prev, [teamKey]: 0 }));
    }

    const scoringTeamIndex = newTeams.findIndex(t => t.id === data.teamId);
    if (scoringTeamIndex === -1) return;

    const opposingTeamIndex = 1 - scoringTeamIndex;
    
    if (data.pointType === 'line-out') {
        newTeams[opposingTeamIndex].score += data.points;
    } else {
        let teamScoreIncrement = 0;
        if (data.pointType === 'lona-points') {
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
        newTeams[scoringTeamIndex].score += teamScoreIncrement;

        if (data.playerId) {
            const playerIndex = newTeams[scoringTeamIndex].players.findIndex(p => p.id === data.playerId);
            if (playerIndex !== -1) {
                const player = newTeams[scoringTeamIndex].players[playerIndex];
                let playerPointIncrement = 0;
                const isSuccessfulRaid = data.pointType.includes('raid') || data.pointType.includes('bonus') || data.pointType.includes('lona');

                if (isSuccessfulRaid) {
                    player.totalRaids += 1;
                    player.successfulRaids += 1;
                }

                const raidPointsScored = data.points;
                const totalPointsInRaid = raidPointsScored + (data.pointType.includes('bonus') ? 1 : 0);
                if (isSuccessfulRaid && totalPointsInRaid >= 3) {
                    player.superRaids += 1;
                }

                switch (data.pointType) {
                    case 'raid':
                    case 'lona-points':
                        player.raidPoints += data.points;
                        playerPointIncrement = data.points;
                        break;
                    case 'raid-bonus':
                        player.raidPoints += data.points;
                        player.bonusPoints += 1;
                        playerPointIncrement = data.points + 1;
                        break;
                    case 'lona-bonus-points':
                        player.raidPoints += data.points;
                        player.bonusPoints += 1;
                        playerPointIncrement = data.points + 1;
                        break;
                    case 'tackle':
                    case 'tackle-lona':
                        player.tacklePoints += data.points;
                        if (data.points === 2) {
                            player.superTacklePoints += 1;
                        }
                        playerPointIncrement = data.points;
                        break;
                    case 'bonus':
                        player.bonusPoints += 1;
                        playerPointIncrement = 1;
                        break;
                }
                player.totalPoints += playerPointIncrement;
            }
        }
    }
    
    const team1ScoreAfterUpdate = newTeams.find(t => t.id === 1)!.score;
    const team2ScoreAfterUpdate = newTeams.find(t => t.id === 2)!.score;

    const scoringTeam = newTeams.find(t => t.id === data.teamId)!;
    const defendingTeam = newTeams.find(t => t.id !== data.teamId)!;
    const player = scoringTeam.players.find(p => p.id === data.playerId);

    const raidingTeamForCommentary = isTackleEvent ? defendingTeam : scoringTeam;
    const defendingTeamForCommentary = isTackleEvent ? scoringTeam : defendingTeam; 
    const currentRaidCount = raidingTeamId === 1 ? raidState.team1 : raidState.team2;
    const totalPointsInRaid = data.points + (['raid-bonus', 'bonus', 'lona-bonus-points'].includes(data.pointType) ? 1 : 0);
    const isSuccessfulRaid = data.pointType.includes('raid') || data.pointType.includes('bonus') || data.pointType.includes('lona');

    let eventType: string;
    if (isTackleEvent) {
        eventType = data.points === 2 ? 'super_tackle_score' : 'tackle_score';
    } else if (data.pointType === 'line-out') {
        eventType = 'line_out';
    } else {
        eventType = 'raid_score';
    }
    
    let raiderForCommentary: string | undefined;
    let defenderForCommentary: string | undefined;

    if (eventType === 'line_out') {
        const originalRaidingTeam = teams.find(t => t.id === raidingTeamId)
        raiderForCommentary = originalRaidingTeam?.players.find(p => p.id === data.playerId)?.name ?? 'Unknown Player';
    } else if (isTackleEvent) {
        const originalRaidingTeam = teams.find(t => t.id === raidingTeamId);
        // This is a simplification. In a real app, you'd know who was raiding.
        raiderForCommentary = originalRaidingTeam?.players[0]?.name ?? 'Unknown Raider';
        defenderForCommentary = player?.name;
    } else { // raid event
        raiderForCommentary = player?.name;
    }


    const commentaryData = {
        eventType: eventType,
        raidingTeam: raidingTeamForCommentary.name,
        defendingTeam: defendingTeamForCommentary.name,
        raiderName: raiderForCommentary,
        defenderName: defenderForCommentary,
        points: data.points,
        isSuperRaid: isSuccessfulRaid && totalPointsInRaid >= 3,
        isDoOrDie: currentRaidCount === 2,
        isBonus: ['raid-bonus', 'bonus', 'lona-bonus-points'].includes(data.pointType),
        isLona: data.pointType.includes('lona'),
        raidCount: currentRaidCount,
        team1Score: team1ScoreAfterUpdate,
        team2Score: team2ScoreAfterUpdate,
    };
    
    addCommentary(commentaryData);
    setTeams(newTeams);
    switchRaidingTeam();

}, [teams, raidState, addCommentary, switchRaidingTeam, raidingTeamId]);


  const handleEmptyRaid = useCallback((teamId: number) => {
    const isTeam1 = teamId === 1;
    const currentRaids = isTeam1 ? raidState.team1 : raidState.team2;
    
    let raidingTeamPlayerId: number | undefined;

    const newTeamsWithRaidStat = JSON.parse(JSON.stringify(teams)) as [Team, Team];
    
    const raidingTeamIndex = newTeamsWithRaidStat.findIndex(t => t.id === teamId);
    if(raidingTeamIndex !== -1) {
        const raider = newTeamsWithRaidStat[raidingTeamIndex].players[0]; // Assuming first player is raider for empty raid
        raidingTeamPlayerId = raider.id;
        raider.totalRaids += 1;
    }
    
    const raidingTeam = newTeamsWithRaidStat.find(t => t.id === teamId)!;
    const defendingTeam = newTeamsWithRaidStat.find(t => t.id !== teamId)!;
    const player = raidingTeam.players.find(p => p.id === raidingTeamPlayerId);
    const isDoOrDieRaid = currentRaids === 2;
    let finalTeams = newTeamsWithRaidStat;
    
    let finalTeam1Score = newTeamsWithRaidStat.find(t => t.id === 1)!.score;
    let finalTeam2Score = newTeamsWithRaidStat.find(t => t.id === 2)!.score;


    if (isDoOrDieRaid) { 
      const opposingTeamId = isTeam1 ? 2 : 1;
      const raidingTeamName = newTeamsWithRaidStat.find(t => t.id === teamId)?.name;
      const scoringTeamName = newTeamsWithRaidStat.find(t => t.id === opposingTeamId)?.name;
      
      const newTeamsWithScore = newTeamsWithRaidStat.map(team => 
        team.id === opposingTeamId ? { ...team, score: team.score + 1 } : team
      ) as [Team, Team];
      
      finalTeam1Score = newTeamsWithScore.find(t => t.id === 1)!.score;
      finalTeam2Score = newTeamsWithScore.find(t => t.id === 2)!.score;

      addCommentary({
          eventType: 'do_or_die_fail',
          raidingTeam: raidingTeam.name,
          defendingTeam: defendingTeam.name,
          raiderName: player?.name,
          points: 1,
          isSuperRaid: false,
          isDoOrDie: true,
          isBonus: false,
          isLona: false,
          raidCount: currentRaids,
          team1Score: finalTeam1Score,
          team2Score: finalTeam2Score,
      });

      finalTeams = newTeamsWithScore;

      toast({
          title: "Do or Die Raid Failed!",
          description: `1 point awarded to ${scoringTeamName} as ${raidingTeamName} failed to score.`,
          variant: "destructive"
      });
      
      setRaidState(prev => isTeam1 ? { ...prev, team1: 0 } : { ...prev, team2: 0 });

    } else {
      setRaidState(prev => isTeam1 ? { ...prev, team1: prev.team1 + 1 } : { ...prev, team2: prev.team2 + 1 });
      toast({
          title: "Empty Raid",
          description: `Raid count for ${newTeamsWithRaidStat.find(t => t.id === teamId)?.name} is now ${currentRaids + 1}.`,
      });
       addCommentary({
          eventType: 'empty_raid',
          raidingTeam: raidingTeam.name,
          defendingTeam: defendingTeam.name,
          raiderName: player?.name,
          points: 0,
          isSuperRaid: false,
          isDoOrDie: false,
          isBonus: false,
          isLona: false,
          raidCount: currentRaids,
          team1Score: finalTeam1Score,
          team2Score: finalTeam2Score,
      });
    }

    setTeams(finalTeams);
    switchRaidingTeam();

  }, [raidState, teams, toast, switchRaidingTeam, addCommentary]);


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
    const [team1, team2] = teams;

    // --- Styling ---
    const headerStyle = { font: { bold: true, color: { rgb: "FFFFFFFF" } }, fill: { fgColor: { rgb: "FFD32F2F" } }, alignment: { horizontal: "center", vertical: "center" } };
    const centeredStyle = { alignment: { horizontal: "center", vertical: "center" } };
    const border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };

    // --- Match Summary Sheet ---
    const summaryData = [
      [`${team1.name} vs ${team2.name} - Match Summary`],
      [],
      ["Final Score"],
      [`${team1.name}`, team1.score],
      [`${team2.name}`, team2.score],
      [],
      ["Result"],
      [team1.score > team2.score ? `${team1.name} Won` : team2.score > team1.score ? `${team2.name} Won` : "Match Drawn"]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }, // Title
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }, // Final Score
      { s: { r: 6, c: 0 }, e: { r: 6, c: 1 } }, // Result
      { s: { r: 7, c: 0 }, e: { r: 7, c: 1 } }  // Winner
    ];
    wsSummary['A1'].s = { font: { bold: true, sz: 16 }, alignment: { horizontal: "center" } };
    wsSummary['A3'].s = { font: { bold: true, sz: 14 } };
    wsSummary['A7'].s = { font: { bold: true, sz: 14 } };
    wsSummary['!cols'] = [{ wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Match Summary");


    // --- Team Sheets ---
    teams.forEach(team => {
        const teamDataForSheet = team.players.map(p => ({
            "Player Name": p.name,
            "Total Points": p.totalPoints,
            "Raid Points": p.raidPoints,
            "Bonus Points": p.bonusPoints,
            "Tackle Points": p.tacklePoints,
            "Super Tackles": p.superTacklePoints,
            "Total Raids": p.totalRaids,
            "Successful Raids": p.successfulRaids,
            "Success Rate (%)": p.totalRaids > 0 ? parseFloat(((p.successfulRaids / p.totalRaids) * 100).toFixed(2)) : 0,
            "Super Raids": p.superRaids
        }));

        const teamHeader = [
            [team.name],
            [],
            ["Coach:", team.coach, "", "City:", team.city, "", "Final Score:", team.score],
            []
        ];

        const ws = XLSX.utils.aoa_to_sheet(teamHeader, { origin: "A1" });
        XLSX.utils.sheet_add_json(ws, teamDataForSheet, { origin: "A5" });

        // Merges
        ws["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: teamDataForSheet[0] ? Object.keys(teamDataForSheet[0]).length - 1 : 10 } },
        ];
        
        // --- Apply Styles ---
        // Title
        ws['A1'].s = { font: { bold: true, sz: 16 }, alignment: { horizontal: "center" } };

        // Headers
        const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A5:J5');
        for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: 4, c: C });
            if (ws[cellAddress]) {
                ws[cellAddress].s = headerStyle;
            }
        }
        
        // Data and Borders
        const dataRange = XLSX.utils.decode_range(ws['!ref'] || `A5:J${5 + team.players.length}`);
        for (let R = dataRange.s.r + 5; R <= dataRange.e.r; ++R) {
            for (let C = dataRange.s.c; C <= dataRange.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cellAddress]) continue;
                
                ws[cellAddress].s = { ...ws[cellAddress].s, border };
                
                // Center numeric data
                if (typeof ws[cellAddress].v === 'number') {
                    ws[cellAddress].s = { ...ws[cellAddress].s, ...centeredStyle };
                }
            }
        }
        
        // Column Widths
        const colWidths = Object.keys(teamDataForSheet[0] || {}).map((key, i) => ({ 
            wch: Math.max(
                key.length, 
                ...teamDataForSheet.map(row => String(row[key as keyof typeof row]).length)
            ) + 2 
        }));
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, team.name.substring(0, 31));
    });
    
    const matchFileName = `${teams[0].name} vs ${teams[1].name} - Match Stats.xlsx`;
    XLSX.writeFile(wb, matchFileName);
  };

  const handleExportCommentary = () => {
    const doc = new Document({
        sections: [{
            children: commentaryLog.reverse().map(entry => 
                new Paragraph({
                    children: [new TextRun(entry)],
                    spacing: { after: 200 }
                })
            ),
        }],
    });

    Packer.toBlob(doc).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = url;
        a.download = `${teams[0].name} vs ${teams[1].name} - Commentary.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    });
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
            <div className="lg:col-span-3 space-y-8">
               <Scoreboard
                teams={teams}
                timer={timer}
                raidState={raidState}
                raidingTeamId={raidingTeamId}
                matchDuration={matchDuration}
                onToggleTimer={handleToggleTimer}
                onResetTimer={handleResetTimer}
                onTeamNameChange={handleTeamNameChange}
                onTeamCoachChange={handleTeamCoachChange}
                onTeamCityChange={handleTeamCityChange}
                onMatchDurationChange={handleMatchDurationChange}
              />
               <ScoringControls 
                  teams={teams} 
                  raidingTeamId={raidingTeamId}
                  onAddScore={handleAddScore} 
                  onEmptyRaid={handleEmptyRaid}
                  onSwitchRaidingTeam={switchRaidingTeam}
                />
               <LiveCommentary commentaryLog={commentaryLog} isLoading={isCommentaryLoading} onExportCommentary={handleExportCommentary} />
            </div>
          </div>


          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PlayerStatsTable team={teams[0]} onPlayerNameChange={handlePlayerNameChange} />
              <PlayerStatsTable team={teams[1]} onPlayerNameChange={handlePlayerNameChange} />
          </div>
          <div className="mt-8 flex justify-center">
              <Button onClick={handleExportStats} size="lg">
                  <Download className="mr-2 h-4 w-4" />
                  Export Stats to Excel
              </Button>
          </div>
        </div>
      </main>
      <Toaster />
    </>
  );
}

    

    
