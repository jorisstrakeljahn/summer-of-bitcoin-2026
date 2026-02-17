"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ExampleChips } from "./ExampleChips";

interface InputPanelProps {
  onAnalyze: (fixtureJson: string) => void;
  loading: boolean;
}

export function InputPanel({ onAnalyze, loading }: InputPanelProps) {
  const [input, setInput] = useState("");

  async function loadExample(file: string) {
    try {
      const res = await fetch(`/api/fixture?name=${file}`);
      if (!res.ok) return;
      const json = await res.json();
      const text = JSON.stringify(json, null, 2);
      setInput(text);
    } catch {
      /* fixture endpoint may not exist yet; user can paste manually */
    }
  }

  function handleSubmit() {
    if (!input.trim()) return;
    onAnalyze(input.trim());
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="tx">
          <TabsList className="mb-4">
            <TabsTrigger value="tx">Transaction</TabsTrigger>
            <TabsTrigger value="block" disabled>Block (coming soon)</TabsTrigger>
          </TabsList>

          <TabsContent value="tx" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fixture-input">Fixture JSON</Label>
              <Textarea
                id="fixture-input"
                placeholder='{"network":"mainnet","raw_tx":"0200...","prevouts":[...]}'
                className="min-h-[180px] font-mono text-xs resize-y"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
            </div>

            <ExampleChips onSelect={loadExample} disabled={loading} />

            <Button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze Transaction
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
