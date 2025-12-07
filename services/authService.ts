import { User, UserRole, AuditLog, Invite } from '../types';

// STORAGE KEYS
const DB_USERS_KEY = 'bbl_db_users';
const DB_LOGS_KEY = 'bbl_db_logs';
const DB_INVITES_KEY = 'bbl_db_invites';
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

class AuthService {
  private users: User[] = [];
  private logs: AuditLog[] = [];
  private invites: Invite[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Load or Seed Users
    const storedUsers = localStorage.getItem(DB_USERS_KEY);
    if (storedUsers) {
      this.users = JSON.parse(storedUsers);
      
      // Ensure default admin always exists and has correct credentials in case local storage is old
      const adminIndex = this.users.findIndex(u => u.email === DEFAULT_ADMIN.email);
      if (adminIndex === -1) {
        this.users.push(DEFAULT_ADMIN);
        this.saveUsers();
      }
    } else {
      this.users = [DEFAULT_ADMIN];
      this.saveUsers();
    }

    // Load Logs
    const storedLogs = localStorage.getItem(DB_LOGS_KEY);
    if (storedLogs) this.logs = JSON.parse(storedLogs);

    // Load Invites
    const storedInvites = localStorage.getItem(DB_INVITES_KEY);
    if (storedInvites) this.invites = JSON.parse(storedInvites);
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
        authProvider: 'email'
    };

    this.users.push(newUser);
    this.saveUsers();
    
    // In a real app, we wouldn't have a user object to log as 'actor' before they exist, 
    // but we can log it as a system event or temporary actor.
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
            lastLogin: new Date().toISOString()
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
    
    // Prevent removing own admin status if you are the only one (simplified check)
    if (target.email === DEFAULT_ADMIN.email && newRole !== UserRole.ADMIN) {
       throw new Error("Cannot demote the Super Admin.");
    }

    const oldRole = target.role;
    target.role = newRole;
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
      authProvider: 'email'
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
}

export const authService = new AuthService();