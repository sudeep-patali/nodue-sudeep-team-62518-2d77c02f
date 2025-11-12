import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, UserPlus, Copy, Eye, EyeOff, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const AddFaculty = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Navigation state
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    empId: ''
  });
  const [generatedCredentials, setGeneratedCredentials] = useState<{loginId: string, password: string} | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch existing faculty from database
  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    setIsLoading(true);
    try {
      // Fetch staff profiles
      const { data: staffData, error: staffError } = await supabase
        .from('staff_profiles')
        .select('id, name, email, employee_id, department, designation, is_active')
        .eq('is_active', true);

      if (staffError) throw staffError;

      // Fetch user roles for all staff
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['faculty', 'hod']);

      if (rolesError) throw rolesError;

      // Create a map of user_id to roles
      const rolesMap = new Map();
      rolesData?.forEach((role: any) => {
        if (!rolesMap.has(role.user_id)) {
          rolesMap.set(role.user_id, []);
        }
        rolesMap.get(role.user_id).push(role.role);
      });

      // Filter and transform staff data
      const transformedData = (staffData || [])
        .filter(staff => rolesMap.has(staff.id))
        .map(staff => ({
          id: staff.id,
          name: staff.name,
          email: staff.email,
          empId: staff.employee_id,
          department: staff.department,
          designation: staff.designation,
          loginId: staff.email,
          password: staff.employee_id,
          status: staff.is_active ? 'active' : 'inactive'
        }));

      setFaculty(transformedData);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      toast({
        title: "Error",
        description: "Failed to load faculty data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate credentials when empId changes
  useEffect(() => {
    if (formData.empId) {
      const loginId = `${formData.empId}@nodex.edu`;
      const password = formData.empId;
      setGeneratedCredentials({ loginId, password });
    } else {
      setGeneratedCredentials(null);
    }
  }, [formData.empId]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const handleNext = () => {
    if (selectedDepartment && selectedDesignation) {
      setShowForm(true);
    }
  };

  const handleBack = () => {
    if (showForm) {
      setShowForm(false);
    } else if (selectedDesignation) {
      setSelectedDesignation('');
    } else {
      setSelectedDepartment('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.empId || !selectedDepartment || !selectedDesignation) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    if (!generatedCredentials) {
      toast({
        title: "Error",
        description: "Credentials could not be generated",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Map designation to role
      const role = selectedDesignation === 'HOD' ? 'hod' : 'faculty';
      
      // Call the edge function to create faculty
      const response = await supabase.functions.invoke('create_faculty', {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
        body: {
          name: formData.name,
          email: generatedCredentials.loginId,
          employee_id: formData.empId,
          designation: selectedDesignation,
          department: selectedDepartment,
          role: role
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create faculty');
      }

      toast({
        title: "Success!",
        description: `Faculty account created successfully. Login credentials:\nID: ${generatedCredentials.loginId}\nPassword: ${generatedCredentials.password}`,
      });

      // Refresh faculty list
      await fetchFaculty();

      // Reset form
      setFormData({ name: '', email: '', empId: '' });
      setGeneratedCredentials(null);
      setShowPassword(false);
      
    } catch (error: any) {
      console.error('Error creating faculty:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create faculty account",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} title="Add Faculty" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" asChild>
            <Link to="/dashboard/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add New Faculty</h1>
            <p className="text-muted-foreground">Create faculty accounts with generated login credentials</p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <span className={selectedDepartment ? "text-foreground font-medium" : ""}>
            {selectedDepartment || "Select Department"}
          </span>
          {selectedDepartment && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span className={selectedDesignation ? "text-foreground font-medium" : ""}>
                {selectedDesignation || "Select Designation"}
              </span>
            </>
          )}
          {showForm && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">Add Faculty</span>
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {!showForm ? (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Faculty Setup
                </CardTitle>
                <CardDescription>
                  Select department and designation to proceed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedDepartment ? (
                  <div className="space-y-2">
                    <Label>Select Department</Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CSE">Computer Science Engineering</SelectItem>
                        <SelectItem value="EC">Electronics & Communication</SelectItem>
                        <SelectItem value="MECH">Mechanical Engineering</SelectItem>
                        <SelectItem value="CIVIL">Civil Engineering</SelectItem>
                        <SelectItem value="AIML">AI & ML</SelectItem>
                        <SelectItem value="CD">Common Department</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : !selectedDesignation ? (
                  <div className="space-y-2">
                    <Label>Select Designation</Label>
                    <Select value={selectedDesignation} onValueChange={setSelectedDesignation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose designation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOD">HOD</SelectItem>
                        <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                        <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" onClick={handleBack} variant="outline" className="w-full">
                      Back to Department Selection
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-2">Selected Configuration:</h4>
                      <p>Department: {selectedDepartment}</p>
                      <p>Designation: {selectedDesignation}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" onClick={handleBack} variant="outline" className="flex-1">
                        Back
                      </Button>
                      <Button onClick={handleNext} className="flex-1">
                        Proceed to Add Faculty
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Faculty Information
                </CardTitle>
                <CardDescription>
                  Enter faculty details and generate login credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Dr. / Prof. / Mr. / Ms."
                      required
                    />
                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="empId">Employee ID</Label>
                    <Input
                      id="empId"
                      value={formData.empId}
                      onChange={(e) => setFormData({...formData, empId: e.target.value})}
                      placeholder="e.g., EMP001"
                      required
                    />
                  </div>

                  {generatedCredentials && (
                    <div className="pt-4">
                      <Card className="bg-muted/50 border-primary/20">
                        <CardContent className="p-4 space-y-3">
                          <h4 className="font-semibold text-foreground">Auto-Generated Credentials</h4>
                          
                          <div className="space-y-2">
                            <Label>Login ID</Label>
                            <div className="flex gap-2">
                              <Input value={generatedCredentials.loginId} readOnly className="font-mono text-sm" />
                              <Button type="button" size="sm" variant="outline" onClick={() => copyToClipboard(generatedCredentials.loginId, 'Login ID')}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Password</Label>
                            <div className="flex gap-2">
                              <Input 
                                type={showPassword ? 'text' : 'password'} 
                                value={generatedCredentials.password} 
                                readOnly 
                                className="font-mono text-sm"
                              />
                              <Button type="button" size="sm" variant="outline" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => copyToClipboard(generatedCredentials.password, 'Password')}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button type="button" onClick={handleBack} variant="outline" className="flex-1" disabled={isSubmitting}>
                      Back to Setup
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isSubmitting || !generatedCredentials}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Faculty...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Create Faculty
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Faculty Panel */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Faculty Panel</CardTitle>
              <CardDescription>
                {selectedDepartment 
                  ? `${selectedDepartment} Department${selectedDesignation ? ` - ${selectedDesignation}` : ''}`
                  : 'Select department to view faculty'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading faculty...</span>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Login ID</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faculty
                      .filter(fac => {
                        if (!selectedDepartment) return false;
                        const departmentMatch = fac.department === selectedDepartment;
                        const designationMatch = !selectedDesignation || fac.designation === selectedDesignation;
                        return departmentMatch && designationMatch;
                      })
                      .map((fac) => (
                      <TableRow key={fac.id}>
                        <TableCell className="font-medium">{fac.name}</TableCell>
                        <TableCell>{fac.empId}</TableCell>
                        <TableCell>{fac.department}</TableCell>
                        <TableCell>{fac.designation}</TableCell>
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center gap-2">
                            <span>{fac.loginId}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(fac.loginId, 'Login ID')}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center gap-2">
                            <span>••••••••</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(fac.password, 'Password')}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">Active</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {faculty.filter(fac => {
                      if (!selectedDepartment) return false;
                      const departmentMatch = fac.department === selectedDepartment;
                      const designationMatch = !selectedDesignation || fac.designation === selectedDesignation;
                      return departmentMatch && designationMatch;
                    }).length === 0 && selectedDepartment && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No faculty found for the selected filters
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AddFaculty;
