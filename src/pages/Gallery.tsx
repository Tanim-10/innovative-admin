import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Camera, Image, Eye, Loader2 } from 'lucide-react';
import SearchBar from '@/components/admin/SearchBar';
import Table from '@/components/admin/Table';
import Pagination from '@/components/admin/Pagination';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { GalleryItem, productsApi, galleryApi } from '@/services/adminApi';
import { useToast } from '@/hooks/use-toast';

const Gallery: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  // Form State
  const [formData, setFormData] = useState<Partial<GalleryItem>>({
    title: '',
    category: 'workshops',
    image: '',
    description: '',
  });

  // Confirm delete dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    itemId: string;
    itemTitle: string;
  }>({
    isOpen: false,
    itemId: '',
    itemTitle: '',
  });

  const pageSize = 10;

  // Load items
  const loadGallery = async () => {
    setIsLoading(true);
    try {
      const data = await galleryApi.getAll();
      setItems(data);
    } catch (err) {
      toast({
        title: 'Error loading gallery',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  // Filter gallery items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, categoryFilter]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  const handleAddNew = () => {
    setFormData({
      title: '',
      category: 'workshops',
      image: '',
      description: '',
    });
    setIsEditModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await productsApi.uploadImage(file);
      if (url) {
        setFormData((prev) => ({ ...prev, image: url }));
        toast({ title: 'Image uploaded successfully!' });
      }
    } catch (err) {
      toast({
        title: 'Image upload failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteClick = (item: GalleryItem) => {
    setConfirmDialog({
      isOpen: true,
      itemId: item.id,
      itemTitle: item.title,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      await galleryApi.delete(confirmDialog.itemId);
      toast({ title: 'Gallery item deleted successfully' });
      setItems((prev) => prev.filter((i) => i.id !== confirmDialog.itemId));
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setConfirmDialog({ isOpen: false, itemId: '', itemTitle: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !formData.image || !formData.description) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const newItem = await galleryApi.create(formData);
      toast({ title: 'Gallery item created successfully!' });
      setItems((prev) => [newItem, ...prev]);
      setIsEditModalOpen(false);
    } catch (err) {
      toast({
        title: 'Failed to create item',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const columns = [
    {
      key: 'image',
      header: 'Preview',
      render: (item: GalleryItem) => (
        <div className="w-16 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center border border-border">
          {item.image ? (
            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      render: (item: GalleryItem) => (
        <div>
          <p className="font-semibold text-foreground">{item.title}</p>
          <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded mt-1 inline-block">
            {item.category}
          </span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (item: GalleryItem) => (
        <p className="text-sm text-muted-foreground max-w-sm truncate" title={item.description}>
          {item.description}
        </p>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date Created',
      render: (item: GalleryItem) => (
        <span className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: GalleryItem) => (
        <button
          onClick={() => handleDeleteClick(item)}
          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete Item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-header">Gallery Management</h1>
          <p className="page-description">
            Upload, categorize, and manage gallery images displayed on the homepage • {items.length} total
          </p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field w-full sm:w-40"
          >
            <option value="all">All Categories</option>
            <option value="workshops">Workshops</option>
            <option value="projects">Projects</option>
            <option value="lab">Lab Space</option>
            <option value="events">Events</option>
          </select>
          <SearchBar
            placeholder="Search gallery..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="w-full sm:w-72"
          />
          <button
            onClick={handleAddNew}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Pictures</p>
          <p className="text-2xl font-bold text-foreground">{items.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Workshops</p>
          <p className="text-2xl font-bold text-primary">
            {items.filter((i) => i.category === 'workshops').length}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Projects</p>
          <p className="text-2xl font-bold text-success">
            {items.filter((i) => i.category === 'projects').length}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Lab & Events</p>
          <p className="text-2xl font-bold text-warning">
            {items.filter((i) => i.category === 'lab' || i.category === 'events').length}
          </p>
        </div>
      </div>

      {/* Gallery Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            data={paginatedItems}
            keyExtractor={(item) => item.id}
            emptyMessage="No gallery items found"
          />
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !isLoading && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Add New Gallery Item Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Add Gallery Picture"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="e.g. Robotics Workshop Day 1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Category *
            </label>
            <select
              value={formData.category || 'workshops'}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="input-field"
              required
            >
              <option value="workshops">Workshops</option>
              <option value="projects">Projects</option>
              <option value="lab">Lab Space</option>
              <option value="events">Events</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description *
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field min-h-[80px]"
              placeholder="Give a short description about this gallery picture..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Picture Upload *
            </label>
            <div className="space-y-3">
              {formData.image ? (
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-border group bg-muted">
                  <img src={formData.image} alt="Upload preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="btn-outline bg-destructive/15 hover:bg-destructive text-destructive hover:text-destructive-foreground border-destructive/20 font-semibold px-4 py-2 text-xs rounded-full transition-all"
                    >
                      Delete and Replace
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-36 border-2 border-dashed border-border hover:border-primary/50 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-card hover:bg-muted/5 transition-all"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <span className="text-sm text-muted-foreground">Uploading image...</span>
                    </>
                  ) : (
                    <>
                      <Image className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Click to upload image</span>
                      <span className="text-xs text-muted-foreground">PNG, JPG, JPEG up to 5MB</span>
                    </>
                  )}
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-border/20">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="btn-outline px-5 py-2.5 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="btn-primary px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Picture</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, itemId: '', itemTitle: '' })}
        onConfirm={handleConfirmDelete}
        title="Delete Picture?"
        message={`Are you sure you want to delete "${confirmDialog.itemTitle}" from the gallery? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default Gallery;
