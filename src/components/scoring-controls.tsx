
"use client"

import { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardPlus, Star, Shield, Swords, Award, PlusSquare, UserMinus } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"

interface ScoringControlsProps {
  teams: [Team, Team];
  onAddScore: (data: { teamId: number; playerId?: number; pointType: string; points: number }) => void;
}

const formSchema = z.object({
  teamId: z.string().min(1, { message: 'Please select a team.' }),
  pointType: z.enum(['raid', 'tackle', 'bonus', 'raid-bonus', 'lona-points', 'lona-bonus-points', 'tackle-lona', 'line-out']),
  points: z.coerce.number().min(1, { message: 'Points must be at least 1.' }).max(10, { message: 'Points cannot exceed 10.' }),
  playerId: z.string().optional(),
}).refine(data => {
  if (['raid', 'tackle', 'bonus', 'raid-bonus', 'lona-points', 'lona-bonus-points', 'tackle-lona'].includes(data.pointType)) {
    return data.playerId && data.playerId.length > 0;
  }
  return true;
}, {
  message: "Player selection is required for this point type.",
  path: ["playerId"],
}).refine(data => {
    // For line-out, player is also required.
    if (data.pointType === 'line-out') {
        return data.playerId && data.playerId.length > 0;
    }
    return true;
}, {
    message: "Please select the player who stepped out.",
    path: ["playerId"],
});

export function ScoringControls({ teams, onAddScore }: ScoringControlsProps) {
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

  const selectedTeamId = form.watch('teamId');
  const selectedPointType = form.watch('pointType');
  const selectedTeam = teams.find(t => t.id === Number(selectedTeamId));

  function onSubmit(values: z.infer<typeof formSchema>) {
    let points = values.points;
    // For these types, the 'points' value is from the form, but the bonus/lona points are calculated in handleAddScore
    if (['bonus', 'line-out'].includes(values.pointType)) points = 1;

    const data = {
        teamId: Number(values.teamId),
        playerId: values.playerId ? Number(values.playerId) : undefined,
        pointType: values.pointType,
        points: points,
    };
    onAddScore(data);
    
    let toastDescription = `Added points for ${values.pointType.replace('-', ' ')}.`;
    if (values.pointType === 'line-out') {
        const opposingTeam = teams.find(t => t.id !== Number(values.teamId));
        toastDescription = `Point awarded to ${opposingTeam?.name} for line out.`;
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
        return 'The 2 Lona points will be added automatically.';
      case 'line-out':
        return 'Select the team of the player who stepped out. The point will be given to the opposing team.';
      default:
        return null;
    }
  }

  const helperText = getHelperText();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <ClipboardPlus className="text-primary" />
          Update Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-muted-foreground">Add points for raids, tackles, bonuses, or a lona for a team.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">Add Score Event</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Register a Scoring Event</DialogTitle>
              <DialogDescription>
                Select the team, player, and type of point to award.
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <FormLabel className="font-normal flex items-center gap-2"><PlusSquare className="w-4 h-4" /> Bonus + Points</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="bonus" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Star className="w-4 h-4" /> Bonus Only</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="tackle-lona" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Award className="w-4 h-4" /> Tackle + Lona</FormLabel>
                          </FormItem>
                           <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="lona-bonus-points" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Award className="w-4 h-4" /> Lona+Bonus+Pts</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="lona-points" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Award className="w-4 h-4" /> Lona + Points</FormLabel>
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
                      <FormItem>
                        <FormLabel>Player</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedTeam}>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                
                
                {(selectedPointType === 'raid' || selectedPointType === 'tackle' || selectedPointType === 'raid-bonus' || selectedPointType === 'lona-points' || selectedPointType === 'lona-bonus-points' || selectedPointType === 'tackle-lona') && (
                  <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {selectedPointType === 'raid-bonus' || selectedPointType === 'lona-bonus-points' ? 'Raid Points' :
                          selectedPointType === 'tackle-lona' ? 'Tackle Points' : 'Points'}
                        </FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 1" {...field} />
                        </FormControl>
                         {helperText && selectedPointType !== 'line-out' && (
                            <p className="text-xs text-muted-foreground pt-1">
                                {helperText}
                            </p>
                        )}
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
      </CardContent>
    </Card>
  );
}
