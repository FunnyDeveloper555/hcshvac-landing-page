import { useState } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CTAIconsAdd from "./CTAIconsAdd";
import CTAIconsLibrary from "./CTAIconsLibrary";
import CTAIconsAssignments from "./CTAIconsAssignments";

export default function CTAIconsTabbed() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">CTA Icons</h2>
        <p className="text-muted-foreground">Manage call-to-action icons, library, and assignments</p>
      </div>
      <Tabs defaultValue="library" className="w-full">
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="library" className="flex-1">Library</TabsTrigger>
          <TabsTrigger value="add" className="flex-1">Add Icon</TabsTrigger>
          <TabsTrigger value="assignments" className="flex-1">Assignments</TabsTrigger>
        </TabsList>
        <TabsContent value="library"><CTAIconsLibrary /></TabsContent>
        <TabsContent value="add"><CTAIconsAdd /></TabsContent>
        <TabsContent value="assignments"><CTAIconsAssignments /></TabsContent>
      </Tabs>
    </div>
  );
}
