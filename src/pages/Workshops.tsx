import React, { useState, useEffect } from 'react';
import { adminApi, Workshop } from '@/services/adminApi';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, Check, X, Search, Clock, Mail, ExternalLink, AlertCircle, Users, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const Workshops: React.FC = () => {
  const { toast } = useToast();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

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
            Review and approve live workshop hosting proposals submitted by instructors.
          </p>
        </div>
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
              <CardHeader className="pb-4">
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
                  <div className="flex items-start gap-2 pt-1 border-t border-border/20 mt-1">
                    <Mail className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-foreground font-semibold">{workshop.hostName}</span>
                      <span className="text-[10px] text-muted-foreground">{workshop.hostEmail}</span>
                    </div>
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
    </div>
  );
};

export default Workshops;
