import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  LogIn, 
  LogOut, 
  Key, 
  Mail, 
  Smartphone, 
  AlertTriangle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  event_type: string;
  event_description: string;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Json | null;
}

const eventConfig: Record<string, { icon: React.ElementType; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  login: { icon: LogIn, variant: 'default' },
  logout: { icon: LogOut, variant: 'secondary' },
  password_change: { icon: Key, variant: 'default' },
  password_reset_request: { icon: Key, variant: 'outline' },
  email_change: { icon: Mail, variant: 'default' },
  '2fa_enabled': { icon: Smartphone, variant: 'default' },
  '2fa_disabled': { icon: Smartphone, variant: 'destructive' },
  backup_codes_regenerated: { icon: RefreshCw, variant: 'outline' },
  backup_code_used: { icon: Shield, variant: 'outline' },
  login_failed: { icon: AlertTriangle, variant: 'destructive' },
};

const eventLabels: Record<string, string> = {
  login: 'Anmeldung',
  logout: 'Abmeldung',
  password_change: 'Passwort geändert',
  password_reset_request: 'Passwort-Reset angefordert',
  email_change: 'E-Mail geändert',
  '2fa_enabled': '2FA aktiviert',
  '2fa_disabled': '2FA deaktiviert',
  backup_codes_regenerated: 'Backup-Codes erneuert',
  backup_code_used: 'Backup-Code verwendet',
  login_failed: 'Fehlgeschlagene Anmeldung',
};

export const ActivityLog = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('account_activity')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching activities:', error);
          return;
        }

        setActivities(data || []);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [user]);

  const getEventIcon = (eventType: string) => {
    const config = eventConfig[eventType] || { icon: Shield, variant: 'secondary' as const };
    const Icon = config.icon;
    return <Icon className="h-4 w-4" />;
  };

  const getEventBadgeVariant = (eventType: string) => {
    return eventConfig[eventType]?.variant || 'secondary';
  };

  const getEventLabel = (eventType: string) => {
    return eventLabels[eventType] || eventType;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Kontoaktivität
          </CardTitle>
          <CardDescription>
            Ihre letzten Sicherheitsereignisse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Kontoaktivität
        </CardTitle>
        <CardDescription>
          Ihre letzten Sicherheitsereignisse
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Noch keine Aktivitäten aufgezeichnet.
          </p>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    {getEventIcon(activity.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getEventBadgeVariant(activity.event_type)}>
                        {getEventLabel(activity.event_type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.event_description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.created_at), { 
                        addSuffix: true, 
                        locale: de 
                      })} • {format(new Date(activity.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
