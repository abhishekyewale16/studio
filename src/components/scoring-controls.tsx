
"use client"

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ScoringControlsProps {
  teams: [Team, Team];
  raidingTeamId: number;
  onAddScore: (data: { teamId: number; playerId?: number; pointType: string; points: number }) => void;
  onEmptyRaid: (teamId: number) => void;
  onSwitchRaidingTeam: () => void;
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
});


export function ScoringControls({ teams, raidingTeamId, onAddScore, onEmptyRaid, onSwitchRaidingTeam }: ScoringControlsProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamId: '',
      pointType: 'raid',
      points: 1,
      playerId: '',
    },
  });

  // Effect to automatically set the teamId in the form to the current raiding team
  useEffect(() => {
    form.setValue('teamId', String(raidingTeamId));
  }, [raidingTeamId, form]);

  const selectedTeamId = form.watch('teamId');
  const selectedPointType = form.watch('pointType');
  const selectedTeam = teams.find(t => t.id === Number(selectedTeamId));

  function onSubmit(values: z.infer<typeof formSchema>) {
    let points = values.points;
    if (['bonus'].includes(values.pointType)) points = 1;

    // For tackle points, the point goes to the non-raiding team
    const isTackleEvent = ['tackle', 'tackle-lona'].includes(values.pointType);
    const scoringTeamId = isTackleEvent ? (raidingTeamId === 1 ? 2 : 1) : raidingTeamId;

    const data = {
        teamId: scoringTeamId,
        playerId: values.playerId ? Number(values.playerId) : undefined,
        pointType: values.pointType,
        points: points,
    };
    onAddScore(data);
    
    let toastDescription = `Added points for ${values.pointType.replace('-', ' ')}.`;
    if (values.pointType === 'line-out') {
        const opposingTeam = teams.find(t => t.id !== Number(values.teamId));
        toastDescription = `${values.points} point(s) awarded to ${opposingTeam?.name} for line out.`;
    }

    toast({
      title: "Score Updated!",
      description: toastDescription,
    })
    setOpen(false);
    form.reset();
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
  const showPlayerSelection = ['raid', 'tackle', 'bonus', 'raid-bonus', 'lona-points', 'lona-bonus-points', 'tackle-lona', 'line-out'].includes(selectedPointType);

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
            <Button className="w-full">Add Score Event</Button>
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
                      <FormLabel>Team</FormLabel>
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
                       {helperText && selectedPointType === 'line-out' && (
                            <p className="text-xs text-muted-foreground pt-1">
                                {helperText}
                            </p>
                        )}
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
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-2">
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
                        <FormLabel>Player</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedTeam}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a player" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {selectedTeam?.players.map(player => (
                              <SelectItem key={player.id} value={String(player.id)}>{player.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedPointType === 'line-out' && <p className="text-xs text-muted-foreground pt-1">Player selection is optional for line outs.</p>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                
                
                {(selectedPointType !== 'bonus') && (
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
                         {helperText && !['line-out', 'tackle', 'tackle-lona'].includes(selectedPointType) && (
                            <p className="text-xs text-muted-foreground pt-1">
                                {helperText}
                            </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                 {['tackle', 'tackle-lona'].includes(selectedPointType) && (
                    <p className="text-xs text-muted-foreground pt-1">
                        {helperText}
                    </p>
                )}


                <DialogFooter>
                  <Button type="submit">Add Points</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Ban className="mr-2 h-4 w-4" />
                Empty Raid
              </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>Declare Empty Raid?</AlertDialogTitle>
              <AlertDialogDescription>
                  This will count as an empty raid for the currently raiding team ({teams.find(t => t.id === raidingTeamId)?.name}) and switch the raid to the other team.
              </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onEmptyRaid(raidingTeamId)}>Confirm</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button variant="ghost" className="w-full" onClick={onSwitchRaidingTeam}>
          <Replace className="mr-2 h-4 w-4" />
          Switch Raiding Team
        </Button>

      </CardContent>
    </Card>
  );
}
