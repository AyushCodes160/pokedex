import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Battle() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl text-center">Pokémon Battle Arena</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <p className="text-xl text-muted-foreground text-center">
            Welcome to the Battle Arena! Select your team and challenge your opponent.
          </p>
          <div className="w-full max-w-sm p-4 bg-muted/50 rounded-lg text-center">
            <p>Battle feature is currently under construction.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
