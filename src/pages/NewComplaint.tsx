import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import Header from '@/components/Header';

const complaintSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description too long'),
});

export default function NewComplaint() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    customCategory: '',
  });

  const detectPriority = (description: string): string => {
    const lowerDesc = description.toLowerCase();
    if (/(harassment|mental|abuse)/i.test(lowerDesc)) {
      return 'Critical';
    } else if (/(hostel|food|wifi|lab)/i.test(lowerDesc)) {
      return 'Urgent';
    }
    return 'Normal';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      complaintSchema.parse(formData);

      const priority = detectPriority(formData.description);

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
      <Header role="student" />
      
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
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
                    <SelectItem value="Hostel / Accommodation">Hostel / Accommodation</SelectItem>
                    <SelectItem value="Mentor Behavior / Staff Attitude">Mentor Behavior / Staff Attitude</SelectItem>
                    <SelectItem value="Curriculum / Teaching">Curriculum / Teaching</SelectItem>
                    <SelectItem value="Batch Management">Batch Management</SelectItem>
                    <SelectItem value="Laptop / Lab / Internet / Wi-Fi Issue">Laptop / Lab / Internet / Wi-Fi Issue</SelectItem>
                    <SelectItem value="Payment / Finance">Payment / Finance</SelectItem>
                    <SelectItem value="Food / Canteen">Food / Canteen</SelectItem>
                    <SelectItem value="Mental Health / Harassment / Bullying">Mental Health / Harassment / Bullying</SelectItem>
                    <SelectItem value="Miscommunication / Misleading Information">Miscommunication / Misleading Information</SelectItem>
                    <SelectItem value="Personal Safety">Personal Safety</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
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
