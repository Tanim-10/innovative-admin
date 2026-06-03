import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit2, Trash2, ArrowUpDown, Loader2, 
  Layers, Package, Check, X, ShieldAlert, Sparkles, Clock, Compass 
} from 'lucide-react';
import { adminApi, Project } from '@/services/adminApi';
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

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [mrp, setMrp] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [projectType, setProjectType] = useState<'combo_components' | 'ready_made'>('combo_components');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [estimatedBuildTime, setEstimatedBuildTime] = useState('');
  const [componentsInput, setComponentsInput] = useState('');
  const [documentation, setDocumentation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Load projects
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.projects.getAll();
      setProjects(data);
    } catch (err) {
      toast({
        title: 'Error loading projects',
        description: err instanceof Error ? err.message : 'Could not fetch projects list.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenCreate = () => {
    setSelectedProject(null);
    setName('');
    setSku('');
    setShortDescription('');
    setLongDescription('');
    setMrp(0);
    setSellingPrice(0);
    setStockQuantity(0);
    setProjectType('combo_components');
    setDifficulty('beginner');
    setEstimatedBuildTime('');
    setComponentsInput('');
    setDocumentation('');
    setImageUrl('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setSelectedProject(project);
    setName(project.name);
    setSku(project.sku);
    setShortDescription(project.shortDescription);
    setLongDescription(project.longDescription || '');
    setMrp(project.mrp);
    setSellingPrice(project.sellingPrice);
    setStockQuantity(project.stockQuantity || 0);
    setProjectType(project.projectType);
    setDifficulty(project.difficulty);
    setEstimatedBuildTime(project.estimatedBuildTime);
    setComponentsInput(project.components.join(', '));
    setDocumentation(project.documentation || '');
    setImageUrl(project.images[0] || '');
    setIsFormOpen(true);
  };

  const handleOpenDelete = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteOpen(true);
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await adminApi.products.uploadImage(file);
      setImageUrl(url);
      toast({ title: 'Image uploaded successfully' });
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Image upload failed',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !sku || !shortDescription || !projectType) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in Name, SKU, Short Description and Project Type.',
        variant: 'destructive',
      });
      return;
    }

    const payload: Partial<Project> = {
      name,
      sku,
      shortDescription,
      longDescription,
      mrp,
      sellingPrice,
      stockQuantity,
      projectType,
      difficulty,
      estimatedBuildTime,
      components: componentsInput.split(',').map(c => c.trim()).filter(Boolean),
      documentation,
      images: imageUrl ? [imageUrl] : [],
      status: 'active',
    };

    try {
      if (selectedProject) {
        await adminApi.projects.update(selectedProject.id, payload);
        toast({ title: 'Project kit updated successfully' });
      } else {
        await adminApi.projects.create(payload);
        toast({ title: 'Project kit created successfully' });
      }
      setIsFormOpen(false);
      fetchProjects();
    } catch (err) {
      toast({
        title: 'Action failed',
        description: err instanceof Error ? err.message : 'Operation failed.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;

    try {
      await adminApi.projects.delete(selectedProject.id);
      toast({ title: 'Project kit deleted successfully' });
      setIsDeleteOpen(false);
      fetchProjects();
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Could not delete project.',
        variant: 'destructive',
      });
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.components.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Kits Directory</h1>
          <p className="text-sm text-muted-foreground">
            Manage your hardware combo kits and ready-made built robotics projects inventory.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Add Project Kit
        </Button>
      </div>

      {/* Search block */}
      <div className="flex items-center gap-2 max-w-sm bg-card border rounded-lg px-3 py-1.5">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input 
          type="text" 
          placeholder="Search by name, SKU, or components..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm h-7"
        />
      </div>

      {/* Grid Table */}
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Loading projects catalog...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-60" />
            <h3 className="font-semibold text-sm">No Projects Listed</h3>
            <p className="text-xs text-muted-foreground">List new robotics project kits to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Project Info</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id} className="hover:bg-muted/10">
                  <TableCell className="align-middle">
                    <img 
                      src={project.images[0] || PLACEHOLDER_IMAGE} 
                      alt="" 
                      className="w-10 h-10 rounded-md object-contain bg-secondary/50 border"
                    />
                  </TableCell>
                  <TableCell className="align-middle">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-foreground">{project.name}</span>
                      <span className="text-[11px] text-muted-foreground line-clamp-1 max-w-[280px]">
                        {project.shortDescription}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="align-middle font-mono text-xs">{project.sku}</TableCell>
                  <TableCell className="align-middle">
                    <Badge variant="outline" className="text-[10px] py-0 px-2 uppercase bg-secondary/50">
                      {project.projectType === 'combo_components' ? 'Kit Combo' : 'Ready-made'}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-middle">
                    <Badge className="text-[10px] py-0 px-2 capitalize bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                      {project.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-middle text-right font-bold text-sm text-foreground">
                    ₹{project.sellingPrice.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="align-middle text-center">
                    <span className={`inline-flex items-center justify-center font-bold text-xs px-2.5 py-0.5 rounded-full ${
                      (project.stockQuantity || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {project.stockQuantity || 0}
                    </span>
                  </TableCell>
                  <TableCell className="align-middle text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="w-8 h-8 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                        onClick={() => handleOpenEdit(project)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="w-8 h-8 rounded-lg hover:bg-secondary text-destructive hover:text-destructive"
                        onClick={() => handleOpenDelete(project)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProject ? 'Edit Project Details' : 'Add New Project Kit'}</DialogTitle>
            <DialogDescription>
              Provide components list, estimations and build instructions to help users buy and assembly kits.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">PROJECT NAME *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">SKU * (e.g. PR-AR-ROBOT-01)</label>
                <Input value={sku} onChange={(e) => setSku(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">SHORT DESCRIPTION * (shown on grid cards)</label>
              <Input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">LONG DESCRIPTION (rich overview)</label>
              <Textarea value={longDescription} onChange={(e) => setLongDescription(e.target.value)} rows={3} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">MRP (INR) *</label>
                <Input type="number" value={mrp} onChange={(e) => setMrp(Number(e.target.value))} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">SELLING PRICE (INR) *</label>
                <Input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(Number(e.target.value))} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">STOCK QUANTITY *</label>
                <Input type="number" value={stockQuantity} onChange={(e) => setStockQuantity(Number(e.target.value))} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">PROJECT TYPE *</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-[#161c28] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="combo_components">Combo Components Kit</option>
                  <option value="ready_made">Ready-made Project</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">DIFFICULTY *</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-[#161c28] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">ESTIMATED BUILD TIME</label>
                <Input value={estimatedBuildTime} onChange={(e) => setEstimatedBuildTime(e.target.value)} placeholder="e.g. 5 hours" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">COMPONENTS INCLUDED (comma separated)</label>
              <Input 
                value={componentsInput} 
                onChange={(e) => setComponentsInput(e.target.value)} 
                placeholder="e.g. Arduino Uno, SG90 Servo, Ultrasonic Sensor, Battery Holder"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">BUILD GUIDE / DOCUMENTATION (Markdown or text)</label>
              <Textarea 
                value={documentation} 
                onChange={(e) => setDocumentation(e.target.value)} 
                placeholder="Write assembly instructions, wiring diagrams and code files here." 
                rows={5} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground block">PROJECT COVER IMAGE</label>
              <div className="flex items-center gap-3">
                <Input 
                  type="text" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  placeholder="Paste image URL or upload file..."
                  className="flex-1"
                />
                <div className="relative">
                  <Input 
                    type="file" 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                    id="project-image-uploader" 
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    disabled={isUploading}
                    onClick={() => document.getElementById('project-image-uploader')?.click()}
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
                  </Button>
                </div>
              </div>
              {imageUrl && (
                <img src={imageUrl} alt="" className="w-16 h-16 rounded border bg-secondary/30 object-contain" />
              )}
            </div>

            <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit">Save Project</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5" />
              Delete Project Kit?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedProject?.name}</strong>? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Projects;
