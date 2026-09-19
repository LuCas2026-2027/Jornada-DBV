import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Activity, User, Question } from '../../types';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  User as UserIcon,
  BookOpen,
  CheckCircle2,
  Save,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Send,
  RotateCcw
} from 'lucide-react';

interface ActivityPlayerViewProps {
  activity: Activity;
  user: User;
  onBack: () => void;
  onSubmit: (activityId: string, answers: Record<string, string>, summaryContent: string) => void;
  onAutoSaveDraft?: (activityId: string, questionIndex: number, answers: Record<string, string>) => void;
}

export function ActivityPlayerView({
  activity,
  user,
  onBack,
  onSubmit,
  onAutoSaveDraft,
}: ActivityPlayerViewProps) {
  const existingSubmission = activity.submissions[user.id];
  const isAlreadySubmitted = !!existingSubmission;
  const isGraded = existingSubmission?.status === 'AVALIADO';

  const questions: Question[] = activity.questions && activity.questions.length > 0
    ? activity.questions
    : [
        {
          id: 'q-default-1',
          statement: activity.description,
          type: 'ESSAY',
        },
      ];

  const totalQuestions = questions.length;

  // Retrieve draft if any
  const studentDraft = activity.drafts?.[user.id];
  const initialIndex = Math.min(
    Math.max(studentDraft?.currentQuestionIndex || 0, 0),
    totalQuestions - 1
  );

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    if (existingSubmission?.answers) {
      return existingSubmission.answers;
    }
    if (studentDraft?.answers) {
      return studentDraft.answers;
    }
    if (existingSubmission?.content) {
      return { [questions[0]?.id || 'q-default-1']: existingSubmission.content };
    }
    return {};
  });

  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Salvo agora');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const currentQuestion = questions[currentIndex] || questions[0];
  const currentAnswer = answers[currentQuestion.id] || '';

  // Auto-save debounce effect
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (isAlreadySubmitted) return;

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      if (onAutoSaveDraft) {
        onAutoSaveDraft(activity.id, currentIndex, answers);
      }
      setSaveStatus('saved');
      const now = new Date();
      setLastSavedTime(
        `Salvo automaticamente às ${now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}`
      );
    }, 600);

    return () => clearTimeout(timer);
  }, [answers, currentIndex, activity.id, isAlreadySubmitted, onAutoSaveDraft]);

  const handleSelectOption = (option: string) => {
    if (isAlreadySubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }));
  };

  const handleTextAnswerChange = (val: string) => {
    if (isAlreadySubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: val,
    }));
  };

  const answeredCount = questions.filter((q) => Boolean(answers[q.id]?.trim())).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinalSubmit = () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    const summaryParts = questions.map((q, idx) => {
      return `[Questão ${idx + 1}]: ${answers[q.id] || '(Em branco)'}`;
    });
    const summary = summaryParts.join('\n\n');

    setTimeout(() => {
      onSubmit(activity.id, answers, summary);
      setIsSubmitting(false);
      setShowSuccessModal(true);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#7c4dff', '#48cae4', '#ffd166', '#06d6a0'],
        });
      } catch (e) {
        // Safe fallback
      }
    }, 500);
  };

  return (
    <div id="activity-player-screen" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <button
            type="button"
            id="back-to-activities-btn"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100/70 px-4 py-2 rounded-2xl transition self-start cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Atividades</span>
          </button>

          {/* Auto-save indicator */}
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500">
            {isAlreadySubmitted ? (
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isGraded ? 'Atividade Corrigida' : 'Atividade Enviada'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200/60">
                <Save className={`w-3.5 h-3.5 ${saveStatus === 'saving' ? 'text-amber-500 animate-spin' : 'text-emerald-500'}`} />
                <span>{saveStatus === 'saving' ? 'Salvando...' : lastSavedTime}</span>
              </span>
            )}
          </div>
        </div>

        {/* Activity Details Overview */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 font-bold text-xs rounded-full">
                {activity.subject}
              </span>
              {activity.dueDate && (
                <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 font-semibold text-xs rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Prazo: {new Date(activity.dueDate).toLocaleDateString('pt-BR')}
                </span>
              )}
              <span className="px-3 py-1 bg-slate-100 text-slate-600 font-semibold text-xs rounded-full">
                {totalQuestions} {totalQuestions === 1 ? 'questão' : 'questões'}
              </span>
              <span className="px-3 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-full">
                Nota Máxima: {activity.maxScore} pts
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              {activity.title}
            </h1>

            <div className="flex items-center gap-2.5 mt-3 text-xs text-slate-600">
              <img
                src={activity.teacherAvatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'}
                alt={activity.teacherName || 'Professor'}
                className="w-7 h-7 rounded-full object-cover border border-purple-200"
              />
              <span className="font-semibold text-slate-800">
                {activity.teacherName || 'Professor Responsável'}
              </span>
            </div>

            {activity.instructions && activity.instructions.length > 0 && (
              <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-1.5">Instruções:</span>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  {activity.instructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Teacher Grade / Feedback Box if graded */}
          {isGraded && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/70 p-4 rounded-3xl">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Nota Atribuída</span>
              </div>
              <div className="text-3xl font-black text-emerald-700 my-1">
                {existingSubmission.grade?.toFixed(1)}{' '}
                <span className="text-xs font-normal text-emerald-600">/ {activity.maxScore}</span>
              </div>
              {existingSubmission.feedback && (
                <div className="text-xs text-emerald-900 mt-2 bg-white/70 p-2.5 rounded-xl border border-emerald-100">
                  <span className="font-bold block mb-0.5">Comentário do Professor:</span>
                  {existingSubmission.feedback}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar & Question Jump Indicator */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-purple-700">
              Questão {currentIndex + 1} de {totalQuestions}
            </span>
            <span className="text-slate-400 font-normal">&bull;</span>
            <span className="text-slate-500 font-normal">
              {answeredCount} respondida(s)
            </span>
          </div>
          <span className="font-mono text-purple-700 font-extrabold">{progressPercent}%</span>
        </div>

        {/* Progress bar line */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(progressPercent, 4)}%` }}
          />
        </div>

        {/* Question buttons jump selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          {questions.map((q, idx) => {
            const isAnswered = Boolean(answers[q.id]?.trim());
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`min-w-8 h-8 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                  isCurrent
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-300'
                    : isAnswered
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Question Box */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-3 py-1 rounded-full">
            {currentQuestion.type === 'MULTIPLE_CHOICE'
              ? 'Múltipla Escolha'
              : currentQuestion.type === 'TRUE_FALSE'
              ? 'Verdadeiro ou Falso'
              : 'Resposta Escrita'}
          </span>

          <span className="text-xs text-slate-400 font-medium">
            Salvo automaticamente
          </span>
        </div>

        {/* Question Statement */}
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
            {currentIndex + 1}. {currentQuestion.statement}
          </h3>

          {/* Optional Question Image */}
          {currentQuestion.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-80 bg-slate-50 flex items-center justify-center">
              <img
                src={currentQuestion.imageUrl}
                alt={`Imagem da questão ${currentIndex + 1}`}
                className="max-h-80 w-auto object-contain"
              />
            </div>
          )}
        </div>

        {/* Input area based on question type */}
        <div className="space-y-3 pt-2">
          {currentQuestion.type === 'MULTIPLE_CHOICE' && currentQuestion.options && (
            <div className="space-y-2.5">
              {currentQuestion.options.map((opt, oIdx) => {
                const isSelected = currentAnswer === opt;
                const letter = String.fromCharCode(65 + oIdx);
                return (
                  <button
                    key={oIdx}
                    type="button"
                    disabled={isAlreadySubmitted}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full text-left p-4 rounded-2xl border transition flex items-start gap-3.5 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50/80 border-purple-400 text-purple-950 font-semibold shadow-sm'
                        : 'bg-white border-slate-200 hover:border-purple-200 hover:bg-slate-50/80 text-slate-800'
                    } ${isAlreadySubmitted ? 'cursor-default' : ''}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-xs sm:text-sm leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'TRUE_FALSE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Verdadeiro', 'Falso'].map((choice) => {
                const isSelected = currentAnswer === choice;
                return (
                  <button
                    key={choice}
                    type="button"
                    disabled={isAlreadySubmitted}
                    onClick={() => handleSelectOption(choice)}
                    className={`p-4 rounded-2xl border text-center font-bold text-sm transition cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-purple-200 hover:bg-slate-50'
                    } ${isAlreadySubmitted ? 'cursor-default' : ''}`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.type === 'ESSAY' && (
            <div className="space-y-2">
              <textarea
                rows={5}
                disabled={isAlreadySubmitted}
                value={currentAnswer}
                onChange={(e) => handleTextAnswerChange(e.target.value)}
                placeholder="Escreva sua resposta detalhada aqui..."
                className="w-full p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 leading-relaxed disabled:bg-slate-50 disabled:text-slate-600"
              />
              <span className="text-[11px] text-slate-400 block text-right">
                {currentAnswer.length} caracteres
              </span>
            </div>
          )}
        </div>

        {/* Bottom Nav Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            id="activity-prev-question-btn"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {currentIndex < totalQuestions - 1 ? (
              <button
                type="button"
                id="activity-next-question-btn"
                onClick={handleNext}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Próxima</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : !isAlreadySubmitted ? (
              <button
                type="button"
                id="activity-finish-btn"
                onClick={() => setShowConfirmModal(true)}
                className="w-full sm:w-auto px-7 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Enviar para o professor</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onBack}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Voltar ao Menu</span>
              </button>
            )}
          </div>
        </div>

        {/* Resumo da Atividade ao terminar todas as questões ou na última questão */}
        {!isAlreadySubmitted && (currentIndex === totalQuestions - 1 || answeredCount === totalQuestions) && (
          <div className="mt-4 p-4 bg-purple-50 rounded-2xl border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                  Você respondeu {answeredCount} de {totalQuestions} questões.
                </span>
                <span className="text-[11px] text-slate-500">
                  {answeredCount === totalQuestions
                    ? 'Todas as questões foram preenchidas e estão prontas para entrega.'
                    : 'Você pode revisar as pendentes ou enviar agora para avaliação.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              id="send-to-teacher-summary-btn"
              onClick={() => setShowConfirmModal(true)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Enviar para o professor</span>
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-purple-100 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-700 mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Tem certeza que deseja enviar esta atividade para correção?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Você respondeu {answeredCount} de {totalQuestions} questões. Após o envio, suas respostas serão bloqueadas para alterações e encaminhadas ao professor.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                id="cancel-submit-activity-btn"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                id="confirm-submit-activity-btn"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Enviando...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar atividade</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal Confirmation */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-emerald-100 space-y-4 animate-in zoom-in-95 text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full inline-block mb-1">
                Status: Enviada
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Atividade enviada com sucesso!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Suas respostas foram registradas e encaminhadas para a direção pedagógica e professores. As alterações foram bloqueadas.
              </p>
              <div className="mt-3 p-3 bg-slate-50 rounded-xl text-slate-600 text-xs font-mono">
                Registrado em: {new Date().toLocaleString('pt-BR')}
              </div>
            </div>

            <div className="pt-3">
              <button
                type="button"
                id="close-success-modal-btn"
                onClick={() => {
                  setShowSuccessModal(false);
                  onBack();
                }}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-purple-600/20 transition cursor-pointer"
              >
                Concluir e Voltar ao Catálogo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
