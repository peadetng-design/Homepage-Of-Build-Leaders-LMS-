
import { User, UserRole, AuditLog, Invite, Lesson, JoinRequest } from '../types';

// STORAGE KEYS
const DB_USERS_KEY = 'bbl_db_users';
const DB_LOGS_KEY = 'bbl_db_logs';
const DB_INVITES_KEY = 'bbl_db_invites';
const DB_LESSONS_KEY = 'bbl_db_lessons';
const DB_REQUESTS_KEY = 'bbl_db_requests';
const SESSION_KEY = 'bbl_session_token';

// DEFAULT ADMIN CREDENTIALS
// CRITICAL: This specific email is the ROOT SYSTEM ADMIN
const DEFAULT_ADMIN_EMAIL = 'peadetng@gmail.com';
const DEFAULT_ADMIN = {
  id: 'usr_main_admin',
  name: 'System Admin',
  email: DEFAULT_ADMIN_EMAIL, 
  passwordHash: 'Peter.Adetunji2023#',
  role: UserRole.ADMIN,
  isVerified: true,
  avatarUrl: '',
  lastLogin: new Date().toISOString(),
  authProvider: 'email' as const
};

// DEFAULT ORG ADMIN (FOR DEMO)
const DEFAULT_ORG = {
  id: 'usr_demo_org',
  name: 'Grace Community Church',
  email: 'org@demo.com',
  passwordHash: 'org123',
  role: UserRole.ORGANIZATION,
  isVerified: true,
  avatarUrl: '',
  lastLogin: new Date().toISOString(),
  authProvider: 'email' as const,
  organizationCode: 'ORG777'
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
  classCode: 'DEMO01',
  organizationId: 'usr_demo_org', // Linked to default Org
  createdBy: 'usr_demo_org' // Created by Org
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
  mentorId: 'usr_demo_mentor',
  organizationId: 'usr_demo_org', // Cascade link
  createdBy: 'usr_demo_mentor'
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
  linkedStudentId: 'usr_demo_student'
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
    const storedUsers = localStorage.getItem(DB_USERS_KEY);
    if (storedUsers) {
      this.users = JSON.parse(storedUsers);
      
      // Seed Defaults if missing (Ensure Org is added if old DB exists)
      const defaults = [DEFAULT_ORG, DEFAULT_MENTOR, DEFAULT_STUDENT, DEFAULT_PARENT];
      defaults.forEach(def => {
          if (!this.users.find(u => u.email === def.email)) {
              this.users.push(def);
          }
      });

      // CRITICAL FIX: ENSURE DEFAULT ADMIN ALWAYS EXISTS AND HAS ADMIN ROLE
      const adminIndex = this.users.findIndex(u => u.email === DEFAULT_ADMIN_EMAIL);
      if (adminIndex !== -1) {
          // Force update role and essential credentials to ensure admin access
          this.users[adminIndex].role = UserRole.ADMIN;
          if (!this.users[adminIndex].passwordHash) this.users[adminIndex].passwordHash = DEFAULT_ADMIN.passwordHash;
      } else {
          // Create if not exists
          this.users.unshift(DEFAULT_ADMIN);
      }

      this.saveUsers();
    } else {
      this.users = [DEFAULT_ADMIN, DEFAULT_ORG, DEFAULT_MENTOR, DEFAULT_STUDENT, DEFAULT_PARENT];
      this.saveUsers();
    }

    const storedLogs = localStorage.getItem(DB_LOGS_KEY);
    if (storedLogs) this.logs = JSON.parse(storedLogs);

    const storedInvites = localStorage.getItem(DB_INVITES_KEY);
    if (storedInvites) this.invites = JSON.parse(storedInvites);

    const storedLessons = localStorage.getItem(DB_LESSONS_KEY);
    if (storedLessons) {
      this.lessons = JSON.parse(storedLessons);
    } else {
       // Seed lessons if empty
       this.lessons = []; 
    }
    
    const storedRequests = localStorage.getItem(DB_REQUESTS_KEY);
    if (storedRequests) this.requests = JSON.parse(storedRequests);
  }

  private saveUsers() { localStorage.setItem(DB_USERS_KEY, JSON.stringify(this.users)); }
  private saveLogs() { localStorage.setItem(DB_LOGS_KEY, JSON.stringify(this.logs)); }
  private saveInvites() { localStorage.setItem(DB_INVITES_KEY, JSON.stringify(this.invites)); }
  private saveLessons() { localStorage.setItem(DB_LESSONS_KEY, JSON.stringify(this.lessons)); }
  private saveRequests() { localStorage.setItem(DB_REQUESTS_KEY, JSON.stringify(this.requests)); }

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

  private generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // --- AUTH ---

  async register(name: string, email: string, password: string, role: UserRole, orgCode?: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 800));

    if (this.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("Email already registered");
    }

    // Resolve Org Code if provided (For Mentors joining an Org)
    let organizationId = undefined;
    if (role === UserRole.MENTOR && orgCode) {
        const org = this.users.find(u => u.role === UserRole.ORGANIZATION && u.organizationCode === orgCode.toUpperCase());
        if (!org) throw new Error("Invalid Organization Code");
        organizationId = org.id;
    }

    const verificationToken = crypto.randomUUID();
    const newUser: User = {
        id: crypto.randomUUID(),
        name,
        email,
        role,
        passwordHash: password,
        isVerified: false,
        verificationToken,
        lastLogin: undefined,
        authProvider: 'email',
        // Generate codes based on role
        classCode: role === UserRole.MENTOR ? this.generateCode() : undefined,
        organizationCode: role === UserRole.ORGANIZATION ? this.generateCode() : undefined,
        organizationId: organizationId
    };

    this.users.push(newUser);
    this.saveUsers();
    
    this.logAction(newUser, 'REGISTER', `User registered as ${role}`);

    const link = `${window.location.origin}?verify_token=${verificationToken}`;
    console.log(`%c[SIMULATION] Verification Email sent to ${email}. Link: ${link}`, 'color: #059669; font-weight: bold; font-size: 14px;');
  }

  async verifyEmail(token: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const user = this.users.find(u => u.verificationToken === token);
    if (!user) throw new Error("Invalid token");
    user.isVerified = true;
    user.verificationToken = undefined;
    this.saveUsers();
  }

  async login(email: string, password: string): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error("Invalid credentials");
    if (user.authProvider && user.authProvider !== 'email') throw new Error(`Sign in with ${user.authProvider}`);
    if (user.passwordHash !== password) throw new Error("Invalid credentials");
    if (!user.isVerified) throw new Error("Verify email first.");

    user.lastLogin = new Date().toISOString();
    this.saveUsers();
    this.logAction(user, 'LOGIN', `User logged in`);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, exp: Date.now() + 3600000 }));
    return user;
  }

  async loginWithSocial(provider: 'google' | 'apple', role?: UserRole): Promise<User> {
      // (Social login implementation same as before)
      await new Promise(resolve => setTimeout(resolve, 1000));
      // SIMULATION: If trying to simulate admin login via social (optional logic)
      const email = provider === 'google' ? 'social.google@example.com' : 'social.apple@example.com';
      let user = this.users.find(u => u.email === email);
      if(!user) {
          user = {
              id: crypto.randomUUID(),
              name: provider === 'google' ? 'Google User' : 'Apple User',
              email,
              role: role || UserRole.STUDENT,
              authProvider: provider,
              isVerified: true,
              lastLogin: new Date().toISOString(),
              classCode: role === UserRole.MENTOR ? this.generateCode() : undefined,
              organizationCode: role === UserRole.ORGANIZATION ? this.generateCode() : undefined
          };
          this.users.push(user);
          this.saveUsers();
      } else {
          user.lastLogin = new Date().toISOString();
          this.saveUsers();
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, exp: Date.now() + 3600000 }));
      return user;
  }

  async logout(): Promise<void> { localStorage.removeItem(SESSION_KEY); }

  async getSession(): Promise<User | null> {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (!sessionStr) return null;
    try {
      const session = JSON.parse(sessionStr);
      if (Date.now() > session.exp) return null;
      return this.users.find(u => u.id === session.userId) || null;
    } catch { return null; }
  }

  // --- ORGANIZATION MANAGEMENT ---

  // Get all members of an organization (Mentors and Students)
  async getOrganizationMembers(orgId: string): Promise<{mentors: User[], students: User[]}> {
      const mentors = this.users.filter(u => u.role === UserRole.MENTOR && u.organizationId === orgId);
      const students = this.users.filter(u => u.role === UserRole.STUDENT && u.organizationId === orgId);
      return { mentors, students };
  }

  // Create Mentor directly by Org Admin
  async createMentorDirectly(orgAdmin: User, name: string, email: string, password: string): Promise<void> {
      if (orgAdmin.role !== UserRole.ORGANIZATION) throw new Error("Unauthorized");
      if (this.users.find(u => u.email === email)) throw new Error("Email exists");

      const newMentor: User = {
          id: crypto.randomUUID(),
          name,
          email,
          role: UserRole.MENTOR,
          passwordHash: password,
          isVerified: true, // Auto-verified since created by Admin
          authProvider: 'email',
          organizationId: orgAdmin.id,
          classCode: this.generateCode(),
          lastLogin: undefined,
          createdBy: orgAdmin.id
      };
      
      this.users.push(newMentor);
      this.saveUsers();
      this.logAction(orgAdmin, 'CREATE_MENTOR', `Directly created mentor ${email}`);
  }

  async deleteUser(actor: User, targetId: string): Promise<void> {
      const allowedRoles = [UserRole.ADMIN, UserRole.ORGANIZATION, UserRole.MENTOR];
      if (!allowedRoles.includes(actor.role)) throw new Error("Unauthorized");
      
      const targetIndex = this.users.findIndex(u => u.id === targetId);
      if (targetIndex === -1) throw new Error("User not found");
      const target = this.users[targetIndex];

      // CRITICAL SECURITY: NO ONE CAN DELETE THE SYSTEM ADMIN
      if (target.email === DEFAULT_ADMIN_EMAIL) {
          throw new Error("Cannot delete System Admin. This account is protected.");
      }

      // Permissions check
      if (actor.role !== UserRole.ADMIN) {
          // Cannot delete admins
          if (target.role === UserRole.ADMIN) {
             throw new Error("Insufficient permissions to delete Administrator.");
          }
          
          // Strict Ownership Check: Must be creator OR direct hierarchy manager
          const isCreator = target.createdBy === actor.id;
          const isOrgManager = (actor.role === UserRole.ORGANIZATION && target.organizationId === actor.id);
          const isMentorManager = (actor.role === UserRole.MENTOR && target.mentorId === actor.id);

          if (!isCreator && !isOrgManager && !isMentorManager) {
              throw new Error("You can only delete users you invited or manage.");
          }
      }

      this.users.splice(targetIndex, 1);
      this.saveUsers();
      this.logAction(actor, 'DELETE_USER', `Deleted user ${target.email} (${target.role})`);
  }

  // --- GENERAL MANAGEMENT ---

  async getAllUsers(actor: User): Promise<User[]> {
    // ADMIN: See all
    if (actor.role === UserRole.ADMIN) {
        return this.users;
    }

    // ORGANIZATION: See members of org OR users created by them
    if (actor.role === UserRole.ORGANIZATION) {
        return this.users.filter(u => 
            u.organizationId === actor.id || 
            u.createdBy === actor.id
        );
    }

    // MENTOR: See students in class OR users created by them
    if (actor.role === UserRole.MENTOR) {
        return this.users.filter(u => 
            u.mentorId === actor.id || 
            u.createdBy === actor.id
        );
    }

    // OTHERS: None
    throw new Error("Unauthorized");
  }
  
  async getLogs(adminUser: User): Promise<AuditLog[]> { return this.logs; }

  async updateUserRole(actor: User, targetId: string, role: UserRole): Promise<void> {
      const allowedRoles = [UserRole.ADMIN, UserRole.ORGANIZATION, UserRole.MENTOR];
      if (!allowedRoles.includes(actor.role)) throw new Error("Unauthorized");

      const u = this.users.find(u => u.id === targetId);
      if(u) {
          // CRITICAL SECURITY: Cannot change System Admin's role
          if (u.email === DEFAULT_ADMIN_EMAIL) {
             throw new Error("Cannot change role of System Admin");
          }
          
          // ADMIN: Full access (except System Admin check above)
          if (actor.role === UserRole.ADMIN) {
             // Continue
          } else {
             // NON-ADMIN: Ownership check
             const isCreator = u.createdBy === actor.id;
             const isOrgManager = (actor.role === UserRole.ORGANIZATION && u.organizationId === actor.id);
             const isMentorManager = (actor.role === UserRole.MENTOR && u.mentorId === actor.id);

             if (!isCreator && !isOrgManager && !isMentorManager) {
                 throw new Error("You can only change roles for users you invited or manage.");
             }
             
             // Prevent non-admin from creating/modifying Admins
             if (role === UserRole.ADMIN || u.role === UserRole.ADMIN) {
                 throw new Error("Insufficient permissions to assign or modify Admin role.");
             }
          }

          u.role = role;
          if (role === UserRole.MENTOR && !u.classCode) u.classCode = this.generateCode();
          if (role === UserRole.ORGANIZATION && !u.organizationCode) u.organizationCode = this.generateCode();
          this.saveUsers();
      }
  }

  async changePassword(user: User, oldP: string, newP: string): Promise<void> {
      const u = this.users.find(u => u.id === user.id);
      if(!u) throw new Error("User not found");
      if(u.passwordHash !== oldP) throw new Error("Incorrect password");
      u.passwordHash = newP;
      this.saveUsers();
  }

  // --- INVITES ---
  
  async createInvite(actor: User, email: string, role: UserRole): Promise<string> {
      // Allow Admin, Org, and Mentor to create invites
      const allowedRoles = [UserRole.ADMIN, UserRole.ORGANIZATION, UserRole.MENTOR];
      if (!allowedRoles.includes(actor.role)) throw new Error("Unauthorized");
      
      const token = crypto.randomUUID();
      const invite: Invite = {
          id: crypto.randomUUID(),
          token,
          email,
          role,
          invitedBy: actor.name,
          inviterId: actor.id, // Track ownership
          organizationId: actor.role === UserRole.ORGANIZATION ? actor.id : undefined,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 72*3600000).toISOString(),
          status: 'pending'
      };
      this.invites.push(invite);
      this.saveInvites();
      return token;
  }

  async getInvites(actor: User): Promise<Invite[]> {
      const allowedRoles = [UserRole.ADMIN, UserRole.ORGANIZATION, UserRole.MENTOR];
      if (!allowedRoles.includes(actor.role)) throw new Error("Unauthorized");
      
      // Admin sees all pending
      if (actor.role === UserRole.ADMIN) {
           return this.invites.filter(i => i.status === 'pending');
      }
      
      // Org/Mentor sees only their own invites
      return this.invites.filter(i => i.status === 'pending' && i.inviterId === actor.id);
  }

  async deleteInvite(actor: User, inviteId: string): Promise<void> {
      const allowedRoles = [UserRole.ADMIN, UserRole.ORGANIZATION, UserRole.MENTOR];
      if (!allowedRoles.includes(actor.role)) throw new Error("Unauthorized");

      const idx = this.invites.findIndex(i => i.id === inviteId);
      if (idx === -1) throw new Error("Invite not found");
      const invite = this.invites[idx];
      
      if (actor.role !== UserRole.ADMIN) {
          if (invite.inviterId !== actor.id) {
              throw new Error("You can only revoke invites you created.");
          }
      }

      this.invites.splice(idx, 1);
      this.saveInvites();
  }
  
  async validateInvite(token: string) { return this.invites.find(i => i.token === token && i.status === 'pending'); }
  
  async acceptInvite(token: string, name: string, pass: string): Promise<User> {
      const inv = await this.validateInvite(token);
      if(!inv) throw new Error("Invalid invite");
      
      const user: User = {
          id: crypto.randomUUID(),
          name,
          email: inv.email,
          role: inv.role,
          passwordHash: pass,
          isVerified: true,
          authProvider: 'email',
          organizationId: inv.organizationId, // Link if Org Invite
          classCode: inv.role === UserRole.MENTOR ? this.generateCode() : undefined,
          lastLogin: new Date().toISOString(),
          createdBy: inv.inviterId // Link to inviter
      };
      this.users.push(user);
      inv.status = 'accepted';
      this.saveInvites();
      this.saveUsers();
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, exp: Date.now() + 3600000 }));
      return user;
  }

  // --- CLASS & REQUESTS ---

  async joinClass(student: User, code: string): Promise<void> {
      const mentor = this.users.find(u => u.classCode === code.toUpperCase() && u.role === UserRole.MENTOR);
      if (!mentor) throw new Error("Invalid Class Code");
      
      const s = this.users.find(u => u.id === student.id);
      if (s) {
          s.mentorId = mentor.id;
          // IMPORTANT: Link student to Mentor's Organization as well
          if (mentor.organizationId) {
              s.organizationId = mentor.organizationId;
          }
          this.saveUsers();
      }
  }

  async getAllMentors(): Promise<User[]> { return this.users.filter(u => u.role === UserRole.MENTOR); }
  async getJoinRequests(m: User): Promise<JoinRequest[]> { return this.requests.filter(r => r.mentorId === m.id && r.status === 'pending'); }
  async requestJoinMentor(s: User, mId: string): Promise<void> {
      if (this.requests.find(r => r.studentId === s.id && r.mentorId === mId && r.status === 'pending')) throw new Error("Pending");
      this.requests.push({ id: crypto.randomUUID(), studentId: s.id, studentName: s.name, mentorId: mId, status: 'pending', timestamp: new Date().toISOString() });
      this.saveRequests();
  }
  async respondToRequest(rid: string, status: 'accepted'|'rejected', mentor: User): Promise<void> {
      const r = this.requests.find(x => x.id === rid);
      if(r) {
          r.status = status;
          if(status === 'accepted') {
              const s = this.users.find(u => u.id === r.studentId);
              if(s) {
                  s.mentorId = mentor.id;
                  if(mentor.organizationId) s.organizationId = mentor.organizationId;
              }
          }
          this.saveRequests();
          this.saveUsers();
      }
  }

  async linkParentToStudent(parent: User, studentEmail: string): Promise<void> {
      const student = this.users.find(u => u.email === studentEmail && u.role === UserRole.STUDENT);
      if (!student) throw new Error("Student not found");
      const p = this.users.find(u => u.id === parent.id);
      if(p) { p.linkedStudentId = student.id; this.saveUsers(); }
  }

  // --- LESSONS ---
  async getLessons() { return this.lessons; }
}

export const authService = new AuthService();
