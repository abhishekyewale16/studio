
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
import { ClipboardPlus, Star, Shield, Swords, Award, PlusSquare } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"

interface ScoringControlsProps {
  teams: [Team, Team];
  onAddScore: (data: { teamId: number; playerId?: number; pointType: string; points: number }) => void;
}

const formSchema = z.object({
  teamId: z.string().min(1, { message: 'Please select a team.' }),
  pointType: z.enum(['raid', 'tackle', 'bonus', 'lona', 'raid-bonus', 'lona-points', 'lona-bonus-points']),
  points: z.coerce.number().min(1, { message: 'Points must be at least 1.' }).max(10, { message: 'Points cannot exceed 10.' }),
  playerId: z.string().optional(),
}).refine(data => data.pointType === 'lona' || (data.playerId && data.playerId.length > 0), {
  message: "Player selection is required for this point type.",
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
    if (values.pointType === 'bonus') points = 1;
    if (values.pointType === 'lona') points = 2;
    if (values.pointType === 'raid-bonus') points = values.points; // The total points from raid, bonus is handled in handleAddScore
    if (values.pointType === 'lona-bonus-points') points = values.points; // The total points from raid, bonus and lona are handled in handleAddScore

    const data = {
        teamId: Number(values.teamId),
        playerId: values.playerId ? Number(values.playerId) : undefined,
        pointType: values.pointType,
        points: points,
    };
    onAddScore(data);
    toast({
      title: "Score Updated!",
      description: `Added points for ${values.pointType}.`,
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
                            <FormControl><RadioGroupItem value="lona-bonus-points" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Award className="w-4 h-4" /> Lona+Bonus+Pts</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="lona-points" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Award className="w-4 h-4" /> Lona + Points</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="lona" /></FormControl>
                            <FormLabel className="font-normal flex items-center gap-2"><Award className="w-4 h-4" /> Lona Only</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedPointType !== 'lona' && (
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
                )}
                
                {(selectedPointType === 'raid' || selectedPointType === 'tackle' || selectedPointType === 'raid-bonus' || selectedPointType === 'lona-points' || selectedPointType === 'lona-bonus-points') && (
                  <FormField
                    control={form.control}
                    name="points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{selectedPointType === 'raid-bonus' || selectedPointType === 'lona-bonus-points' ? 'Raid Points' : 'Points'}</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 1" {...field} />
                        </FormControl>
                         {helperText && (
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
