'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale, useTranslations } from 'next-intl';
import { createUser, deleteUser, updateUserPassword, toggleRegistration } from '../actions';
import { Loader2, Trash2, Key, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function UsersTable({
  users,
  registrationEnabled,
  currentUserId
}: {
  users: User[],
  registrationEnabled: boolean,
  currentUserId?: string;
}) {
  const t = useTranslations('auth.admin');
  const locale = useLocale();
  const router = useRouter();
  const [regEnabled, setRegEnabled] = useState(registrationEnabled);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPassOpen, setIsPassOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const dateFormatter = new Intl.DateTimeFormat(locale);

  // Add User Form State
  const [addEmail, setAddEmail] = useState('');
  const [addPass, setAddPass] = useState('');

  // Change Pass Form State
  const [newPass, setNewPass] = useState('');

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('email', addEmail);
    formData.append('password', addPass);

    const res = await createUser(null, formData);
    setLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(t('userCreated'));
      setIsAddOpen(false);
      setAddEmail('');
      setAddPass('');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm(t('confirmDelete'))) return;
    setLoading(true);
    const res = await deleteUser(userId);
    setLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(t('userDeleted'));
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    const res = await updateUserPassword(selectedUser.id, newPass);
    setLoading(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(t('passwordUpdated'));
      setIsPassOpen(false);
      setNewPass('');
      setSelectedUser(null);
    }
  };

  const handleToggleReg = async (checked: boolean) => {
    setRegEnabled(checked);
    const res = await toggleRegistration(checked);
    if (res?.error) {
      setRegEnabled(!checked);
      toast.error(res.error);
    } else {
      toast.success(checked ? t('registrationEnabled') : t('registrationDisabled'));
      router.refresh();
    }
  };

  useEffect(() => {
    setRegEnabled(registrationEnabled);
  }, [registrationEnabled]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center space-x-2">
          <Switch checked={regEnabled} onCheckedChange={handleToggleReg} id="reg-switch" disabled={loading} />
          <Label htmlFor="reg-switch">{t('toggleRegistration')}</Label>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="mr-2 h-4 w-4" /> {t('addUser')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('addUser')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('email')}</Label>
                <Input value={addEmail} onChange={e => setAddEmail(e.target.value)} required type="email" />
              </div>
              <div className="space-y-2">
                <Label>{t('password')}</Label>
                <Input value={addPass} onChange={e => setAddPass(e.target.value)} required type="password" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('addUser')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('email')}</TableHead>
              <TableHead>{t('createdAt')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>{dateFormatter.format(new Date(user.created_at))}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsPassOpen(true);
                      }}
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      disabled={loading || user.id === currentUserId}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isPassOpen} onOpenChange={setIsPassOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('changePassword')}: {selectedUser?.email}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label>{t('newPassword')}</Label>
              <Input value={newPass} onChange={e => setNewPass(e.target.value)} required type="password" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('changePassword')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
