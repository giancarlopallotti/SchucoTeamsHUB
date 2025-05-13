import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Impostazioni</h1>
      <Tabs defaultValue="account" className="max-w-3xl mx-auto">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifiche</TabsTrigger>
          <TabsTrigger value="appearance">Aspetto</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Account</CardTitle>
              <CardDescription>Gestisci i dettagli e le preferenze del tuo account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="current-password">Password Attuale</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nuova Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Conferma Nuova Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button disabled>Cambia Password (Non Implementato)</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Notifiche</CardTitle>
              <CardDescription>Configura come ricevi le notifiche.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                  <span>Notifiche Email</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Ricevi aggiornamenti importanti via email.
                  </span>
                </Label>
                <Switch id="email-notifications" defaultChecked disabled />
              </div>
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
                  <span>Notifiche Push</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Ricevi avvisi in tempo reale sui tuoi dispositivi.
                  </span>
                </Label>
                <Switch id="push-notifications" disabled />
              </div>
              <Button disabled>Salva Impostazioni Notifiche (Non Implementato)</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Aspetto</CardTitle>
              <CardDescription>Personalizza l'aspetto dell'applicazione.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">L'interruttore per il tema (Chiaro/Scuro) sarà qui. Richiede la configurazione di next-themes.</p>
              {/* Placeholder for theme toggle 
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <Label htmlFor="theme-toggle" className="flex flex-col space-y-1">
                  <span>Tema</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Seleziona il tuo tema preferito.
                  </span>
                </Label>
                <p>Interfaccia per cambio tema</p>
              </div>
              */}
              <Button disabled>Salva Impostazioni Aspetto (Non Implementato)</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
