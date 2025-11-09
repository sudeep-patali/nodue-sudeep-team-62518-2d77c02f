import { format } from 'date-fns';

interface Application {
  id: string;
  library_verified: boolean;
  library_comment?: string;
  hostel_verified: boolean;
  hostel_comment?: string;
  college_office_verified: boolean;
  college_office_comment?: string;
  faculty_verified: boolean;
  faculty_comment?: string;
  counsellor_verified: boolean;
  counsellor_comment?: string;
  class_advisor_verified: boolean;
  class_advisor_comment?: string;
  hod_verified: boolean;
  hod_comment?: string;
  payment_verified: boolean;
  payment_comment?: string;
  lab_verified: boolean;
  lab_comment?: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

interface Profile {
  name: string;
  usn?: string;
  email?: string;
  department?: string;
  semester?: number;
  batch?: string;
  section?: string;
  student_type?: string;
}

export const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMMM dd, yyyy');
  } catch {
    return 'N/A';
  }
};

export const formatDepartment = (dept?: string): string => {
  const deptMap: Record<string, string> = {
    'MECH': 'Mechanical Engineering',
    'CSE': 'Computer Science Engineering',
    'CIVIL': 'Civil Engineering',
    'EC': 'Electronics and Communication',
    'AIML': 'Artificial Intelligence & Machine Learning',
    'CD': 'Computer Science (Data Science)'
  };
  return dept ? deptMap[dept] || dept : 'N/A';
};

export const generateCertificateHTML = (application: Application, profile: Profile): string => {
  const currentDate = format(new Date(), 'MMMM dd, yyyy');
  const isHostelStudent = profile.student_type === 'hostel';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>No Due Certificate - ${profile.name}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Georgia', 'Times New Roman', serif;
          padding: 20px;
          background: #f5f5f5;
        }
        
        .certificate-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border: 3px solid #2c3e50;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #2c3e50;
        }
        
        .header h1 {
          font-size: 28px;
          color: #2c3e50;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .header h2 {
          font-size: 22px;
          color: #34495e;
          font-weight: 600;
          margin-top: 15px;
        }
        
        .intro {
          text-align: center;
          margin: 30px 0;
          font-size: 16px;
          color: #555;
          line-height: 1.6;
        }
        
        .student-details {
          margin: 30px 0;
          background: #f8f9fa;
          padding: 20px;
          border-left: 4px solid #3498db;
        }
        
        .detail-row {
          display: flex;
          margin: 8px 0;
          font-size: 15px;
        }
        
        .detail-label {
          font-weight: 600;
          color: #2c3e50;
          width: 140px;
        }
        
        .detail-value {
          color: #555;
          flex: 1;
        }
        
        .clearance-section {
          margin-top: 40px;
        }
        
        .clearance-title {
          font-size: 20px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #ecf0f1;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .clearance-item {
          margin: 20px 0;
          padding: 15px;
          background: #f8f9fa;
          border-left: 4px solid #27ae60;
          page-break-inside: avoid;
        }
        
        .clearance-header {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .checkmark {
          color: #27ae60;
          font-size: 20px;
          margin-right: 10px;
          font-weight: bold;
        }
        
        .clearance-name {
          font-size: 16px;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .clearance-details {
          margin-left: 30px;
          font-size: 14px;
          color: #555;
        }
        
        .clearance-date {
          margin: 5px 0;
        }
        
        .clearance-remarks {
          margin: 5px 0;
          font-style: italic;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #ecf0f1;
          text-align: center;
        }
        
        .footer-info {
          font-size: 14px;
          color: #555;
          margin: 10px 0;
        }
        
        .validity-text {
          margin-top: 20px;
          font-size: 13px;
          color: #666;
          font-style: italic;
          text-align: center;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .certificate-container {
            max-width: 100%;
            box-shadow: none;
            border: 2px solid #2c3e50;
            padding: 30px;
          }
          
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        <div class="header">
          <h1>No Objection Certificate</h1>
          <h2>Clearance Certificate</h2>
        </div>
        
        <div class="intro">
          This is to certify that the following student has successfully cleared all 
          requirements and has no pending dues or obligations with the institution.
        </div>
        
        <div class="student-details">
          <div class="detail-row">
            <div class="detail-label">Name:</div>
            <div class="detail-value">${profile.name}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">USN:</div>
            <div class="detail-value">${profile.usn || 'N/A'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Department:</div>
            <div class="detail-value">${formatDepartment(profile.department)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Semester:</div>
            <div class="detail-value">${profile.semester || 'N/A'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Batch:</div>
            <div class="detail-value">${profile.batch || 'N/A'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Section:</div>
            <div class="detail-value">${profile.section || 'N/A'}</div>
          </div>
        </div>
        
        <div class="clearance-section">
          <div class="clearance-title">Clearance Details</div>
          
          <!-- Library Clearance -->
          <div class="clearance-item">
            <div class="clearance-header">
              <span class="checkmark">✓</span>
              <span class="clearance-name">Library Clearance</span>
            </div>
            <div class="clearance-details">
              <div class="clearance-date">Verified on: ${formatDate(application.updated_at)}</div>
              <div class="clearance-remarks">Remarks: ${application.library_comment || 'No remarks'}</div>
            </div>
          </div>
          
          ${isHostelStudent ? `
          <!-- Hostel Clearance -->
          <div class="clearance-item">
            <div class="clearance-header">
              <span class="checkmark">✓</span>
              <span class="clearance-name">Hostel Clearance</span>
            </div>
            <div class="clearance-details">
              <div class="clearance-date">Verified on: ${formatDate(application.updated_at)}</div>
              <div class="clearance-remarks">Remarks: ${application.hostel_comment || 'No remarks'}</div>
            </div>
          </div>
          ` : ''}
          
          <!-- College Office Clearance -->
          <div class="clearance-item">
            <div class="clearance-header">
              <span class="checkmark">✓</span>
              <span class="clearance-name">College Office Clearance</span>
            </div>
            <div class="clearance-details">
              <div class="clearance-date">Verified on: ${formatDate(application.updated_at)}</div>
              <div class="clearance-remarks">Remarks: ${application.college_office_comment || 'No remarks'}</div>
            </div>
          </div>
          
          <!-- Faculty Clearance -->
          <div class="clearance-item">
            <div class="clearance-header">
              <span class="checkmark">✓</span>
              <span class="clearance-name">Faculty Clearance</span>
            </div>
            <div class="clearance-details">
              <div class="clearance-date">Verified on: ${formatDate(application.updated_at)}</div>
              <div class="clearance-remarks">Remarks: ${application.faculty_comment || 'No remarks'}</div>
            </div>
          </div>
          
          <!-- Counsellor Clearance -->
          <div class="clearance-item">
            <div class="clearance-header">
              <span class="checkmark">✓</span>
              <span class="clearance-name">Counsellor Clearance</span>
            </div>
            <div class="clearance-details">
              <div class="clearance-date">Verified on: ${formatDate(application.updated_at)}</div>
              <div class="clearance-remarks">Remarks: ${application.counsellor_comment || 'No remarks'}</div>
            </div>
          </div>
          
          <!-- Class Advisor Clearance -->
          <div class="clearance-item">
            <div class="clearance-header">
              <span class="checkmark">✓</span>
              <span class="clearance-name">Class Advisor Clearance</span>
            </div>
            <div class="clearance-details">
              <div class="clearance-date">Verified on: ${formatDate(application.updated_at)}</div>
              <div class="clearance-remarks">Remarks: ${application.class_advisor_comment || 'No remarks'}</div>
            </div>
          </div>
          
          <!-- HOD Approval -->
          <div class="clearance-item">
            <div class="clearance-header">
              <span class="checkmark">✓</span>
              <span class="clearance-name">HOD Approval</span>
            </div>
            <div class="clearance-details">
              <div class="clearance-date">Verified on: ${formatDate(application.updated_at)}</div>
              <div class="clearance-remarks">Remarks: ${application.hod_comment || 'No remarks'}</div>
            </div>
          </div>
          
          <!-- Lab Charges Payment -->
          <div class="clearance-item">
            <div class="clearance-header">
              <span class="checkmark">✓</span>
              <span class="clearance-name">Lab Charges Payment</span>
            </div>
            <div class="clearance-details">
              <div class="clearance-date">Transaction ID: ${application.transaction_id || 'N/A'}</div>
              <div class="clearance-date">Verified on: ${formatDate(application.updated_at)}</div>
              <div class="clearance-remarks">Remarks: ${application.payment_comment || 'No remarks'}</div>
            </div>
          </div>
          
          <!-- Lab Instructor Clearance -->
          <div class="clearance-item">
            <div class="clearance-header">
              <span class="checkmark">✓</span>
              <span class="clearance-name">Lab Instructor Clearance</span>
            </div>
            <div class="clearance-details">
              <div class="clearance-date">Verified on: ${formatDate(application.updated_at)}</div>
              <div class="clearance-remarks">Remarks: ${application.lab_comment || 'No remarks'}</div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-info">Certificate Generated: ${currentDate}</div>
          <div class="footer-info">Application ID: ${application.id}</div>
          
          <div class="validity-text">
            This certificate is valid and verifies that the student has no pending dues or obligations.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
