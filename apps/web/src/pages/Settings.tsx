import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ChevronRight, CreditCard, Moon, Sun, User, UserCog, Laptop, MonitorSmartphone, Bell, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteAccount } from "@/lib/auth";
import { userService } from "@/features/auth/services/userService";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [profileForm, setProfileForm] = useState({
    name: user?.user_metadata?.full_name || user?.user_metadata?.name || "",
    email: user?.email || "",
    bio: user?.user_metadata?.bio || ""
  });
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Update form data immediately when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        email: user.email || "",
        bio: user.user_metadata?.bio || ""
      });
    }
  }, [user]);

  // Refresh JWT in background - don't block UI
  useEffect(() => {
    let isMounted = true;
    
    // Only refresh if we have a user
    if (user?.id) {
      setIsRefreshing(true);
      
      // Perform background refresh without blocking UI
      userService.refreshUserSession()
        .then(() => {
          // Only update state if component is still mounted
          if (isMounted) setIsRefreshing(false);
        })
        .catch((err: Error) => {
          console.error('Error refreshing session:', err);
          if (isMounted) setIsRefreshing(false);
        });
    }
    
    return () => { isMounted = false; };
  }, [user?.id]); // Only depend on user ID to avoid unnecessary refreshes

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);
    
    try {
      const { error } = await userService.updateProfile(user.id, {
        fullName: profileForm.name,
        bio: profileForm.bio
      });
      
      if (error) {
        setError(error);
      } else {
        setSaveSuccess(true);
        // Reset after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving your profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE_ALL_DATA_FOREVER') {
      setError('Please type DELETE_ALL_DATA_FOREVER to confirm account deletion');
      return;
    }

    setIsDeleting(true);
    setError(null);
    
    try {
      const { error } = await deleteAccount();
      if (error) {
        // Check if it's the edge function error but database records were successfully deleted
        if (error.message.includes('edge function') || error.message.includes('Edge Function')) {
          console.warn('Auth user deletion failed, but database records were successfully removed');
          // Still consider this a success and sign out
          await signOut();
          navigate('/');
          return;
        }
        setError(error.message);
      } else {
        // Sign out and redirect to home page
        await signOut();
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting your account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update your personal information and how others see you on the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>{profileForm.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">Change Avatar</Button>
                </div>
                
                <div className="grid gap-4 flex-1">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={profileForm.name} 
                      onChange={handleProfileChange} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      value={profileForm.email} 
                      onChange={handleProfileChange} 
                      disabled 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Biography</Label>
                    <Input 
                      id="bio" 
                      name="bio" 
                      value={profileForm.bio} 
                      onChange={handleProfileChange} 
                      placeholder="Tell us a bit about yourself"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    "Saved!"
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how InnerFlame looks for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Theme Preference</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose between light and dark mode.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={cn(
                          "relative flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground transition-all",
                          theme === "light" ? "border-primary" : "border-muted"
                        )}
                      >
                        <div className="mb-3 rounded-full bg-orange-100 p-3 dark:bg-orange-900/20">
                          <Sun className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="mb-1 font-medium">Light</div>
                        <div className="text-xs text-muted-foreground">
                          Light mode interface
                        </div>
                        {theme === "light" && (
                          <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={cn(
                          "relative flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground transition-all",
                          theme === "dark" ? "border-primary" : "border-muted"
                        )}
                      >
                        <div className="mb-3 rounded-full bg-indigo-100 p-3 dark:bg-indigo-900/20">
                          <Moon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="mb-1 font-medium">Dark</div>
                        <div className="text-xs text-muted-foreground">
                          Dark mode interface
                        </div>
                        {theme === "dark" && (
                          <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("system")}
                        className={cn(
                          "relative flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground transition-all",
                          theme === "system" ? "border-primary" : "border-muted"
                        )}
                      >
                        <div className="mb-3 rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                          <MonitorSmartphone className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="mb-1 font-medium">System</div>
                        <div className="text-xs text-muted-foreground">
                          Follow system preference
                        </div>
                        {theme === "system" && (
                          <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage your notification preferences and communication settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Email Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Newsletter</p>
                    <p className="text-sm text-muted-foreground">Receive our weekly newsletter with founder tips and resources</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Updates & Promotions</p>
                    <p className="text-sm text-muted-foreground">Receive updates about new features and special offers</p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
              <CardDescription>
                Manage your subscription and payment information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Free Plan</h3>
                    <p className="text-sm text-muted-foreground">You are currently on the free plan</p>
                  </div>
                  <Button variant="outline">Upgrade</Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Payment Methods</h3>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="rounded-md bg-muted p-2">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">No payment methods</p>
                        <p className="text-sm text-muted-foreground">Add a payment method to upgrade your plan</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Billing History</h3>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-sm text-muted-foreground">No billing history available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Manage your account settings and security preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="pt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription className="pt-4">
                        This action cannot be undone. This will permanently delete your account and all associated data.
                        Please type <span className="font-mono font-bold">DELETE_ALL_DATA_FOREVER</span> to confirm.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Input
                        type="text"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder="Type DELETE_ALL_DATA_FOREVER to confirm"
                        className="font-mono"
                      />
                    </div>
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <DialogFooter>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirm !== 'DELETE_ALL_DATA_FOREVER' || isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting Account...
                          </>
                        ) : (
                          'Delete Account'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 