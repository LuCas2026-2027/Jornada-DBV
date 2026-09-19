import { useState, useEffect } from 'react';
import {
  getInitialState,
  persistSession,
  persistActivities,
  persistNotices,
  persistCourses,
  persistStudents,
  saveActivityDraft,
  StorageState,
} from './services/storage';
import { User, Activity, SchoolNotice, Course, Teacher } from './types';
import { AuthPortal } from './components/auth/AuthPortal';
import { Sidebar, StudentTab, DirectorTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { StudentDashboard } from './components/student/StudentDashboard';
import { CoursesView } from './components/student/CoursesView';
import { ActivitiesView } from './components/student/ActivitiesView';
import { GradesView } from './components/student/GradesView';
import { NoticesView } from './components/student/NoticesView';
import { ScheduleView } from './components/student/ScheduleView';
import { StudentAnswersView } from './components/student/StudentAnswersView';
import { StudentResultsView } from './components/student/StudentResultsView';
import { DirectorDashboard } from './components/director/DirectorDashboard';
import { ProfileModal } from './components/student/ProfileModal';
import { TeacherContactModal } from './components/student/TeacherContactModal';

export default function App() {
  const [appState, setAppState] = useState<StorageState>(() => getInitialState());
  const [activeTab, setActiveTab] = useState<string>('DASHBOARD');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<Course | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
  const [contactTeacher, setContactTeacher] = useState<Teacher | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Sync state changes with localStorage
  const { currentUser, students, activities, notices, courses, teachers, schedule } = appState;

  useEffect(() => {
    // When director logs in, default tab is director dashboard
    if (currentUser?.role === 'DIRETOR') {
      if (!activeTab.startsWith('DIR_') && activeTab !== 'GRADES') {
        setActiveTab('DIR_DASHBOARD');
      }
    } else if (currentUser?.role === 'ALUNO') {
      if (activeTab.startsWith('DIR_')) {
        setActiveTab('DASHBOARD');
      }
    }
  }, [currentUser]);

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    setAppState((prev) => ({ ...prev, currentUser: user }));
    if (user.role === 'DIRETOR') {
      setActiveTab('DIR_DASHBOARD');
    } else {
      setActiveTab('DASHBOARD');
    }
  };

  const handleLogout = () => {
    persistSession(null);
    setAppState((prev) => ({ ...prev, currentUser: null }));
    setActiveTab('DASHBOARD');
    setShowProfileModal(false);
  };

  // Student Actions
  const handleSubmitActivity = (
    activityId: string,
    answerText: string,
    answersMap?: Record<string, string>
  ) => {
    if (!currentUser) return;

    const updatedActivities = activities.map((act) => {
      if (act.id === activityId) {
        return {
          ...act,
          submissions: {
            ...act.submissions,
            [currentUser.id]: {
              studentId: currentUser.id,
              studentName: currentUser.name,
              studentAvatar: currentUser.avatar,
              submittedAt: new Date().toISOString(),
              content: answerText,
              answers: answersMap,
              status: 'PENDENTE' as const,
            },
          },
        };
      }
      return act;
    });

    // Update student monitoring status to ONLINE
    const updatedStudents = students.map((stu) => {
      if (stu.id === currentUser.id) {
        return {
          ...stu,
          onlineStatus: 'ONLINE' as const,
          activeActivityProgress: undefined,
          lastAccess: 'Agora mesmo',
        };
      }
      return stu;
    });

    persistActivities(updatedActivities);
    setAppState((prev) => ({
      ...prev,
      activities: updatedActivities,
      students: updatedStudents,
    }));
  };

  const handleAutoSaveDraft = (
    activityId: string,
    questionIndex: number,
    answers: Record<string, string>
  ) => {
    if (!currentUser) return;
    saveActivityDraft(activityId, currentUser.id, questionIndex, answers);

    const act = activities.find((a) => a.id === activityId);
    const actTitle = act?.title || 'Atividade em Andamento';
    const totalQ = act?.questions?.length || 1;

    // Update in-memory state smoothly including live monitoring
    setAppState((prev) => ({
      ...prev,
      students: prev.students.map((stu) => {
        if (stu.id === currentUser.id) {
          return {
            ...stu,
            onlineStatus: 'RESPONDENDO' as const,
            activeActivityProgress: {
              activityId,
              activityTitle: actTitle,
              currentQuestion: questionIndex + 1,
              totalQuestions: totalQ,
              isPrivateWhileAnswering: true,
            },
            lastAccess: 'Agora mesmo',
          };
        }
        return stu;
      }),
      activities: prev.activities.map((act) => {
        if (act.id === activityId) {
          return {
            ...act,
            drafts: {
              ...(act.drafts || {}),
              [currentUser.id]: {
                currentQuestionIndex: questionIndex,
                answers,
                lastSavedAt: new Date().toISOString(),
              },
            },
          };
        }
        return act;
      }),
    }));
  };

  const handleToggleLessonComplete = (courseId: string, lessonId: string) => {
    const updatedCourses = courses.map((crs) => {
      if (crs.id === courseId) {
        const updatedLessons = crs.lessons.map((l) =>
          l.id === lessonId ? { ...l, completed: !l.completed } : l
        );
        const completedCount = updatedLessons.filter((l) => l.completed).length;
        const newPct = Math.round((completedCount / updatedLessons.length) * 100);
        return {
          ...crs,
          lessons: updatedLessons,
          completedLessons: completedCount,
          progressPercentage: newPct,
        };
      }
      return crs;
    });

    persistCourses(updatedCourses);
    setAppState((prev) => ({ ...prev, courses: updatedCourses }));
  };

  const handleUpdateAvatar = (newAvatarUrl: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, avatar: newAvatarUrl };
    persistSession(updatedUser);

    // If student, update also in students list
    const updatedStudents = students.map((s) =>
      s.id === currentUser.id ? { ...s, avatar: newAvatarUrl } : s
    );
    persistStudents(updatedStudents);

    setAppState((prev) => ({
      ...prev,
      currentUser: updatedUser,
      students: updatedStudents,
    }));
  };

  // Director Actions
  const handleCreateActivity = (newActData: Omit<Activity, 'id' | 'submissions'>) => {
    const newActivity: Activity = {
      ...newActData,
      id: `act-${Date.now()}`,
      submissions: {},
    };

    const updated = [newActivity, ...activities];
    persistActivities(updated);
    setAppState((prev) => ({ ...prev, activities: updated }));
  };

  const handleGradeSubmission = (
    activityId: string,
    studentId: string,
    grade: number,
    feedback: string
  ) => {
    const updatedActivities = activities.map((act) => {
      if (act.id === activityId && act.submissions[studentId]) {
        return {
          ...act,
          submissions: {
            ...act.submissions,
            [studentId]: {
              ...act.submissions[studentId],
              status: 'AVALIADO' as const,
              grade,
              feedback,
            },
          },
        };
      }
      return act;
    });

    persistActivities(updatedActivities);
    setAppState((prev) => ({ ...prev, activities: updatedActivities }));
  };

  const handleCreateNotice = (newNoticeData: Omit<SchoolNotice, 'id' | 'publishDate'>) => {
    const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

    const newNotice: SchoolNotice = {
      ...newNoticeData,
      id: `not-${Date.now()}`,
      publishDate: todayFormatted,
    };

    const updated = [newNotice, ...notices];
    persistNotices(updated);
    setAppState((prev) => ({ ...prev, notices: updated }));
  };

  const handleDeleteNotice = (noticeId: string) => {
    const updated = notices.filter((n) => n.id !== noticeId);
    persistNotices(updated);
    setAppState((prev) => ({ ...prev, notices: updated }));
  };

  // If user is not authenticated, display AuthPortal
  if (!currentUser) {
    return <AuthPortal onLoginSuccess={handleLoginSuccess} />;
  }

  // Pending count for student
  const studentPendingCount = activities.filter(
    (act) => !act.submissions[currentUser.id]
  ).length;

  // Pending corrections for director
  const directorPendingCorrectionsCount = activities.reduce(
    (acc, act) =>
      acc +
      Object.values(act.submissions).filter((sub) => sub.status === 'PENDENTE').length,
    0
  );

  return (
    <div className="min-h-screen bg-[#f4f2fb] p-2 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Outer Card Container - Replicating the exact floating dashboard framing from the reference image */}
      <div
        id="app-container"
        className="w-full max-w-[1440px] bg-[#fbfaff] rounded-[28px] sm:rounded-[36px] p-3 sm:p-5 md:p-6 shadow-2xl shadow-purple-950/8 border border-purple-100/80 flex flex-col md:flex-row gap-5 relative overflow-hidden"
      >
        {/* Left Sidebar */}
        <Sidebar
          role={currentUser.role}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSelectedCourseForDetail(null);
          }}
          onLogout={handleLogout}
          pendingActivitiesCount={currentUser.role === 'ALUNO' ? studentPendingCount : undefined}
          pendingCorrectionsCount={currentUser.role === 'DIRETOR' ? directorPendingCorrectionsCount : undefined}
          unreadNoticesCount={notices.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0">
          {/* Top Header */}
          <Header
            user={currentUser}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            notices={notices}
            onOpenProfile={() => setShowProfileModal(true)}
            onSelectNotice={(notice) => {
              setSelectedNoticeId(notice.id);
              setActiveTab('NOTICES');
            }}
            onLogout={handleLogout}
          />

          {/* Quick Demo Switcher helper pill on bottom right or header */}
          <div className="mb-4 flex items-center justify-between bg-purple-50/70 border border-purple-100 px-4 py-2 rounded-2xl text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-purple-900">
                {currentUser.role === 'DIRETOR' ? 'Modo: Direção Pedagógica' : 'Modo: Portal do Aluno'}
              </span>
              <span className="text-slate-400 hidden sm:inline">&bull;</span>
              <span className="text-slate-600 hidden sm:inline">
                {currentUser.name} ({currentUser.email})
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
            >
              Trocar de Usuário / Sair
            </button>
          </div>

          {/* Views for DIRETOR */}
          {currentUser.role === 'DIRETOR' && (
            <DirectorDashboard
              director={currentUser}
              students={students}
              activities={activities}
              notices={notices}
              activeDirectorTab={activeTab}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onCreateActivity={handleCreateActivity}
              onGradeSubmission={handleGradeSubmission}
              onCreateNotice={handleCreateNotice}
              onDeleteNotice={handleDeleteNotice}
            />
          )}

          {/* Views for ALUNO */}
          {currentUser.role === 'ALUNO' && (
            <>
              {activeTab === 'DASHBOARD' && (
                <StudentDashboard
                  user={currentUser}
                  courses={courses}
                  activities={activities}
                  notices={notices}
                  teachers={teachers}
                  onNavigateTab={(tab) => {
                    setActiveTab(tab);
                    setSelectedCourseForDetail(null);
                  }}
                  onSelectCourse={(course) => {
                    setSelectedCourseForDetail(course);
                    setActiveTab('COURSES');
                  }}
                  onSelectActivity={(act) => {
                    setSelectedActivityId(act.id);
                    setActiveTab('ACTIVITIES');
                  }}
                  onSelectNotice={(notice) => {
                    setSelectedNoticeId(notice.id);
                    setActiveTab('NOTICES');
                  }}
                  onContactTeacher={(teacher) => setContactTeacher(teacher)}
                />
              )}

              {activeTab === 'ACTIVITIES' && (
                <ActivitiesView
                  user={currentUser}
                  activities={activities}
                  onSubmitActivity={handleSubmitActivity}
                  onAutoSaveDraft={handleAutoSaveDraft}
                  selectedActivityId={selectedActivityId}
                />
              )}

              {activeTab === 'MY_ANSWERS' && (
                <StudentAnswersView
                  user={currentUser}
                  activities={activities}
                  onOpenActivity={(act) => {
                    setSelectedActivityId(act.id);
                    setActiveTab('ACTIVITIES');
                  }}
                />
              )}

              {activeTab === 'RESULTS' && (
                <StudentResultsView
                  user={currentUser}
                  activities={activities}
                  onOpenActivity={(act) => {
                    setSelectedActivityId(act.id);
                    setActiveTab('ACTIVITIES');
                  }}
                />
              )}

              {activeTab === 'PROFILE' && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm max-w-2xl mx-auto space-y-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-purple-300"
                    />
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900">{currentUser.name}</h2>
                      <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                        {currentUser.grade || 'Desbravador - Guerreiros Da Serra'}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">{currentUser.email}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setShowProfileModal(true)}
                      className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-purple-600/20 transition cursor-pointer"
                    >
                      Alterar Foto de Perfil
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-6 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer"
                    >
                      Sair da Conta
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'COURSES' && (
                <CoursesView
                  courses={courses}
                  initialSelectedCourse={selectedCourseForDetail}
                  onToggleLessonComplete={handleToggleLessonComplete}
                />
              )}

              {activeTab === 'NOTICES' && (
                <NoticesView notices={notices} selectedNoticeId={selectedNoticeId} />
              )}

              {activeTab === 'SCHEDULE' && (
                <ScheduleView schedule={schedule} />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        role={currentUser.role}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedCourseForDetail(null);
        }}
        pendingActivitiesCount={currentUser.role === 'ALUNO' ? studentPendingCount : undefined}
        unreadNoticesCount={notices.length}
      />

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          user={currentUser}
          onClose={() => setShowProfileModal(false)}
          onUpdateAvatar={handleUpdateAvatar}
          onLogout={handleLogout}
        />
      )}

      {/* Teacher Contact Modal */}
      {contactTeacher && (
        <TeacherContactModal
          teacher={contactTeacher}
          onClose={() => setContactTeacher(null)}
        />
      )}
    </div>
  );
}
