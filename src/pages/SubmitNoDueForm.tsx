import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/DashboardHeader";
import { Plus, X, ArrowLeft, ArrowRight, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Subject {
  id: string;
  name: string;
  code: string;
  is_elective: boolean;
}

interface Faculty {
  id: string;
  name: string;
  designation: string;
  department: string;
}

interface SelectedSubject {
  subject_id: string;
  subject_name: string;
  subject_code: string;
  faculty_id: string;
  faculty_name: string;
}

const SubmitNoDueForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Student profile data
  const [profile, setProfile] = useState<any>(null);
  
  // Form data
  const [department, setDepartment] = useState("");
  const [section, setSection] = useState("");
  const [semester, setSemester] = useState<number | null>(null);
  const [studentType, setStudentType] = useState("");
  
  // Subjects and faculty
  const [fixedSubjects, setFixedSubjects] = useState<Subject[]>([]);
  const [electiveSubjects, setElectiveSubjects] = useState<Subject[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [selectedElectives, setSelectedElectives] = useState<string[]>([]);
  const [subjectFacultyMap, setSubjectFacultyMap] = useState<Record<string, string>>({});
  const [existingApplication, setExistingApplication] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login/student");
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  useEffect(() => {
    if (semester) {
      if (department && semester) {
        fetchSubjects();
      }
      fetchFaculty();
    }
  }, [department, semester]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setDepartment(data.department);
      setSection(data.section);
      setSemester(data.semester);
      setStudentType(data.student_type);

      // Check for existing application
      await checkExistingApplication(data.semester, data.batch);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const checkExistingApplication = async (semester: number, batch: string) => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id, status, created_at')
        .eq('student_id', user?.id)
        .eq('semester', semester)
        .eq('batch', batch)
        .maybeSingle();

      if (error) {
        console.error('Error checking existing application:', error);
        return;
      }

      setExistingApplication(data);
    } catch (error) {
      console.error('Error checking existing application:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('department', department as any)
        .eq('semester', semester);

      if (error) throw error;

      const fixed = data?.filter(s => !s.is_elective) || [];
      const electives = data?.filter(s => s.is_elective) || [];

      setFixedSubjects(fixed);
      setElectiveSubjects(electives);
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    }
  };

  const fetchFaculty = async () => {
    try {
      // Fetch faculty from public view (excludes sensitive contact info)
      const { data, error } = await supabase
        .from('faculty_public')
        .select('id, name, designation, department')
        .order('designation', { ascending: true })
        .order('department', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      setFacultyList(data || []);
    } catch (error: any) {
      console.error('Error fetching faculty:', error);
      toast.error('Failed to load faculty list');
    }
  };

  const groupFacultyByDesignation = () => {
    const grouped: Record<string, Faculty[]> = {
      'HOD': [],
      'Associate Professor': [],
      'Assistant Professor': []
    };

    facultyList.forEach(faculty => {
      const designation = faculty.designation || 'Assistant Professor';
      if (grouped[designation]) {
        grouped[designation].push(faculty);
      } else {
        grouped['Assistant Professor'].push(faculty);
      }
    });

    return grouped;
  };

  const handleAddElective = (subjectId: string) => {
    if (!selectedElectives.includes(subjectId)) {
      setSelectedElectives([...selectedElectives, subjectId]);
    }
  };

  const handleRemoveElective = (subjectId: string) => {
    setSelectedElectives(selectedElectives.filter(id => id !== subjectId));
    const newMap = { ...subjectFacultyMap };
    delete newMap[subjectId];
    setSubjectFacultyMap(newMap);
  };

  const handleFacultySelection = (subjectId: string, facultyId: string) => {
    setSubjectFacultyMap({
      ...subjectFacultyMap,
      [subjectId]: facultyId
    });
  };

  const validateStep1 = () => {
    if (!department || !semester || !studentType) {
      toast.error("Please fill in all required fields");
      return false;
    }
    if (department === "CSE" && !section) {
      toast.error("Please select a section");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    // Check if all fixed subjects have faculty assigned
    for (const subject of fixedSubjects) {
      if (!subjectFacultyMap[subject.id]) {
        toast.error(`Please assign faculty for ${subject.name}`);
        return false;
      }
    }

    // Check if all selected electives have faculty assigned
    for (const electiveId of selectedElectives) {
      if (!subjectFacultyMap[electiveId]) {
        const elective = electiveSubjects.find(s => s.id === electiveId);
        toast.error(`Please assign faculty for ${elective?.name}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setIsSubmitting(true);

    try {
      // Prepare subject-faculty mappings
      const subjectFacultyMappings = [];
      
      // Add fixed subjects
      for (const subject of fixedSubjects) {
        if (subjectFacultyMap[subject.id]) {
          subjectFacultyMappings.push({
            subject_id: subject.id,
            faculty_id: subjectFacultyMap[subject.id]
          });
        }
      }
      
      // Add selected electives
      for (const electiveId of selectedElectives) {
        if (subjectFacultyMap[electiveId]) {
          subjectFacultyMappings.push({
            subject_id: electiveId,
            faculty_id: subjectFacultyMap[electiveId]
          });
        }
      }

      // Submit application via edge function with validation
      const { data, error } = await supabase.functions.invoke('submit-application', {
        body: {
          department,
          semester,
          batch: profile.batch,
          subjects: subjectFacultyMappings
        }
      });

      // Check for function invocation error or error in response data
      if (error) {
        console.error('Function invocation error:', error);
        throw new Error('Failed to submit application. Please try again.');
      }

      // Check if the edge function returned an error in the data
      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.success) {
        throw new Error('Application submission failed. Please try again.');
      }

      toast.success('Application submitted successfully!');
      navigate('/dashboard/student');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      // Display the specific error message from the edge function
      const errorMessage = error.message || 'Failed to submit application. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Show warning if application already exists
  if (existingApplication) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <DashboardHeader 
          title="Submit No-Due Application"
          user={{
            name: profile.name,
            email: profile.email,
            role: 'student'
          }}
        />

        <div className="container mx-auto p-6 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/student')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Application Already Exists</CardTitle>
              <CardDescription>
                You have already submitted an application for Semester {semester}, Batch {profile.batch}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-2">Current Application Status</p>
                <div className="flex items-center gap-2">
                  <Badge variant={existingApplication.status === 'approved' ? 'default' : 'secondary'}>
                    {existingApplication.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Submitted on {new Date(existingApplication.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                You can only have one active application per semester and batch. 
                To submit a new application, you need to delete your existing one first.
              </p>

              <div className="flex gap-2">
                <Button
                  onClick={() => navigate('/dashboard/student')}
                  variant="default"
                >
                  View Dashboard
                </Button>
                <Button
                  onClick={() => navigate('/application-tracker')}
                  variant="outline"
                >
                  Track Application
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <DashboardHeader 
        title="Submit No-Due Application"
        user={{
          name: profile.name,
          email: profile.email,
          role: 'student'
        }}
      />

      <div className="container mx-auto p-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard/student')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              1
            </div>
            <div className={`w-20 h-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
            <div className={`w-20 h-1 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Basic Information</CardTitle>
              <CardDescription>Verify your details and student type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Department</Label>
                  <Input value={department} disabled />
                </div>
                {department === "CSE" && (
                  <div>
                    <Label>Section</Label>
                    <Input value={section} disabled />
                  </div>
                )}
                <div>
                  <Label>Semester</Label>
                  <Input value={semester || ''} disabled />
                </div>
                <div>
                  <Label>Student Type</Label>
                  <Input value={studentType} disabled className="capitalize" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button onClick={() => {
                  if (validateStep1()) setStep(2);
                }}>
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Subject Selection */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Subject & Faculty Assignment</CardTitle>
              <CardDescription>Assign faculty for each subject</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fixed Subjects */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Core Subjects</h3>
                <div className="space-y-3">
                  {fixedSubjects.map((subject) => (
                    <div key={subject.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">{subject.name}</p>
                          <p className="text-sm text-muted-foreground">{subject.code}</p>
                        </div>
                        <Badge>Core</Badge>
                      </div>
                      <Select
                        value={subjectFacultyMap[subject.id] || ""}
                        onValueChange={(value) => handleFacultySelection(subject.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Faculty" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(groupFacultyByDesignation()).map(([designation, faculties]) => (
                            faculties.length > 0 && (
                              <div key={designation}>
                                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                  {designation}
                                </div>
                                 {faculties.map((faculty) => (
                                  <SelectItem key={faculty.id} value={faculty.id} className="pl-6">
                                    {faculty.name} ({faculty.department})
                                  </SelectItem>
                                ))}
                              </div>
                            )
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Elective Subjects */}
              {electiveSubjects.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Elective Subjects</h3>
                  
                  {/* Add Elective Button */}
                  <Select onValueChange={handleAddElective}>
                    <SelectTrigger className="mb-3">
                      <SelectValue placeholder="+ Add Elective Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {electiveSubjects
                        .filter(s => !selectedElectives.includes(s.id))
                        .map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name} ({subject.code})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {/* Selected Electives */}
                  <div className="space-y-3">
                    {selectedElectives.map((electiveId) => {
                      const subject = electiveSubjects.find(s => s.id === electiveId);
                      if (!subject) return null;

                      return (
                        <div key={subject.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold">{subject.name}</p>
                              <p className="text-sm text-muted-foreground">{subject.code}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Elective</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveElective(subject.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <Select
                            value={subjectFacultyMap[subject.id] || ""}
                            onValueChange={(value) => handleFacultySelection(subject.id, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Faculty" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(groupFacultyByDesignation()).map(([designation, faculties]) => (
                                faculties.length > 0 && (
                                  <div key={designation}>
                                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                                      {designation}
                                    </div>
                                     {faculties.map((faculty) => (
                                      <SelectItem key={faculty.id} value={faculty.id} className="pl-6">
                                        {faculty.name} ({faculty.department})
                                      </SelectItem>
                                    ))}
                                  </div>
                                )
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button onClick={() => {
                  if (validateStep2()) setStep(3);
                }}>
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review and Submit */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Review & Submit</CardTitle>
              <CardDescription>Review your application before submission</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Student Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-muted-foreground">Name:</p>
                  <p className="font-medium">{profile.name}</p>
                  <p className="text-muted-foreground">USN:</p>
                  <p className="font-medium">{profile.usn}</p>
                  <p className="text-muted-foreground">Department:</p>
                  <p className="font-medium">{department}</p>
                  <p className="text-muted-foreground">Semester:</p>
                  <p className="font-medium">{semester}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Subjects ({fixedSubjects.length + selectedElectives.length})</h3>
                <div className="space-y-2">
                  {[...fixedSubjects, ...electiveSubjects.filter(s => selectedElectives.includes(s.id))].map((subject) => {
                    const facultyId = subjectFacultyMap[subject.id];
                    const faculty = facultyList.find(f => f.id === facultyId);
                    
                    return (
                      <div key={subject.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium text-sm">{subject.name}</p>
                          <p className="text-xs text-muted-foreground">{subject.code}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{faculty?.name}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SubmitNoDueForm;
