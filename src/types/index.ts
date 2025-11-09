export type UserRole = 
  | 'admin' 
  | 'student' 
  | 'library' 
  | 'hostel' 
  | 'college_office' 
  | 'faculty' 
  | 'hod' 
  | 'lab_instructor'
  | 'counsellor'
  | 'class_advisor';

export type Department = 'MECH' | 'CSE' | 'CIVIL' | 'EC' | 'AIML' | 'CD';
export type Section = 'A' | 'B';
export type Semester = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type StudentType = 'local' | 'hostel';

export type ApplicationStatus = 
  | 'pending'
  | 'library_verified'
  | 'hostel_verified'
  | 'college_office_verified'
  | 'faculty_verified'
  | 'counsellor_verified'
  | 'class_advisor_verified'
  | 'hod_verified'
  | 'payment_pending'
  | 'lab_verified'
  | 'completed'
  | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: Department;
  collegeNumber?: string;
  batch?: string;
  photo?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  semester: Semester;
  department: Department;
  isElective: boolean;
}

export interface Application {
  id: string;
  studentId: string;
  studentName: string;
  collegeNumber: string;
  department: Department;
  section?: Section;
  semester: Semester;
  studentType: StudentType;
  status: ApplicationStatus;
  subjects: ApplicationSubject[];
  libraryVerified: boolean;
  libraryComment?: string;
  hostelVerified: boolean;
  hostelComment?: string;
  collegeOfficeVerified: boolean;
  collegeOfficeComment?: string;
  hodVerified: boolean;
  hodComment?: string;
  counsellorVerified: boolean;
  counsellorComment?: string;
  classAdvisorVerified: boolean;
  classAdvisorComment?: string;
  paymentVerified: boolean;
  paymentComment?: string;
  labVerified: boolean;
  labComment?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationSubject {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  facultyId: string;
  facultyName: string;
  verified: boolean;
  comment?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'approval' | 'rejection' | 'info';
  read: boolean;
  createdAt: Date;
}
