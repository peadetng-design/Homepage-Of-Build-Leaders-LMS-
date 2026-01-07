import { User, UserRole, AuditLog, Invite, Lesson, JoinRequest, ChatChannel, ChatMessage, ChatAttachment } from '../types';

// STORAGE KEYS
const DB_USERS_KEY = 'bbl_db_users';
const DB_LOGS_KEY = 'bbl_db_logs';
const DB_INVITES_KEY = 'bbl_db_invites';
const DB_LESSONS_KEY = 'bbl_db_lessons';
const DB_REQUESTS_KEY = 'bbl_db_requests';
const DB_CHANNELS_KEY = 'bbl_db_channels';
const DB_MESSAGES_KEY = 'bbl_db_messages'; 
const SESSION_KEY = 'bbl_session_token';

// DEFAULT ADMIN CREDENTIALS
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
  allowedRoles: [UserRole.ADMIN, UserRole.CO_ADMIN, UserRole.MENTOR, UserRole.STUDENT, UserRole.ORGANIZATION, UserRole.PARENT],
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
  allowedRoles: [UserRole.ORGANIZATION, UserRole.MENTOR, UserRole.STUDENT, UserRole.PARENT],
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
  allowedRoles: [UserRole.MENTOR, UserRole.STUDENT, UserRole.ORGANIZATION, UserRole.PARENT],
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
  allowedRoles: [UserRole.STUDENT, UserRole.MENTOR, UserRole.ORGANIZATION, UserRole.PARENT],
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
  allowedRoles: [UserRole.PARENT, UserRole.STUDENT, UserRole.MENTOR, UserRole.ORGANIZATION],
  curatedLessonIds: []
};

class AuthService {
  private users: User[] = [];
  private logs: AuditLog[] = [];
  private invites: Invite[] = [];
  private lessons: Lesson[] = [];
  private requests: JoinRequest[] = [];
  private channels: ChatChannel[] = []; 
  private messages: ChatMessage[] = []; 

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
          const isSystemAdmin = u.email === DEFAULT_ADMIN_EMAIL || u.role === UserRole.ADMIN || u.role === UserRole.CO_ADMIN;
          
          if (!u.allowedRoles || u.allowedRoles.length <= 1) {
              u.allowedRoles = isSystemAdmin 
                ? [UserRole.ADMIN, UserRole.CO_ADMIN, UserRole.MENTOR, UserRole.STUDENT, UserRole.ORGANIZATION, UserRole.PARENT]
                : [UserRole.STUDENT, UserRole.MENTOR, UserRole.ORGANIZATION, UserRole.PARENT];
              usersUpdated = true;
          }
          if (!u.curatedLessonIds) {
              u.curatedLessonIds = [];
              usersUpdated = true;
          }
          if (!u.avatarUrl) {
              u.avatarUrl = '';
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
          this.users[adminIndex].role = UserRole.ADMIN;
          this.users[adminIndex].allowedRoles = [UserRole.ADMIN, UserRole.CO_ADMIN, UserRole.MENTOR, UserRole.STUDENT, UserRole.ORGANIZATION, UserRole.PARENT];
          if (!this.users[adminIndex].passwordHash) this.users[adminIndex].passwordHash = DEFAULT_ADMIN.passwordHash;
      } else {
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
    }
    
    const storedRequests = localStorage.getItem(DB_REQUESTS_KEY);
    if (storedRequests) this.requests = JSON.parse(storedRequests);

    const storedChannels = localStorage.getItem(DB_CHANNELS_KEY);
    if (storedChannels) this.channels = JSON.parse(storedChannels);

    const storedMessages = localStorage.getItem(DB_MESSAGES_KEY);
    if (storedMessages) {
        this.messages = JSON.parse(storedMessages);
    } else {
        // Seed some demo messages
        this.messages = [
            {
                id: 'msg-1',
                channelId: 'default-global',
                senderId: 'usr_main_admin',
                senderName: 'System Admin',
                senderRole: UserRole.ADMIN,
                text: 'Welcome to the Build Biblical Leaders collective chat!',
                timestamp: new Date().toISOString()
            }
        ];
        this.saveMessages();
    }
  }

  private saveUsers() { localStorage.setItem(DB_USERS_KEY, JSON.stringify(this.users)); }
  private saveLogs() { localStorage.setItem(DB_LOGS_KEY, JSON.stringify(this.logs)); }
  private saveInvites() { localStorage.setItem(DB_INVITES_KEY, JSON.stringify(this.invites)); }
  private saveLessons() { localStorage.setItem(DB_LESSONS_KEY, JSON.stringify(this.lessons)); }
  private saveRequests() { localStorage.setItem(DB_REQUESTS_KEY, JSON.stringify(this.requests)); }
  private saveChannels() { localStorage.setItem(DB_CHANNELS_KEY, JSON.stringify(this.channels)); }
  private saveMessages() { localStorage.setItem(DB_MESSAGES_KEY, JSON.stringify(this.messages)); }

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
        classCode: (role === UserRole.MENTOR || role === UserRole.CO_ADMIN) ? this.generateCode() : undefined,
        organizationCode: role === UserRole.ORGANIZATION ? this.generateCode() : undefined,
        organizationId: organizationId,
        // Admin types get broader access
        allowedRoles: (role === UserRole.ADMIN || role === UserRole.CO_ADMIN)
          ? [UserRole.ADMIN, UserRole.CO_ADMIN, UserRole.MENTOR, UserRole.STUDENT, UserRole.ORGANIZATION, UserRole.PARENT]
          : [UserRole.STUDENT, UserRole.MENTOR, UserRole.ORGANIZATION, UserRole.PARENT],
        curatedLessonIds: [],
        avatarUrl: ''
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
    
    const isSystemAdmin = user.email === DEFAULT_ADMIN_EMAIL || user.role === UserRole.ADMIN || user.role === UserRole.CO_ADMIN;
    if (!user.allowedRoles || user.allowedRoles.length <= 1) {
        user.allowedRoles = isSystemAdmin 
          ? [UserRole.ADMIN, UserRole.CO_ADMIN, UserRole.MENTOR, UserRole.STUDENT, UserRole.ORGANIZATION, UserRole.PARENT]
          : [UserRole.STUDENT, UserRole.MENTOR, UserRole.ORGANIZATION, UserRole.PARENT];
    }
    
    if (!user.curatedLessonIds) user.curatedLessonIds = [];
    
    this.saveUsers();
    this.logAction(user, 'LOGIN', `User logged in`);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, exp: Date.now() + 3600000 }));
    return user;
  }

  async loginWithSocial(provider: 'google' | 'apple', role?: UserRole): Promise<User> {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const email = provider === 'google' ? DEFAULT_ADMIN_EMAIL : 'social.apple@example.com';
      let user = this.users.find(u => u.email === email);
      
      if(!user) {
          if (email === DEFAULT_ADMIN_EMAIL) {
               user = { ...DEFAULT_ADMIN };
               this.users.unshift(user);
          } else {
              const isAdminType = (role === UserRole.ADMIN || role === UserRole.CO_ADMIN);
              user = {
                  id: crypto.randomUUID(),
                  name: provider === 'google' ? 'Google User' : 'Apple User',
                  email,
                  role: role || UserRole.STUDENT,
                  authProvider: provider,
                  isVerified: true,
                  lastLogin: new Date().toISOString(),
                  classCode: (role === UserRole.MENTOR || role === UserRole.CO_ADMIN) ? this.generateCode() : undefined,
                  organizationCode: role === UserRole.ORGANIZATION ? this.generateCode() : undefined,
                  allowedRoles: isAdminType
                    ? [UserRole.ADMIN, UserRole.CO_ADMIN, UserRole.MENTOR, UserRole.STUDENT, UserRole.ORGANIZATION, UserRole.PARENT]
                    : [UserRole.STUDENT, UserRole.MENTOR, UserRole.ORGANIZATION, UserRole.PARENT],
                  curatedLessonIds: [],
                  avatarUrl: ''
              };
              this.users.push(user);
          }
          this.saveUsers();
      } else {
          const isSystemAdmin = user.email === DEFAULT_ADMIN_EMAIL || user.role === UserRole.ADMIN || user.role === UserRole.CO_ADMIN;
          if (isSystemAdmin) {
             user.allowedRoles = [UserRole.ADMIN, UserRole.CO_ADMIN, UserRole.MENTOR, UserRole.STUDENT, UserRole.ORGANIZATION, UserRole.PARENT];
          } else if (!user.allowedRoles || user.allowedRoles.length <= 1) {
             user.allowedRoles = [UserRole.STUDENT, UserRole.MENTOR, UserRole.ORGANIZATION, UserRole.PARENT];
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

  // --- PROFILE CUSTOMIZATION ---

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
      const user = this.users.find(u => u.id === userId);
      if (!user) throw new Error("User not found");
      
      Object.assign(user, updates);
      this.saveUsers();
      return { ...user };
  }

  // --- CHAT SYSTEM ---

  async sendMessage(sender: User, channelId: string, text: string, attachment?: ChatAttachment): Promise<void> {
      const msg: ChatMessage = {
          id: crypto.randomUUID(),
          channelId,
          senderId: sender.id,
          senderName: sender.name,
          senderRole: sender.role,
          text,
          timestamp: new Date().toISOString(),
          attachment
      };
      this.messages.push(msg);
      this.saveMessages();
  }

  async getChannelMessages(channelId: string): Promise<ChatMessage[]> {
      return this.messages.filter(m => m.channelId === channelId);
  }

  async getRecentMessages(user: User, limit: number = 2): Promise<ChatMessage[]> {
      // 1. Get all channels this user can see
      const userChannels = await this.getUserChannels(user);
      const channelIds = userChannels.map(c => c.id);
      
      // 2. Filter messages and sort by time
      return this.messages
        .filter(m => channelIds.includes(m.channelId))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
  }

  async createChatChannel(creator: User, name: string, description: string, config: Partial<ChatChannel>): Promise<void> {
      if (creator.role === UserRole.STUDENT || creator.role === UserRole.PARENT) throw new Error("Unauthorized");
      const isAdminType = creator.role === UserRole.ADMIN || creator.role === UserRole.CO_ADMIN;
      const newChannel: ChatChannel = {
          id: crypto.randomUUID(),
          name, description, creatorId: creator.id,
          scope: isAdminType ? 'global' : creator.role === UserRole.ORGANIZATION ? 'org' : 'class',
          orgId: creator.role === UserRole.ORGANIZATION ? creator.id : undefined,
          mentorId: creator.role === UserRole.MENTOR ? creator.id : undefined,
          includeRoles: config.includeRoles || [],
          includeStudentsOfMentors: config.includeStudentsOfMentors || false,
          createdAt: new Date().toISOString()
      };
      this.channels.push(newChannel);
      this.saveChannels();
  }

  async updateChannelName(actor: User, channelId: string, newName: string): Promise<void> {
      const channel = this.channels.find(c => c.id === channelId);
      if (!channel) throw new Error("Channel not found");
      
      // Permission: Creator or Admin
      const isAdminType = actor.role === UserRole.ADMIN || actor.role === UserRole.CO_ADMIN;
      if (channel.creatorId !== actor.id && !isAdminType) {
          throw new Error("Unauthorized to edit this channel");
      }

      channel.name = newName;
      this.saveChannels();
  }

  async getUserChannels(user: User): Promise<ChatChannel[]> {
      const userChannels = this.channels.filter(ch => {
          if (ch.creatorId === user.id) return true;
          if (ch.scope === 'global') {
              if (ch.includeRoles.includes(user.role)) return true;
              if (ch.includeStudentsOfMentors && user.role === UserRole.STUDENT) return true;
          }
          if (ch.scope === 'org') {
              if (user.organizationId !== ch.orgId && user.id !== ch.orgId) return false;
              if (ch.includeRoles.includes(user.role)) return true;
              if (ch.includeStudentsOfMentors && user.role === UserRole.STUDENT) return true;
          }
          if (ch.scope === 'class') {
              if (user.mentorId !== ch.mentorId && user.id !== ch.mentorId) return false;
              if (user.role === UserRole.STUDENT) return true;
          }
          return false;
      });

      // Ensure global collective always exists for authenticated users
      if (!userChannels.find(c => c.id === 'default-global')) {
          userChannels.unshift({
              id: 'default-global',
              name: 'Global Collective',
              description: 'Public channel for all users',
              creatorId: 'usr_main_admin',
              scope: 'global',
              includeRoles: [UserRole.ADMIN, UserRole.CO_ADMIN, UserRole.MENTOR, UserRole.ORGANIZATION, UserRole.STUDENT, UserRole.PARENT],
              createdAt: new Date(2023, 0, 1).toISOString()
          });
      }

      return userChannels;
  }

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
      if (student.mentorId) {
          const mentor = this.users.find(u => u.id === student.mentorId);
          if (mentor?.curatedLessonIds) mentor.curatedLessonIds.forEach(id => ids.add(id));
      }
      if (student.organizationId) {
          const org = this.users.find(u => u.id === student.organizationId);
          if (org?.curatedLessonIds) org.curatedLessonIds.forEach(id => ids.add(id));
      }
      return Array.from(ids);
  }

  async getOrganizationMembers(orgId: string): Promise<{mentors: User[], students: User[]}> {
      return {
        mentors: this.users.filter(u => u.role === UserRole.MENTOR && u.organizationId === orgId),
        students: this.users.filter(u => u.role === UserRole.STUDENT && u.organizationId === orgId)
      };
  }

  async createMentorDirectly(orgAdmin: User, name: string, email: string, password: string): Promise<void> {
      if (orgAdmin.role !== UserRole.ORGANIZATION) throw new Error("Unauthorized");
      if (this.users.find(u => u.email === email)) throw new Error("Email exists");
      const newMentor: User = {
          id: crypto.randomUUID(), name, email, role: UserRole.MENTOR, passwordHash: password,
          isVerified: true, authProvider: 'email', organizationId: orgAdmin.id, classCode: this.generateCode(),
          createdBy: orgAdmin.id, allowedRoles: [UserRole.STUDENT, UserRole.MENTOR, UserRole.ORGANIZATION, UserRole.PARENT],
          curatedLessonIds: [], avatarUrl: ''
      };
      this.users.push(newMentor);
      this.saveUsers();
  }

  async deleteUser(actor: User, targetId: string): Promise<void> {
      if (this.users.find(u => u.id === targetId)?.email === DEFAULT_ADMIN_EMAIL) throw new Error("Protected");
      this.users = this.users.filter(u => u.id !== targetId);
      this.saveUsers();
  }

  async getAllUsers(actor: User): Promise<User[]> {
    const isAdminType = actor.role === UserRole.ADMIN || actor.role === UserRole.CO_ADMIN;
    if (isAdminType) return this.users;
    if (actor.role === UserRole.ORGANIZATION) return this.users.filter(u => u.organizationId === actor.id || u.createdBy === actor.id);
    if (actor.role === UserRole.MENTOR) return this.users.filter(u => u.mentorId === actor.id || u.createdBy === actor.id);
    throw new Error("Unauthorized");
  }
  
  async getLogs(adminUser: User): Promise<AuditLog[]> { return this.logs; }

  async updateUserRole(actor: User, targetId: string, role: UserRole): Promise<void> {
      const u = this.users.find(u => u.id === targetId);
      if(u && u.email !== DEFAULT_ADMIN_EMAIL) {
          u.role = role;
          this.saveUsers();
      }
  }

  async changePassword(user: User, oldP: string, newP: string): Promise<void> {
      const u = this.users.find(u => u.id === user.id);
      if(u && u.passwordHash === oldP) { u.passwordHash = newP; this.saveUsers(); }
  }

  async createInvite(actor: User, email: string, role: UserRole): Promise<string> {
      const token = crypto.randomUUID();
      const isAdminType = actor.role === UserRole.ADMIN || actor.role === UserRole.CO_ADMIN;
      this.invites.push({ id: crypto.randomUUID(), token, email, role, invitedBy: actor.name, inviterId: actor.id, organizationId: actor.role === UserRole.ORGANIZATION ? actor.id : undefined, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 72*3600000).toISOString(), status: 'pending' });
      this.saveInvites();
      return token;
  }

  async getInvites(actor: User): Promise<Invite[]> {
      const isAdminType = actor.role === UserRole.ADMIN || actor.role === UserRole.CO_ADMIN;
      return isAdminType ? this.invites.filter(i => i.status === 'pending') : this.invites.filter(i => i.status === 'pending' && i.inviterId === actor.id);
  }

  async deleteInvite(actor: User, inviteId: string): Promise<void> {
      this.invites = this.invites.filter(i => i.id !== inviteId);
      this.saveInvites();
  }
  
  async validateInvite(token: string) { return this.invites.find(i => i.token === token && i.status === 'pending'); }
  
  async acceptInvite(token: string, name: string, pass: string): Promise<User> {
      const inv = await this.validateInvite(token);
      if(!inv) throw new Error("Invalid");
      const isAdminType = (inv.role === UserRole.ADMIN || inv.role === UserRole.CO_ADMIN);
      const user: User = { id: crypto.randomUUID(), name, email: inv.email, role: inv.role, passwordHash: pass, isVerified: true, authProvider: 'email', organizationId: inv.organizationId, classCode: (inv.role === UserRole.MENTOR || inv.role === UserRole.CO_ADMIN) ? this.generateCode() : undefined, lastLogin: new Date().toISOString(), createdBy: inv.inviterId, 
          allowedRoles: isAdminType 
            ? [UserRole.ADMIN, UserRole.CO_ADMIN, UserRole.MENTOR, UserRole.STUDENT, UserRole.ORGANIZATION, UserRole.PARENT]
            : [UserRole.STUDENT, UserRole.MENTOR, UserRole.ORGANIZATION, UserRole.PARENT], curatedLessonIds: [], avatarUrl: '' };
      this.users.push(user);
      inv.status = 'accepted';
      this.saveInvites(); this.saveUsers();
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, exp: Date.now() + 3600000 }));
      return user;
  }

  async joinClass(student: User, code: string): Promise<void> {
      const mentor = this.users.find(u => u.classCode === code.toUpperCase() && (u.role === UserRole.MENTOR || u.role === UserRole.CO_ADMIN));
      if (!mentor) throw new Error("Invalid");
      const s = this.users.find(u => u.id === student.id);
      if (s) { s.mentorId = mentor.id; if (mentor.organizationId) s.organizationId = mentor.organizationId; this.saveUsers(); }
  }

  async getAllMentors(): Promise<User[]> { return this.users.filter(u => u.role === UserRole.MENTOR || u.role === UserRole.CO_ADMIN); }
  async getJoinRequests(m: User): Promise<JoinRequest[]> { return this.requests.filter(r => r.mentorId === m.id && r.status === 'pending'); }
  async requestJoinMentor(s: User, mId: string): Promise<void> {
      if (this.requests.find(r => r.studentId === s.id && r.mentorId === mId && r.status === 'pending')) throw new Error("Pending");
      this.requests.push({ id: crypto.randomUUID(), studentId: s.id, studentName: s.name, mentorId: mId, status: 'pending', timestamp: new Date().toISOString() });
      this.saveRequests();
  }
  async respondToRequest(rid: string, status: 'accepted'|'rejected', mentor: User): Promise<void> {
      const r = this.requests.find(x => x.id === rid);
      if(r) { r.status = status; if(status === 'accepted') { const s = this.users.find(u => u.id === r.studentId); if(s) { s.mentorId = mentor.id; if(mentor.organizationId) s.organizationId = mentor.organizationId; } } this.saveRequests(); this.saveUsers(); }
  }

  async linkParentToStudent(parent: User, studentEmail: string): Promise<void> {
      const student = this.users.find(u => u.email === studentEmail && u.role === UserRole.STUDENT);
      if (!student) throw new Error("Student not found");
      const p = this.users.find(u => u.id === parent.id);
      if(p) { p.linkedStudentId = student.id; this.saveUsers(); }
  }

  async createGroup(user: User, groupName: string): Promise<User> {
    const targetUser = this.users.find(u => u.id === user.id);
    if (!targetUser) throw new Error("User not found");
    targetUser.role = UserRole.MENTOR;
    if (!targetUser.classCode) targetUser.classCode = this.generateCode();
    targetUser.groupName = groupName;
    this.saveUsers();
    return targetUser;
  }

  async getLessons() { return this.lessons; }
}

export const authService = new AuthService();