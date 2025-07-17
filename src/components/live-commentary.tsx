"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface LiveCommentaryProps {
    commentaryLog: string[];
    isLoading: boolean;
}

export function LiveCommentary({ commentaryLog, isLoading }: LiveCommentaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Mic className="text-primary" />
          Live Commentary
          {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48 w-full rounded-md border p-4">
          <div className="flex flex-col gap-3">
             <AnimatePresence>
                {commentaryLog.length === 0 && !isLoading && (
                    <p className="text-sm text-muted-foreground text-center">Match commentary will appear here...</p>
                )}
                {commentaryLog.map((entry, index) => (
                <motion.div
                    key={index}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                        delay: 0.1 * index
                    }}
                    className="text-sm"
                >
                    <span className="font-semibold text-primary">▶</span> {entry}
                </motion.div>
                ))}
             </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
