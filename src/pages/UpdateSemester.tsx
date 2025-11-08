import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, RefreshCw, Users, GraduationCap, Plus, Trash2, Settings, Clock, FileText, AlertCircle, Settings2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Batch {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
  current_semester: number;
  student_count: number;
}

interface BatchSettings {
  batch_name: string;
  enabled: boolean;
  scheduled_start: string | null;
  scheduled_end: string | null;
}

const UpdateSemester = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [selectedBatch, setSelectedBatch] = useState('');
  const [newSemester, setNewSemester] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add Batch Dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Delete Batch Dialog
  const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Global submission settings
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [scheduledStart, setScheduledStart] = useState<string>('');
  const [scheduledEnd, setScheduledEnd] = useState<string>('');
  const [isUpdatingGlobal, setIsUpdatingGlobal] = useState(false);

  // Batch-specific settings
  const [batchSettings, setBatchSettings] = useState<Map<string, BatchSettings>>(new Map());
  const [editingBatch, setEditingBatch] = useState<string | null>(null);
  const [batchSchedules, setBatchSchedules] = useState<Map<string, {
    start: string;
    end: string;
  }>>(new Map());

  useEffect(() => {
    fetchBatches();
    fetchSubmissionSettings();
  }, []);

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      // Fetch batches with student counts
      const { data: batchData, error: batchError} = await (supabase as any)
        .from('batches')
        .select('*')
        .order('start_year', { ascending: false });

      if (batchError) throw batchError;

      // For each batch, count students
      const batchesWithCounts = await Promise.all(
        (batchData || []).map(async (batch: any) => {
          const { count } = await (supabase as any)
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('batch', batch.name);

          return {
            ...batch,
            student_count: count || 0
          };
        })
      );

      setBatches(batchesWithCounts);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: "Error",
        description: "Failed to load batches",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubmissionSettings = async () => {
    try {
      // Fetch global settings
      const { data: globalData, error: globalError } = await supabase
        .from('global_submission_settings')
        .select('*')
        .single();

      if (globalError) {
        console.error('Error fetching global settings:', globalError);
      } else if (globalData) {
        setGlobalEnabled(globalData.enabled);
        setScheduledStart(globalData.scheduled_start || '');
        setScheduledEnd(globalData.scheduled_end || '');
      }

      // Fetch batch-specific settings
      const { data: batchData, error: batchError } = await supabase
        .from('batch_submission_settings')
        .select('*');

      if (batchError) {
        console.error('Error fetching batch settings:', batchError);
      } else if (batchData) {
        const settingsMap = new Map<string, BatchSettings>();
        batchData.forEach((setting: any) => {
          settingsMap.set(setting.batch_name, setting);
        });
        setBatchSettings(settingsMap);
      }
    } catch (error) {
      console.error('Error fetching submission settings:', error);
    }
  };

  const handleToggleGlobal = async (enabled: boolean) => {
    setIsUpdatingGlobal(true);
    try {
      const { error } = await supabase
        .from('global_submission_settings')
        .update({ 
          enabled,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', (await supabase.from('global_submission_settings').select('id').single()).data?.id);

      if (error) throw error;

      setGlobalEnabled(enabled);
      toast({
        title: "Success",
        description: `Student submissions ${enabled ? 'enabled' : 'disabled'} globally`,
      });
    } catch (error) {
      console.error('Error toggling global submissions:', error);
      toast({
        title: "Error",
        description: "Failed to update submission setting",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingGlobal(false);
    }
  };

  const handleUpdateSchedule = async () => {
    setIsUpdatingGlobal(true);
    try {
      const { error } = await supabase
        .from('global_submission_settings')
        .update({ 
          scheduled_start: scheduledStart || null,
          scheduled_end: scheduledEnd || null,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', (await supabase.from('global_submission_settings').select('id').single()).data?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Schedule updated successfully",
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingGlobal(false);
    }
  };

  const handleToggleBatch = async (batchName: string, enabled: boolean) => {
    try {
      const existing = batchSettings.get(batchName);
      
      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('batch_submission_settings')
          .update({ 
            enabled,
            updated_at: new Date().toISOString(),
            updated_by: user?.id
          })
          .eq('batch_name', batchName);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('batch_submission_settings')
          .insert({ 
            batch_name: batchName,
            enabled,
            updated_by: user?.id
          });

        if (error) throw error;
      }

      // Update local state
      const newSettings = new Map(batchSettings);
      newSettings.set(batchName, {
        batch_name: batchName,
        enabled,
        scheduled_start: existing?.scheduled_start || null,
        scheduled_end: existing?.scheduled_end || null
      });
      setBatchSettings(newSettings);

      toast({
        title: "Success",
        description: `Submissions ${enabled ? 'enabled' : 'disabled'} for ${batchName}`,
      });
    } catch (error) {
      console.error('Error toggling batch submissions:', error);
      toast({
        title: "Error",
        description: "Failed to update batch setting",
        variant: "destructive"
      });
    }
  };

  const handleUpdateBatchSchedule = async (batchName: string, start: string, end: string) => {
    try {
      // Validation
      if (start && end && new Date(start) >= new Date(end)) {
        toast({
          title: "Invalid Schedule",
          description: "End time must be after start time",
          variant: "destructive"
        });
        return;
      }
      
      const existing = batchSettings.get(batchName);
      
      if (existing) {
        // Update
        const { error } = await supabase
          .from('batch_submission_settings')
          .update({ 
            scheduled_start: start || null,
            scheduled_end: end || null,
            updated_by: user?.id
          })
          .eq('batch_name', batchName);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('batch_submission_settings')
          .insert({ 
            batch_name: batchName,
            enabled: true,
            scheduled_start: start || null,
            scheduled_end: end || null,
            updated_by: user?.id
          });

        if (error) throw error;
      }
      
      toast({
        title: "Success",
        description: `Custom schedule set for ${batchName}`
      });
      
      // Clear editing state
      const newSchedules = new Map(batchSchedules);
      newSchedules.delete(batchName);
      setBatchSchedules(newSchedules);
      setEditingBatch(null);
      
      fetchSubmissionSettings();
    } catch (error) {
      console.error('Error updating batch schedule:', error);
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive"
      });
    }
  };

  const handleClearBatchSchedule = async (batchName: string) => {
    try {
      const { error } = await supabase
        .from('batch_submission_settings')
        .update({ 
          scheduled_start: null,
          scheduled_end: null,
          updated_by: user?.id
        })
        .eq('batch_name', batchName);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Custom schedule cleared for ${batchName}. Using global settings.`
      });
      
      fetchSubmissionSettings();
    } catch (error) {
      console.error('Error clearing batch schedule:', error);
      toast({
        title: "Error",
        description: "Failed to clear schedule",
        variant: "destructive"
      });
    }
  };

  const getBatchStatusMessage = (batchName: string): string => {
    const settings = batchSettings.get(batchName);
    
    if (!settings) {
      return `Using global settings (${globalEnabled ? 'enabled' : 'disabled'})`;
    }
    
    const now = new Date();
    
    if (!settings.enabled) {
      return "Submissions disabled for this batch";
    }
    
    if (settings.scheduled_start) {
      const start = new Date(settings.scheduled_start);
      if (now < start) {
        return `Opens on ${start.toLocaleString()}`;
      }
    }
    
    if (settings.scheduled_end) {
      const end = new Date(settings.scheduled_end);
      if (now > end) {
        return "Schedule expired";
      }
      return `Closes on ${end.toLocaleString()}`;
    }
    
    return "Custom settings active";
  };

  const getStatusMessage = () => {
    const now = new Date();
    
    if (!globalEnabled) {
      return "❌ Submissions are currently disabled globally";
    }
    
    if (scheduledStart) {
      const start = new Date(scheduledStart);
      if (now < start) {
        return `⏳ Submissions will open on ${start.toLocaleString()}`;
      }
    }
    
    if (scheduledEnd) {
      const end = new Date(scheduledEnd);
      if (now > end) {
        return "⏰ Scheduled submission window has closed";
      }
      return `⏰ Submissions will close on ${end.toLocaleString()}`;
    }
    
    return "✅ Submissions are currently open";
  };

  const getBatchStatus = (batchName: string): "default" | "destructive" | "secondary" | "outline" => {
    const settings = batchSettings.get(batchName);
    const now = new Date();
    
    if (!settings) {
      // No override, use global
      return globalEnabled ? "default" : "destructive";
    }
    
    if (!settings.enabled) {
      return "destructive";
    }
    
    // Check schedule
    if (settings.scheduled_start && now < new Date(settings.scheduled_start)) {
      return "outline"; // Scheduled, not yet open
    }
    
    if (settings.scheduled_end && now > new Date(settings.scheduled_end)) {
      return "secondary"; // Expired
    }
    
    return "default"; // Active
  };

  const getBatchEnabled = (batchName: string): boolean => {
    const settings = batchSettings.get(batchName);
    return settings ? settings.enabled : globalEnabled;
  };

  const selectedBatchData = batches.find(b => b.name === selectedBatch);

  const handleUpdateSemester = async () => {
    if (!selectedBatch || !newSemester) {
      toast({
        title: "Error",
        description: "Please select batch and new semester",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      // Update all students in the batch
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ semester: parseInt(newSemester) })
        .eq('batch', selectedBatch);

      if (error) throw error;

      // Update batch current semester
      await (supabase as any)
        .from('batches')
        .update({ current_semester: parseInt(newSemester) })
        .eq('name', selectedBatch);

      toast({
        title: "Success!",
        description: `Updated semester to ${newSemester} for all students in batch ${selectedBatch}`,
      });

      // Reset and refresh
      setSelectedBatch('');
      setNewSemester('');
      fetchBatches();
    } catch (error) {
      console.error('Error updating semester:', error);
      toast({
        title: "Error",
        description: "Failed to update semester. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateBatch = async () => {
    if (!newBatchName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a batch name",
        variant: "destructive"
      });
      return;
    }

    // Validate format
    const batchPattern = /^\d{4}-\d{2}$/;
    if (!batchPattern.test(newBatchName)) {
      toast({
        title: "Invalid Format",
        description: "Batch name must be in format YYYY-YY (e.g., 2024-28)",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-batch`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ batchName: newBatchName }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create batch');
      }

      toast({
        title: "Success!",
        description: `Batch ${newBatchName} created successfully`,
        action: (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate(`/admin/add-student?batch=${newBatchName}`)}
          >
            Add Students
          </Button>
        ),
      });

      setIsAddDialogOpen(false);
      setNewBatchName('');
      fetchBatches();
    } catch (error: any) {
      console.error('Error creating batch:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create batch",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!batchToDelete || !deleteConfirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-batch`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ batchName: batchToDelete.name }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete batch');
      }

      toast({
        title: "Batch Deleted",
        description: `Deleted ${result.deleted.students} students and ${result.deleted.applications} applications`,
      });

      // Clear selection if deleted batch was selected
      if (selectedBatch === batchToDelete.name) {
        setSelectedBatch('');
      }

      setBatchToDelete(null);
      setDeleteConfirmed(false);
      fetchBatches();
    } catch (error: any) {
      console.error('Error deleting batch:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete batch",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} title="Update Semester" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/dashboard/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Update Semester</h1>
              <p className="text-muted-foreground">Manage batches and update semester for students</p>
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add New Batch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Batch</DialogTitle>
                <DialogDescription>
                  Add a new batch to the system. Format: YYYY-YY (e.g., 2024-28)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="batch-name">Batch Name</Label>
                  <Input
                    id="batch-name"
                    placeholder="e.g., 2024-28"
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: YYYY-YY (start year - end year last 2 digits)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBatch} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Batch'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Global Submission Control Card */}
        <Card className="mb-6 border-2 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle>Global Submission Control</CardTitle>
              </div>
              <Badge variant={globalEnabled ? "default" : "destructive"}>
                {globalEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <CardDescription>
              Master control for all no-due form submissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Master toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <h4 className="font-semibold mb-1">Enable Submissions</h4>
                <p className="text-sm text-muted-foreground">
                  Master switch to enable/disable all submissions
                </p>
              </div>
              <Switch
                checked={globalEnabled}
                onCheckedChange={handleToggleGlobal}
                disabled={isUpdatingGlobal}
              />
            </div>

            {/* Schedule settings */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Clock className="mr-2 h-4 w-4" />
                  Schedule Opening/Closing Times
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Opens At (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for no start time restriction
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Closes At (Optional)</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for no end time restriction
                  </p>
                </div>
                <Button onClick={handleUpdateSchedule} disabled={isUpdatingGlobal}>
                  {isUpdatingGlobal ? 'Saving...' : 'Save Schedule'}
                </Button>
              </CollapsibleContent>
            </Collapsible>

            {/* Status message */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {getStatusMessage()}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Selection Panel */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Semester Update
              </CardTitle>
              <CardDescription>
                Select batch and new semester to update all students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Batch</label>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.name}>
                        {batch.name} (Current: Sem {batch.current_semester})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBatch && (
                <>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold mb-2">Batch Information</h4>
                    <p className="text-sm">Batch: {selectedBatchData?.name}</p>
                    <p className="text-sm">Current Semester: {selectedBatchData?.current_semester}</p>
                    <p className="text-sm">Total Students: {selectedBatchData?.student_count}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Semester</label>
                    <Select value={newSemester} onValueChange={setNewSemester}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose new semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <SelectItem key={sem} value={sem.toString()}>
                            Semester {sem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {newSemester && (
                    <div className="p-4 bg-warning/10 border border-warning rounded-lg">
                      <p className="text-sm font-medium text-warning-foreground mb-2">
                        ⚠️ Confirmation Required
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This will update the semester from {selectedBatchData?.current_semester} to {newSemester} for all {selectedBatchData?.student_count} students in batch {selectedBatch}.
                      </p>
                    </div>
                  )}

                  <Button 
                    onClick={handleUpdateSemester} 
                    className="w-full" 
                    disabled={!newSemester || isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Update Semester
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Batches Overview */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                All Batches
              </CardTitle>
              <CardDescription>Current semester status of all batches</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading batches...</div>
              ) : batches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No batches found. Create your first batch to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {batches.map((batch) => {
                    const batchSchedule = batchSchedules.get(batch.name) || { start: '', end: '' };
                    const existingSettings = batchSettings.get(batch.name);
                    const isEditing = editingBatch === batch.name;
                    
                    return (
                      <Card key={batch.id} className="border">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-foreground">{batch.name}</h4>
                              <Badge variant={getBatchStatus(batch.name)} className="text-xs">
                                {getBatchEnabled(batch.name) ? 'Open' : 'Closed'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{batch.student_count}</span>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => {
                                      setBatchToDelete(batch);
                                      setDeleteConfirmed(false);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Batch {batch.name}?</AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-4">
                                      <p className="text-destructive font-semibold">
                                        ⚠️ This action cannot be undone!
                                      </p>
                                      <div className="bg-muted p-4 rounded-lg space-y-2">
                                        <p className="font-medium">This will permanently delete:</p>
                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                          <li>{batch.student_count} student(s) and their accounts</li>
                                          <li>All applications from this batch</li>
                                          <li>All related faculty assignments</li>
                                        </ul>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Checkbox
                                          id="confirm-delete"
                                          checked={deleteConfirmed}
                                          onCheckedChange={(checked) => setDeleteConfirmed(checked as boolean)}
                                        />
                                        <label
                                          htmlFor="confirm-delete"
                                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                          I understand this action cannot be undone
                                        </label>
                                      </div>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => {
                                      setBatchToDelete(null);
                                      setDeleteConfirmed(false);
                                    }}>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleDeleteBatch}
                                      disabled={!deleteConfirmed || isDeleting}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {isDeleting ? 'Deleting...' : 'Delete Batch'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>

                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-full justify-start">
                                <Settings2 className="mr-2 h-4 w-4" />
                                Submission Settings
                              </Button>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent className="space-y-4 mt-3 p-3 bg-muted/30 rounded-md">
                              {/* Enable/Disable Toggle */}
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <Label className="text-sm font-medium">Enable submissions</Label>
                                  <p className="text-xs text-muted-foreground">Overrides global setting</p>
                                </div>
                                <Switch
                                  checked={getBatchEnabled(batch.name)}
                                  onCheckedChange={(enabled) => handleToggleBatch(batch.name, enabled)}
                                />
                              </div>

                              {/* Custom Schedule */}
                              <div className="space-y-3 pt-3 border-t">
                                <Label className="text-sm font-medium">Custom Schedule (Optional)</Label>
                                <div className="space-y-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Opens At</Label>
                                    <Input
                                      type="datetime-local"
                                      value={isEditing ? batchSchedule.start : (existingSettings?.scheduled_start || '')}
                                      onChange={(e) => {
                                        if (!isEditing) setEditingBatch(batch.name);
                                        const newSchedules = new Map(batchSchedules);
                                        newSchedules.set(batch.name, { 
                                          ...batchSchedule, 
                                          start: e.target.value 
                                        });
                                        setBatchSchedules(newSchedules);
                                      }}
                                      className="h-9"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Closes At</Label>
                                    <Input
                                      type="datetime-local"
                                      value={isEditing ? batchSchedule.end : (existingSettings?.scheduled_end || '')}
                                      onChange={(e) => {
                                        if (!isEditing) setEditingBatch(batch.name);
                                        const newSchedules = new Map(batchSchedules);
                                        newSchedules.set(batch.name, { 
                                          ...batchSchedule, 
                                          end: e.target.value 
                                        });
                                        setBatchSchedules(newSchedules);
                                      }}
                                      className="h-9"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleUpdateBatchSchedule(batch.name, batchSchedule.start, batchSchedule.end)}
                                      disabled={!isEditing && !batchSchedule.start && !batchSchedule.end}
                                    >
                                      Save Schedule
                                    </Button>
                                    {existingSettings?.scheduled_start || existingSettings?.scheduled_end ? (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleClearBatchSchedule(batch.name)}
                                      >
                                        Clear
                                      </Button>
                                    ) : null}
                                  </div>
                                </div>
                              </div>

                              {/* Status Message */}
                              <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                  {getBatchStatusMessage(batch.name)}
                                </AlertDescription>
                              </Alert>
                            </CollapsibleContent>
                          </Collapsible>
                          
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-sm text-muted-foreground">Current Semester</span>
                            <span className="text-lg font-bold text-primary">{batch.current_semester}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default UpdateSemester;
