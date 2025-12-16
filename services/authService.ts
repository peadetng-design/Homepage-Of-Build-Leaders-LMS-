
import { User, UserRole, AuditLog, Invite, Lesson, JoinRequest, ChatChannel } from '../types';

// STORAGE KEYS
const DB_USERS_KEY = 'bbl_db_users';
const DB_LOGS_KEY = 'bbl_db_logs';
const DB_INVITES_KEY = 'bbl_db_invites';
const DB_LESSONS_KEY = 'bbl_db_lessons';
const DB_REQUESTS_KEY = 'bbl_db_requests';
const DB_CHANNELS_KEY = 'bbl_db_channels'; // New Key
const SESSION_KEY = 'bbl_session_token';

// DEFAULT ADMIN CREDENTIALS
// CRITICAL: This specific email is the ROOT SYSTEM ADMIN and must be protected
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
  authProvider: 'email' as const,
  allowedRoles: [UserRole.ADMIN],
  curatedLessonIds: []
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
  organizationCode: 'ORG777',
  allowedRoles: [UserRole.ORGANIZATION],
  curatedLessonIds: []
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
  createdBy: 'usr_demo_org', // Created by Org
  allowedRoles: [UserRole.MENTOR],
  curatedLessonIds: ['demo-lesson-1']
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
  createdBy: 'usr_demo_mentor',
  allowedRoles: [UserRole.STUDENT],
  curatedLessonIds: []
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
  linkedStudentId: 'usr_demo_student',
  allowedRoles: [UserRole.PARENT],
  curatedLessonIds: []
};

class AuthService {
  private users: User[] = [];
  private logs: AuditLog[] = [];
  private invites: Invite[] = [];
  private lessons: Lesson[] = [];
  private requests: JoinRequest[] = [];
  private channels: ChatChannel[] = []; // Chat Channels

  constructor() {
    this.init();
  }

  private init() {
    const storedUsers = localStorage.getItem(DB_USERS_KEY);
    if (storedUsers) {
      this.users = JSON.parse(storedUsers);
      
      // MIGRATION: Ensure allowedRoles and curatedLessonIds exist for all existing users
      let usersUpdated = false;
      this.users.forEach(u => {
          if (!u.allowedRoles) {
              u.allowedRoles = [u.role];
              usersUpdated = true;
          }
          if (!u.curatedLessonIds) {
              u.curatedLessonIds = [];
              usersUpdated = true;
          }
          // Fix: Ensure Root Admin has allowedRoles
          if (u.email === DEFAULT_ADMIN_EMAIL && !u.allowedRoles.includes(UserRole.ADMIN)) {
              u.allowedRoles.push(UserRole.ADMIN);
              usersUpdated = true;
          }
      });
      if (usersUpdated) this.saveUsers();

      // Seed Defaults if missing
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
          if (!this.users[adminIndex].allowedRoles?.includes(UserRole.ADMIN)) {
             this.users[adminIndex].allowedRoles = [UserRole.ADMIN];
          }
          // Keep ID stable, update password if needed
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

    const storedChannels = localStorage.getItem(DB_CHANNELS_KEY);
    if (storedChannels) this.channels = JSON.parse(storedChannels);
  }

  private saveUsers() { localStorage.setItem(DB_USERS_KEY, JSON.stringify(this.users)); }
  private saveLogs() { localStorage.setItem(DB_LOGS_KEY, JSON.stringify(this.logs)); }
  private saveInvites() { localStorage.setItem(DB_INVITES_KEY, JSON.stringify(this.invites)); }
  private saveLessons() { localStorage.setItem(DB_LESSONS_KEY, JSON.stringify(this.lessons)); }
  private saveRequests() { localStorage.setItem(DB_REQUESTS_KEY, JSON.stringify(this.requests)); }
  private saveChannels() { localStorage.setItem(DB_CHANNELS_KEY, JSON.stringify(this.channels)); }

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
        organizationId: organizationId,
        allowedRoles: [role], // Initialize with requested role
        curatedLessonIds: []
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
    // Ensure allowedRoles is set (for migration robustness)
    if (!user.allowedRoles) user.allowedRoles = [user.role];
    if (!user.curatedLessonIds) user.curatedLessonIds = [];
    
    this.saveUsers();
    this.logAction(user, 'LOGIN', `User logged in`);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, exp: Date.now() + 3600000 }));
    return user;
  }

  async loginWithSocial(provider: 'google' | 'apple', role?: UserRole): Promise<User> {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // FIX: FORCE Google Login to point to System Admin for the requested 'peadetng@gmail.com'
      const email = provider === 'google' ? DEFAULT_ADMIN_EMAIL : 'social.apple@example.com';
      
      let user = this.users.find(u => u.email === email);
      
      if(!user) {
          if (email === DEFAULT_ADMIN_EMAIL) {
               // Recover Admin if it was somehow deleted
               user = { ...DEFAULT_ADMIN };
               this.users.unshift(user);
          } else {
             // Normal user creation (Apple or other)
              user = {
                  id: crypto.randomUUID(),
                  name: provider === 'google' ? 'Google User' : 'Apple User',
                  email,
                  role: role || UserRole.STUDENT,
                  authProvider: provider,
                  isVerified: true,
                  lastLogin: new Date().toISOString(),
                  classCode: role === UserRole.MENTOR ? this.generateCode() : undefined,
                  organizationCode: role === UserRole.ORGANIZATION ? this.generateCode() : undefined,
                  allowedRoles: [role || UserRole.STUDENT],
                  curatedLessonIds: []
              };
              this.users.push(user);
          }
          this.saveUsers();
      } else {
          // If the user exists (Admin), ENSURE they are an ADMIN
          if (user.email === DEFAULT_ADMIN_EMAIL && user.role !== UserRole.ADMIN) {
             console.warn("Restoring System Admin privileges");
             user.role = UserRole.ADMIN;
             if (!user.allowedRoles?.includes(UserRole.ADMIN)) {
                 user.allowedRoles = [...(user.allowedRoles || []), UserRole.ADMIN];
             }
          }
          
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

  // --- CHAT CHANNELS ---

  async createChatChannel(creator: User, name: string, description: string, config: Partial<ChatChannel>): Promise<void> {
      // Validate Permissions
      if (creator.role === UserRole.STUDENT || creator.role === UserRole.PARENT) {
          throw new Error("Unauthorized to create group chats");
      }

      const newChannel: ChatChannel = {
          id: crypto.randomUUID(),
          name,
          description,
          creatorId: creator.id,
          scope: creator.role === UserRole.ADMIN ? 'global' : creator.role === UserRole.ORGANIZATION ? 'org' : 'class',
          orgId: creator.role === UserRole.ORGANIZATION ? creator.id : undefined,
          mentorId: creator.role === UserRole.MENTOR ? creator.id : undefined,
          includeRoles: config.includeRoles || [],
          includeStudentsOfMentors: config.includeStudentsOfMentors || false,
          createdAt: new Date().toISOString()
      };

      this.channels.push(newChannel);
      this.saveChannels();
      this.logAction(creator, 'CREATE_CHANNEL', `Created channel: ${name}`);
  }

  async getUserChannels(user: User): Promise<ChatChannel[]> {
      return this.channels.filter(ch => {
          // 1. Creator always sees their channels
          if (ch.creatorId === user.id) return true;

          // 2. Filter by Scope
          if (ch.scope === 'global') {
              // Global: Check role match
              if (ch.includeRoles.includes(user.role)) return true;
              
              // If Admin selected "Mentors + Students" (via includeStudentsOfMentors logic)
              if (ch.includeStudentsOfMentors && user.role === UserRole.STUDENT) {
                  // Admin "Global" + Students means ALL students in the system
                  return true;
              }
          }
          
          if (ch.scope === 'org') {
              // Must belong to this Org
              if (user.organizationId !== ch.orgId && user.id !== ch.orgId) return false;
              
              if (ch.includeRoles.includes(user.role)) return true;
              if (ch.includeStudentsOfMentors && user.role === UserRole.STUDENT) return true;
          }

          if (ch.scope === 'class') {
              // Must belong to this Mentor
              if (user.mentorId !== ch.mentorId && user.id !== ch.mentorId) return false;
              
              // Class channels usually include students
              if (user.role === UserRole.STUDENT) return true;
          }

          return false;
      });
  }

  // --- CURATED LESSONS ---

  async toggleCuratedLesson(actor: User, lessonId: string): Promise<boolean> {
      const user = this.users.find(u => u.id === actor.id);
      if (!user) throw new Error("User not found");
      
      if (!user.curatedLessonIds) user.curatedLessonIds = [];
      
      let added = false;
      if (user.curatedLessonIds.includes(lessonId)) {
          user.curatedLessonIds = user.curatedLessonIds.filter(id => id !== lessonId);
      } else {
          user.curatedLessonIds.push(lessonId);
          added = true;
      }
      this.saveUsers();
      return added;
  }

  async getCuratedLessonIdsForStudent(student: User): Promise<string[]> {
      const ids: Set<string> = new Set();
      
      // 1. Get Mentor's curated list
      if (student.mentorId) {
          const mentor = this.users.find(u => u.id === student.mentorId);
          if (mentor && mentor.curatedLessonIds) {
              mentor.curatedLessonIds.forEach(id => ids.add(id));
          }
      }

      // 2. Get Organization's curated list
      if (student.organizationId) {
          const org = this.users.find(u => u.id === student.organizationId);
          if (org && org.curatedLessonIds) {
              org.curatedLessonIds.forEach(id => ids.add(id));
          }
      }

      return Array.from(ids);
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
          createdBy: orgAdmin.id,
          allowedRoles: [UserRole.MENTOR],
          curatedLessonIds: []
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
          // When admin manually changes role, reset allowedRoles to match new role to avoid confusion, 
          // unless logic suggests otherwise. For simplicity, we reset here for manual admin actions.
          u.allowedRoles = [role]; 
          
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
          createdBy: inv.inviterId, // Link to inviter
          allowedRoles: [inv.role],
          curatedLessonIds: []
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

  // --- GROUP CREATION ---

  async createGroup(user: User, groupName: string): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const targetUser = this.users.find(u => u.id === user.id);
    if (!targetUser) throw new Error("User not found");

    // Initialize allowedRoles if missing (backward compatibility)
    if (!targetUser.allowedRoles) {
        targetUser.allowedRoles = [targetUser.role];
    }

    // Add Mentor role if not present, ensuring we keep the original role
    if (!targetUser.allowedRoles.includes(UserRole.MENTOR)) {
        targetUser.allowedRoles.push(UserRole.MENTOR);
    }

    // Upgrade Logic: Set active role to MENTOR
    if (targetUser.role !== UserRole.MENTOR) {
        targetUser.role = UserRole.MENTOR;
    }

    // Ensure Class Code
    if (!targetUser.classCode) {
      targetUser.classCode = this.generateCode();
    }
    
    // Set Group Name
    targetUser.groupName = groupName;

    this.saveUsers();
    this.logAction(targetUser, 'CREATE_GROUP', `User created group: ${groupName}`);

    return targetUser;
  }

  // --- LESSONS ---
  async getLessons() { return this.lessons; }
}

export const authService = new AuthService();
