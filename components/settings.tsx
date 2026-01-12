'use client';

import { ReactNode, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  addBackendUrl, deleteBackendUrl,
  addRemoteConfig, deleteRemoteConfig,
  BackendUrl, RemoteConfig
} from '@/app/actions';

import { Skeleton } from '@/components/ui/skeleton';

interface SettingsProps {
  backends: BackendUrl[];
  remoteConfigs: RemoteConfig[];
  onUpdate: () => void;
  isLoading?: boolean;
}

export function Settings({ backends, remoteConfigs, onUpdate, isLoading = false }: SettingsProps) {
  const t = useTranslations('Settings');

  return (
    <div className="grid gap-6">
      <ResourceManager
        title={t('backend.title')}
        description={
          <>
            {t('backend.description')}{' '}
            <a
              href="https://github.com/tindy2013/subconverter/blob/master/README-docker.md"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              {t('backend.docLink')}
            </a>
          </>
        }
        items={backends}
        onAdd={addBackendUrl}
        onDelete={deleteBackendUrl}
        onUpdate={onUpdate}
        placeholderName={t('backend.placeholderName')}
        placeholderUrl={t('backend.placeholderUrl')}
        isLoading={isLoading}
      />

      <ResourceManager
        title={t('remoteConfig.title')}
        description={
          <>
            {t('remoteConfig.description')}{' '}
            <a
              href="https://github.com/ACL4SSR/ACL4SSR/tree/master/Clash/config"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              {t('remoteConfig.docLink')}
            </a>
          </>
        }
        items={remoteConfigs}
        onAdd={addRemoteConfig}
        onDelete={deleteRemoteConfig}
        onUpdate={onUpdate}
        placeholderName={t('remoteConfig.placeholderName')}
        placeholderUrl={t('remoteConfig.placeholderUrl')}
        isLoading={isLoading}
      />
    </div>
  );
}

interface ResourceManagerProps {
  title: string;
  description: ReactNode;
  items: { id: string, name: string, url: string; }[];
  onAdd: (name: string, url: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onUpdate: () => void;
  placeholderName: string;
  placeholderUrl: string;
  isLoading?: boolean;
}

function ResourceManager({
  title, description, items,
  onAdd, onDelete, onUpdate,
  placeholderName, placeholderUrl,
  isLoading = false
}: ResourceManagerProps) {
  const t = useTranslations('Settings');
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name || !url) return;
    setLoading(true);
    try {
      await onAdd(name, url);
      toast.success(t('toast.added'));
      setIsOpen(false);
      setName('');
      setUrl('');
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
      await onDelete(id);
      toast.success(t('toast.deleted'));
      onUpdate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> {t('add')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('addNewItem')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label>{t('nameLabel')}</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholderName} />
              </div>
              <div className="grid gap-2">
                <label>{t('urlLabel')}</label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={placeholderUrl} />
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
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[250px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  {t('table.empty')}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="max-w-[300px] truncate" title={item.url}>
                    {item.url}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
