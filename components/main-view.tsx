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

  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [loadingBackends, setLoadingBackends] = useState(false);
  const [loadingRemoteConfigs, setLoadingRemoteConfigs] = useState(false);

  const refreshSubscriptions = async () => {
    setLoadingSubscriptions(true);
    try {
      const subs = await getSubscriptions();
      setSubscriptions(subs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const refreshConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const confs = await getGeneratedConfigs();
      setConfigs(confs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConfigs(false);
    }
  };

  const refreshBackends = async () => {
    setLoadingBackends(true);
    try {
      const backs = await getBackendUrls();
      setBackends(backs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBackends(false);
    }
  };

  const refreshRemoteConfigs = async () => {
    setLoadingRemoteConfigs(true);
    try {
      const remotes = await getRemoteConfigs();
      setRemoteConfigs(remotes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRemoteConfigs(false);
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
            onConfigGenerated={refreshConfigs}
          />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <SubscriptionList
            subscriptions={subscriptions}
            onUpdate={refreshSubscriptions}
            isLoading={loadingSubscriptions}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <GeneratedList configs={configs} onUpdate={refreshConfigs} isLoading={loadingConfigs} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Settings
            backends={backends}
            remoteConfigs={remoteConfigs}
            onBackendsUpdate={refreshBackends}
            onRemoteConfigsUpdate={refreshRemoteConfigs}
            loadingBackends={loadingBackends}
            loadingRemoteConfigs={loadingRemoteConfigs}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
