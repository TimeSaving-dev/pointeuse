"use client";

import { useState, useEffect } from "react";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Définir l'interface pour un utilisateur
interface User {
  id: number;
  name: string;
  email: string;
  company: string;
  role: string;
  status: string;
}

// Exemple de page de gestion des utilisateurs avec squelettes
export default function UserManagementWithSkeletonPage() {
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  // Simuler le chargement des données
  useEffect(() => {
    // Cette fonction simule un appel API
    const fetchData = async () => {
      setLoading(true);
      
      // Simulation d'un délai de chargement
      setTimeout(() => {
        // Données simulées
        const mockPendingUsers: User[] = [
          { id: 1, name: "Jean Dupont", email: "jean@example.com", company: "Acme Inc", role: "Employé", status: "En attente" },
          { id: 2, name: "Marie Martin", email: "marie@example.com", company: "Tech Co", role: "Manager", status: "En attente" },
        ];
        
        const mockAllUsers: User[] = [
          { id: 1, name: "Jean Dupont", email: "jean@example.com", company: "Acme Inc", role: "Employé", status: "En attente" },
          { id: 2, name: "Marie Martin", email: "marie@example.com", company: "Tech Co", role: "Manager", status: "En attente" },
          { id: 3, name: "Pierre Dubois", email: "pierre@example.com", company: "Global Ltd", role: "Employé", status: "Actif" },
          { id: 4, name: "Sophie Lefebvre", email: "sophie@example.com", company: "Startup SAS", role: "Admin", status: "Actif" },
          { id: 5, name: "Lucas Moreau", email: "lucas@example.com", company: "Acme Inc", role: "Employé", status: "Actif" },
        ];
        
        setPendingUsers(mockPendingUsers);
        setAllUsers(mockAllUsers);
        setLoading(false);
      }, 2000); // 2 secondes de délai simulé
    };
    
    fetchData();
  }, []);

  // Fonction pour recharger les données (simulation)
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>
        <Button onClick={handleRefresh}>
          {loading ? "Chargement..." : "Actualiser"}
        </Button>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">Tous les utilisateurs</TabsTrigger>
          <TabsTrigger value="pending">Utilisateurs en attente</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Tous les utilisateurs</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton columns={6} rows={5} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.company}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.status}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="mr-2">
                            Éditer
                          </Button>
                          <Button variant="destructive" size="sm">
                            Supprimer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs en attente d&apos;approbation</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton columns={6} rows={3} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Aucun utilisateur en attente
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.company}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell>{user.status}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" className="mr-2">
                              Approuver
                            </Button>
                            <Button variant="destructive" size="sm">
                              Rejeter
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 