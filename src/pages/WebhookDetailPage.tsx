import { useParams } from 'react-router-dom';
import { Header } from '@/components/layout';
import { WebhookDetail } from '@/components/webhooks';
import { ErrorMessage, PageLoader } from '@/components/common';
import { useWebhook } from '@/hooks';

export function WebhookDetailPage() {
  const { id } = useParams<{ id: string }>();
  
  const { data: webhook, isLoading, error, refetch } = useWebhook(id || '');

  if (isLoading) {
    return (
      <>
        <Header title="Webhook Details" />
        <div className="p-6">
          <PageLoader />
        </div>
      </>
    );
  }

  if (error || !webhook) {
    return (
      <>
        <Header title="Webhook Details" />
        <div className="p-6">
          <ErrorMessage
            message={error instanceof Error ? error.message : 'Webhook not found'}
            onRetry={() => refetch()}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Header 
        title="Webhook Details" 
        onRefresh={() => refetch()}
      />
      <div className="p-6">
        <WebhookDetail webhook={webhook} />
      </div>
    </>
  );
}
