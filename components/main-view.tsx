'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubscriptionList } from './subscription-list';
import { Converter } from './converter';
import { GeneratedList } from './generated-list';
import { Settings } from './settings';
import { useTranslations } from 'next-intl';
import {
  getSubscriptions,
  getGeneratedConfigs,
  getBackendUrls,
  getRemoteConfigs,
  Subscription,
  GeneratedConfig,
  BackendUrl,
  RemoteConfig
} from '@/app/actions';

interface MainViewProps {
  initialSubscriptions: Subscription[];
  initialConfigs: GeneratedConfig[];
  initialBackends: BackendUrl[];
  initialRemoteConfigs: RemoteConfig[];
}

export function MainView({
  initialSubscriptions,
  initialConfigs,
  initialBackends,
  initialRemoteConfigs
}: MainViewProps) {
  const t = useTranslations('Main');

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions);
  const [configs, setConfigs] = useState<GeneratedConfig[]>(initialConfigs);
  const [backends, setBackends] = useState<BackendUrl[]>(initialBackends);
  const [remoteConfigs, setRemoteConfigs] = useState<RemoteConfig[]>(initialRemoteConfigs);
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [subs, confs, backs, remotes] = await Promise.all([
        getSubscriptions(),
        getGeneratedConfigs(),
        getBackendUrls(),
        getRemoteConfigs()
      ]);
      setSubscriptions(subs);
      setConfigs(confs);
      setBackends(backs);
      setRemoteConfigs(remotes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <Tabs defaultValue="convert" className="space-y-4">
        <TabsList>
          <TabsTrigger value="convert">{t('tabs.convert')}</TabsTrigger>
          <TabsTrigger value="subscriptions">{t('tabs.subscriptions')}</TabsTrigger>
          <TabsTrigger value="history">{t('tabs.history')}</TabsTrigger>
          <TabsTrigger value="settings">{t('tabs.settings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="convert" className="space-y-4">
          <Converter
            subscriptions={subscriptions}
            backends={backends}
            remoteConfigs={remoteConfigs}
            onConfigGenerated={refreshData}
          />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <SubscriptionList subscriptions={subscriptions} onUpdate={refreshData} isLoading={loading} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <GeneratedList configs={configs} onUpdate={refreshData} isLoading={loading} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Settings
            backends={backends}
            remoteConfigs={remoteConfigs}
            onUpdate={refreshData}
            isLoading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
