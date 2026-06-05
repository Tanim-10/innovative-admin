import React, { useEffect, useState } from 'react';
import {
  FileText,
  Trash2,
  RefreshCw,
  Loader2,
  Eye,
  EyeOff,
  Search,
  MessageCircle,
  ThumbsUp,
  ExternalLink,
  ShieldAlert,
  MessageSquare,
  BookOpen,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { adminApi, Idea, IdeaComment } from '@/services/adminApi';

const CATEGORIES = ['All', 'Robotics', 'IoT', 'Electronics', 'Software', 'Other'];

const ResourcesHub: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'community' | 'structured'>('community');
  
  // Filtering & Search
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  // Comment Viewer Modal State
  const [selectedIdeaForComments, setSelectedIdeaForComments] = useState<Idea | null>(null);
  const [comments, setComments] = useState<IdeaComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Deletion States
  const [deleteIdeaId, setDeleteIdeaId] = useState<string | null>(null);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.ideas.getAll({
        type: activeTab,
        category: category === 'All' ? undefined : category,
        search: search.trim() || undefined,
        limit: 100 // fetch up to 100 for moderation list
      });
      if (res.success) {
        setIdeas(res.data);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, category, statusFilter]);

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      loadData();
    }
  };

  const handleToggleHideIdea = async (id: string) => {
    try {
      const res = await adminApi.ideas.toggleHide(id);
      if (res.success) {
        setIdeas((prev) =>
          prev.map((idea) => (idea._id === id ? { ...idea, isHidden: res.data.isHidden } : idea))
        );
        toast.success(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle visibility');
    }
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      await adminApi.ideas.delete(id);
      setIdeas((prev) => prev.filter((idea) => idea._id !== id));
      setDeleteIdeaId(null);
      toast.success('Post deleted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  const handleViewComments = async (idea: Idea) => {
    setSelectedIdeaForComments(idea);
    setLoadingComments(true);
    try {
      const res = await adminApi.ideas.getComments(idea._id);
      if (res.success) {
        setComments(res.data);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleHideComment = async (commentId: string) => {
    try {
      const res = await adminApi.ideas.toggleHideComment(commentId);
      if (res.success) {
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? { ...c, isHidden: res.data.isHidden } : c))
        );
        toast.success(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to toggle visibility');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await adminApi.ideas.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      
      // Decrement comment count on the local idea state
      if (selectedIdeaForComments) {
        setIdeas((prev) =>
          prev.map((idea) =>
            idea._id === selectedIdeaForComments._id
              ? { ...idea, commentsCount: Math.max(0, idea.commentsCount - 1) }
              : idea
          )
        );
      }
      setDeleteCommentId(null);
      toast.success('Comment deleted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  const getAuthorDisplay = (item: Idea | IdeaComment) => {
    if (item.adminId) {
      const adminObj = typeof item.adminId === 'object' ? item.adminId : null;
      return {
        name: adminObj?.email ? adminObj.email.split('@')[0] + ' (Admin)' : 'Admin',
        role: 'admin',
        isAdmin: true,
      };
    }
    const userObj = typeof item.userId === 'object' ? item.userId : null;
    return {
      name: userObj?.name || 'Anonymous',
      role: userObj?.role || 'student',
      isAdmin: false,
    };
  };

  const filteredIdeas = ideas.filter((idea) => {
    if (statusFilter === 'hidden') return idea.isHidden;
    if (statusFilter === 'visible') return !idea.isHidden;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Community & Ideas Moderation</h1>
          <p className="text-muted-foreground">Manage user posts, detailed project ideas, and comments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin-hover" />
            Refresh
          </Button>
          <a
            href="http://localhost:5173/resources"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Go to Frontend Feed
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Info Card for Admin */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="py-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
            <UserCheck className="h-4 w-4" />
            💡 Tip for Administrators
          </CardTitle>
          <CardDescription className="text-xs text-primary/80">
            You can log in directly on the main website (e.g.,{' '}
            <a
              href="http://localhost:5173/login"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
            >
              http://localhost:5173/login
            </a>
            ) using your admin email and password. This will allow you to participate in conversations,
            write comments, post detailed resources, and hide/delete items directly on the main feed.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Overview Analytics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Community Posts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ideas.filter((i) => i.type === 'community' && !i.isHidden).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {ideas.filter((i) => i.type === 'community' && i.isHidden).length} hidden by moderator
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Structured Project Ideas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ideas.filter((i) => i.type === 'structured' && !i.isHidden).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {ideas.filter((i) => i.type === 'structured' && i.isHidden).length} hidden by moderator
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Moderation Check</CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {ideas.filter((i) => i.isHidden).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently hidden/flagged posts</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs and Table Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Feed Selectors */}
            <div className="flex bg-muted p-1 rounded-lg w-fit">
              <Button
                variant={activeTab === 'community' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('community')}
                className="h-8"
              >
                Community Feed
              </Button>
              <Button
                variant={activeTab === 'structured' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('structured')}
                className="h-8"
              >
                Structured Ideas
              </Button>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category selector */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-background border border-input rounded-md text-sm px-3 py-2 outline-none"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-background border border-input rounded-md text-sm px-3 py-2 outline-none"
              >
                <option value="all">All Visibility</option>
                <option value="visible">Visible Only</option>
                <option value="hidden">Hidden Only</option>
              </select>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Press Enter to search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyPress}
                  className="pl-9 h-10 w-full"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">
                    {activeTab === 'structured' ? 'Project Title' : 'Post Preview'}
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[140px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIdeas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      No posts matching criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIdeas.map((idea) => {
                    const author = getAuthorDisplay(idea);
                    return (
                      <TableRow key={idea._id} className={idea.isHidden ? 'bg-amber-500/5' : ''}>
                        {/* Title / Description Preview */}
                        <TableCell>
                          <div className="flex flex-col gap-1 max-w-[320px]">
                            {idea.type === 'structured' ? (
                              <span className="font-bold text-foreground truncate">{idea.title}</span>
                            ) : null}
                            <span className="text-xs text-muted-foreground line-clamp-2">
                              {idea.description}
                            </span>
                            <span className="text-[10px] text-muted-foreground/85">
                              {new Date(idea.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {idea.category}
                          </Badge>
                        </TableCell>

                        {/* Author */}
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{author.name}</span>
                            <span className="text-[10px] text-muted-foreground capitalize">
                              {author.role}
                            </span>
                          </div>
                        </TableCell>

                        {/* Stats */}
                        <TableCell>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {idea.upvotes.length}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {idea.commentsCount}
                            </span>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {idea.isHidden ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <EyeOff className="h-3 w-3" />
                              Hidden
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-600 hover:bg-green-500/10 border-green-500/20 flex items-center gap-1 w-fit">
                              <Eye className="h-3 w-3" />
                              Visible
                            </Badge>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Comments Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View & Moderate Comments"
                              onClick={() => handleViewComments(idea)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>

                            {/* Hide/Show Toggle */}
                            <Button
                              variant="ghost"
                              size="sm"
                              title={idea.isHidden ? 'Make visible' : 'Hide from feed'}
                              onClick={() => handleToggleHideIdea(idea._id)}
                            >
                              {idea.isHidden ? (
                                <Eye className="h-4 w-4 text-green-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-amber-600" />
                              )}
                            </Button>

                            {/* Delete Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              title="Delete Post"
                              onClick={() => setDeleteIdeaId(idea._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Dialog for Comment Moderation */}
      {selectedIdeaForComments && (
        <AlertDialog
          open={!!selectedIdeaForComments}
          onOpenChange={(open) => {
            if (!open) setSelectedIdeaForComments(null);
          }}
        >
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center justify-between">
                <span>Comments on Post</span>
                <span className="text-xs font-normal text-muted-foreground max-w-[300px] truncate">
                  "{selectedIdeaForComments.title || selectedIdeaForComments.description}"
                </span>
              </AlertDialogTitle>
              <AlertDialogDescription>
                Moderate individual comments below. Hiding hides it from standard users. Deleting is permanent.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="my-4 max-h-[350px] overflow-y-auto pr-2">
              {loadingComments ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No comments on this post yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => {
                    const cAuthor = getAuthorDisplay(comment);
                    return (
                      <div
                        key={comment._id}
                        className={`p-3 rounded-lg border flex items-start justify-between gap-3 text-xs ${
                          comment.isHidden ? 'bg-amber-500/5 border-amber-500/30' : 'bg-muted/30 border-border'
                        }`}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">{cAuthor.name}</span>
                            <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 scale-90">
                              {cAuthor.role}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-foreground text-sm font-medium">{comment.comment}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Hide Comment */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleToggleHideComment(comment._id)}
                            title={comment.isHidden ? 'Make visible' : 'Hide comment'}
                          >
                            {comment.isHidden ? (
                              <Eye className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                            )}
                          </Button>
                          {/* Delete Comment */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleteCommentId(comment._id)}
                            title="Delete comment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <AlertDialogFooter>
              <Button variant="outline" onClick={() => setSelectedIdeaForComments(null)}>
                Close Window
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Confirmation Dialog for Deleting Post */}
      <AlertDialog open={!!deleteIdeaId} onOpenChange={(open) => !open && setDeleteIdeaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Community Post?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone and will remove it permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteIdeaId && handleDeleteIdea(deleteIdeaId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Deleting Comment */}
      <AlertDialog open={!!deleteCommentId} onOpenChange={(open) => !open && setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone and will remove it permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCommentId && handleDeleteComment(deleteCommentId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ResourcesHub;
