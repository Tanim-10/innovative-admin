import React, { useState, useEffect, useMemo } from 'react';
import { adminApi, InternshipApplication } from '@/services/adminApi';
import { useToast } from '@/hooks/use-toast';
import { 
  Briefcase, Search, AlertCircle, Mail, Phone, Calendar, 
  ExternalLink, FileText, Globe, Check, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Modal from '@/components/admin/Modal';
import Table from '@/components/admin/Table';
import Pagination from '@/components/admin/Pagination';

const Internships: React.FC = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<InternshipApplication['status']>('pending');
  const [selectedApp, setSelectedApp] = useState<InternshipApplication | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.internships.getAll();
      setApplications(data);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error loading applications',
        description: err.message || 'Could not fetch internship applications.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleUpdateStatus = async (id: string, status: InternshipApplication['status']) => {
    setIsUpdatingId(id);
    try {
      await adminApi.internships.updateStatus(id, status);
      toast({
        title: 'Status Updated',
        description: `Application status has been changed to "${status}".`
      });
      
      // Update local state if modal is open
      if (selectedApp && selectedApp.id === id) {
        setSelectedApp(prev => prev ? { ...prev, status } : null);
      }
      
      await fetchApplications();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Action Failed',
        description: err.message || 'Could not update status.',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingId(null);
    }
  };

  // Filter applications based on search and tab status
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchesStatus = app.status === activeTab;
      const matchesSearch = 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.mobile.includes(searchQuery) ||
        app.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
        app.coverLetter.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [applications, searchQuery, activeTab]);

  const totalPages = Math.ceil(filteredApps.length / pageSize);
  const paginatedApps = filteredApps.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to page 1 when search or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const handleViewApp = (app: InternshipApplication) => {
    setSelectedApp(app);
    setIsViewModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadgeVariant = (status: InternshipApplication['status']) => {
    switch (status) {
      case 'shortlisted': return 'default'; // Success / Primary
      case 'rejected': return 'destructive';
      case 'under-review': return 'secondary';
      default: return 'outline';
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Applicant',
      render: (app: InternshipApplication) => (
        <div>
          <p className="font-semibold text-foreground">{app.name}</p>
          <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {app.email}
          </span>
        </div>
      ),
    },
    {
      key: 'mobile',
      header: 'Mobile',
      render: (app: InternshipApplication) => (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Phone className="w-3 h-3" />
          {app.mobile}
        </span>
      ),
    },
    {
      key: 'skills',
      header: 'Key Skills',
      render: (app: InternshipApplication) => (
        <div className="flex flex-wrap gap-1 max-w-[220px]">
          {app.skills.slice(0, 3).map((skill, idx) => (
            <Badge key={idx} variant="outline" className="text-[9px] px-1 py-0 bg-background/40">
              {skill}
            </Badge>
          ))}
          {app.skills.length > 3 && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground">
              +{app.skills.length - 3} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Applied Date',
      render: (app: InternshipApplication) => (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(app.createdAt)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (app: InternshipApplication) => (
        <Badge variant={getStatusBadgeVariant(app.status)} className="text-[10px] uppercase font-bold tracking-wider capitalize">
          {app.status.replace('-', ' ')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (app: InternshipApplication) => (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-muted"
          onClick={() => handleViewApp(app)}
          title="View Details"
        >
          <Eye className="w-4 h-4 text-primary" />
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-primary" />
            Internship Applications
          </h1>
          <p className="text-sm text-muted-foreground">
            Review applicant skills, resumes, cover letters and manage hiring/screening statuses.
          </p>
        </div>
      </div>

      {/* Tabs list & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border">
        {/* Tabs */}
        <div className="flex bg-[#111827] p-1 rounded-lg border border-border/80 max-w-fit overflow-x-auto">
          {(['pending', 'under-review', 'shortlisted', 'rejected'] as const).map((tab) => {
            const count = applications.filter(app => app.status === tab).length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-semibold rounded-md capitalize transition-all flex items-center gap-2 shrink-0 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                }`}
              >
                {tab.replace('-', ' ')}
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
            placeholder="Search by name, skills, cover..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/50 border-border"
          />
        </div>
      </div>

      {/* Applications Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : paginatedApps.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl max-w-md mx-auto">
          <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No applications found</h3>
          <p className="text-sm text-muted-foreground">No applications match the status filter or search query.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table
              columns={columns}
              data={paginatedApps}
              keyExtractor={(app) => app.id}
              emptyMessage="No applications found"
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-2">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}

      {/* View Application Details Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Internship Application Details"
        size="lg"
      >
        {selectedApp && (
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">{selectedApp.name}</h3>
                <div className="flex flex-col gap-1.5 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {selectedApp.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    {selectedApp.mobile}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Applied on: {formatDate(selectedApp.createdAt)}
                  </span>
                </div>
              </div>
              <Badge variant={getStatusBadgeVariant(selectedApp.status)} className="text-[10px] uppercase font-bold tracking-wider self-start shrink-0">
                {selectedApp.status.replace('-', ' ')}
              </Badge>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Candidate Skills</h4>
              <div className="flex flex-wrap gap-2">
                {selectedApp.skills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs px-2.5 py-1 bg-background/50 border border-border">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Links / Attachments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/30 border border-border/60 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Candidate Resume</p>
                    <p className="text-[10px] text-muted-foreground">PDF Document</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-8 gap-1" asChild>
                  <a href={selectedApp.resumeUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" />
                    View
                  </a>
                </Button>
              </div>

              <div className="p-4 bg-muted/30 border border-border/60 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Portfolio/Projects</p>
                    <p className="text-[10px] text-muted-foreground">{selectedApp.portfolioUrl ? 'External Link' : 'Not provided'}</p>
                  </div>
                </div>
                {selectedApp.portfolioUrl ? (
                  <Button size="sm" variant="outline" className="h-8 gap-1" asChild>
                    <a href={selectedApp.portfolioUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </a>
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground italic mr-2">N/A</span>
                )}
              </div>
            </div>

            {/* Cover Letter */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cover Letter / Statement of Purpose</h4>
              <Card className="bg-muted/20 border-border/65">
                <CardContent className="p-4">
                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-line font-serif">
                    {selectedApp.coverLetter}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Workflow status update */}
            <div className="border-t border-border/40 pt-4 flex flex-col gap-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Update Screening Status</span>
              <div className="flex flex-wrap gap-2">
                {(['pending', 'under-review', 'shortlisted', 'rejected'] as const).map((status) => {
                  const isActive = selectedApp.status === status;
                  return (
                    <Button
                      key={status}
                      size="sm"
                      variant={isActive ? 'default' : 'outline'}
                      className="text-xs capitalize font-semibold"
                      disabled={isUpdatingId === selectedApp.id}
                      onClick={() => handleUpdateStatus(selectedApp.id, status)}
                    >
                      {status === selectedApp.status && <Check className="w-3.5 h-3.5 mr-1" />}
                      {status.replace('-', ' ')}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Internships;
