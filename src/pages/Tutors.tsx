import React, { useState, useEffect } from 'react';
import { adminApi, Tutor } from '@/services/adminApi';
import { useToast } from '@/hooks/use-toast';
import { 
  GraduationCap, Check, X, Search, Clock, Mail, Phone, BookOpen, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const Tutors: React.FC = () => {
  const { toast } = useToast();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  const fetchTutors = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.tutors.getAll();
      setTutors(data);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error loading tutors',
        description: err.message || 'Could not fetch the tutors list.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTutors();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setIsUpdatingId(id);
    try {
      await adminApi.tutors.updateStatus(id, status);
      toast({
        title: `Tutor Application ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        description: `Tutor status has been updated to ${status}.`
      });
      // Refresh list
      await fetchTutors();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Action Failed',
        description: err.message || 'Could not update tutor status.',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Filter tutors based on search and tab status
  const filteredTutors = tutors.filter((t) => {
    const matchesStatus = t.tutorStatus === activeTab;
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.bio && t.bio.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.expertise && t.expertise.some(exp => exp.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-primary" />
            Robotics Academy Tutors
          </h1>
          <p className="text-sm text-muted-foreground">
            Approve applications, view expertise, and manage instructor status on the platform.
          </p>
        </div>
      </div>

      {/* Tabs list & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
        {/* Tabs */}
        <div className="flex bg-[#111827] p-1 rounded-lg border border-border/80 max-w-fit">
          {(['pending', 'approved', 'rejected'] as const).map((tab) => {
            const count = tutors.filter(t => t.tutorStatus === tab).length;
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
            placeholder="Search by name, expertise, bio..."
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
      ) : filteredTutors.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl max-w-md mx-auto">
          <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No tutors found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map((tutor) => (
            <Card key={tutor.id} className="bg-card border-border hover:border-primary/50 transition-all flex flex-col justify-between overflow-hidden shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-foreground line-clamp-1">{tutor.name}</h3>
                    <div className="flex flex-col gap-1 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground/75" />
                        {tutor.email}
                      </span>
                      {tutor.mobile && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground/75" />
                          {tutor.mobile}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant={tutor.tutorStatus === 'approved' ? 'default' : tutor.tutorStatus === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px] uppercase font-bold tracking-wider shrink-0">
                    {tutor.tutorStatus}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="py-0 flex-1 space-y-4">
                {/* Biography */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Biography</span>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {tutor.bio || 'No bio provided.'}
                  </p>
                </div>

                {/* Expertise tags */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Areas of Expertise</span>
                  {tutor.expertise && tutor.expertise.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {tutor.expertise.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px] bg-background/50 border-border/80 py-0.5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">None listed</span>
                  )}
                </div>

                {/* Date Applied */}
                {tutor.createdAt && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Applied on: {new Date(tutor.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                )}
              </CardContent>

              {/* Status Update Actions */}
              <div className="p-4 mt-6 border-t border-border/60 bg-[#161c28]/45 flex items-center justify-end gap-2.5">
                {tutor.tutorStatus === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive hover:bg-destructive/10 text-destructive text-xs gap-1 font-semibold"
                      disabled={isUpdatingId === tutor.id}
                      onClick={() => handleUpdateStatus(tutor.id, 'rejected')}
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs gap-1 font-semibold"
                      disabled={isUpdatingId === tutor.id}
                      onClick={() => handleUpdateStatus(tutor.id, 'approved')}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </Button>
                  </>
                )}

                {tutor.tutorStatus === 'approved' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive hover:bg-destructive/10 text-destructive text-xs gap-1 font-semibold"
                    disabled={isUpdatingId === tutor.id}
                    onClick={() => handleUpdateStatus(tutor.id, 'rejected')}
                  >
                    <X className="w-3.5 h-3.5" />
                    Revoke Status
                  </Button>
                )}

                {tutor.tutorStatus === 'rejected' && (
                  <Button
                    size="sm"
                    className="text-xs gap-1 font-semibold"
                    disabled={isUpdatingId === tutor.id}
                    onClick={() => handleUpdateStatus(tutor.id, 'approved')}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve Applicant
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

export default Tutors;
