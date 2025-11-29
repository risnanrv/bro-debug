import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Bell, LogOut, User, Sparkles, Upload, X, FileText, Image as ImageIcon, Video } from 'lucide-react';
import { z } from 'zod';
import brototypeLogo from '@/assets/brototype-logo-new.png';

const complaintSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description too long'),
});

const categories = [
  "Hostel / Accommodation",
  "Mentor Behavior / Staff Attitude",
  "Curriculum / Teaching",
  "Batch Management",
  "Laptop / Lab / Internet / Wi-Fi Issue",
  "Payment / Finance",
  "Food / Canteen",
  "Mental Health / Harassment / Bullying",
  "Miscommunication / Misleading Information",
  "Personal Safety",
  "Other"
];

export default function NewComplaint() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [aiInput, setAiInput] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    customCategory: '',
  });

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    const { data: announcements } = await supabase
      .from('announcements')
      .select('id');

    const { data: reads } = await supabase
      .from('announcement_reads')
      .select('announcement_id')
      .eq('student_id', user?.id);

    if (announcements && reads) {
      const readIds = new Set(reads.map((r) => r.announcement_id));
      const unread = announcements.filter((a) => !readIds.has(a.id)).length;
      setUnreadCount(unread);
    }
  };

  const detectPriority = (description: string): string => {
    const lowerDesc = description.toLowerCase();
    if (/(harassment|mental|abuse)/i.test(lowerDesc)) {
      return 'Critical';
    } else if (/(hostel|food|wifi|lab)/i.test(lowerDesc)) {
      return 'Urgent';
    }
    return 'Normal';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4'];
        const maxSize = 25 * 1024 * 1024; // 25MB
        
        if (!validTypes.includes(file.type)) {
          toast({
            title: 'Invalid file type',
            description: `${file.name} is not a supported file type`,
            variant: 'destructive',
          });
          return false;
        }
        
        if (file.size > maxSize) {
          toast({
            title: 'File too large',
            description: `${file.name} exceeds 25MB limit`,
            variant: 'destructive',
          });
          return false;
        }
        
        return true;
      });

      if (files.length + validFiles.length > 5) {
        toast({
          title: 'Too many files',
          description: 'Maximum 5 files allowed',
          variant: 'destructive',
        });
        return;
      }

      setFiles([...files, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4" />;
    if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const handleAiEnhance = async () => {
    if (!aiInput.trim()) {
      toast({
        title: 'Error',
        description: 'Please describe your issue first',
        variant: 'destructive',
      });
      return;
    }

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-complaint', {
        body: { description: aiInput }
      });

      if (error) throw error;

      setAiSuggestions(data);
      toast({
        title: 'AI Suggestions Ready',
        description: 'Review and apply the suggestions below',
      });
    } catch (error: any) {
      console.error('AI enhancement error:', error);
      toast({
        title: 'AI Enhancement Failed',
        description: error.message || 'Failed to generate suggestions',
        variant: 'destructive',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestion = (field: 'title' | 'description' | 'category' | 'priority') => {
    if (!aiSuggestions) return;

    if (field === 'title') {
      setFormData({ ...formData, title: aiSuggestions.title });
    } else if (field === 'description') {
      setFormData({ ...formData, description: aiSuggestions.description });
    } else if (field === 'category') {
      setFormData({ ...formData, category: aiSuggestions.category });
    }

    toast({
      title: 'Applied',
      description: `${field} has been updated`,
    });
  };

  const uploadFiles = async (complaintId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${complaintId}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('complaint-attachments')
        .upload(`${user?.id}/${fileName}`, file);

      if (error) {
        console.error('File upload error:', error);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('complaint-attachments')
        .getPublicUrl(`${user?.id}/${fileName}`);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      complaintSchema.parse(formData);

      const priority = detectPriority(formData.description);

      // Create temp ID for file uploads
      const tempId = crypto.randomUUID();
      const attachmentUrls = files.length > 0 ? await uploadFiles(tempId) : [];

      const { error } = await supabase.from('complaints').insert({
        student_id: user?.id,
        is_anonymous: isAnonymous,
        student_name_cached: isAnonymous ? 'Anonymous Student' : profile?.full_name,
        title: formData.title,
        category: formData.category as any,
        custom_category_text: formData.category === 'Other' ? formData.customCategory : null,
        description: formData.description,
        priority: priority as any,
        status: 'Pending' as any,
        attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Complaint submitted!',
        description: 'Your complaint has been submitted successfully',
      });

      navigate('/dashboard');
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Validation error',
          description: err.errors[0].message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Unified Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <button 
            onClick={() => navigate('/dashboard')}
            className="hover:opacity-80 transition-opacity"
          >
            <img 
              src={brototypeLogo} 
              alt="Brototype" 
              className="logo-size pl-3 pt-1"
            />
          </button>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/updates')}
              className="text-sm font-medium flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden md:inline">Updates</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => navigate('/profile')}
              className="text-sm font-medium flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span className="hidden md:inline">Profile</span>
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => {
                supabase.auth.signOut();
                navigate('/auth');
              }}
              className="text-sm font-medium flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* AI Enhancement Panel */}
        <Collapsible open={showAiPanel} onOpenChange={setShowAiPanel} className="mb-6">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">AI Complaint Enhancer</CardTitle>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {showAiPanel ? 'Hide' : 'Show'}
                  </span>
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Describe your issue in your own words</Label>
                  <Textarea
                    placeholder="E.g., The WiFi in hostel block B keeps disconnecting..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                <Button onClick={handleAiEnhance} disabled={aiLoading} className="w-full gap-2">
                  <Sparkles className="h-4 w-4" />
                  {aiLoading ? 'Generating...' : 'Generate Suggestions with AI'}
                </Button>

                {aiSuggestions && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h4 className="font-semibold text-sm text-primary">AI Suggestions</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Title</Label>
                          <p className="text-sm mt-1">{aiSuggestions.title}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => applyAiSuggestion('title')}>
                          Apply
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Label className="text-xs text-muted-foreground">Description</Label>
                          <p className="text-sm mt-1">{aiSuggestions.description}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => applyAiSuggestion('description')}>
                          Apply
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs text-muted-foreground">Category</Label>
                          <p className="text-sm mt-1">{aiSuggestions.category}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => applyAiSuggestion('category')}>
                          Apply
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Recommended Priority</Label>
                      <Badge variant="outline">{aiSuggestions.priority}</Badge>
                    </div>

                    {aiSuggestions.suggestedSteps && (
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <Label className="text-xs">Suggested Resolution Steps</Label>
                        <p>{aiSuggestions.suggestedSteps}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Card className="gradient-card border-border/50 shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl">Submit New <span className="text-primary">Complaint</span></CardTitle>
            <CardDescription className="text-base">
              Describe your issue in detail. We'll prioritize and address it accordingly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border">
                <div className="space-y-0.5">
                  <Label htmlFor="anonymous" className="text-base font-medium">Submit Anonymously</Label>
                  <p className="text-sm text-muted-foreground">
                    Your name will be hidden from display
                  </p>
                </div>
                <Switch
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={setIsAnonymous}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Brief summary of your complaint"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value, customCategory: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.category === 'Other' && (
                <div className="space-y-2">
                  <Label htmlFor="customCategory">Specify Category</Label>
                  <Input
                    id="customCategory"
                    placeholder="Please specify the category"
                    value={formData.customCategory}
                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about your complaint..."
                  className="min-h-[200px]"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Priority will be auto-detected based on keywords in your description
                </p>
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <Label>Attachments (optional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-center">
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Upload className="h-4 w-4" />
                        <span>Click to upload files (max 5)</span>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf,video/mp4"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Supported: Images (JPG, PNG, WEBP), PDF, Video (MP4) • Max 25MB per file
                  </p>
                  
                  {files.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-secondary/20 rounded p-2">
                          <div className="flex items-center gap-2">
                            {getFileIcon(file.type)}
                            <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Submitting...' : 'Submit Complaint'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}