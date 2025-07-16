"use client"

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { analyzeFoulPlay, type AnalyzeFoulPlayOutput } from '@/ai/flows/analyze-foul-play';
import { Gavel, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  playDescription: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(500, {
    message: "Description must not be longer than 500 characters."
  }),
});

export function FoulPlayAnalyzer() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeFoulPlayOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playDescription: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await analyzeFoulPlay({ playDescription: values.playDescription });
      setAnalysisResult(result);
    } catch (e) {
      setError("An error occurred while analyzing the play. Please try again.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Gavel className="text-primary" />
          Foul Play Analyzer
        </CardTitle>
        <CardDescription>Use AI to check a play description for potential foul play violations.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FormField
              control={form.control}
              name="playDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Play Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the play in detail. e.g., 'The raider was tackled by three defenders, but one defender pulled his jersey from behind.'"
                      className="resize-none"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Play
            </Button>
          </CardFooter>
        </form>
      </Form>
      
      {analysisResult && (
        <div className="p-4 pt-0">
          <Alert variant={analysisResult.hasFoulPlay ? "destructive" : "default"} >
             {analysisResult.hasFoulPlay ? <ShieldAlert className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            <AlertTitle>{analysisResult.hasFoulPlay ? "Potential Foul Play Detected" : "Play Appears Clear"}</AlertTitle>
            <AlertDescription>
              {analysisResult.analysis}
            </AlertDescription>
          </Alert>
        </div>
      )}
      {error && (
         <div className="p-4 pt-0">
            <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        </div>
      )}
    </Card>
  );
}
