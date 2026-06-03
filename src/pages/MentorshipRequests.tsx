import React, { useState, useEffect } from 'react';
import { 
  Search, Edit2, Loader2, Calendar, Clock, Video, 
  CheckCircle2, XCircle, AlertCircle, HelpCircle, User, 
  ExternalLink, FileText, ChevronRight 
} from 'lucide-react';
import { adminApi, MentorshipRequest, Tutor } from '@/services/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

const MentorshipRequests = () => {
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MentorshipRequest | null>(null);

  // Form State
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'completed'>('pending');
  const [assignedTutorId, setAssignedTutorId] = useState<string>('');
  const [meetingLink, setMeetingLink] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch Requests and Tutors
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reqData, tutorData] = await Promise.all([
        adminApi.mentorships.getAll(),
        adminApi.tutors.getAll()
      ]);
      setRequests(reqData);
      // Filter only approved tutors for assignment
      setTutors(tutorData.filter(t => t.tutorStatus === 'approved'));
    } catch (err) {
      toast({
        title: 'Error loading data',
        description: err instanceof Error ? err.message : 'Could not retrieve database entries.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenReview = (request: MentorshipRequest) => {
    setSelectedRequest(request);
    setStatus(request.status);
    setAssignedTutorId(
      request.tutorId && typeof request.tutorId === 'object' 
        ? request.tutorId.id 
        : (request.tutorId as string) || ''
    );
    setMeetingLink(request.meetingLink || '');
    setAdminNotes(request.adminNotes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setIsUpdating(true);
    try {
      await adminApi.mentorships.update(selectedRequest.id, {
        status,
        tutorId: assignedTutorId || null,
        meetingLink: meetingLink.trim(),
        adminNotes: adminNotes.trim()
      });

      toast({ title: 'Mentorship request updated successfully' });
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Operation failed.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredRequests = requests.filter(r => {
    const studentName = typeof r.userId === 'object' ? r.userId.name : '';
    const studentEmail = typeof r.userId === 'object' ? r.userId.email : '';
    
    const matchesSearch = 
      r.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mentorship & Consultancy Requests</h1>
        <p className="text-sm text-muted-foreground">
          Review user-submitted 1-on-1 consultancy requests, assign certified mentors, and manage scheduled video call URLs.
        </p>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 max-w-sm w-full bg-card border rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input 
            type="text" 
            placeholder="Search by topic, student..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm h-7"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-card border px-3 py-1.5 rounded-lg">
          <span className="text-xs text-muted-foreground font-semibold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-transparent border-0 focus:ring-0 text-foreground font-medium cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Loading request registry...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-60" />
            <h3 className="font-semibold text-sm">No Requests Found</h3>
            <p className="text-xs text-muted-foreground">There are no mentorship requests matching the current filters.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Preferred Schedule</TableHead>
                <TableHead>Assigned Mentor</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((req) => {
                const student = typeof req.userId === 'object' ? req.userId : { name: 'Unknown', email: 'N/A' };
                const tutor = typeof req.tutorId === 'object' ? req.tutorId : null;
                
                return (
                  <TableRow key={req.id} className="hover:bg-muted/10">
                    <TableCell className="align-middle">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">{student.name}</span>
                        <span className="text-[11px] text-muted-foreground">{student.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="align-middle">
                      <div className="flex flex-col max-w-[280px]">
                        <span className="font-bold text-sm text-foreground truncate">{req.topic}</span>
                        <span className="text-[11px] text-muted-foreground line-clamp-1">{req.description}</span>
                      </div>
                    </TableCell>
                    <TableCell className="align-middle">
                      <div className="flex flex-col text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          {formatDate(req.preferredDate)}
                        </span>
                        <span className="flex items-center gap-1 mt-1">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          {req.preferredTime}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="align-middle">
                      {tutor ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-secondary/50">
                            {tutor.name}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Not Assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="align-middle text-center">
                      <Badge className={`text-[10px] py-0.5 px-2.5 uppercase font-bold tracking-wider border-none text-white ${
                        req.status === 'approved' ? 'bg-green-600' :
                        req.status === 'completed' ? 'bg-gray-500' :
                        req.status === 'rejected' ? 'bg-red-600' :
                        'bg-amber-600'
                      }`}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-middle text-right">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1 shadow-sm text-xs font-bold"
                        onClick={() => handleOpenReview(req)}
                      >
                        Review
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Live Consultation Request</DialogTitle>
            <DialogDescription>
              Verify topic requirements, assign an approved mentor, and schedule meet link credentials.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <form onSubmit={handleSave} className="space-y-4 pt-2">
              
              {/* Student info card */}
              <div className="bg-secondary/20 border rounded-xl p-4 space-y-2 text-xs">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary" />
                  Student Contact Details
                </p>
                <div className="grid grid-cols-2 gap-2 mt-1.5 text-muted-foreground">
                  <p>Name: <span className="font-semibold text-foreground">
                    {typeof selectedRequest.userId === 'object' ? selectedRequest.userId.name : 'N/A'}
                  </span></p>
                  <p>Email: <span className="font-semibold text-foreground">
                    {typeof selectedRequest.userId === 'object' ? selectedRequest.userId.email : 'N/A'}
                  </span></p>
                  <p>Phone: <span className="font-semibold text-foreground">
                    {typeof selectedRequest.userId === 'object' && selectedRequest.userId.mobile ? selectedRequest.userId.mobile : 'N/A'}
                  </span></p>
                  <p>Requested: <span className="font-semibold text-foreground">
                    {formatDate(selectedRequest.createdAt)}
                  </span></p>
                </div>
              </div>

              {/* Topic & Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  CONSULTATION TOPIC
                </label>
                <p className="text-sm font-bold text-foreground bg-muted/20 p-2.5 rounded-lg border">
                  {selectedRequest.topic}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground">STUDENT REQUIREMENTS DESCRIPTION</label>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/10 p-3 rounded-lg border max-h-40 overflow-y-auto">
                  {selectedRequest.description}
                </p>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-4 bg-muted/20 border p-3 rounded-xl">
                <div className="space-y-0.5 text-xs">
                  <span className="text-muted-foreground block">Preferred Date:</span>
                  <span className="font-bold text-foreground">{formatDate(selectedRequest.preferredDate)}</span>
                </div>
                <div className="space-y-0.5 text-xs">
                  <span className="text-muted-foreground block">Preferred Slot:</span>
                  <span className="font-bold text-foreground">{selectedRequest.preferredTime}</span>
                </div>
              </div>

              {/* Status & Tutor assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">REQUEST STATUS</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="flex h-10 w-full rounded-md border border-input bg-[#161c28] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="approved">Approved & Scheduled</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed Session</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">ASSIGN CERTIFIED TUTOR</label>
                  <select
                    value={assignedTutorId}
                    onChange={(e) => setAssignedTutorId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-[#161c28] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">-- Select Mentor --</option>
                    {tutors.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.expertise?.slice(0,2).join(', ')})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Meet link */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-primary" />
                  MEETING URL (Google Meet, Zoom, MS Teams)
                </label>
                <Input 
                  type="text" 
                  value={meetingLink} 
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx" 
                />
              </div>

              {/* Admin notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">COORDINATION NOTES (shared with student)</label>
                <Textarea 
                  value={adminNotes} 
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Write session timing clarifications or instructions for the student here."
                  rows={3}
                />
              </div>

              <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Saving updates...' : 'Save Changes'}
                </Button>
              </DialogFooter>

            </form>
          )}

        </DialogContent>
      </Dialog>

    </div>
  );
};

export default MentorshipRequests;
