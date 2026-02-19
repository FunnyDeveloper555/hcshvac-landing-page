import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import UsersList from "./UsersList";
import UserGroupsList from "./UserGroupsList";
import { Users, FolderOpen } from "lucide-react";

export default function UsersAdmin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "users";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList>
        <TabsTrigger value="users" className="gap-2">
          <Users className="h-4 w-4" />
          Users
        </TabsTrigger>
        <TabsTrigger value="groups" className="gap-2">
          <FolderOpen className="h-4 w-4" />
          Groups
        </TabsTrigger>
      </TabsList>
      <TabsContent value="users">
        <UsersList />
      </TabsContent>
      <TabsContent value="groups">
        <UserGroupsList />
      </TabsContent>
    </Tabs>
  );
}
