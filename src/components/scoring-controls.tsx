
"use client"

import { useState, useEffect } from 'react';
import { useForm, useForm as useEmptyRaidForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Team } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardPlus, Star, Shield, Swords, Award, PlusSquare, UserMinus, Ban, Replace } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"

interface ScoringControlsProps {
  teams: [Team, Team];
  raidingTeamId: number;
  onAddScore: (data: { teamId: number; playerId?: number; pointType: string; points: number }) => void;
  onEmptyRaid: (teamId: number, playerId: number) => void;
  onSwitchRaidingTeam: () => void;
  isTimerRunning: boolean;
}

const formSchema = z.object({
  teamId: z.string().min(1, { message: 'Please select a team.' }),
  pointType: z.enum(['raid', 'tackle', 'bonus', 'raid-bonus', 'lona-points', 'lona-bonus-points', 'tackle-lona', 'line-out']),
  points: z.coerce.number().min(1, { message: 'Points must be at least 1.' }).max(10, { message: 'Points cannot exceed 10.' }),
  playerId: z.string().optional(),
}).refine(data => {
  if (data.pointType !== 'line-out') {
    return data.playerId && data.playerId.length > 0;
  }
  return true;
}, {
  message: "Player selection is required for this point type.",
  path: ["playerId"],
}).refine(data => {
    if (['raid', 'raid-bonus'].includes(data.pointType)) {
        return data.points >= 1 && data.points <= 5;
    }
    return true;
}, {
    message: "Raid points must be between 1 and 5.",
    path: ["points"],
}).refine(data => {
    if (['lona-bonus-points'].includes(data.pointType)) {
        return data.points >= 6 && data.points <= 7;
    }
    return true;
}, {
    message: "Points must be 6 or 7 for this Lona event.",
    path: ["points"],
}).refine(data => {
    if (['lona-points'].includes(data.pointType)) {
        return data.points >= 1 && data.points <= 7;
    }
    return true;
}, {
    message: "Raid points can be up to 7 for this Lona event.",
    path: ["points"],
});

const emptyRaidSchema = z.object({
    playerId: z.string().min(1, { message: "Please select the raider." }),
});


export function ScoringControls({ teams, raidingTeamId, onAddScore, onEmptyRaid, onSwitchRaidingTeam, isTimerRunning }: ScoringControlsProps) {
  const [open, setOpen] = useState(false);
  const [emptyRaidDialogOpen, setEmptyRaidDialogOpen] = useState(false);
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamId: String(raidingTeamId),
      pointType: 'raid',
      points: 1,
      playerId: '',
    },
  });

  const emptyRaidForm = useEmptyRaidForm<z.infer<typeof emptyRaidSchema>>({
    resolver: zodResolver(emptyRaidSchema),
    defaultValues: {
        playerId: ''
    }
  });

  const selectedPointType = form.watch('pointType');
  const isTackleEvent = selectedPointType === 'tackle' || selectedPointType === 'tackle-lona';
  const raidingTeam = teams.find(t => t.id === raidingTeamId);


  // Set the correct teamId when the modal opens or raidingTeamId changes
  useEffect(() => {
    if(open) {
      const isTackle = ['tackle', 'tackle-lona'].includes(form.getValues('pointType'));
      const effectiveTeamId = isTackle ? (raidingTeamId === 1 ? '2' : '1') : String(raidingTeamId);
      form.setValue('teamId', effectiveTeamId);
      if (form.getValues('playerId')) {
        form.setValue('playerId', ''); // Reset player on raid change
      }
    }
  }, [raidingTeamId, open, form]);

  useEffect(() => {
    if (!emptyRaidDialogOpen) {
        emptyRaidForm.reset({ playerId: '' });
    }
  }, [emptyRaidDialogOpen, emptyRaidForm]);
  
  const selectedTeam = teams.find(t => t.id === Number(form.watch('teamId')));

  function onSubmit(values: z.infer<typeof formSchema>) {
    let points = values.points;
    if (['bonus'].includes(values.pointType)) points = 1;

    const data = {
        teamId: Number(values.teamId),
        playerId: values.playerId ? Number(values.playerId) : undefined,
        pointType: values.pointType,
        points: points,
    };
    onAddScore(data);
    
    let toastDescription = `Added points for ${values.pointType.replace('-', ' ')}.`;
    if (values.pointType === 'line-out') {
        const lineOutTeam = teams.find(t => t.id === raidingTeamId)
        const opposingTeam = teams.find(t => t.id !== raidingTeamId);
        toastDescription = `${values.points} point(s) awarded to ${opposingTeam?.name} for ${lineOutTeam?.name}'s line out.`;
    }

    toast({
      title: "Score Updated!",
      description: toastDescription,
    })
    setOpen(false);
    form.reset({
        teamId: String(raidingTeamId === 1 ? 2: 1), // Pre-set for the next raid
        pointType: 'raid',
        points: 1,
        playerId: '',
    });
  }

  function onEmptyRaidSubmit(values: z.infer<typeof emptyRaidSchema>) {
    onEmptyRaid(raidingTeamId, Number(values.playerId));
    setEmptyRaidDialogOpen(false);
  }
  
  const handlePointTypeChange = (value: string) => {
    form.setValue('pointType', value as z.infer<typeof formSchema>['pointType']);
    form.setValue('playerId', ''); // Reset player when type changes
    form.trigger('playerId'); // Manually trigger validation for playerId
    const isTackle = ['tackle', 'tackle-lona'].includes(value);
    
    // Reset points based on the new type
    let defaultPoints = 1;
    if (['lona-bonus-points'].includes(value)) {
        defaultPoints = 6;
    }
    if (['lona-points'].includes(value)) {
      defaultPoints = 1;
    }
    form.setValue('points', defaultPoints);

    const newTeamId = isTackle ? (raidingTeamId === 1 ? '2' : '1') : String(raidingTeamId);
    form.setValue('teamId', newTeamId);
  }


  const getHelperText = () => {
    switch(selectedPointType) {
      case 'raid-bonus':
        return 'The bonus point will be added automatically.';
      case 'lona-points':
        return 'The 2 Lona points will be added automatically.';
      case 'lona-bonus-points':
        return 'The bonus and 2 Lona points will be added automatically.';
      case 'tackle-lona':
        return 'Select the tackling player. Point(s) and Lona awarded to their team.';
      case 'tackle':
        return 'Select the tackling player. The point will be awarded to their team.';
      case 'line-out':
        return 'Select the team of the player(s) who stepped out. The point(s) will be given to the opposing team.';
      default:
        return null;
    }
  }
  
  const helperText = getHelperText();
  const showPlayerSelection = true; 
  const playerSelectTeamId = selectedPointType === 'line-out' ? raidingTeamId : Number(form.watch('teamId'))
  const playerSelectTeam = teams.find(t => t.id === playerSelectTeamId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <ClipboardPlus className="text-primary" />
          Update Score
        </CardTitle>
        <CardDescription>
            Add points for raids, tackles, and other events, or declare an empty raid.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={!isTimerRunning}>Add Score Event</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Register a Scoring Event</DialogTitle>
              <DialogDescription>
                Select the team, player, and type of point to award. The raid will switch automatically.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="teamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scoring Team</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value} disabled>
                        <FormControl>
                           <SelectTrigger>
                                <SelectValue placeholder="Select a team" />
                           </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {teams.map(team => (
                                <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
                            ))}
                        </SelectContent>
                       </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pointType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Point Type</FormLabel>
                      <FormControl>
                        <RadioGroup 
                          onValueChange={handlePointTypeChange} 
                          value={field.value} 
                          className="grid grid-cols-2 gap-2"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="raid" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Swords className="w-4 h-4" /> Raid</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="tackle" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Shield className="w-4 h-4" /> Tackle</FormLabel>
                          </FormItem>
                           <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="raid-bonus" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><PlusSquare className="w-4 h-4" /> Raid + Bonus</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="bonus" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Star className="w-4 h-4" /> Bonus Only</FormLabel>
                          </FormItem>
                           <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="lona-bonus-points" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Award className="w-4 h-4" /> Lona+Bonus+Pts</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="lona-points" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Award className="w-4 h-4" /> Lona + Raid Pts</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="tackle-lona" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Award className="w-4 h-4" /> Tackle + Lona</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="line-out" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><UserMinus className="w-4 h-4" /> Line Out</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                
                  <FormField
                    control={form.control}
                    name="playerId"
                    render={({ field }) => (
                      <FormItem style={{ display: showPlayerSelection ? 'block' : 'none' }}>
                        <FormLabel>Player ({playerSelectTeam?.name})</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!playerSelectTeam}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a player" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {playerSelectTeam?.players.map(player => (
                              <SelectItem key={player.id} value={String(player.id)}>{player.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {helperText && <p className="text-xs text-muted-foreground pt-1">{helperText}</p>}
                        {selectedPointType === 'line-out' && <p className="text-xs text-muted-foreground pt-1">Select player who is out. Point goes to other team.</p>}

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                
                
                {(selectedPointType !== 'bonus' && !isTackleEvent) && (
                  <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {selectedPointType === 'raid-bonus' || selectedPointType === 'lona-bonus-points' ? 'Raid Points' :
                          selectedPointType === 'tackle-lona' ? 'Tackle Points' :
                           selectedPointType === 'lona-points' ? 'Raid Points' :
                          selectedPointType === 'line-out' ? 'Number of Players' : 'Points'}
                        </FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 1" {...field} />
                        </FormControl>
                         
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {isTackleEvent && (
                  <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Tackle Points</FormLabel>
                        <FormControl>
                            <RadioGroup
                                onValueChange={(value) => field.onChange(Number(value))}
                                value={String(field.value)}
                                className="flex gap-4"
                            >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="1" /></FormControl>
                                    <FormLabel className="font-normal">1 Point</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl><RadioGroupItem value="2" /></FormControl>
                                    <FormLabel className="font-normal">2 Points (Super Tackle)</FormLabel>
                                </FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}


                <DialogFooter>
                  <Button type="submit">Add Points</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={emptyRaidDialogOpen} onOpenChange={setEmptyRaidDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full" disabled={!isTimerRunning}>
                    <Ban className="mr-2 h-4 w-4" />
                    Empty Raid
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Declare Empty Raid</DialogTitle>
                    <DialogDescription>
                        Select the player who performed the empty raid for the currently raiding team ({raidingTeam?.name}). This will switch the raid to the other team.
                    </DialogDescription>
                </DialogHeader>
                <Form {...emptyRaidForm}>
                    <form onSubmit={emptyRaidForm.handleSubmit(onEmptyRaidSubmit)} className="space-y-4">
                        <FormField
                            control={emptyRaidForm.control}
                            name="playerId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Raiding Player</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!raidingTeam}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a player" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {raidingTeam?.players.map(player => (
                                                <SelectItem key={player.id} value={String(player.id)}>{player.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setEmptyRaidDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Confirm Empty Raid</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

        <Button variant="ghost" className="w-full" onClick={onSwitchRaidingTeam} disabled={!isTimerRunning}>
          <Replace className="mr-2 h-4 w-4" />
          Switch Raiding Team
        </Button>

      </CardContent>
    </Card>
  );
}
