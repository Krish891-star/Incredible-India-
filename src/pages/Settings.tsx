import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Settings as SettingsIcon, Bell, Globe, Shield, Trash2 } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [language, setLanguage] = useState('en');
  const [signingOut, setSigningOut] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const handleSavePreferences = () => {
    toast.success('Preferences saved successfully!');
  };

  return (
    <>
      <Helmet>
        <title>Settings | Incredible India</title>
        <meta name="description" content="Manage your account settings, preferences, and privacy options." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero */}
        <section className="relative pt-32 pb-16 bg-gradient-to-br from-primary via-primary/90 to-accent">
          <div className="container mx-auto px-4 text-center">
            <SettingsIcon className="h-12 w-12 text-primary-foreground mx-auto mb-4" />
            <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              Settings
            </h1>
            <p className="text-xl text-primary-foreground/90">
              Manage your account and preferences
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto space-y-8">
              {/* Notifications */}
              <Card className="border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    Manage how you receive updates and notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about new destinations and deals
                      </p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={notificationsEnabled}
                      onCheckedChange={setNotificationsEnabled}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-updates">Email Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Weekly newsletter with travel tips and recommendations
                      </p>
                    </div>
                    <Switch
                      id="email-updates"
                      checked={emailUpdates}
                      onCheckedChange={setEmailUpdates}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Language & Region */}
              <Card className="border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Language & Region
                  </CardTitle>
                  <CardDescription>
                    Set your preferred language and regional settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Preferred Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                        <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                        <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                        <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                        <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                        <SelectItem value="gu">ગુજરાતી (Gujarati)</SelectItem>
                        <SelectItem value="kn">ಕನ್ನಡ (Kannada)</SelectItem>
                        <SelectItem value="ml">മലയാളം (Malayalam)</SelectItem>
                        <SelectItem value="pa">ਪੰਜਾਬੀ (Punjabi)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Privacy & Security */}
              <Card className="border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Privacy & Security
                  </CardTitle>
                  <CardDescription>
                    Manage your account security and privacy settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Email Address</Label>
                    <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                  </div>
                  <Separator />
                  <div>
                    <Label>Account Created</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full">
                    Change Password
                  </Button>
                </CardContent>
              </Card>

              {/* Save Button */}
              <Button
                variant="saffron"
                size="lg"
                className="w-full"
                onClick={handleSavePreferences}
              >
                Save Preferences
              </Button>

              {/* Danger Zone */}
              <Card className="border-destructive/20 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible actions for your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSignOut}
                    disabled={signingOut}
                  >
                    {signingOut ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Sign Out
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => toast.error('Please contact support to delete your account')}
                  >
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}