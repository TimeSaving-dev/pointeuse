"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  isActive: boolean;
  accountStatus: string;
  createdAt: string;
  isAdmin: boolean;
  position: string | null;
  hourlyRate: string | null;
  company: string | null;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Formulaire pour ajouter un utilisateur
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    position: "",
    hourlyRate: "",
    company: "",
    accountStatus: "APPROVED",
    isAdmin: false,
  });

  // Fonction pour réinitialiser les messages
  const resetMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const status = activeTab === "pending" ? "PENDING" : "";
      const url = `/api/admin/users${status ? `?status=${status}` : ""}`;
      console.log(`Fetching users with URL: ${url}, activeTab: ${activeTab}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des utilisateurs");
      }
      
      const data = await response.json();
      console.log(`Received users data:`, data.users);
      
      if (activeTab === "pending") {
        setPendingUsers(data.users);
      } else {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Erreur:", err);
      setError("Impossible de charger les utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== "add") {
    fetchUsers();
    }
    
    // Réinitialiser les messages lors du changement d'onglet
    resetMessages();
  }, [activeTab]);
  
  // Effet pour faire disparaître le message de succès après 5 secondes
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleApprove = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          accountStatus: "APPROVED",
        }),
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de l&apos;approbation de l&apos;utilisateur");
      }
      
      const result = await response.json();
      console.log("Résultat de l'approbation:", result);
      
      // Mettre à jour la liste des utilisateurs en attente
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
      
      // Rafraîchir la liste des utilisateurs
      fetchUsers();
      
      // Déclencher un événement personnalisé pour rafraîchir les notifications
      const refreshEvent = new CustomEvent('refreshNotifications');
      window.dispatchEvent(refreshEvent);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Impossible d&apos;approuver l&apos;utilisateur");
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          accountStatus: "REJECTED",
        }),
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors du rejet de l&apos;utilisateur");
      }
      
      const result = await response.json();
      console.log("Résultat du rejet:", result);
      
      // Mettre à jour la liste des utilisateurs en attente
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
      
      // Rafraîchir la liste des utilisateurs
      fetchUsers();
      
      // Déclencher un événement personnalisé pour rafraîchir les notifications
      const refreshEvent = new CustomEvent('refreshNotifications');
      window.dispatchEvent(refreshEvent);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Impossible de rejeter l&apos;utilisateur");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy HH:mm", { locale: fr });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">En attente</span>;
      case "APPROVED":
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Approuvé</span>;
      case "REJECTED":
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Rejeté</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };
  
  // Fonction pour gérer la création d'un nouvel utilisateur
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Validation basique
      if (!newUser.email || !newUser.password) {
        setError("L'email et le mot de passe sont requis");
        return;
      }
      
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la création de l'utilisateur");
      }
      
      // Réinitialiser le formulaire
      setNewUser({
        name: "",
        email: "",
        password: "",
        position: "",
        hourlyRate: "",
        company: "",
        accountStatus: "APPROVED",
        isAdmin: false,
      });
      
      setSuccessMessage("Utilisateur créé avec succès");
      
      // Retourner à la liste des utilisateurs après 2 secondes
      setTimeout(() => {
        setActiveTab("all");
      }, 2000);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err instanceof Error ? err.message : "Impossible de créer l'utilisateur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Gestion des utilisateurs</CardTitle>
        <div className="flex space-x-2 mt-2">
          <Button 
            variant={activeTab === "pending" ? "outline" : "default"} 
            onClick={() => setActiveTab("pending")}
            size="sm"
          >
            En attente
          </Button>
          <Button 
            variant={activeTab === "all" ? "outline" : "default"} 
            onClick={() => setActiveTab("all")}
            size="sm"
          >
            Tous les utilisateurs
          </Button>
          <Button 
            variant={activeTab === "add" ? "outline" : "default"} 
            onClick={() => setActiveTab("add")}
            size="sm"
          >
            Ajouter un utilisateur
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 mb-4 bg-red-50 text-red-800 rounded-md text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 mb-4 bg-green-50 text-green-800 rounded-md text-sm">
            {successMessage}
          </div>
        )}

        {activeTab === "add" ? (
          <div className="max-w-md mx-auto">
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Nom (optionnel)</Label>
                <Input 
                  id="name" 
                  value={newUser.name} 
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Nom de l'utilisateur"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input 
                  id="email" 
                  type="email"
                  value={newUser.email} 
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="email@exemple.com"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="password">Mot de passe <span className="text-red-500">*</span></Label>
                <Input 
                  id="password" 
                  type="password"
                  value={newUser.password} 
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="position">Poste</Label>
                <Input 
                  id="position" 
                  value={newUser.position} 
                  onChange={(e) => setNewUser({...newUser, position: e.target.value})}
                  placeholder="Poste occupé"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="hourlyRate">Forfait Horaire</Label>
                <Input 
                  id="hourlyRate" 
                  value={newUser.hourlyRate} 
                  onChange={(e) => setNewUser({...newUser, hourlyRate: e.target.value})}
                  placeholder="Exemple: 25.50"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="company">Entreprise</Label>
                <Input 
                  id="company" 
                  value={newUser.company} 
                  onChange={(e) => setNewUser({...newUser, company: e.target.value})}
                  placeholder="Nom de l'entreprise"
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="status">Statut du compte</Label>
                <select 
                  id="status"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newUser.accountStatus} 
                  onChange={(e) => setNewUser({...newUser, accountStatus: e.target.value})}
                >
                  <option value="APPROVED">Approuvé</option>
                  <option value="PENDING">En attente</option>
                  <option value="REJECTED">Rejeté</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="role">Rôle</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isAdmin"
                    checked={newUser.isAdmin}
                    onChange={(e) => setNewUser({...newUser, isAdmin: e.target.checked})}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="isAdmin">Administrateur</Label>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  "Créer l'utilisateur"
                )}
              </Button>
            </form>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : activeTab === "pending" && pendingUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune demande d&apos;inscription en attente
          </div>
        ) : activeTab === "pending" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Date d&apos;inscription</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name || "-"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.company || "-"}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                        onClick={() => handleApprove(user.id)}
                      >
                        Approuver
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                        onClick={() => handleReject(user.id)}
                      >
                        Rejeter
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun utilisateur trouvé
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Forfait Horaire</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Date d&apos;inscription</TableHead>
                <TableHead>Rôle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name || "-"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getStatusBadge(user.accountStatus)}</TableCell>
                  <TableCell>{user.position || "-"}</TableCell>
                  <TableCell>{user.hourlyRate || "-"}</TableCell>
                  <TableCell>{user.company || "-"}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    {user.isAdmin ? (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Admin</span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Utilisateur</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 