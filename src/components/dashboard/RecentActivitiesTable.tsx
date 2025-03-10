"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ActivityItem {
  id: string;
  timestamp: string;
  user: {
    name?: string;
    email: string;
  };
  [key: string]: any;
}

interface RecentActivitiesTableProps {
  title: string;
  type: "checkins" | "pauses" | "checkouts";
  data: {
    id: string;
    userName: string;
    timestamp: string;
    location?: string;
    isReturn?: boolean;
  }[];
  className?: string;
}

export function RecentActivitiesTable({ title, data, className, type }: RecentActivitiesTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
  };

  const getTypeLabel = () => {
    switch (type) {
      case "checkins":
        return "Arrivée";
      case "pauses":
        return "Pause";
      case "checkouts":
        return "Départ";
      default:
        return "Activité";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Horodatage</TableHead>
              {type === "checkins" && <TableHead>Retour de pause</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.userName}</TableCell>
                  <TableCell>{getTypeLabel()}</TableCell>
                  <TableCell>{formatDate(item.timestamp)}</TableCell>
                  {type === "checkins" && (
                    <TableCell>{item.isReturn ? "Oui" : "Non"}</TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={type === "checkins" ? 4 : 3} className="text-center">
                  Aucune donnée disponible
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 