import { MainView } from '@/components/main-view';
import { getBackendUrls, getGeneratedConfigs, getRemoteConfigs, getSubscriptions } from '@/app/actions';

export default async function Home() {
  const [subscriptions, configs, backends, remoteConfigs] = await Promise.all([
    getSubscriptions(),
    getGeneratedConfigs(),
    getBackendUrls(),
    getRemoteConfigs()
  ]);

  return (
    <MainView
      initialSubscriptions={subscriptions}
      initialConfigs={configs}
      initialBackends={backends}
      initialRemoteConfigs={remoteConfigs}
    />
  );
}
