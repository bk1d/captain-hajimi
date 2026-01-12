'use client';

import { useState } from 'react';
import { Copy, ExternalLink, Loader2, ChevronsUpDown, Info, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { generateAndSaveConfig, Subscription, GeneratedConfig, BackendUrl, RemoteConfig } from '@/app/actions';
import { useTranslations } from 'next-intl';

interface ConverterProps {
  subscriptions: Subscription[];
  backends: BackendUrl[];
  remoteConfigs: RemoteConfig[];
  onConfigGenerated: () => void;
}

const TARGETS = [
  { value: 'clash', label: 'Clash' },
  { value: 'clashr', label: 'ClashR' },
  { value: 'quan', label: 'Quantumult' },
  { value: 'quanx', label: 'Quantumult X' },
  { value: 'loon', label: 'Loon' },
  { value: 'ss', label: 'SS (SIP002)' },
  { value: 'sssub', label: 'SS (SIP008)' },
  { value: 'ssr', label: 'SSR' },
  { value: 'surfboard', label: 'Surfboard' },
  { value: 'surge&ver=2', label: 'Surge 2' },
  { value: 'surge&ver=3', label: 'Surge 3' },
  { value: 'surge&ver=4', label: 'Surge 4' },
  { value: 'trojan', label: 'Trojan' },
  { value: 'v2ray', label: 'V2Ray' },
  { value: 'mixed', label: 'Mixed' },
];

const DEFAULT_BACKEND = 'https://api.wcc.best';
const DEFAULT_CONFIG = 'https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online_Mini.ini';

export function Converter({ subscriptions, backends, remoteConfigs, onConfigGenerated }: ConverterProps) {
  const t = useTranslations('Converter');

  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND);
  const [target, setTarget] = useState('clash');
  const [configUrl, setConfigUrl] = useState(DEFAULT_CONFIG);
  const [useCustomConfig, setUseCustomConfig] = useState(true);
  const [exclude, setExclude] = useState('');
  const [include, setInclude] = useState('');
  const [filename, setFilename] = useState('');

  // Advanced Options
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [emoji, setEmoji] = useState(true);
  const [udp, setUdp] = useState(false);
  const [tfo, setTfo] = useState(false);
  const [scv, setScv] = useState(true);
  const [expand, setExpand] = useState(true);
  const [customParams, setCustomParams] = useState<{ key: string, value: string; }[]>([]);

  const [loading, setLoading] = useState(false);
  const [lastConfig, setLastConfig] = useState<GeneratedConfig | null>(null);

  const handleToggleSub = (id: string) => {
    setSelectedSubs(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAddCustomParam = () => {
    setCustomParams([...customParams, { key: '', value: '' }]);
  };

  const handleRemoveCustomParam = (index: number) => {
    setCustomParams(customParams.filter((_, i) => i !== index));
  };

  const handleCustomParamChange = (index: number, field: 'key' | 'value', value: string) => {
    const newParams = [...customParams];
    newParams[index][field] = value;
    setCustomParams(newParams);
  };

  const handleGenerate = async () => {
    if (selectedSubs.length === 0) {
      toast.error(t('toast.selectAtLeastOne'));
      return;
    }

    setLoading(true);
    try {
      const selectedUrls = subscriptions
        .filter(s => selectedSubs.includes(s.id))
        .map(s => s.url);

      const customParamsObj: Record<string, string> = {};
      customParams.forEach(p => {
        if (p.key.trim()) {
          customParamsObj[p.key.trim()] = p.value.trim();
        }
      });

      const config = await generateAndSaveConfig({
        backendUrl,
        target,
        urls: selectedUrls,
        configUrl: useCustomConfig ? configUrl : undefined,
        exclude: exclude || undefined,
        include: include || undefined,
        filename: filename || undefined,
        advanced: {
          emoji,
          udp,
          tfo,
          scv,
          expand,
        },
        customParams: Object.keys(customParamsObj).length > 0 ? customParamsObj : undefined
      });

      setLastConfig(config);
      onConfigGenerated();
      toast.success(t('toast.generatedSuccess'));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const getPublicLink = (config: GeneratedConfig) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/api/s/${config.id}?key=${config.token}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('toast.copied'));
  };

  interface OptionSwitchProps {
    id: string;
    label: string;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    tooltip: string;
  }

  const OptionSwitch = ({ id, label, checked, onCheckedChange, tooltip }: OptionSwitchProps) => (
    <div className="flex items-center justify-between space-x-2 border p-3 rounded-lg bg-card">
      <div className="flex items-center space-x-2">
        <Label htmlFor={id} className="cursor-pointer font-medium">{label}</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );

  interface LabelWithTooltipProps {
    htmlFor: string;
    label: string;
    tooltip: string;
  }

  const LabelWithTooltip = ({ htmlFor, label, tooltip }: LabelWithTooltipProps) => (
    <div className="flex items-center space-x-2 mb-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('selectSourcesTitle')}</CardTitle>
          <CardDescription>{t('selectSourcesDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {subscriptions.length === 0 && <p className="text-sm text-muted-foreground">{t('noSubscriptions')}</p>}
            {subscriptions.map(sub => (
              <div key={sub.id} className="flex items-center space-x-2">
                <Checkbox
                  id={sub.id}
                  checked={selectedSubs.includes(sub.id)}
                  onCheckedChange={() => handleToggleSub(sub.id)}
                />
                <Label htmlFor={sub.id} className="flex-1 cursor-pointer">
                  {sub.name} <span className="text-xs text-muted-foreground ml-2 truncate max-w-[200px] inline-block align-bottom">{sub.url}</span>
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('configurationTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('configurationNameLabel')}</Label>
            <Input value={filename} onChange={e => setFilename(e.target.value)} placeholder={t('configurationNamePlaceholder')} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('targetPlatformLabel')}</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TARGETS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>{t('backendUrlLabel')}</Label>
                <a
                  href="https://github.com/tindy2013/subconverter/blob/master/README-docker.md"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1"
                >
                  {t('backendDocLink')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex gap-2">
                <Select value={backendUrl} onValueChange={setBackendUrl}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t('backendSelectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DEFAULT_BACKEND}>{t('backendDefaultPrefix')} ({DEFAULT_BACKEND})</SelectItem>
                    {backends.map(b => (
                      <SelectItem key={b.id} value={b.url}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                value={backendUrl}
                onChange={e => setBackendUrl(e.target.value)}
                placeholder={t('backendCustomPlaceholder')}
                className="mt-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>{t('remoteConfigLabel')}</Label>
                <a
                  href="https://github.com/ACL4SSR/ACL4SSR/tree/master/Clash/config"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1"
                >
                  {t('remoteConfigDocLink')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <Switch checked={useCustomConfig} onCheckedChange={setUseCustomConfig} />
            </div>
            {useCustomConfig && (
              <div className="space-y-2">
                <Select value={configUrl} onValueChange={setConfigUrl}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('remoteConfigSelectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DEFAULT_CONFIG}>{t('remoteConfigDefaultLabel')}</SelectItem>
                    {remoteConfigs.map(c => (
                      <SelectItem key={c.id} value={c.url}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input value={configUrl} onChange={e => setConfigUrl(e.target.value)} placeholder={t('remoteConfigCustomPlaceholder')} />
              </div>
            )}
          </div>

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="space-y-2 border rounded-md p-4">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">{t('advancedTitle')}</Label>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronsUpDown className="h-4 w-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <OptionSwitch id="emoji" label={t('advanced.emoji.label')} checked={emoji} onCheckedChange={setEmoji} tooltip={t('advanced.emoji.tooltip')} />
                <OptionSwitch id="udp" label={t('advanced.udp.label')} checked={udp} onCheckedChange={setUdp} tooltip={t('advanced.udp.tooltip')} />
                <OptionSwitch id="tfo" label={t('advanced.tfo.label')} checked={tfo} onCheckedChange={setTfo} tooltip={t('advanced.tfo.tooltip')} />
                <OptionSwitch id="scv" label={t('advanced.scv.label')} checked={scv} onCheckedChange={setScv} tooltip={t('advanced.scv.tooltip')} />
                <OptionSwitch id="expand" label={t('advanced.expand.label')} checked={expand} onCheckedChange={setExpand} tooltip={t('advanced.expand.tooltip')} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>{t('advanced.custom.label')}</Label>
                    <a
                      href="https://github.com/tindy2013/subconverter/blob/master/README-docker.md"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-500 hover:underline inline-flex items-center gap-1"
                    >
                      {t('advanced.custom.docLink')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleAddCustomParam}>
                    <Plus className="h-4 w-4 mr-1" /> {t('advanced.custom.add')}
                  </Button>
                </div>
                {customParams.map((param, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder={t('advanced.custom.keyPlaceholder')}
                      value={param.key}
                      onChange={e => handleCustomParamChange(index, 'key', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder={t('advanced.custom.valuePlaceholder')}
                      value={param.value}
                      onChange={e => handleCustomParamChange(index, 'value', e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveCustomParam(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <LabelWithTooltip htmlFor="include" label={t('includeLabel')} tooltip={t('includeTooltip')} />
                  <Input id="include" value={include} onChange={e => setInclude(e.target.value)} placeholder="e.g. (HK|SG)" />
                </div>
                <div className="space-y-2">
                  <LabelWithTooltip htmlFor="exclude" label={t('excludeLabel')} tooltip={t('excludeTooltip')} />
                  <Input id="exclude" value={exclude} onChange={e => setExclude(e.target.value)} placeholder="e.g. (Expire|Traffic)" />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Button onClick={handleGenerate} disabled={loading || selectedSubs.length === 0} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t('generateButton')}
          </Button>

          {lastConfig && (
            <div className="mt-4 p-4 bg-muted rounded-lg border">
              <h4 className="font-medium mb-2">{t('generatedLinkTitle')}</h4>
              <div className="flex gap-2">
                <Input readOnly value={getPublicLink(lastConfig)} />
                <Button size="icon" variant="outline" onClick={() => copyToClipboard(getPublicLink(lastConfig))}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={() => window.open(getPublicLink(lastConfig), '_blank')}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('generatedLinkHint')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
