'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { addSubscription, deleteSubscription, Subscription } from '@/app/actions';
import { useTranslations } from 'next-intl';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onUpdate: () => void;
}

export function SubscriptionList({ subscriptions, onUpdate }: SubscriptionListProps) {
  const t = useTranslations('Subscriptions');
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newName || !newUrl) return;
    setLoading(true);
    try {
      await addSubscription(newName, newUrl);
      toast.success(t('toast.added'));
      setIsOpen(false);
      setNewName('');
      setNewUrl('');
      onUpdate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await deleteSubscription(id);
      toast.success(t('toast.deleted'));
      onUpdate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('title')}</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> {t('addSource')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('addDialogTitle')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label>{t('nameLabel')}</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. My Airport" />
              </div>
              <div className="grid gap-2">
                <label>{t('urlLabel')}</label>
                <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." />
              </div>
              <Button onClick={handleAdd} disabled={loading}>
                {loading ? t('adding') : t('save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.name')}</TableHead>
              <TableHead>{t('table.url')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  {t('table.empty')}
                </TableCell>
              </TableRow>
            )}
            {subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">{sub.name}</TableCell>
                <TableCell className="max-w-[300px] truncate" title={sub.url}>
                  {sub.url}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(sub.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
