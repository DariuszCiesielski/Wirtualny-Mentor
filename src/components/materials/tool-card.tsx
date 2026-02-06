'use client';

/**
 * Tool Card Component
 *
 * Displays a recommended tool with link, description,
 * and optional install command.
 */

import { ExternalLink, Terminal, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Tool } from '@/types/materials';

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{tool.name}</CardTitle>
          <Badge variant={tool.isFree ? 'default' : 'secondary'}>
            {tool.isFree ? (
              <><Check className="h-3 w-3 mr-1" /> Darmowe</>
            ) : (
              <><X className="h-3 w-3 mr-1" /> Płatne</>
            )}
          </Badge>
        </div>
        <CardDescription>{tool.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tool.installCommand && (
          <div className="bg-zinc-900 rounded-md p-3 font-mono text-sm flex items-center gap-2">
            <Terminal className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <code className="text-zinc-100 overflow-x-auto">
              {tool.installCommand}
            </code>
          </div>
        )}
        <Button asChild variant="outline" className="w-full">
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Przejdź do strony
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
