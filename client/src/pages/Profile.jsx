import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile, updatePassword } from "../api/profile";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PageWrapper from "../components/common/PageWrapper";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { formatDate } from "../lib/utils";
import { User, Lock, Mail } from "lucide-react";

export default function Profile() {
  const { user, login } = useAuth();
  const queryClient = useQueryClient();
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  const profileUser = data?.data?.user || user;

  useEffect(() => {
    if (profileUser) {
      setProfileForm({ name: profileUser.name, email: profileUser.email });
    }
  }, [profileUser?.id, profileUser?.name, profileUser?.email]);

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (res) => {
      if (res.success) {
        login(res.data.user);
        queryClient.invalidateQueries(["profile"]);
        setMessage("Profile updated successfully");
        setError("");
      }
    },
    onError: (err) => {
      setError(err.response?.data?.error || "Failed to update profile");
      setMessage("");
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: updatePassword,
    onSuccess: (res) => {
      if (res.success) {
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setMessage("Password updated successfully");
        setError("");
      }
    },
    onError: (err) => {
      setError(err.response?.data?.error || "Failed to update password");
      setMessage("");
    },
  });

  const handleProfileSubmit = (event) => {
    event.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      setMessage("");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setMessage("");
      return;
    }
    updatePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  if (isLoading && !profileUser) return <LoadingSpinner />;

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Profile</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your account settings</p>
        </div>

        {(message || error) && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              error
                ? "border-red-500/20 bg-red-500/10 text-red-400"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {error || message}
          </div>
        )}

        <Card className="border-white/[0.04] bg-[#141414]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <User className="h-4 w-4 text-zinc-500" />
              Account details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-9"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              {profileUser?.createdAt && (
                <p className="text-xs text-zinc-500">
                  Member since {formatDate(profileUser.createdAt)}
                </p>
              )}
              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-white/[0.04] bg-[#141414]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Lock className="h-4 w-4 text-zinc-500" />
              Change password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit" disabled={updatePasswordMutation.isPending}>
                {updatePasswordMutation.isPending ? "Updating..." : "Update password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
