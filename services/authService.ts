
import { User, UserRole, AuditLog, Invite, Lesson, JoinRequest } from '../types';

// STORAGE KEYS
const DB_USERS_KEY = 'bbl_db_users';
const DB_LOGS_KEY = 'bbl_db_logs';
const DB_INVITES_KEY = 'bbl_db_invites';
const DB_LESSONS_KEY = 'bbl_db_lessons';
const DB_REQUESTS_KEY = 'bbl_db_requests';
const SESSION_KEY = 'bbl_session_token';

// DEFAULT ADMIN CREDENTIALS
const DEFAULT_ADMIN = {
  id: 'usr_main_admin',
  name: 'Main Admin',
  email: 'peadetng@gmail.com',
  passwordHash: 'Peter.Adetunji2023#', // In real app, this would be bcrypt hash
  role: UserRole.ADMIN,
  isVerified: true,
  avatarUrl: '',
  lastLogin: new Date().toISOString(),
  authProvider: 'email' as const
};

// DEFAULT MENTOR CREDENTIALS (FOR DEMO)
const DEFAULT_MENTOR = {
  id: 'usr_demo_mentor',
  name: 'Demo Mentor',
  email: 'mentor@demo.com',
  passwordHash: 'mentor123',
  role: UserRole.MENTOR,
  isVerified: true,
  avatarUrl: '',
  lastLogin: new Date().toISOString(),
  authProvider: 'email' as const,
  classCode: 'DEMO01'
};

// DEFAULT STUDENT CREDENTIALS (FOR DEMO)
const DEFAULT_STUDENT = {
  id: 'usr_demo_student',
  name: 'Demo Student',
  email: 'student@demo.com',
  passwordHash: 'student123',
  role: UserRole.STUDENT,
  isVerified: true,
  avatarUrl: '',
  lastLogin: new Date().toISOString(),
  authProvider: 'email' as const,
  mentorId: 'usr_demo_mentor' // Pre-linked to the demo mentor
};

// DEFAULT PARENT CREDENTIALS (FOR DEMO)
const DEFAULT_PARENT = {
  id: 'usr_demo_parent',
  name: 'Demo Parent',
  email: 'parent@demo.com',
  passwordHash: 'parent123',
  role: UserRole.PARENT,
  isVerified: true,
  avatarUrl: '',
  lastLogin: new Date().toISOString(),
  authProvider: 'email' as const,
  linkedStudentId: 'usr_demo_student' // Pre-linked to the demo student
};

class AuthService {
  private users: User[] = [];
  private logs: AuditLog[] = [];
  private invites: Invite[] = [];
  private lessons: Lesson[] = [];
  private requests: JoinRequest[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Load or Seed Users
    const storedUsers = localStorage.getItem(DB_USERS_KEY);
    if (storedUsers) {
      this.users = JSON.parse(storedUsers);
      
      // Ensure default admin always exists
      if (!this.users.find(u => u.email === DEFAULT_ADMIN.email)) {
        this.users.push(DEFAULT_ADMIN);
      }
      
      // Ensure default mentor always exists
      if (!this.users.find(u => u.email === DEFAULT_MENTOR.email)) {
        this.users.push(DEFAULT_MENTOR);
      }

      // Ensure default student always exists
      if (!this.users.find(u => u.email === DEFAULT_STUDENT.email)) {
        this.users.push(DEFAULT_STUDENT);
      }

      // Ensure default parent always exists
      if (!this.users.find(u => u.email === DEFAULT_PARENT.email)) {
        this.users.push(DEFAULT_PARENT);
      }
      
      this.saveUsers();
    } else {
      this.users = [DEFAULT_ADMIN, DEFAULT_MENTOR, DEFAULT_STUDENT, DEFAULT_PARENT];
      this.saveUsers();
    }

    // Load Logs
    const storedLogs = localStorage.getItem(DB_LOGS_KEY);
    if (storedLogs) this.logs = JSON.parse(storedLogs);

    // Load Invites
    const storedInvites = localStorage.getItem(DB_INVITES_KEY);
    if (storedInvites) this.invites = JSON.parse(storedInvites);

    // Load Lessons
    const storedLessons = localStorage.getItem(DB_LESSONS_KEY);
    if (storedLessons) {
      this.lessons = JSON.parse(storedLessons);
    } else {
      // Seed some initial lessons
      this.lessons = [
        { 
          id: '1', 
          title: 'Introduction to Genesis', 
          category: 'Old Testament', 
          author: 'Main Admin', 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString(),
          lesson_type: 'Mixed',
          status: 'published', 
          views: 120,
          description: 'A study of the beginning.',
          sections: [] 
        },
        { 
          id: '2', 
          title: 'The Gospel of John: Chapter 1', 
          category: 'New Testament', 
          author: 'Main Admin', 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString(),
          lesson_type: 'Mixed',
          status: 'published', 
          views: 85,
          description: 'Understanding the Word.',
          sections: [] 
        },
        { 
          id: '3', 
          title: 'Leadership Principles of David', 
          category: 'Leadership', 
          author: 'Main Admin', 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString(),
          lesson_type: 'Leadership',
          status: 'draft', 
          views: 0,
          description: 'Leadership lessons from King David.',
          sections: [] 
        },
      ];
      this.saveLessons();
    }

    // Load Requests
    const storedRequests = localStorage.getItem(DB_REQUESTS_KEY);
    if (storedRequests) this.requests = JSON.parse(storedRequests);
  }

  private saveUsers() {
    localStorage.setItem(DB_USERS_KEY, JSON.stringify(this.users));
  }
  
  private saveLogs() {
    localStorage.setItem(DB_LOGS_KEY, JSON.stringify(this.logs));
  }

  private saveInvites() {
    localStorage.setItem(DB_INVITES_KEY, JSON.stringify(this.invites));
  }

  private saveLessons() {
    localStorage.setItem(DB_LESSONS_KEY, JSON.stringify(this.lessons));
  }

  private saveRequests() {
    localStorage.setItem(DB_REQUESTS_KEY, JSON.stringify(this.requests));
  }

  private logAction(actor: User, action: string, details: string, severity: 'info' | 'warning' | 'critical' = 'info') {
    const log: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      action,
      details,
      severity
    };
    this.logs.unshift(log);
    this.saveLogs();
  }

  private generateClassCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // --- AUTHENTICATION ---

  async register(name: string, email: string, password: string, role: UserRole): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Sim network

    if (this.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("Email already registered");
    }

    const verificationToken = crypto.randomUUID();
    const newUser: User = {
        id: crypto.randomUUID(),
        name,
        email,
        role,
        passwordHash: password, // In real app: hash it
        isVerified: false,
        verificationToken,
        lastLogin: undefined,
        authProvider: 'email',
        classCode: role === UserRole.MENTOR ? this.generateClassCode() : undefined
    };

    this.users.push(newUser);
    this.saveUsers();
    
    this.logAction(newUser, 'REGISTER', `User registered, pending verification`);

    // Simulate Email Sending
    const link = `${window.location.origin}?verify_token=${verificationToken}`;
    console.log(`%c[SIMULATION] Verification Email sent to ${email}. Link: ${link}`, 'color: #059669; font-weight: bold; font-size: 14px;');
  }

  async verifyEmail(token: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Sim network

    const user = this.users.find(u => u.verificationToken === token);
    if (!user) throw new Error("Invalid or expired verification token");

    user.isVerified = true;
    user.verificationToken = undefined; // Clear token
    this.saveUsers();
    this.logAction(user, 'VERIFY_EMAIL', `User verified email address`);
  }

  async login(email: string, password: string): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Sim network

    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) throw new Error("Invalid credentials");
    
    // Check provider
    if (user.authProvider && user.authProvider !== 'email') {
      throw new Error(`Please sign in with ${user.authProvider}`);
    }

    // In real app: await bcrypt.compare(password, user.passwordHash)
    if (user.passwordHash !== password) {
      throw new Error("Invalid credentials");
    }

    if (!user.isVerified) {
      throw new Error("Please verify your email address before logging in. Check your console for the simulation link.");
    }

    user.lastLogin = new Date().toISOString();
    this.saveUsers();
    
    this.logAction(user, 'LOGIN', `User logged in from web client`);
    
    // Set Session
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, exp: Date.now() + 3600000 }));
    
    return user;
  }

  async loginWithSocial(provider: 'google' | 'apple', role?: UserRole): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Sim network delay

    // Mock data based on provider to simulate a successful OAuth callback
    const email = provider === 'google' ? 'social.google@example.com' : 'social.apple@example.com';
    const name = provider === 'google' ? 'Google User' : 'Apple User';

    let user = this.users.find(u => u.email === email);
    
    if (!user) {
        // Auto-register new social user
        user = {
            id: crypto.randomUUID(),
            name,
            email,
            role: role || UserRole.STUDENT, // Use selected role or default to Student
            authProvider: provider,
            isVerified: true, // Social accounts are trusted
            lastLogin: new Date().toISOString(),
            classCode: (role === UserRole.MENTOR) ? this.generateClassCode() : undefined
        };
        this.users.push(user);
        this.saveUsers();
        this.logAction(user, 'REGISTER_SOCIAL', `User registered via ${provider} as ${user.role}`);
    } else {
        // Log existing user in
        user.lastLogin = new Date().toISOString();
        this.saveUsers();
        this.logAction(user, 'LOGIN_SOCIAL', `User logged in via ${provider}`);
    }

    // Set Session
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, exp: Date.now() + 3600000 }));
    return user;
  }

  async logout(): Promise<void> {
    localStorage.removeItem(SESSION_KEY);
  }

  async getSession(): Promise<User | null> {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;
    
    try {
      const session = JSON.parse(sessionStr);
      if (Date.now() > session.exp) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return this.users.find(u => u.id === session.userId) || null;
    } catch {
      return null;
    }
  }

  // --- USER MANAGEMENT ---

  async getAllUsers(adminUser: User): Promise<User[]> {
    if (adminUser.role !== UserRole.ADMIN) throw new Error("Unauthorized");
    return this.users;
  }

  async updateUserRole(adminUser: User, targetUserId: string, newRole: UserRole): Promise<void> {
    if (adminUser.role !== UserRole.ADMIN) throw new Error("Unauthorized");
    
    const target = this.users.find(u => u.id === targetUserId);
    if (!target) throw new Error("User not found");
    
    // Prevent removing own admin status
    if (target.email === DEFAULT_ADMIN.email && newRole !== UserRole.ADMIN) {
       throw new Error("Cannot demote the Super Admin.");
    }

    const oldRole = target.role;
    target.role = newRole;
    
    // Generate class code if promoting to Mentor
    if (newRole === UserRole.MENTOR && !target.classCode) {
        target.classCode = this.generateClassCode();
    }

    this.saveUsers();
    
    this.logAction(adminUser, 'UPDATE_ROLE', `Changed ${target.email} from ${oldRole} to ${newRole}`, 'warning');
  }

  async changePassword(user: User, currentPass: string, newPass: string): Promise<void> {
    const target = this.users.find(u => u.id === user.id);
    if (!target) throw new Error("User not found");

    // If user used social login, they might not have a password hash
    if (!target.passwordHash && target.authProvider !== 'email') {
        throw new Error(`You are logged in via ${target.authProvider}. You cannot change password here.`);
    }

    if (target.passwordHash !== currentPass) {
       throw new Error("Current password is incorrect");
    }

    target.passwordHash = newPass;
    this.saveUsers();
    this.logAction(user, 'CHANGE_PASSWORD', `User changed their own password`);
  }

  // --- INVITES & REGISTRATION ---

  async createInvite(adminUser: User, email: string, role: UserRole): Promise<string> {
    if (adminUser.role !== UserRole.ADMIN) throw new Error("Unauthorized");

    // Check if user exists
    if (this.users.find(u => u.email === email)) throw new Error("User already exists");

    const token = crypto.randomUUID();
    const invite: Invite = {
      id: crypto.randomUUID(),
      token,
      email,
      role,
      invitedBy: adminUser.name,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 72 * 3600000).toISOString(), // 72 hours
      status: 'pending'
    };

    this.invites.push(invite);
    this.saveInvites();
    
    this.logAction(adminUser, 'CREATE_INVITE', `Created invite for ${email} as ${role}`);
    
    return token;
  }

  async validateInvite(token: string): Promise<Invite> {
    const invite = this.invites.find(i => i.token === token);
    if (!invite) throw new Error("Invalid invite token");
    if (invite.status !== 'pending') throw new Error("Invite already used or expired");
    if (new Date() > new Date(invite.expiresAt)) throw new Error("Invite expired");
    return invite;
  }

  async acceptInvite(token: string, name: string, password: string): Promise<User> {
    const invite = await this.validateInvite(token);
    
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email: invite.email,
      role: invite.role,
      passwordHash: password,
      isVerified: true,
      lastLogin: new Date().toISOString(),
      authProvider: 'email',
      classCode: invite.role === UserRole.MENTOR ? this.generateClassCode() : undefined
    };

    this.users.push(newUser);
    
    invite.status = 'accepted';
    this.saveInvites();
    this.saveUsers();
    
    // Auto login
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: newUser.id, exp: Date.now() + 3600000 }));
    
    // Log system action
    const log: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      actorId: newUser.id,
      actorName: newUser.name,
      action: 'ACCEPT_INVITE',
      details: `User registered via invite token`,
      severity: 'info'
    };
    this.logs.unshift(log);
    this.saveLogs();

    return newUser;
  }

  async getLogs(adminUser: User): Promise<AuditLog[]> {
    if (adminUser.role !== UserRole.ADMIN) throw new Error("Unauthorized");
    return this.logs;
  }

  // --- LESSONS MANAGEMENT ---
  
  async getLessons(): Promise<Lesson[]> {
    return this.lessons;
  }

  async addLesson(user: User, title: string, category: string): Promise<void> {
    // ALLOW ADMIN OR MENTOR
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.MENTOR) {
      throw new Error("Unauthorized");
    }

    const newLesson: Lesson = {
      id: crypto.randomUUID(),
      title,
      category,
      author: user.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lesson_type: 'Mixed',
      status: user.role === UserRole.ADMIN ? 'published' : 'draft', // Admin publishes directly, others might default to draft
      views: 0,
      description: '',
      sections: []
    };
    
    this.lessons.unshift(newLesson);
    this.saveLessons();
    this.logAction(user, 'CREATE_LESSON', `Created lesson: ${title}`);
  }

  // --- CLASS & MENTOR MANAGEMENT (STUDENT) ---

  async getAllMentors(): Promise<User[]> {
      return this.users.filter(u => u.role === UserRole.MENTOR);
  }

  async joinClass(student: User, code: string): Promise<void> {
      const mentor = this.users.find(u => u.classCode === code.toUpperCase() && u.role === UserRole.MENTOR);
      if (!mentor) throw new Error("Invalid Class Code.");

      if (student.role !== UserRole.STUDENT) throw new Error("Only students can join classes.");

      const currentUserRecord = this.users.find(u => u.id === student.id);
      if (currentUserRecord) {
          currentUserRecord.mentorId = mentor.id;
          this.saveUsers();
          this.logAction(student, 'JOIN_CLASS', `Joined mentor ${mentor.name}'s class via code`);
      }
  }

  async requestJoinMentor(student: User, mentorId: string): Promise<void> {
      const mentor = this.users.find(u => u.id === mentorId);
      if (!mentor) throw new Error("Mentor not found.");

      // Check if already requested
      const existing = this.requests.find(r => r.studentId === student.id && r.mentorId === mentorId && r.status === 'pending');
      if (existing) throw new Error("Request already pending.");

      const req: JoinRequest = {
          id: crypto.randomUUID(),
          studentId: student.id,
          studentName: student.name,
          mentorId: mentorId,
          status: 'pending',
          timestamp: new Date().toISOString()
      };

      this.requests.push(req);
      this.saveRequests();
      this.logAction(student, 'REQUEST_JOIN', `Requested to join ${mentor.name}`);
  }

  async getJoinRequests(mentor: User): Promise<JoinRequest[]> {
      if (mentor.role !== UserRole.MENTOR) return [];
      return this.requests.filter(r => r.mentorId === mentor.id && r.status === 'pending');
  }

  async respondToRequest(requestId: string, status: 'accepted' | 'rejected', mentor: User): Promise<void> {
      const req = this.requests.find(r => r.id === requestId);
      if (!req) throw new Error("Request not found");
      if (req.mentorId !== mentor.id) throw new Error("Unauthorized");

      req.status = status;
      this.saveRequests();

      if (status === 'accepted') {
          const student = this.users.find(u => u.id === req.studentId);
          if (student) {
              student.mentorId = mentor.id;
              this.saveUsers();
          }
      }
  }

  // --- PARENT MANAGEMENT ---

  async linkParentToStudent(parent: User, studentEmail: string): Promise<void> {
      // Find Student
      const student = this.users.find(u => u.email.toLowerCase() === studentEmail.toLowerCase() && u.role === UserRole.STUDENT);
      if (!student) {
          throw new Error("Student email not found. Please ensure the student is registered.");
      }
      
      const parentRecord = this.users.find(u => u.id === parent.id);
      if (parentRecord) {
          parentRecord.linkedStudentId = student.id;
          this.saveUsers();
          this.logAction(parent, 'LINK_STUDENT', `Linked to student account: ${student.email}`);
      }
  }
}

export const authService = new AuthService();
