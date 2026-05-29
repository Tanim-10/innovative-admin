import React, { useState, useEffect } from 'react';
import { adminApi, Workshop } from '@/services/adminApi';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, Check, X, Search, Clock, Mail, ExternalLink, AlertCircle, Users, BookOpen, Plus, Linkedin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const Workshops: React.FC = () => {
  const { toast } = useToast();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    hostName: '',
    hostLinkedIn: '',
    thumbnail: '',
    date: '',
    time: '',
    duration: '',
    meetingLink: ''
  });

  const fetchWorkshops = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.workshops.getAll();
      setWorkshops(data);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error loading workshops',
        description: err.message || 'Could not fetch the workshops list.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setIsUpdatingId(id);
    try {
      await adminApi.workshops.updateStatus(id, status);
      toast({
        title: `Workshop ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        description: `Workshop status has been updated to ${status}.`
      });
      await fetchWorkshops();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Action Failed',
        description: err.message || 'Could not update workshop status.',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleUploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingThumbnail(true);
    try {
      const url = await adminApi.products.uploadImage(file);
      if (url) {
        setForm(prev => ({ ...prev, thumbnail: url }));
        toast({
          title: 'Thumbnail Uploaded',
          description: 'Workshop thumbnail image uploaded successfully.'
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Upload Failed',
        description: err.message || 'Could not upload thumbnail.',
        variant: 'destructive'
      });
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.date || !form.time || !form.duration || !form.meetingLink || !form.hostName) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi.workshops.create(form);
      toast({
        title: 'Success!',
        description: 'Workshop created successfully.',
      });
      setIsCreateOpen(false);
      setForm({
        title: '',
        description: '',
        hostName: '',
        hostLinkedIn: '',
        thumbnail: '',
        date: '',
        time: '',
        duration: '',
        meetingLink: ''
      });
      await fetchWorkshops();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Creation Failed',
        description: err.message || 'Could not create workshop.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter workshops based on search and tab status
  const filteredWorkshops = workshops.filter((w) => {
    const matchesStatus = w.status === activeTab;
    const matchesSearch = 
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.hostEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary" />
            Robotics Live Workshops
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage live workshops. Create and schedule new live sessions.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="md:self-end font-semibold gap-2">
          <Plus className="w-4 h-4" />
          Create Workshop
        </Button>
      </div>

      {/* Tabs list & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
        {/* Tabs */}
        <div className="flex bg-[#111827] p-1 rounded-lg border border-border/80 max-w-fit">
          {(['pending', 'approved', 'rejected'] as const).map((tab) => {
            const count = workshops.filter(w => w.status === tab).length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-semibold rounded-md capitalize transition-all flex items-center gap-2 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                }`}
              >
                {tab}
                <Badge variant={isActive ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0.5">
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, host, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50 border-border"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filteredWorkshops.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl max-w-md mx-auto">
          <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No workshops found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkshops.map((workshop) => (
            <Card key={workshop.id} className="bg-card border-border hover:border-primary/50 transition-all flex flex-col justify-between overflow-hidden shadow-sm">
              {workshop.thumbnail ? (
                <div className="w-full h-40 overflow-hidden relative">
                  <img src={workshop.thumbnail} className="w-full h-full object-cover" alt={workshop.title} />
                </div>
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-[#1e293b] to-[#0f172a] flex items-center justify-center text-muted-foreground relative">
                  <Calendar className="w-8 h-8 opacity-40 text-primary" />
                </div>
              )}
              <CardHeader className="pb-4 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[10px] uppercase font-bold tracking-wider">
                      {workshop.duration}
                    </Badge>
                    <h3 className="text-base font-bold text-foreground line-clamp-2 min-h-[3rem] mt-1.5">{workshop.title}</h3>
                  </div>
                  <Badge variant={workshop.status === 'approved' ? 'default' : workshop.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px] uppercase font-bold tracking-wider shrink-0">
                    {workshop.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="py-0 flex-1 space-y-4">
                {/* Description */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</span>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {workshop.description}
                  </p>
                </div>

                {/* Timing & Host */}
                <div className="space-y-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{formatDate(workshop.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{workshop.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span>Enrolled: <span className="font-semibold text-foreground">{workshop.enrolledStudentsCount} students</span></span>
                  </div>
                  <div className="flex items-start justify-between gap-2 pt-1 border-t border-border/20 mt-1">
                    <div className="flex items-start gap-2">
                      <Mail className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-foreground font-semibold">{workshop.hostName}</span>
                        {workshop.hostEmail && <span className="text-[10px] text-muted-foreground">{workshop.hostEmail}</span>}
                      </div>
                    </div>
                    {workshop.hostLinkedIn && (
                      <a 
                        href={workshop.hostLinkedIn} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:text-foreground transition-colors p-1"
                        title="LinkedIn Profile"
                      >
                        <Linkedin className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Meeting Link */}
                <div className="bg-muted/50 p-2.5 rounded-lg border border-border/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate font-mono">{workshop.meetingLink}</span>
                  </div>
                  <a
                    href={workshop.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-foreground p-1 hover:bg-primary/20 rounded transition-colors shrink-0"
                    title="Open Virtual Room Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </CardContent>

              {/* Status Update Actions */}
              <div className="p-4 mt-6 border-t border-border/60 bg-[#161c28]/45 flex items-center justify-end gap-2.5">
                {workshop.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive hover:bg-destructive/10 text-destructive text-xs gap-1 font-semibold"
                      disabled={isUpdatingId === workshop.id}
                      onClick={() => handleUpdateStatus(workshop.id, 'rejected')}
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs gap-1 font-semibold"
                      disabled={isUpdatingId === workshop.id}
                      onClick={() => handleUpdateStatus(workshop.id, 'approved')}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </Button>
                  </>
                )}

                {workshop.status === 'approved' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive hover:bg-destructive/10 text-destructive text-xs gap-1 font-semibold"
                    disabled={isUpdatingId === workshop.id}
                    onClick={() => handleUpdateStatus(workshop.id, 'rejected')}
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject/Revoke
                  </Button>
                )}

                {workshop.status === 'rejected' && (
                  <Button
                    size="sm"
                    className="text-xs gap-1 font-semibold"
                    disabled={isUpdatingId === workshop.id}
                    onClick={() => handleUpdateStatus(workshop.id, 'approved')}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve Workshop
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Workshop Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[550px] bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Create New Workshop</DialogTitle>
            <DialogDescription>
              Fill in the details to schedule and launch a new live robotics workshop.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Introduction to PCB Designing"
                className="bg-background/50 border-border text-foreground"
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea
                id="description"
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What will students learn in this workshop?"
                className="bg-background/50 border-border min-h-[100px] text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="date" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="bg-background/50 border-border text-foreground"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="time" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Time</Label>
                <Input
                  id="time"
                  type="text"
                  required
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  placeholder="e.g. 5:00 PM"
                  className="bg-background/50 border-border text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="duration" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Duration</Label>
                <Input
                  id="duration"
                  required
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="e.g. 2 Hours"
                  className="bg-background/50 border-border text-foreground"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hostName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tutor Name</Label>
                <Input
                  id="hostName"
                  required
                  value={form.hostName}
                  onChange={(e) => setForm({ ...form, hostName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="bg-background/50 border-border text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="hostLinkedIn" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">LinkedIn URL (Optional)</Label>
                <Input
                  id="hostLinkedIn"
                  type="url"
                  value={form.hostLinkedIn}
                  onChange={(e) => setForm({ ...form, hostLinkedIn: e.target.value })}
                  placeholder="e.g. https://linkedin.com/in/username"
                  className="bg-background/50 border-border text-foreground"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="thumbnail" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Workshop Thumbnail (Optional)</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    id="thumbnail-file"
                    type="file"
                    accept="image/*"
                    onChange={handleUploadThumbnail}
                    disabled={isUploadingThumbnail}
                    className="bg-background/50 border-border text-foreground cursor-pointer text-xs"
                  />
                  {isUploadingThumbnail && (
                    <span className="text-[10px] text-primary animate-pulse">Uploading image to Cloudinary...</span>
                  )}
                  {form.thumbnail && (
                    <div className="flex items-center gap-2 border border-border bg-background/30 p-1.5 rounded-lg">
                      <img src={form.thumbnail} alt="Thumbnail Preview" className="w-10 h-10 object-cover rounded" />
                      <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{form.thumbnail}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setForm({ ...form, thumbnail: '' })}
                        className="text-destructive hover:bg-destructive/10 text-[10px] h-6 px-1.5 ml-auto"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="meetingLink" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meeting Link</Label>
              <Input
                id="meetingLink"
                type="url"
                required
                value={form.meetingLink}
                onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                placeholder="e.g. https://meet.google.com/abc-defg-hij"
                className="bg-background/50 border-border font-mono text-xs text-foreground"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
                className="border-border hover:bg-muted/10 font-semibold"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-semibold">
                {isSubmitting ? 'Creating...' : 'Create Workshop'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Workshops;
