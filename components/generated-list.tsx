'use client';

import { Copy, Trash2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { GeneratedConfig, deleteGeneratedConfig } from '@/app/actions';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';

interface GeneratedListProps {
  configs: GeneratedConfig[];
  onUpdate: () => void;
  isLoading?: boolean;
}

export function GeneratedList({ configs, onUpdate, isLoading = false }: GeneratedListProps) {
  const t = useTranslations('History');

  const getPublicLink = (config: GeneratedConfig) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/api/s/${config.id}?key=${config.token}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('copied'));
  };

  const handleDelete = async (id: string, filename: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await deleteGeneratedConfig(id, filename);
      toast.success(t('deleted'));
      onUpdate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.name')}</TableHead>
              <TableHead>{t('table.target')}</TableHead>
              <TableHead>{t('table.createdAt')}</TableHead>
              <TableHead>{t('table.link')}</TableHead>
              <TableHead className="w-[100px] text-right">{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[60px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 items-center">
                      <Skeleton className="h-8 w-[200px]" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : configs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {t('table.empty')}
                </TableCell>
              </TableRow>
            ) : (
              configs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell className="font-medium">
                    {config.name || <span className="text-muted-foreground italic">{t('untitled')}</span>}
                  </TableCell>
                  <TableCell className="uppercase text-xs">{config.target}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(config.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 items-center">
                      <Input
                        readOnly
                        value={getPublicLink(config)}
                        className="h-8 w-[200px] text-xs font-mono"
                        suppressHydrationWarning
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyToClipboard(getPublicLink(config))}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Info className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{t('details.title')}</DialogTitle>
                            <DialogDescription>
                              {t('details.createdAtPrefix')} {new Date(config.created_at).toLocaleString()}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-1 text-sm">{t('details.target')}</h4>
                                <p className="text-sm text-muted-foreground uppercase">{config.target}</p>
                              </div>
                              <div>
                                <h4 className="font-medium mb-1 text-sm">{t('details.backend')}</h4>
                                <p className="text-sm text-muted-foreground truncate" title={config.params.backendUrl}>
                                  {config.params.backendUrl}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <h4 className="font-medium mb-1 text-sm">{t('details.remoteConfig')}</h4>
                                <p className="text-sm text-muted-foreground break-all">
                                  {config.params.configUrl || t('details.remoteConfigDefault')}
                                </p>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2 text-sm">{t('details.sources')} ({config.params.urls?.length || 0})</h4>
                              <div className="bg-muted p-2 rounded-md text-xs font-mono space-y-1 max-h-[150px] overflow-y-auto">
                                {config.params.urls?.map((url: string, i: number) => (
                                  <div key={i} className="break-all border-b last:border-0 pb-1 last:pb-0 border-border/50">
                                    {url}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {config.params.advanced && (
                              <div>
                                <h4 className="font-medium mb-2 text-sm">{t('details.advanced')}</h4>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(config.params.advanced).map(([key, value]) => {
                                    if (!value) return null;
                                    return (
                                      <Badge key={key} variant="secondary" className="text-xs">
                                        {key}
                                      </Badge>
                                    );
                                  })}
                                  {config.params.include && (
                                    <Badge variant="outline" className="text-xs">
                                      {t('details.include')}: {config.params.include}
                                    </Badge>
                                  )}
                                  {config.params.exclude && (
                                    <Badge variant="outline" className="text-xs">
                                      {t('details.exclude')}: {config.params.exclude}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            {config.params.customParams && (
                              <div>
                                <h4 className="font-medium mb-2 text-sm">{t('details.customParams')}</h4>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(config.params.customParams).map(([key, value]) => (
                                    <Badge key={key} variant="outline" className="text-xs">
                                      {key}: {value}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(config.id, config.filename)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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
