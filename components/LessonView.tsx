import React, { useState, useEffect, useRef } from 'react';
import { Lesson, QuizQuestion, QuizOption, User, Module, Course, AboutSegment, LeadershipNote, Certificate, LessonHighlight, LessonAnnotation, UserRole, LessonSessionState, Resource, LessonBookmark, SyncLogEntry } from '../types';
import { lessonService } from '../services/lessonService';
import { exportService } from '../services/exportService';
import CertificateGenerator from './CertificateGenerator';
import Tooltip from './Tooltip';
import { 
  ArrowLeft, BookOpen, X, CheckCircle, Target, Sparkles, Globe, Layers, 
  PenTool, Save, Activity, Loader2, CloudUpload, ChevronLeft, ChevronRight, 
  Home, BadgeCheck, Trophy, Clock, Highlighter, MessageSquare, Download, 
  RefreshCcw, LogOut, Bell, FileText, File as FileIcon, Move, Trash2, Plus, 
  Eye, Search, Share2, Info, GraduationCap, ListChecks, Filter, Keyboard, 
  Maximize2, Minimize2, Settings2, Trash, Pin, MessageCircle, Link, FileQuestion, Quote, Trash2 as TrashIcon, Check, MoreVertical,
  Database, Pause, PlayCircle, SignalHigh, SignalLow, Monitor, History, Settings, FileDown, HardDrive, RefreshCw, AlertCircle, Zap, Bookmark, BookmarkPlus, Tag, List, Layout, FileEdit, ClipboardList, CheckSquare, Wifi, WifiOff, RefreshCw as RotateIcon, ShieldCheck, Crown
} from 'lucide-react';

interface LessonViewProps {
  lesson: Lesson;
  currentUser: User;
  onBack: () => void;
}

type ToolTab = 'insight' | 'highlights' | 'annotations' | 'pause' | 'download' | 'autosave' | 'index' | 'bookmarks';

type DownloadStatus = 'IDLE' | 'QUEUED' | 'DOWNLOADING' | 'COMPLETED' | 'FAILED';

const LessonView: React.FC<LessonViewProps> = ({ lesson, currentUser, onBack }) => {
  const [attempts, setAttempts] = useState<Record<string, string>>({}); 
  const [parentModule, setParentModule] = useState<Module | null>(null);
  const [parentCourse, setParentCourse] = useState<Course | null>(null);
  const [activeAboutType, setActiveAboutType] = useState<'course' | 'module' | 'lesson' | null>(null);
  
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentScore, setCurrentScore] = useState({ correct: 0, total: 0 });
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);
  const [isLastInModule, setIsLastInModule] = useState(false);
  const [adjacentLessons, setAdjacentLessons] = useState<{ prev?: string; next?: string }>({});
  
  const [moduleProgressData, setModuleProgressData] = useState<{ completed: number; total: number } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // --- HIGHLIGHTING MATRIX STATE ---
  const [highlights, setHighlights] = useState<LessonHighlight[]>([]);
  const [globalHighlights, setGlobalHighlights] = useState<LessonHighlight[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [selectionToolbar, setSelectionToolbar] = useState<{ x: number, y: number, text: string } | null>(null);

  // --- ANNOTATION MATRIX STATE ---
  const [annotations, setAnnotations] = useState<LessonAnnotation[]>([]);
  const [globalAnnotations, setGlobalAnnotations] = useState<LessonAnnotation[]>([]);
  const [isAnnotationReviewMode, setIsAnnotationReviewMode] = useState(false);
  const [isAddingFreeAnnotation, setIsAddingFreeAnnotation] = useState(false);
  const [currentAnnotationDraft, setCurrentAnnotationDraft] = useState({ body: '', type: 'Comment' as any, tags: [] as string[], color: '#4f46e5' });

  // --- BOOKMARK MATRIX STATE ---
  const [bookmarks, setBookmarks] = useState<LessonBookmark[]>([]);
  const [globalBookmarks, setGlobalBookmarks] = useState<LessonBookmark[]>([]);
  const [isBookmarkReviewMode, setIsBookmarkReviewMode] = useState(false);
  const [bookmarkSearch, setBookmarkSearch] = useState('');
  const [activeBookmarkType, setActiveBookmarkType] = useState<'All' | 'Exam' | 'Important' | 'Review'>('All');
  const [bookmarkExportStatus, setBookmarkExportStatus] = useState<boolean>(false);

  // --- AUTOSYNC INTELLIGENCE STATE ---
  const [isPaused, setIsPaused] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [resumeNotification, setResumeNotification] = useState<string | null>(null);
  const [autoPauseEnabled, setAutoPauseEnabled] = useState(true);
  const [sessionRestorePending, setSessionRestorePending] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncLogEntry[]>([]);
  const [isManuallySyncing, setIsManuallySyncing] = useState(false);

  // --- DOWNLOAD MATRIX STATE ---
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>('IDLE');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [localVault, setLocalVault] = useState<string[]>(JSON.parse(localStorage.getItem('bbl_offline_vault') || '[]'));
  const [linkedResources, setLinkedResources] = useState<Resource[]>([]);
  const [activeDownloadFormat, setActiveDownloadFormat] = useState<string | null>(null);

  const annotationTypes = [
    { id: 'Comment' as const, icon: MessageCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'Question' as const, icon: FileQuestion, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'Reflection' as const, icon: Sparkles, color: 'text-rose-600', bg: 'bg-rose-50' }
  ];

  const bookmarkTags = [
      { id: 'Exam', color: 'bg-red-100 text-red-700 border-red-200' },
      { id: 'Important', color: 'bg-amber-100 text-amber-700 border-amber-200' },
      { id: 'Confusing', color: 'bg-sky-100 text-sky-700 border-sky-200' },
      { id: 'Revise', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
  ];

  // Tools Portal State
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [activeToolTab, setActiveToolTab] = useState<ToolTab>('highlights');
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);
  
  // Drag Positioning
  const [toolsPosition, setToolsPosition] = useState({ x: 0, y: 80 }); 
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const [issuedCertForPreview, setIssuedCertForPreview] = useState<Certificate | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<number>(0); 
  const footerRef = useRef<HTMLDivElement>(null);
  const lessonBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOnline = () => { 
        setIsOnline(true); 
        if (isPaused && autoPauseEnabled) handleResume(); 
        handleRegistrySync();
    };
    const handleOffline = () => { 
        setIsOnline(false); 
        if (!isPaused && autoPauseEnabled) handlePause("Graceful Pause: Network Latency Detected."); 
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.altKey && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            isPaused ? handleResume() : handlePause("Executive Pause Triggered");
        }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPaused, autoPauseEnabled]);

  useEffect(() => {
    const initializeLesson = async () => {
        setAttempts({});
        setCurrentScore({ correct: 0, total: 0 });
        setIsLessonCompleted(false);
        setIssuedCertForPreview(null);
        setShowCelebration(false);
        
        // Initial responsive position for optimized console
        if (window.innerWidth > 1200) {
            setToolsPosition({ x: window.innerWidth - 450, y: 100 });
        } else {
            setToolsPosition({ x: 20, y: 100 });
        }
        
        const isAlreadyDone = await loadData();
        
        // FIX: Only initiate telemetry and session restoration if the lesson is in an active state (not completed)
        if (!isAlreadyDone) {
            startTelemetry();

            // Session Restore Logic: Only for lessons in progress
            const session = await lessonService.getSessionState(currentUser.id, lesson.id);
            if (session) {
                setSessionRestorePending(true);
                setTimeout(() => {
                    window.scrollTo({ top: session.lastScrollPosition, behavior: 'smooth' });
                    if (session.activeToolTab) setActiveToolTab(session.activeToolTab as ToolTab);
                    setResumeNotification(`Resuming scholarly session from Registry Snapshot...`);
                    setTimeout(() => { setResumeNotification(null); setSessionRestorePending(false); }, 3000);
                }, 1000);
            }
        } else {
            // For completed lessons, only restore the static timer value without resuming the clock
            const initialTime = await lessonService.getQuizTimer(currentUser.id, lesson.id);
            setElapsedSeconds(initialTime);
            elapsedRef.current = initialTime;
        }

        // Registry Sync for meta-content
        const hls = await lessonService.getHighlights(currentUser.id, lesson.id);
        setHighlights(hls);
        const anns = await lessonService.getAnnotations(currentUser.id, lesson.id);
        setAnnotations(anns);
        const bks = await lessonService.getBookmarks(currentUser.id, lesson.id);
        setBookmarks(bks);
        
        const allHls = await lessonService.getAllHighlightsAcrossRegistry(currentUser.id);
        setGlobalHighlights(allHls);
        const allAnns = await lessonService.getAllAnnotationsAcrossRegistry(currentUser.id);
        setGlobalAnnotations(allAnns);
        const allBks = await lessonService.getAllBookmarksAcrossRegistry(currentUser.id);
        setGlobalBookmarks(allBks);
        
        const logs = await lessonService.getSyncLog();
        setSyncHistory(logs);

        // Fetch Linked Resources (Admin Uploads)
        const allResources = await lessonService.getResources();
        setLinkedResources(allResources.filter(r => r.targetLessonId === lesson.id || lesson.title.includes(r.title.split(' ')[0])));
    };

    initializeLesson();
    return () => stopTelemetry();
  }, [lesson.id]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setToolsPosition({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Contextual Selection Listener
  useEffect(() => {
    const handleSelectionChange = () => {
        if (isPaused) return;
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            if (rect.width > 0) {
                setSelectionToolbar({
                    x: rect.left + (rect.width / 2),
                    y: rect.top + window.scrollY - 60,
                    text: selection.toString()
                });
            }
        } else {
            setSelectionToolbar(null);
        }
    };

    document.addEventListener('mouseup', handleSelectionChange);
    return () => document.removeEventListener('mouseup', handleSelectionChange);
  }, [isPaused]);

  const handleStartDrag = (e: React.MouseEvent) => {
    dragOffset.current = { x: e.clientX - toolsPosition.x, y: e.clientY - toolsPosition.y };
    setIsDragging(true);
  };

  const startTelemetry = async () => {
    const initialTime = await lessonService.getQuizTimer(currentUser.id, lesson.id);
    setElapsedSeconds(initialTime);
    elapsedRef.current = initialTime;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (isPaused) return;
      elapsedRef.current += 1;
      setElapsedSeconds(elapsedRef.current);
      if (elapsedRef.current % 5 === 0) {
          lessonService.saveQuizTimer(currentUser.id, lesson.id, elapsedRef.current);
          captureSessionSnapshot();
      }
      if (isAutoSaveEnabled && elapsedRef.current % 30 === 0) handleSaveNote();
    }, 1000);
  };

  const captureSessionSnapshot = async () => {
      const state: LessonSessionState = {
          lastScrollPosition: window.scrollY,
          activeToolTab: activeToolTab,
          isPaused: isPaused,
          timestamp: new Date().toISOString(),
          deviceType: window.innerWidth > 768 ? 'Desktop' : 'Mobile'
      };
      await lessonService.saveSessionState(currentUser.id, lesson.id, state);
      refreshSyncLog();
  };

  const stopTelemetry = () => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        lessonService.saveQuizTimer(currentUser.id, lesson.id, elapsedRef.current);
        captureSessionSnapshot();
    }
  };

  const loadData = async () => {
    const history = await lessonService.getAttempts(currentUser.id, lesson.id);
    const mod = await lessonService.getModuleById(lesson.moduleId);
    
    // FETCH PROGRESS WITH NORMALIZED IDENTITY
    if (mod) {
        setParentModule(mod);
        const course = await lessonService.getCourseById(mod.courseId);
        if (course) setParentCourse(course);
        const moduleLessons = await lessonService.getLessonsByModuleId(lesson.moduleId);
        let completedCount = 0;
        for (const ml of moduleLessons) {
            // SYNC CHECK: Use normalized hasUserAttemptedLesson protocol
            if (await lessonService.hasUserAttemptedLesson(currentUser.id, ml.id)) {
              completedCount++;
            }
        }
        setModuleProgressData({ completed: completedCount, total: moduleLessons.length });
    }

    const attemptMap: Record<string, string> = {};
    let scoreCount = 0;
    history.forEach(h => { 
        attemptMap[h.quizId] = h.selectedOptionId;
        if (h.isCorrect) scoreCount++;
    });
    setAttempts(attemptMap);
    const bibleCount = lesson.bibleQuizzes?.length || 0;
    const noteCount = lesson.noteQuizzes?.length || 0;
    const totalQ = bibleCount + noteCount;
    setCurrentScore({ correct: scoreCount, total: totalQ });
    
    const isCompleted = totalQ === 0 || Object.keys(attemptMap).length >= totalQ;
    if (isCompleted) {
        setIsLessonCompleted(true);
    }
    
    // REPAIR: Adjacency Matrix must recognize current user identity to resolve correct curriculum order (Mentor/Org overrides)
    const adj = await lessonService.getAdjacentLessons(lesson.id, currentUser);
    setAdjacentLessons(adj);
    if (mod && adj.next) {
        const nextLesson = await lessonService.getLessonById(adj.next);
        setIsLastInModule(nextLesson?.moduleId !== mod.id);
    } else if (mod && !adj.next) {
        setIsLastInModule(true);
    }
    setNoteText(await lessonService.getUserLessonNote(currentUser.id, lesson.id));
    
    return isCompleted;
  };

  const handlePause = (reason: string = "Executive Pause Triggered") => {
      setIsPaused(true);
      handleSaveNote();
      captureSessionSnapshot();
      setResumeNotification(reason);
      setTimeout(() => setResumeNotification(null), 4000);
  };

  const handleResume = () => {
      setIsPaused(false);
      setResumeNotification("Session Resumed: Synchronizing Registry...");
      setTimeout(() => setResumeNotification(null), 3000);
      handleRegistrySync();
  };

  const handleRegistrySync = async () => {
      await lessonService.forceRegistrySync();
      refreshSyncLog();
  };

  const refreshSyncLog = async () => {
      const logs = await lessonService.getSyncLog();
      setSyncHistory(logs);
  };

  const handleManualSyncNow = async () => {
      setIsManuallySyncing(true);
      try {
          await lessonService.forceRegistrySync();
          setResumeNotification("Matrix Reconciliation Success.");
      } catch (e: any) {
          setResumeNotification(e.message);
      } finally {
          setIsManuallySyncing(false);
          refreshSyncLog();
          setTimeout(() => setResumeNotification(null), 3000);
      }
  };

  // --- ADJACENCY MATRIX NAVIGATION ---
  const handleNavigateAdjacent = (targetId?: string) => {
      if (!targetId) return;
      window.dispatchEvent(new CustomEvent('bbl_lesson_navigate', { detail: { lessonId: targetId } }));
  };

  // --- BOOKMARK ORCHESTRATION ---
  const handleAddBookmark = (type: 'Text' | 'Position' = 'Position') => {
      if (isPaused) return;
      const id = crypto.randomUUID();
      const textSnippet = type === 'Text' ? selectionToolbar?.text : `Snapshot at position ${Math.round(window.scrollY)}`;
      const title = type === 'Text' ? (selectionToolbar?.text.slice(0, 30) + '...') : `Viewpoint ${bookmarks.length + 1}`;
      
      const newBf: LessonBookmark = {
          id,
          userId: currentUser.id,
          lessonId: lesson.id,
          moduleId: lesson.moduleId,
          courseId: parentCourse?.id,
          title,
          textSnippet,
          scrollPosition: window.scrollY,
          tags: ['Review'],
          color: '#6366f1',
          note: '',
          timestamp: new Date().toISOString(),
          type
      };

      const next = [newBf, ...bookmarks];
      setBookmarks(next);
      lessonService.saveBookmarks(currentUser.id, lesson.id, next);
      setSelectionToolbar(null);
      captureSessionSnapshot();
  };

  const handleDeleteBookmark = (id: string) => {
      const next = bookmarks.filter(b => b.id !== id);
      setBookmarks(next);
      lessonService.saveBookmarks(currentUser.id, lesson.id, next);
      captureSessionSnapshot();
  };

  const handleJumpToBookmark = (b: LessonBookmark) => {
      window.scrollTo({ top: b.scrollPosition, behavior: 'smooth' });
      setResumeNotification(`Jump Success: Restored ${b.title}`);
      setTimeout(() => setResumeNotification(null), 2000);
  };

  const handleExportBookmarks = () => {
      if (bookmarks.length === 0) return;
      let out = `# BOOKMARK REGISTRY: ${lesson.title}\n\n`;
      bookmarks.forEach((b, i) => {
          out += `${i + 1}. [${b.title}] (Pos: ${Math.round(b.scrollPosition)})\n`;
          if (b.textSnippet) out += `   Snippet: "${b.textSnippet}"\n`;
          if (b.note) out += `   Note: ${b.note}\n`;
          out += `   Tags: ${b.tags.join(', ')}\n\n`;
      });
      exportService.downloadTxt(`BBL_Bookmarks_${lesson.id}.md`, out);
      setBookmarkExportStatus(true);
      setTimeout(() => setBookmarkExportStatus(false), 3000);
  };

  const handleUpdateBookmark = (id: string, upd: Partial<LessonBookmark>) => {
      const next = bookmarks.map(b => b.id === id ? { ...b, ...upd } : b);
      setBookmarks(next);
      lessonService.saveBookmarks(currentUser.id, lesson.id, next);
      captureSessionSnapshot();
  };

  const handleInitiateDownload = async (format: string, size: string) => {
      setActiveDownloadFormat(format);
      setDownloadStatus('QUEUED');
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setDownloadStatus('DOWNLOADING');
      let progress = 0;
      const interval = setInterval(() => {
          progress += Math.floor(Math.random() * 20) + 5;
          if (progress >= 100) {
              progress = 100;
              setDownloadProgress(100);
              clearInterval(interval);
              finishDownload(format);
          } else {
              setDownloadProgress(progress);
          }
      }, 400);
  };

  const finishDownload = (format: string) => {
      setDownloadStatus('COMPLETED');
      if (format === 'txt') {
          exportService.exportSingleLesson(lesson, 'txt');
      } else {
          exportService.exportSingleLesson(lesson, 'print');
      }
      lessonService.trackDownload(currentUser.id, lesson.id, format);
      const newVault = Array.from(new Set([...localVault, lesson.id]));
      setLocalVault(newVault);
      localStorage.setItem('bbl_offline_vault', JSON.stringify(newVault));
      setTimeout(() => { setDownloadStatus('IDLE'); setDownloadProgress(0); setActiveDownloadFormat(null); }, 3000);
  };

  const handleOptionSelect = async (quiz: QuizQuestion, option: QuizOption, e: React.MouseEvent<HTMLButtonElement>) => {
    if (attempts[quiz.id] || isPaused) return;
    const clickedElement = e.currentTarget;
    const nextAttempts = { ...attempts, [quiz.id]: option.id };
    setAttempts(nextAttempts);
    if (option.isCorrect) setCurrentScore(prev => ({ ...prev, correct: prev.correct + 1 }));
    const totalQ = (lesson.bibleQuizzes?.length || 0) + (lesson.noteQuizzes?.length || 0);
    
    if (Object.keys(nextAttempts).length >= totalQ) {
        setIsLessonCompleted(true);
        stopTelemetry(); 
        
        // DEEP INTEGRITY SYNC: Increment the module completion count immediately in state
        if (moduleProgressData) {
            setModuleProgressData(prev => prev ? { ...prev, completed: prev.completed + 1 } : null);
        }
        
        // TRIGGER CELEBRATION MATRIX
        setTimeout(() => setShowCelebration(true), 1200);
    }
    setTimeout(() => clickedElement.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    await lessonService.submitAttempt(currentUser.id, lesson.id, quiz.id, option.id, option.isCorrect);
    captureSessionSnapshot();
  };

  const handleSaveNote = async () => {
      setIsSavingNote(true);
      await lessonService.saveUserLessonNote(currentUser.id, lesson.id, noteText);
      setTimeout(() => setIsSavingNote(false), 800);
      captureSessionSnapshot();
  };

  const handleIssueModuleCertificate = async () => {
    if (!parentModule) return;
    try {
        const cert = await lessonService.issueCertificate(currentUser.id, currentUser.name, parentModule.id);
        setIssuedCertForPreview(cert);
    } catch (e) {
        console.error("Certificate Issuance Failure:", e);
        alert("Matrix Error: Unable to issue credential at this time.");
    }
  };

  const handleApplyHighlight = (cat: any = 'General', color: string = '#fbbf24') => {
      if (!selectionToolbar?.text || isPaused) return;
      const newHl: LessonHighlight = {
          id: crypto.randomUUID(),
          lessonId: lesson.id,
          moduleId: lesson.moduleId,
          courseId: parentCourse?.id,
          text: selectionToolbar.text,
          category: cat,
          color: color,
          isPublic: false,
          timestamp: new Date().toISOString(),
          authorId: currentUser.id,
          authorName: currentUser.name
      };
      const next = [newHl, ...highlights];
      setHighlights(next);
      lessonService.saveHighlights(currentUser.id, lesson.id, next);
      setSelectionToolbar(null);
      window.getSelection()?.removeAllRanges();
      captureSessionSnapshot();
  };

  const handleCommitAnnotation = () => {
      if (!currentAnnotationDraft.body.trim() || isPaused) return;
      const newAnn: LessonAnnotation = {
          id: crypto.randomUUID(),
          lessonId: lesson.id,
          moduleId: lesson.moduleId,
          courseId: parentCourse?.id,
          anchoredText: selectionToolbar?.text, 
          body: currentAnnotationDraft.body,
          type: currentAnnotationDraft.type,
          tags: currentAnnotationDraft.tags,
          color: currentAnnotationDraft.color,
          status: 'General',
          isPublic: false,
          timestamp: new Date().toISOString(),
          authorId: currentUser.id,
          authorName: currentUser.name
      };
      const next = [newAnn, ...annotations];
      setAnnotations(next);
      lessonService.saveAnnotations(currentUser.id, lesson.id, next);
      setIsAddingFreeAnnotation(false);
      setSelectionToolbar(null);
      setCurrentAnnotationDraft({ body: '', type: 'Comment', tags: [], color: '#4f46e5' });
      window.getSelection()?.removeAllRanges();
      captureSessionSnapshot();
  };

  const handleToggleAnnotationStatus = (id: string) => {
      const next = annotations.map(a => {
          if (a.id !== id) return a;
          let nextStatus: LessonAnnotation['status'];
          if (a.status === 'General') nextStatus = 'Needs Response';
          else if (a.status === 'Needs Response') nextStatus = 'Resolved';
          else nextStatus = 'General';
          return { ...a, status: nextStatus };
      });
      setAnnotations(next);
      lessonService.saveAnnotations(currentUser.id, lesson.id, next);
      captureSessionSnapshot();
  };

  const handleRemoveAnnotation = (id: string) => {
      if (!window.confirm("Protocol Purge: Permanently delete this registry entry?")) return;
      const next = annotations.filter(a => a.id !== id);
      setAnnotations(next);
      lessonService.saveAnnotations(currentUser.id, lesson.id, next);
      captureSessionSnapshot();
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? [h, m, s].map(v => v.toString().padStart(2, '0')).join(':') : [m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  const renderQuizCard = (quiz: QuizQuestion) => {
    const selectedOptionId = attempts[quiz.id];
    const isAnswered = !!selectedOptionId;
    const selectedOption = quiz.options.find(o => o.id === selectedOptionId);
    const userIsCorrect = selectedOption?.isCorrect;
    return (
      <div key={quiz.id} className={`bg-white rounded-[3rem] shadow-2xl border border-gray-200 overflow-hidden mb-12 relative group/card ${isAnswered ? 'animate-flash-zoom' : 'animate-in fade-in slide-in-from-bottom-6'}`}>
        <div className="p-4 md:p-6 relative z-10"> 
          {quiz.referenceText && (
            <div className="flex items-center gap-2 mb-1 px-4">
              <BookOpen size={14} className="text-indigo-500 shrink-0" />
              <span className="text-[14.5px] font-bold text-indigo-600 leading-none w-full capitalize">{quiz.referenceText}</span>
            </div>
          )}
          <h3 className="text-base md:text-lg font-sans font-black text-gray-900 leading-[1.2] mb-0 px-4 w-full">{quiz.text}</h3>
          <div className="grid grid-cols-1 gap-2 px-2 pt-2">
            {quiz.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              const isCorrect = opt.isCorrect;
              let containerClass = "bg-white border-gray-100 hover:border-indigo-300";
              let explanationContainerClass = "bg-gray-300/90"; 
              let explanationTextClass = "text-gray-900";
              if (isAnswered) {
                if (userIsCorrect) {
                  if (isCorrect) {
                    containerClass = "bg-white border-emerald-500 scale-[1.01] z-30 ring-4 ring-emerald-100 shadow-[0_0_50px_rgba(16,185,129,0.4)]";
                    explanationContainerClass = "bg-emerald-300/95 shadow-lg border-2 border-emerald-500/20"; 
                    explanationTextClass = "text-emerald-950";
                  } else {
                    containerClass = "bg-white border-red-500 opacity-90";
                    explanationContainerClass = "bg-red-300/90 shadow-inner";
                    explanationTextClass = "text-red-950 font-bold";
                  }
                } else {
                  if (isSelected) {
                    containerClass = "bg-white border-red-600 shadow-[0_0_60px_rgba(220,38,38,0.5)] animate-shake z-30 ring-4 ring-red-100 scale-[1.01]";
                    explanationContainerClass = "bg-red-300/95 shadow-xl border-2 border-red-600/20";
                    explanationTextClass = "text-red-950 font-black";
                  } else if (isCorrect) {
                    containerClass = "bg-white border-emerald-500 scale-[1.02] z-20 shadow-[0_0_40px_rgba(16,185,129,0.3)]";
                    explanationContainerClass = "bg-emerald-300/90 shadow-md border border-emerald-400/20";
                    explanationTextClass = "text-emerald-950 font-bold";
                  } else {
                    containerClass = "bg-white border-orange-400 opacity-80 shadow-inner";
                    explanationContainerClass = "bg-orange-300/90"; 
                    explanationTextClass = "text-orange-950";
                  }
                }
              }
              return (
                <button key={opt.id} disabled={isAnswered || isPaused} onClick={(e) => handleOptionSelect(quiz, opt, e)} className={`relative p-5 md:p-8 rounded-[2rem] border-4 transition-all duration-700 text-left group/opt overflow-visible w-full ${containerClass}`}>
                  <div className="flex items-start gap-1 h-full">
                    <div className="flex flex-col items-center justify-start gap-4 shrink-0 pt-0.5 w-16">
                      <div className={`text-4xl font-black font-serif transition-all duration-500 drop-shadow-sm ${isAnswered ? 'text-current opacity-100' : isSelected ? 'text-royal-900' : 'text-gray-300'}`}>{opt.label}</div>
                      {isAnswered && isCorrect && <div className="animate-checkmark-bounce"><CheckCircle size={48} className="text-emerald-600 drop-shadow-xl" fill="rgba(16, 185, 129, 0.1)" /></div>}
                    </div>
                    <div className="flex-1 flex flex-col justify-center pr-1">
                      <p className={`font-black text-sm md:text-base leading-tight w-full mb-[2.5px] ${isAnswered ? 'text-gray-950' : isSelected ? 'text-royal-900' : 'text-gray-800'}`}>{opt.text}</p>
                      {isAnswered && (
                        <div className="mt-0 animate-in slide-in-from-left-6 duration-1000">
                          <div className={`p-4 rounded-2xl border border-black/10 shadow-[inner_0_2px_4px_rgba(0,0,0,0.1)] transition-colors duration-700 mt-[5px] ${explanationContainerClass}`}>
                            <p className={`text-[13px] leading-tight font-black w-full ${explanationTextClass}`}>{opt.explanation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const downloadFormats = [
      { id: 'pdf', label: 'PEDAGOGICAL PDF', icon: FileDown, size: '2.4 MB', color: 'text-red-500', desc: 'Official tagged high-fidelity layout.' },
      { id: 'docx', label: 'SCHOLARLY WORD', icon: FileText, size: '1.1 MB', color: 'text-blue-500', desc: 'Editable manuscript format.' },
      { id: 'epub', label: 'MOBILE EPUB', icon: HardDrive, size: '0.8 MB', color: 'text-indigo-500', desc: 'Reflowable ebook format.' }
  ];

  return (
    <div className="max-w-6xl mx-auto pb-48 animate-in fade-in duration-700 relative min-h-screen flex flex-col">
      
      {/* GLOBAL CELEBRATION MATRIX OVERLAY - Optimized Background to prevent "fizzling" */}
      {showCelebration && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center animate-in fade-in duration-500 isolation-auto">
              {/* Background Backdrop - Simplified to high-opacity solid to prevent strobing blurs */}
              <div className="absolute inset-0 bg-royal-950/90 backdrop-blur-none transition-opacity duration-700">
                   <div className="absolute inset-0 overflow-hidden pointer-events-none">
                       {[...Array(10)].map((_, i) => (
                           <div key={i} className="particle animate-particle-up" style={{
                               left: `${Math.random() * 100}%`,
                               width: `${Math.random() * 4 + 2}px`,
                               height: `${Math.random() * 4 + 2}px`,
                               backgroundColor: '#fbbf24',
                               animationDelay: `${Math.random() * 5}s`,
                               opacity: Math.random() * 0.5 + 0.2
                           }} />
                       ))}
                   </div>
              </div>

              {/* Expressive Background Trophy - Scaled Down */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                  <Trophy size={300} className="text-gold-500 animate-trophy-celebrate" strokeWidth={0.5} />
              </div>

              {/* Central Focus Medallion Card - REDUCED SIZE BY 50% (max-w-md, smaller padding) */}
              <div className="relative z-[510] bg-royal-900 border-[6px] border-gold-500/30 rounded-[3rem] p-8 md:p-10 text-center shadow-[0_30px_100px_-20px_rgba(0,0,0,1)] max-w-md w-full mx-4 animate-in zoom-in-95 duration-500 overflow-hidden will-change-transform">
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
                  
                  <div className="relative z-10 flex flex-col items-center">
                      <div className="animate-in pop-in delay-200">
                        <div className="w-16 h-16 bg-gold-500 text-royal-900 rounded-2xl flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(245,158,11,0.4)] animate-icon-steady-motion">
                            {isLastInModule ? <Crown size={32} fill="currentColor" /> : <CheckCircle size={32} fill="currentColor" />}
                        </div>
                      </div>
                      
                      <div className="animate-in slide-in-from-bottom-2 delay-300">
                          <h2 className="text-2xl md:text-3xl font-serif font-black text-white uppercase tracking-tight mb-4 animate-congrat-pulse">
                            CONGRATULATIONS!
                          </h2>
                      </div>
                      
                      <div className="h-1 w-16 bg-gold-500 mx-auto rounded-full mb-6 animate-in scale-x-in delay-400"></div>
                      
                      <p className="text-royal-100 text-sm md:text-base font-medium leading-relaxed italic animate-in fade-in delay-500 max-w-[280px] mx-auto">
                        {isLastInModule ? (
                            "Well done!! You have successfully completed this module. Please navigate the “Next” button below to proceed to the first lesson in the next module."
                        ) : (
                            "Well done! You have successfully completed this lesson. Please navigate the “Next” button below to proceed to the next lesson."
                        )}
                      </p>

                      <div className="mt-10 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4 delay-600">
                          <div className="flex flex-col gap-3 w-full">
                              <Tooltip content="Resume Matrix Navigation: Exit this screen and return to the curriculum path.">
                                <button 
                                    onClick={() => {
                                        setShowCelebration(false);
                                        // Directly zooms the lesson page down to the exact location of the “NEXT” footer navigation button
                                        setTimeout(() => {
                                            footerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }, 300);
                                    }}
                                    className="group relative w-full px-8 py-4 bg-white text-royal-900 font-black rounded-2xl text-xs md:text-sm uppercase tracking-[0.2em] shadow-xl transition-all transform hover:scale-105 active:scale-95 border-b-[6px] border-gray-200 overflow-hidden"
                                >
                                    PROCEED TO NAVIGATION
                                </button>
                              </Tooltip>

                              {isLastInModule && (
                                  <Tooltip content="Official Certification Protocol: Execute this command to generate your high-fidelity digital credential for mastering this module.">
                                      <button 
                                        onClick={handleIssueModuleCertificate}
                                        className="group relative w-full px-8 py-4 bg-gold-500 text-royal-900 font-black rounded-2xl text-xs md:text-sm uppercase tracking-[0.2em] shadow-xl transition-all transform hover:scale-105 active:scale-95 border-b-[6px] border-gold-700 overflow-hidden"
                                      >
                                          RECEIVE CERTIFICATE
                                      </button>
                                  </Tooltip>
                              )}
                          </div>
                          <p className="text-[8px] font-black text-royal-400 uppercase tracking-[0.3em]">Registry Mastery Verified</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* GLOBAL PAUSE OVERLAY */}
      {isPaused && (
          <div className="fixed inset-0 z-[300] bg-royal-950/80 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
              <div className="bg-white rounded-[4rem] p-12 md:p-20 text-center shadow-[0_50px_150px_-30px_rgba(0,0,0,1)] border-8 border-gold-500 max-w-2xl animate-in zoom-in-95">
                  <div className="w-32 h-32 bg-royal-900 rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl animate-pulse">
                      <Pause size={64} className="text-gold-500" fill="currentColor" />
                  </div>
                  <h2 className="text-4xl md:text-6xl font-serif font-black text-royal-950 uppercase tracking-tighter mb-4">EXECUTIVE PAUSE</h2>
                  <p className="text-gray-500 text-lg md:text-xl font-bold mb-12 italic opacity-80">Matrix Registry Snapshot Saved Successfully.</p>
                  <button onClick={handleResume} className="mt-12 px-16 py-6 bg-royal-900 text-white font-black rounded-3xl text-xl uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all transform hover:scale-105 active:scale-95 border-b-[12px] border-black">RESUME STUDY</button>
              </div>
          </div>
      )}

      {/* RESUME NOTIFICATION */}
      {resumeNotification && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[400] bg-royal-900 text-white px-8 py-4 rounded-2xl shadow-2xl border-4 border-gold-500 flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
              <RotateIcon size={20} className="text-gold-400 animate-spin-slow" />
              <span className="text-[11px] font-black uppercase tracking-widest">{resumeNotification}</span>
              <div className="w-px h-6 bg-white/20"></div>
              <button onClick={() => setResumeNotification(null)} className="p-1 hover:bg-white/10 rounded-full"><X size={16}/></button>
          </div>
      )}

      {/* SELECTION MINI-TOOLBAR */}
      {selectionToolbar && !isPaused && (
          <div style={{ left: `${selectionToolbar.x}px`, top: `${selectionToolbar.y}px` }} className="fixed z-[250] -translate-x-1/2 flex items-center gap-1 bg-royal-950 p-1.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/20 animate-in zoom-in-95">
              <Tooltip content="Quick Bookmark: Instantly anchor this text snippet to your registry for rapid revision.">
                  <button onClick={() => handleAddBookmark('Text')} className="p-3 text-white hover:bg-white/10 rounded-xl transition-all flex items-center gap-2 px-4 border-r border-white/10">
                      <BookmarkPlus size={18} className="text-gold-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Bookmark</span>
                  </button>
              </Tooltip>
              <Tooltip content="Scholarly Highlight: Visual marking of theology or exam-critical text.">
                  <button onClick={() => handleApplyHighlight('General')} className="p-3 text-white hover:bg-white/10 rounded-xl transition-all flex items-center gap-2 px-4 border-r border-white/10">
                      <Highlighter size={18} className="text-sky-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Highlight</span>
                  </button>
              </Tooltip>
              <Tooltip content="Contextual Annotation: Link a detailed rich-text note to this selection.">
                 <button onClick={() => { setIsAddingFreeAnnotation(true); setActiveToolTab('annotations'); }} className="p-3 text-white hover:bg-white/10 rounded-xl transition-all flex items-center gap-2 px-4">
                    <PenTool size={18} className="text-rose-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Annotate</span>
                 </button>
              </Tooltip>
          </div>
      )}

      <nav className="flex items-center flex-wrap gap-3 mb-10 px-6 py-4 bg-white border-4 border-gray-100 shadow-xl rounded-[2rem] animate-in slide-in-from-top-4 w-fit">
          <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-royal-900 transition-all uppercase tracking-[0.2em] group"><Home size={14} className="group-hover:scale-110 transition-transform" /> HOME</button>
          <ChevronRight size={12} className="text-royal-200" strokeWidth={5} />
          <div className="flex items-center gap-2"><Layers size={14} className="text-indigo-400" /><span className="text-[12px] font-serif font-black text-royal-700 uppercase tracking-tight truncate max-w-[150px] md:max-w-sm">{parentModule?.title || 'CURRICULUM'}</span></div>
          <ChevronRight size={12} className="text-royal-200" strokeWidth={5} />
          <div className="flex items-center gap-2"><Sparkles size={14} className="text-gold-500" /><span className="text-[12px] font-serif font-black text-royal-900 uppercase tracking-tight truncate max-w-[150px] md:max-w-sm">{lesson.title}</span></div>
          <div className="h-6 w-px bg-gray-100 mx-3"></div>
          <Tooltip content={isOnline ? "Registry Sync Active (Connected)" : "Offline Mode (Registry Sync Deferred)"}>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {isOnline ? <SignalHigh size={10}/> : <SignalLow size={10}/>} {isOnline ? 'Registry Online' : 'Matrix Offline'}
              </div>
          </Tooltip>
      </nav>

      {/* --- INTELLIGENCE CONSOLE (OPTIMIZED SIZE & DRAGGABLE) --- */}
      {isToolsOpen && (
          <div 
            style={{ left: `${toolsPosition.x}px`, top: `${toolsPosition.y}px` }} 
            className={`fixed z-[200] w-[360px] bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border-4 border-royal-900 rounded-[2.5rem] flex flex-col overflow-hidden border-b-[8px] transition-all ${isDragging ? 'shadow-[0_60px_150px_-30px_rgba(0,0,0,0.8)] opacity-95 scale-[1.01]' : ''}`}
          >
              {/* Drag Handle Header */}
              <div 
                onMouseDown={handleStartDrag} 
                className="bg-royal-900 p-4 flex justify-between items-center cursor-grab active:cursor-grabbing border-b-2 border-black shrink-0"
              >
                  <div className="flex items-center gap-2">
                    <Move size={14} className="text-gold-400" />
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Registry Console</span>
                  </div>
                  <button onClick={() => setIsToolsOpen(false)} className="p-1 text-white/50 hover:text-white transition-colors bg-white/5 rounded-lg"><X size={18}/></button>
              </div>

              {/* Tool Navigation Matrix */}
              <div className="bg-royal-800 p-2 flex flex-wrap justify-center items-center gap-1 shrink-0 border-b-2 border-black">
                  {[
                      { id: 'bookmarks', icon: Bookmark, color: 'text-gold-400', label: 'Bookmarks' },
                      { id: 'annotations', icon: MessageCircle, color: 'text-rose-400', label: 'Annotations' },
                      { id: 'highlights', icon: Highlighter, color: 'text-sky-400', label: 'Highlights' },
                      { id: 'index', icon: Search, color: 'text-indigo-400', label: 'Index' },
                      { id: 'insight', icon: PenTool, color: 'text-rose-400', label: 'Notebook' },
                      { id: 'download', icon: Download, color: 'text-emerald-400', label: 'Archival' },
                      { id: 'pause', icon: Pause, color: 'text-rose-400', label: 'Pause' },
                      { id: 'autosave', icon: RefreshCw, color: 'text-purple-400', label: 'AutoSync' }
                  ].map(tool => (
                      <Tooltip key={tool.id} content={tool.label}>
                        <button onClick={() => setActiveToolTab(tool.id as ToolTab)} className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${activeToolTab === tool.id ? 'bg-white text-royal-950 shadow-lg scale-110' : 'bg-white/10 text-royal-100 hover:bg-white/20'}`}><tool.icon size={16} /></button>
                      </Tooltip>
                  ))}
                  <div className="w-px h-6 bg-white/10 mx-1"></div>
                  <button onClick={onBack} className="p-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all flex items-center justify-center shadow-lg active:scale-90"><LogOut size={16}/></button>
              </div>

              {/* Console Body Area: Height reduced by 30% from 480px to 336px */}
              <div className="p-5 bg-[#fdfdfd] h-[336px] flex flex-col overflow-hidden">
                  
                  {activeToolTab === 'autosave' && (
                      <div className="h-full flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500 overflow-hidden">
                          <div className="border-b-2 border-gray-50 pb-2">
                              <h3 className="text-xl font-serif font-black text-gray-900 uppercase leading-none tracking-tight">AutoSync</h3>
                              <p className="text-gray-400 font-black text-[8px] uppercase tracking-widest mt-2">Registry Delta Engine</p>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                              <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 flex items-center gap-4">
                                  <div className={`p-2 rounded-xl ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                      {isOnline ? <Wifi size={20}/> : <WifiOff size={20}/>}
                                  </div>
                                  <div>
                                      <h4 className="text-[8px] font-black uppercase text-gray-400">Status</h4>
                                      <p className="font-black text-gray-900 uppercase text-[10px]">{isOnline ? 'Online' : 'Offline'}</p>
                                  </div>
                              </div>
                              <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 flex items-center gap-4">
                                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                                      <RotateIcon size={20} className={isManuallySyncing ? 'animate-spin' : ''}/>
                                  </div>
                                  <div>
                                      <h4 className="text-[8px] font-black uppercase text-gray-400">Reconciliation</h4>
                                      <p className="font-black text-gray-900 uppercase text-[10px] truncate max-w-[200px]">{syncHistory[0]?.timestamp ? new Date(syncHistory[0].timestamp).toLocaleTimeString() : 'None'}</p>
                                  </div>
                              </div>
                          </div>

                          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                              <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><History size={14}/> LOG</h4>
                              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                                  {syncHistory.slice(0, 5).map(entry => (
                                      <div key={entry.id} className="p-3 bg-white border-2 border-gray-100 rounded-xl flex items-center justify-between group">
                                          <div className="flex items-center gap-2">
                                              <div className={`p-1.5 rounded-lg ${entry.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                  <ShieldCheck size={12}/>
                                              </div>
                                              <span className="text-[9px] font-black text-gray-800 uppercase truncate max-w-[120px]">{entry.action}</span>
                                          </div>
                                          <span className="text-[8px] font-mono text-gray-300">{new Date(entry.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>

                          <div className="flex gap-2">
                              <button onClick={handleManualSyncNow} disabled={isManuallySyncing} className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl text-[9px] uppercase tracking-widest border-b-4 border-indigo-900 active:scale-95">Sync Now</button>
                              <button onClick={() => setIsAutoSaveEnabled(!isAutoSaveEnabled)} className={`flex-1 py-3 font-black rounded-xl text-[9px] uppercase tracking-widest border-b-4 active:scale-95 ${isAutoSaveEnabled ? 'bg-emerald-500 text-white border-emerald-900' : 'bg-gray-200 text-gray-500 border-gray-400'}`}>{isAutoSaveEnabled ? 'Auto ON' : 'Auto OFF'}</button>
                          </div>
                      </div>
                  )}

                  {activeToolTab === 'bookmarks' && (
                      <div className="h-full flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500 overflow-hidden">
                          <div className="flex justify-between items-end border-b-2 border-gray-50 pb-2">
                              <div>
                                  <h3 className="text-xl font-serif font-black text-gray-900 uppercase leading-none tracking-tight">Bookmarks</h3>
                                  <p className="text-gray-400 font-black text-[8px] uppercase tracking-widest mt-2">Anchored Perspectives</p>
                              </div>
                              <div className="flex gap-1.5">
                                  <button onClick={() => handleAddBookmark('Position')} className="p-2 bg-royal-900 text-white rounded-lg shadow-md border-b-2 border-black hover:bg-black transition-all active:scale-95"><BookmarkPlus size={16}/></button>
                                  <button onClick={handleExportBookmarks} className="p-2 bg-white text-gray-400 border-2 border-gray-100 rounded-lg hover:bg-gray-50"><Download size={16}/></button>
                              </div>
                          </div>

                          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
                              {bookmarks.length === 0 ? (
                                  <div className="text-center py-12 text-gray-300 italic text-[10px] uppercase">Registry Unpopulated</div>
                              ) : bookmarks.map(b => (
                                  <div key={b.id} className="bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm group/bk relative overflow-hidden">
                                      <div className={`absolute top-0 left-0 w-1 h-full`} style={{ backgroundColor: b.color }}></div>
                                      <div className="flex justify-between items-start mb-2 pl-1">
                                          <h4 className="font-serif font-black text-royal-950 text-sm uppercase tracking-tight truncate max-w-[180px]">{b.title}</h4>
                                          <div className="flex gap-1 opacity-0 group-hover/bk:opacity-100 transition-opacity">
                                              <button onClick={() => handleJumpToBookmark(b)} className="p-1 text-gray-400 hover:text-royal-900"><Target size={12}/></button>
                                              <button onClick={() => handleDeleteBookmark(b.id)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon size={12}/></button>
                                          </div>
                                      </div>
                                      <textarea value={b.note} onChange={(e) => handleUpdateBookmark(b.id, { note: e.target.value })} placeholder="Reflection..." className="w-full bg-gray-50 p-2 rounded-lg text-[10px] font-bold text-gray-700 outline-none border border-transparent focus:border-indigo-100 transition-all resize-none min-h-[40px]" />
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {activeToolTab === 'annotations' && (
                      <div className="h-full flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500 overflow-hidden">
                          <div className="flex justify-between items-end border-b-2 border-gray-50 pb-2">
                              <div><h3 className="text-xl font-serif font-black text-gray-900 uppercase leading-none">Annotations</h3><p className="text-gray-400 font-black text-[8px] uppercase tracking-widest mt-2">Scholarly Discourse</p></div>
                              <button onClick={() => setIsAddingFreeAnnotation(!isAddingFreeAnnotation)} className="p-2 bg-royal-900 text-white rounded-lg shadow-md border-b-2 border-black active:scale-95"><Plus size={16}/></button>
                          </div>
                          {isAddingFreeAnnotation && (
                              <div className="bg-indigo-50/50 p-4 rounded-2xl border-2 border-indigo-100 space-y-4 animate-in zoom-in-95">
                                  <textarea autoFocus value={currentAnnotationDraft.body} onChange={e => setCurrentAnnotationDraft({...currentAnnotationDraft, body: e.target.value})} placeholder="Context..." className="w-full bg-white border-2 border-gray-100 rounded-xl p-3 outline-none font-bold text-gray-800 text-xs shadow-inner min-h-[80px]" />
                                  <button onClick={handleCommitAnnotation} className="w-full py-2.5 bg-indigo-600 text-white font-black rounded-xl uppercase text-[9px] tracking-widest border-b-4 border-indigo-950 shadow-md">COMMIT</button>
                              </div>
                          )}
                          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
                              {annotations.map(a => (
                                  <div key={a.id} className="bg-white border-2 border-gray-100 rounded-2xl p-4 shadow-sm group/ann relative overflow-hidden">
                                      <div className={`absolute top-0 left-0 w-1 h-full ${annotationTypes.find(t => t.id === a.type)?.color.replace('text-', 'bg-')}`}></div>
                                      <div className="flex justify-between items-start mb-2 pl-1">
                                          <span className={`text-[8px] font-black uppercase tracking-widest ${annotationTypes.find(t => t.id === a.type)?.color}`}>{a.type}</span>
                                          <div className="flex gap-1 opacity-0 group-hover/ann:opacity-100 transition-opacity">
                                              <button onClick={() => handleToggleAnnotationStatus(a.id)} className="p-1 text-gray-300 hover:text-emerald-600"><Check size={12}/></button>
                                              <button onClick={() => handleRemoveAnnotation(a.id)} className="p-1 text-gray-300 hover:text-red-500"><TrashIcon size={12}/></button>
                                          </div>
                                      </div>
                                      <p className="text-[11px] font-bold text-gray-800 leading-relaxed pl-1 whitespace-pre-wrap">{a.body}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {activeToolTab === 'highlights' && (
                      <div className="h-full flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500 overflow-hidden">
                          <div className="flex justify-between items-end border-b-2 border-gray-50 pb-2">
                              <div><h3 className="text-xl font-serif font-black text-gray-900 uppercase leading-none">Highlights</h3><p className="text-gray-400 font-black text-[8px] uppercase tracking-widest mt-2">Registry Audit</p></div>
                              <button onClick={() => setIsReviewMode(!isReviewMode)} className={`p-2 rounded-lg border-2 transition-all ${isReviewMode ? 'bg-royal-900 text-white border-royal-950 shadow-md' : 'bg-white text-gray-400 border-gray-100'}`}><Eye size={16}/></button>
                          </div>
                          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
                              {highlights.map(h => (
                                  <div key={h.id} className="p-3 bg-white border-2 border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all group/hl relative overflow-hidden">
                                      <div className="flex justify-between items-start mb-2"><span className="text-[8px] font-black uppercase tracking-widest" style={{ color: h.color }}>{h.category}</span><button onClick={() => setHighlights(highlights.filter(x => x.id !== h.id))} className="p-0.5 text-gray-300 hover:text-red-500 opacity-0 group-hover/hl:opacity-100 transition-all"><X size={12}/></button></div>
                                      <p className="text-[11px] font-serif italic text-gray-900 border-l-2 pl-2 leading-relaxed" style={{ borderColor: h.color }}>"{h.text.slice(0, 80)}..."</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {activeToolTab === 'insight' && (
                      <div className="h-full flex flex-col gap-3 animate-in slide-in-from-right-4">
                          <h3 className="text-lg font-serif font-black text-gray-900 uppercase">Notebook</h3>
                          <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Capture revelations..." className="flex-1 w-full bg-white border-2 border-gray-100 rounded-2xl p-4 outline-none font-bold text-gray-800 text-xs resize-none shadow-inner custom-scrollbar focus:border-indigo-500" />
                          <button onClick={handleSaveNote} disabled={isSavingNote} className="py-3 bg-royal-900 text-white font-black rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 uppercase text-[9px] tracking-widest shadow-xl border-b-4 border-black active:scale-95">
                              {isSavingNote ? <Loader2 className="animate-spin" size={14} /> : <CloudUpload size={14} />} <span>COMMIT</span>
                          </button>
                      </div>
                  )}

                  {activeToolTab === 'pause' && (
                      <div className="h-full flex flex-col gap-6 items-center justify-center animate-in slide-in-from-right-4 text-center">
                          <div className="p-4 bg-rose-50 text-rose-600 rounded-full shadow-inner animate-pulse"><Pause size={48} /></div>
                          <div><h4 className="font-serif font-black text-gray-950 text-lg uppercase leading-none">Global Pause</h4><p className="text-gray-400 text-[8px] font-black uppercase tracking-widest mt-2">Instant Session Suspend</p></div>
                          <button onClick={() => handlePause("Protocol Triggered: Executive Pause.")} className="w-full py-4 bg-rose-600 text-white font-black rounded-xl shadow-xl hover:bg-rose-700 transition-all uppercase tracking-[0.2em] text-[9px] border-b-4 border-rose-950 active:scale-95">INITIATE SNAPSHOT</button>
                      </div>
                  )}

                  {activeToolTab === 'download' && (
                      <div className="h-full flex flex-col gap-4 animate-in slide-in-from-right-4 overflow-hidden">
                          <h3 className="text-lg font-serif font-black text-gray-900 uppercase">Archival</h3>
                          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
                              {downloadFormats.map(fmt => (
                                  <div key={fmt.id} className="bg-white p-4 rounded-2xl border-2 border-gray-100 flex items-center justify-between group hover:border-indigo-100 transition-all">
                                      <div className="flex items-center gap-3">
                                          <fmt.icon size={20} className={fmt.color} />
                                          <div>
                                              <h6 className="font-black text-gray-900 text-[10px] leading-none">{fmt.id.toUpperCase()}</h6>
                                              <p className="text-[8px] text-gray-400 font-bold mt-1">{fmt.size}</p>
                                          </div>
                                      </div>
                                      <button onClick={() => handleInitiateDownload(fmt.id, fmt.size)} className="p-2 bg-royal-900 text-white rounded-lg hover:bg-black transition-all shadow-md active:scale-95"><Download size={14}/></button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden mb-12 shrink-0">
        <div className="bg-royal-900 p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10 shadow-lg group"><ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" /></button>
                    <div>
                        <div className="flex items-center gap-3 mb-2"><span className="px-3 py-1 bg-gold-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest">{lesson.lesson_type} Registry</span><span className="h-1 w-1 bg-white/30 rounded-full"></span><span className="text-[9px] font-bold text-royal-200 uppercase tracking-widest">{lesson.book} {lesson.chapter}</span></div>
                        <h1 className="text-2xl md:text-3xl font-serif font-black uppercase tracking-tight leading-tight">{lesson.title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-royal-950/50 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
                    <div className="text-center px-4 border-r border-white/10"><p className="text-[8px] font-black text-royal-300 uppercase tracking-widest mb-1">SCORE</p><p className="text-2xl font-black text-gold-400">{currentScore.correct}/{currentScore.total}</p></div>
                    <div className="text-center px-4"><p className="text-[8px] font-black text-royal-300 uppercase tracking-widest mb-1">DURATION</p><p className="text-2xl font-mono font-black text-white">{formatTime(elapsedSeconds)}</p></div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 flex-1">
        <div className="lg:col-span-2 space-y-16">
          <div className="space-y-12">
            <div className="grid grid-cols-3 gap-4">
              <button onClick={() => setActiveAboutType('course')} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-indigo-500 transition-all flex flex-col items-center text-center group"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mb-2 group-hover:scale-110 transition-transform"><Globe size={20}/></div><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">About Course</span></button>
              <button onClick={() => setActiveAboutType('module')} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-indigo-500 transition-all flex flex-col items-center text-center group"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mb-2 group-hover:scale-110 transition-transform"><Layers size={20}/></div><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">About Module</span></button>
              <button onClick={() => setActiveAboutType('lesson')} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-indigo-500 transition-all flex flex-col items-center text-center group"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mb-2 group-hover:scale-110 transition-transform"><Sparkles size={20}/></div><span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">About Lesson</span></button>
            </div>
          </div>

          <div ref={lessonBodyRef} className={`lesson-body-container select-text ${isPaused ? 'opacity-40 pointer-events-none' : 'opacity-100'} transition-opacity duration-1000 relative`}>
              {sessionRestorePending && (
                  <div className="absolute inset-0 z-[10] bg-white/20 flex flex-col items-center justify-start pt-40">
                      <div className="p-8 bg-white rounded-[3rem] shadow-2xl border-4 border-royal-900 flex flex-col items-center gap-6 animate-pop-in">
                          <Loader2 className="animate-spin text-royal-900" size={48} />
                          <p className="text-xl font-black uppercase tracking-[0.4em] text-royal-950">Synchronizing Session Integrity...</p>
                      </div>
                  </div>
              )}

              {/* RENDER BOOKMARK MARKERS INLINE */}
              {bookmarks.map(b => (
                  <div key={b.id} className="absolute left-[-40px] pointer-events-auto" style={{ top: b.scrollPosition }}>
                      <Tooltip content={b.title}>
                          <button onClick={() => handleJumpToBookmark(b)} className="p-2 bg-gold-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"><Bookmark size={14}/></button>
                      </Tooltip>
                  </div>
              ))}

              {lesson.bibleQuizzes && lesson.bibleQuizzes.length > 0 && (
                <section className="space-y-8 mb-16">
                    <h2 className="text-2xl font-serif font-black text-gray-900 uppercase tracking-tighter flex items-center gap-4"><BookOpen className="text-royal-800" size={32} /> SCRIPTURAL EVALUATION</h2>
                    {( (!isReviewMode && !isAnnotationReviewMode && !isBookmarkReviewMode) ? (
                        <>
                            {lesson.bibleQuizzes.map((q) => renderQuizCard(q))}
                        </>
                    ) : (
                        <div className="bg-indigo-50 p-10 rounded-[3rem] border-4 border-indigo-100 shadow-inner space-y-10 animate-in fade-in duration-500">
                             <div><h3 className="text-2xl font-serif font-black text-indigo-900 uppercase tracking-tight none">Revision Matrix</h3><p className="text-indigo-400 font-black uppercase text-[10px] tracking-widest mt-2">Condensed study excerpts and anchored perspectives</p></div>
                             <div className="space-y-6">
                                {isReviewMode && highlights.map(h => (
                                    <div key={h.id} className="p-6 bg-white rounded-3xl shadow-xl border-l-8 transition-transform hover:scale-[1.01]" style={{ borderColor: h.color }}><p className="text-base font-serif italic leading-relaxed text-gray-950">"{h.text}"</p></div>
                                ))}
                                {isAnnotationReviewMode && annotations.map(a => (
                                    <div key={a.id} className="p-8 bg-white rounded-[2.5rem] shadow-xl border-l-8 border-royal-900 transition-transform hover:scale-[1.01]"><p className="text-lg font-bold text-royal-950 leading-relaxed whitespace-pre-wrap">{a.body}</p></div>
                                ))}
                                {isBookmarkReviewMode && bookmarks.map(b => (
                                    <div key={b.id} onClick={() => handleJumpToBookmark(b)} className="p-6 bg-white rounded-3xl shadow-xl border-l-8 border-gold-500 transition-transform hover:scale-[1.01] cursor-pointer"><h4 className="font-serif font-black uppercase text-gold-600 mb-2">{b.title}</h4>{b.textSnippet && <p className="text-sm italic text-gray-500 line-clamp-3">"{b.textSnippet}"</p>}</div>
                                ))}
                             </div>
                        </div>
                    ))}
                </section>
              )}

              {(!isReviewMode && !isAnnotationReviewMode && !isBookmarkReviewMode) && (
                <>
                  {lesson.leadershipNotes && lesson.leadershipNotes.length > 0 && (
                    <section className="space-y-8 mb-16">
                        <div className="flex items-center gap-4 mb-4"><div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><PenTool size={24} /></div><h2 className="text-2xl font-serif font-black text-gray-900 uppercase tracking-tighter">LEADERSHIP PERSPECTIVE</h2></div>
                        <div className="space-y-12">
                            {lesson.leadershipNotes.map((note) => (
                                <div key={note.id} className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><PenTool size={120} /></div>
                                    <div className="relative z-10"><div className="flex items-center gap-3 mb-8 border-b-2 border-indigo-50 pb-4"><h3 className="text-xl font-serif font-black text-gray-900 uppercase tracking-tighter">{note.title}</h3></div><div className="prose prose-indigo max-w-none text-gray-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: note.body }} /></div>
                                </div>
                            ))}
                        </div>
                    </section>
                  )}
                  {lesson.noteQuizzes && lesson.noteQuizzes.length > 0 && (
                      <section className="space-y-8 mb-16">
                        <h2 className="text-2xl font-serif font-black text-gray-900 uppercase tracking-tighter flex items-center gap-4"><Target className="text-royal-800" size={32} /> CONTEXTUAL EVALUATION</h2>
                        {lesson.noteQuizzes.map((q) => renderQuizCard(q))}
                      </section>
                  )}
                </>
              )}

              {/* TERMINAL PROGRESS MEDALLION: REDESIGNED PANEL Footprint and Visibility */}
              {(!isReviewMode && !isAnnotationReviewMode && !isBookmarkReviewMode) && isLessonCompleted && moduleProgressData && (
                  <div className="mt-12 p-8 bg-slate-50/80 backdrop-blur-sm border-[4px] border-indigo-100/50 rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom-12 duration-1000 w-full max-w-[640px] mx-auto flex flex-col items-center gap-6 overflow-hidden">
                      <ModuleProgressPie completed={moduleProgressData.completed} total={moduleProgressData.total} />
                      
                      {/* PERSISTENT CERTIFICATE ACCESS POINT */}
                      {isLastInModule && (
                          <div className="w-full flex flex-col items-center border-t border-indigo-100 pt-8 animate-in fade-in delay-700">
                              <Tooltip content="Claim Master Credential: You have finished all lessons in this module. Claim your formal certificate here.">
                                <button 
                                    onClick={handleIssueModuleCertificate}
                                    className="group relative px-12 py-5 bg-gold-500 text-royal-900 font-black rounded-2xl text-sm uppercase tracking-[0.2em] shadow-xl transition-all transform hover:scale-105 active:scale-95 border-b-[6px] border-gold-700 flex items-center gap-4"
                                >
                                    <BadgeCheck size={24} /> CLAIM MODULE CERTIFICATE
                                </button>
                              </Tooltip>
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mt-4">Module Requirement Fulfilled</p>
                          </div>
                      )}
                  </div>
              )}

              {/* --- ADJACENCY MATRIX NAVIGATION FOOTER --- */}
              {(!isReviewMode && !isAnnotationReviewMode && !isBookmarkReviewMode) && (
                  <div ref={footerRef} className="mt-20 pt-10 border-t-8 border-gray-50 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                          <button 
                              onClick={() => handleNavigateAdjacent(adjacentLessons.prev)} 
                              disabled={!adjacentLessons.prev}
                              className={`flex-1 w-full md:w-auto px-10 py-6 rounded-[2.5rem] border-b-8 font-black uppercase text-xs tracking-[0.3em] transition-all flex items-center justify-center gap-4 group ${adjacentLessons.prev ? 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 active:scale-95' : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed opacity-50'}`}
                          >
                              <ChevronLeft size={24} className="group-hover:-translate-x-2 transition-transform" /> PREVIOUS
                          </button>

                          <div className="h-16 w-px bg-gray-100 hidden md:block"></div>

                          <button 
                              onClick={() => handleNavigateAdjacent(adjacentLessons.next)} 
                              disabled={!adjacentLessons.next}
                              className={`flex-1 w-full md:w-auto px-12 py-7 rounded-[2.5rem] border-b-8 font-black uppercase text-sm tracking-[0.4em] transition-all flex items-center justify-center gap-6 group shadow-2xl ${adjacentLessons.next ? 'bg-royal-800 text-white border-royal-950 hover:bg-black active:scale-95 transform hover:-translate-y-1' : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed opacity-50'}`}
                          >
                              {adjacentLessons.next ? (
                                  <>
                                      <span>NEXT <span className="hidden lg:inline">(VERIFIED PATHWAY Proceed Next)</span></span>
                                      <ChevronRight size={28} className="group-hover:translate-x-2 transition-transform" />
                                  </>
                              ) : (
                                  <>
                                      <Trophy size={28} className="text-gold-400" />
                                      <span>PATHWAY FULFILLED</span>
                                  </>
                              )}
                          </button>
                      </div>
                      <div className="mt-12 text-center">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.6em]">Registry Adjacency Protocol Verified</p>
                      </div>
                  </div>
              )}
          </div>
        </div>

        {/* Stabilized Tools Trigger: Hidden during overlays to prevent chaos */}
        {!showCelebration && !activeAboutType && !issuedCertForPreview && (
            <div className="fixed bottom-24 right-14 z-[140] flex flex-col items-end gap-4 pointer-events-none animate-in fade-in duration-300">
                <Tooltip content="Expand Scholarly Matrix: Access bookmarks, notes, annotations, and study tools. Tap for a mobile, draggable console.">
                    <button onClick={() => setIsToolsOpen(!isToolsOpen)} className="w-20 h-20 bg-royal-900 text-white rounded-full shadow-[0_20px_50px_rgba(30,27,75,0.6)] flex flex-col items-center justify-center hover:scale-110 active:scale-95 transition-all pointer-events-auto group border-4 border-white relative overflow-hidden">
                        {isToolsOpen ? <X size={28} /> : <Activity size={28} className="group-hover:rotate-12 transition-transform mb-1" />}
                        <span className="font-black text-[10px] uppercase tracking-widest">{isToolsOpen ? 'CLOSE' : 'TOOLS'}</span>
                    </button>
                </Tooltip>
            </div>
        )}
      </div>

      {activeAboutType && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] border-8 border-royal-900">
              <div className="bg-royal-900 p-8 text-white flex justify-between items-center shrink-0"><h3 className="text-2xl font-serif font-black uppercase tracking-tight">Identity: {activeAboutType}</h3><button onClick={() => setActiveAboutType(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button></div>
              <div className="flex-1 overflow-y-auto p-10 bg-gray-50/30 custom-scrollbar"><AboutSection segments={activeAboutType === 'course' ? (parentCourse?.about || []) : activeAboutType === 'module' ? (parentModule?.about || []) : (lesson.about || [])} /></div>
           </div>
        </div>
      )}

      {issuedCertForPreview && (
          <CertificateGenerator 
              certificate={issuedCertForPreview} 
              onClose={() => setIssuedCertForPreview(null)} 
          />
      )}
    </div>
  );
};

const AboutSection = ({ segments }: { segments: AboutSegment[] }) => (
    <div className="space-y-6 mt-4 h-full overflow-y-auto custom-scrollbar pr-3 pb-8">
        {segments.length > 0 ? segments.map((seg, idx) => (
            <div key={idx} className="p-6 bg-white border-2 border-gray-100 rounded-3xl shadow-sm hover:border-indigo-300 transition-all group/seg">
                <div className="flex items-center gap-3 mb-3"><span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs border border-indigo-100">P{seg.order}</span><h5 className="text-[12px] font-black text-gray-900 uppercase tracking-tight group-hover/seg:text-indigo-600 transition-colors">{seg.title}</h5></div>
                <div className="text-[13px] text-gray-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: seg.body }} />
            </div>
        )) : <div className="p-12 text-center bg-gray-50/50 rounded-3xl border-4 border-dashed border-gray-100 opacity-40"><p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Empty Perspectives</p></div>}
    </div>
);

const ModuleProgressPie = ({ completed, total }: { completed: number; total: number }) => {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // --- PIE CALCULATIONS (Fixed for 100x100 viewBox to prevent clipping/square look) ---
    const radius = 25; 
    const strokeWidth = 50; 
    const cx = 50;
    const cy = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-row items-center gap-12 py-6 animate-in fade-in duration-1000">
            {/* Visual Container: Fixed size with proper internal math to prevent scale overrun */}
            <div className="relative w-28 h-28 shrink-0 group">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-xl">
                    {/* Remaining Segment (Neutral Parchment) */}
                    <circle 
                        cx={cx} 
                        cy={cy} 
                        r={radius} 
                        fill="none" 
                        stroke="#F1EFEA" 
                        strokeWidth={strokeWidth} 
                        className="animate-in fade-in duration-700"
                    />
                    {/* Completed Segment (Royal Blue) */}
                    <circle 
                        cx={cx} 
                        cy={cy} 
                        r={radius} 
                        fill="none" 
                        stroke="#1e1b4b" 
                        strokeWidth={strokeWidth} 
                        strokeDasharray={circumference} 
                        strokeDashoffset={offset}
                        strokeLinecap="butt"
                        className="transition-all duration-[900ms] ease-out shadow-inner"
                    />
                    {/* Subtle Inner Detail */}
                    <circle cx={cx} cy={cy} r={radius} fill="none" stroke="black" strokeWidth="0.5" opacity="0.05" />
                </svg>

                {/* Center Overlay Matrix - White text for visibility against dark blue */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <p className="text-xs font-sans font-black text-white drop-shadow-md leading-none mb-0.5">
                        {completed}/{total}
                    </p>
                </div>
            </div>

            {/* Contextual Labeling - RELOCATED TO RIGHT SIDE */}
            <div className="text-left space-y-1">
                <h4 className="text-[12px] font-sans font-black text-gray-400 uppercase tracking-[0.3em]">
                    Module Progress
                </h4>
                <p className="text-3xl font-sans font-black text-indigo-400 tracking-tight leading-none">
                    {percentage}% <span className="text-sm font-medium text-gray-400 lowercase tracking-normal">completed</span>
                </p>
                <div className="h-1.5 w-16 bg-indigo-100 rounded-full mt-3"></div>
            </div>
        </div>
    );
};

export default LessonView;