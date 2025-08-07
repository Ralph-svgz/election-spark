import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/useRealtime';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Eye } from 'lucide-react';

interface UserPresenceProps {
  electionId: string;
  showViewers?: boolean;
}

export const UserPresence = ({ electionId, showViewers = true }: UserPresenceProps) => {
  const { user, profile } = useAuth();
  
  const userInfo = user && profile ? {
    user_id: user.id,
    display_name: user.email?.split('@')[0] || 'Anonymous',
    role: profile.role,
    timestamp: new Date().toISOString()
  } : null;

  const { onlineUsers } = usePresence(`election-${electionId}`, userInfo);

  if (!showViewers || !userInfo) return null;

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const roleColors = {
    admin: 'bg-red-500',
    voter: 'bg-blue-500'
  };

  return (
    <Card className="border-muted/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4" />
          Active Viewers
          <Badge variant="secondary" className="ml-auto">
            {onlineUsers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {onlineUsers.length === 0 ? (
          <div className="text-center py-4">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No active viewers</p>
          </div>
        ) : (
          <div className="space-y-2">
            {onlineUsers.slice(0, 10).map((user: any, index: number) => (
              <div key={`${user.user_id}-${index}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={`text-white text-xs ${roleColors[user.role as keyof typeof roleColors] || 'bg-gray-500'}`}>
                      {getInitials(user.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {user.display_name}
                      {user.user_id === userInfo?.user_id && (
                        <span className="text-muted-foreground ml-1">(You)</span>
                      )}
                    </span>
                    <Badge 
                      variant={user.role === 'admin' ? 'destructive' : 'secondary'} 
                      className="text-xs"
                    >
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            
            {onlineUsers.length > 10 && (
              <div className="text-center pt-2">
                <Badge variant="outline" className="text-xs">
                  +{onlineUsers.length - 10} more viewers
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};