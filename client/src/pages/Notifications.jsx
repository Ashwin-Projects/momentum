import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  markNotificationRead,
  deleteNotification,
} from "../api/notifications";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PageWrapper from "../components/common/PageWrapper";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Bell, Check, Trash2 } from "lucide-react";
import { formatDate } from "../lib/utils";

const typeStyles = {
  reminder: "text-amber-400 bg-amber-500/10",
  alert: "text-red-400 bg-red-500/10",
  info: "text-sky-400 bg-sky-500/10",
};

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  });

  if (isLoading) return <LoadingSpinner />;

  const notifications = data?.data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Notifications</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </p>
          </div>
        </div>

        {notifications.length === 0 ? (
          <Card className="border-2 border-dashed border-white/[0.06] bg-[#141414]">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Bell className="mb-4 h-8 w-8 text-zinc-600" />
              <p className="text-lg text-zinc-400">No notifications yet</p>
              <p className="mt-1 text-sm text-zinc-500">
                Reminders and alerts from Momentum will show up here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`border-white/[0.04] bg-[#141414] ${
                  !notification.isRead ? "border-amber-500/20" : ""
                }`}
              >
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${
                          typeStyles[notification.type] || typeStyles.info
                        }`}
                      >
                        {notification.type}
                      </span>
                      {!notification.isRead && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      )}
                    </div>
                    <p className="font-medium text-zinc-200">{notification.title}</p>
                    <p className="mt-1 text-sm text-zinc-500">{notification.message}</p>
                    <p className="mt-2 text-xs text-zinc-600">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markReadMutation.mutate(notification.id)}
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(notification.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-zinc-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
