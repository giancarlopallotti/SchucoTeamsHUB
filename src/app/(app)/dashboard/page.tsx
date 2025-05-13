"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/user-provider";
import { BarChart, LineChart, PieChart, Users, Briefcase, CheckSquare, ListTodo, UserPlus } from "lucide-react"; // Added UserPlus for consistency
import Link from "next/link";

// Sample data - replace with actual data fetching
const projectStats = {
  totalProjects: 25,
  activeProjects: 15,
  completedProjects: 8,
  overdueTasks: 3,
};

const clientStats = {
  totalClients: 42,
  newClientsThisMonth: 5,
};

const teamActivity = [
  { name: "Gen", tasksCompleted: 65, projectsAdded: 5 },
  { name: "Feb", tasksCompleted: 59, projectsAdded: 4 },
  { name: "Mar", tasksCompleted: 80, projectsAdded: 7 },
  { name: "Apr", tasksCompleted: 81, projectsAdded: 6 },
  { name: "Mag", tasksCompleted: 56, projectsAdded: 4 },
  { name: "Giu", tasksCompleted: 70, projectsAdded: 5 },
];

const projectStatusDistribution = [
  { name: "Non Iniziato", value: 5, fill: "var(--chart-1)" },
  { name: "In Corso", value: 15, fill: "var(--chart-2)" },
  { name: "Completato", value: 8, fill: "var(--chart-3)" },
  { name: "In Sospeso", value: 2, fill: "var(--chart-4)" },
];


export default function DashboardPage() {
  const { user, login } = useUser();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Simula Ruolo:</span>
          <Button size="sm" variant={user?.role === "SUPERVISOR" ? "default" : "outline"} onClick={() => login("SUPERVISOR")}>Supervisore</Button>
          <Button size="sm" variant={user?.role === "AMMINISTRATORE" ? "default" : "outline"} onClick={() => login("AMMINISTRATORE")}>Amministratore</Button>
          <Button size="sm" variant={user?.role === "TECNICO" ? "default" : "outline"} onClick={() => login("TECNICO")}>Tecnico</Button>
        </div>
      </div>
      <p className="text-muted-foreground">Bentornato, {user?.firstName}! Ecco una panoramica dei tuoi progetti e attività.</p>
      
      {/* Key Metrics Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progetti Totali</CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">Gestiti tra tutti i team</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progetti Attivi</CardTitle>
            <ListTodo className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">{projectStats.completedProjects} completati</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clienti Totali</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientStats.totalClients}</div>
            <p className="text-xs text-muted-foreground">+{clientStats.newClientsThisMonth} nuovi questo mese</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attività Scadute</CardTitle>
            <CheckSquare className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{projectStats.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">Richiedono attenzione immediata</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attività del Team</CardTitle>
            <CardDescription>Attività completate e progetti aggiunti negli ultimi 6 mesi.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {/* Placeholder for Chart */}
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <LineChart className="h-16 w-16" />
              <p>Grafico Attività del Team (Placeholder)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distribuzione Stato Progetti</CardTitle>
            <CardDescription>Stato attuale di tutti i progetti.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {/* Placeholder for Chart */}
             <div className="flex h-full items-center justify-center text-muted-foreground">
              <PieChart className="h-16 w-16" />
              <p>Grafico Stato Progetti (Placeholder)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Azioni Rapide</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/projects/new">
              <Briefcase className="mr-2 h-4 w-4" /> Crea Nuovo Progetto
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/clients/new">
              <Users className="mr-2 h-4 w-4" /> Aggiungi Nuovo Cliente
            </Link>
          </Button>
          {(user?.role === "SUPERVISOR" || user?.role === "AMMINISTRATORE") && (
            <Button variant="secondary" asChild>
              <Link href="/users/new">
                <UserPlus className="mr-2 h-4 w-4" /> Aggiungi Nuovo Utente
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/calendar">
              <BarChart className="mr-2 h-4 w-4" /> Visualizza Calendario
            </Link>
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
