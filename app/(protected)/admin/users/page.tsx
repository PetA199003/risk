'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Users, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { hasPermission, UserRole } from '@/lib/permissions';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const roleLabels = {
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.PROJEKTLEITER]: 'Projektleiter',
  [UserRole.MITARBEITER]: 'Mitarbeiter',
};

const getRoleColor = (role: UserRole) => {
  switch (role) {
    case UserRole.ADMIN:
      return 'bg-red-100 text-red-800';
    case UserRole.PROJEKTLEITER:
      return 'bg-blue-100 text-blue-800';
    case UserRole.MITARBEITER:
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock users data
  const [users, setUsers] = useState([
    {
      id: '1',
      name: 'System Administrator',
      email: 'admin@gbu-app.de',
      role: UserRole.ADMIN,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      name: 'Max Mustermann',
      email: 'projektleiter@gbu-app.de',
      role: UserRole.PROJEKTLEITER,
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '3',
      name: 'Lisa Musterfrau',
      email: 'mitarbeiter@gbu-app.de',
      role: UserRole.MITARBEITER,
      createdAt: new Date('2024-02-01'),
    },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.MITARBEITER,
    password: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !hasPermission(session?.user?.role, UserRole.ADMIN)) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || !hasPermission(session.user.role, UserRole.ADMIN)) {
    return null;
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: UserRole.MITARBEITER,
      password: '',
    });
    setEditingUser(null);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '', // Don't pre-fill password for security
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.name || !formData.email || !formData.role) {
        toast.error('Bitte füllen Sie alle Pflichtfelder aus.');
        return;
      }

      if (!editingUser && !formData.password) {
        toast.error('Passwort ist für neue Benutzer erforderlich.');
        return;
      }

      // Check for duplicate email
      const existingUser = users.find(u => u.email === formData.email && u.id !== editingUser?.id);
      if (existingUser) {
        toast.error('Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.');
        return;
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (editingUser) {
        // Update existing user
        setUsers(prev => prev.map(u => 
          u.id === editingUser.id 
            ? { ...u, name: formData.name, email: formData.email, role: formData.role }
            : u
        ));
        toast.success('Benutzer erfolgreich aktualisiert!');
      } else {
        // Create new user
        const newUser = {
          id: Date.now().toString(),
          name: formData.name,
          email: formData.email,
          role: formData.role,
          createdAt: new Date(),
        };
        setUsers(prev => [...prev, newUser]);
        toast.success('Benutzer erfolgreich erstellt!');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Fehler beim Speichern des Benutzers.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (userId === session.user.id) {
      toast.error('Sie können sich nicht selbst löschen.');
      return;
    }

    if (!confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?')) {
      return;
    }

    try {
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('Benutzer erfolgreich gelöscht!');
    } catch (error) {
      toast.error('Fehler beim Löschen des Benutzers.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Benutzer verwalten</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Benutzerkonten und Berechtigungen
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Benutzer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Benutzer bearbeiten' : 'Neuen Benutzer erstellen'}
              </DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? 'Bearbeiten Sie die Benutzerdaten und Berechtigungen.'
                  : 'Erstellen Sie einen neuen Benutzer für das System.'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Vollständiger Name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-Mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="benutzer@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rolle *</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Passwort {editingUser ? '(leer lassen für keine Änderung)' : '*'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Passwort"
                  required={!editingUser}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Wird gespeichert...' : (editingUser ? 'Aktualisieren' : 'Erstellen')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Abbrechen
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Benutzerübersicht
          </CardTitle>
          <CardDescription>
            Alle registrierten Benutzer und ihre Rollen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Erstellt am</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleColor(user.role)}>
                      {roleLabels[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(user.createdAt, 'dd.MM.yyyy', { locale: de })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {user.id !== session.user.id && (
                        <Button variant="outline" size="sm" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === UserRole.ADMIN).length}</p>
                <p className="text-sm text-muted-foreground">Administratoren</p>
              </div>
              <Badge className={getRoleColor(UserRole.ADMIN)}>Admin</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === UserRole.PROJEKTLEITER).length}</p>
                <p className="text-sm text-muted-foreground">Projektleiter</p>
              </div>
              <Badge className={getRoleColor(UserRole.PROJEKTLEITER)}>Projektleiter</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === UserRole.MITARBEITER).length}</p>
                <p className="text-sm text-muted-foreground">Mitarbeiter</p>
              </div>
              <Badge className={getRoleColor(UserRole.MITARBEITER)}>Mitarbeiter</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}