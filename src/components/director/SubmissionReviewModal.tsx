import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MessageSquare,
  Award,
  Calendar,
  Sparkles,
  BookOpen,
  User as UserIcon,
  AlertCircle,
  Save,
} from 'lucide-react';
import { Activity, ActivitySubmission, Question } from '../../types';

interface SubmissionReviewModalProps {
  activity: Activity;
  submission: ActivitySubmission;
  onSaveCorrection: (
    activityId: string,
    studentId: string,
    grade: number,
    feedback: string,
    questionScores: Record<string, number>
  ) => void;
  onClose: () => void;
}

export function SubmissionReviewModal({
  activity,
  submission,
  onSaveCorrection,
  onClose,
}: SubmissionReviewModalProps) {
  const questions = activity.questions || [];
  const defaultQuestionValue = questions.length > 0 ? activity.maxScore / questions.length : 2.5;

  // Initialize scores per question
  const [questionScores, setQuestionScores] = useState<Record<string, number>>(() => {
    if (submission.questionScores) return { ...submission.questionScores };

    const initial: Record<string, number> = {};
    questions.forEach((q) => {
      const qVal = q.points !== undefined ? q.points : defaultQuestionValue;
      const studentAns = submission.answers?.[q.id]?.trim();

      if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') {
        // Auto-correção para questões objetivas
        if (q.correctAnswer && studentAns && studentAns.toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          initial[q.id] = qVal;
        } else {
          initial[q.id] = 0;
        }
      } else {
        // Questão escrita: se já tiver nota avaliada, mantém, senão deixa proporcional se tiver resposta
        initial[q.id] = submission.status === 'AVALIADO' && submission.grade !== undefined ? (submission.grade / questions.length) : qVal;
      }
    });
    return initial;
  });

  // Calculate total grade
  const computedTotal = Object.values(questionScores).reduce((acc, val) => acc + (val || 0), 0);
  const roundedComputed = Math.min(activity.maxScore, Math.round(computedTotal * 10) / 10);

  const [grade, setGrade] = useState<number>(() => {
    if (submission.grade !== undefined) return submission.grade;
    return roundedComputed;
  });

  const [feedback, setFeedback] = useState<string>(
    submission.feedback || 'Excelente esforço e resolução das atividades propostas!'
  );
  const [isSaving, setIsSaving] = useState(false);

  // When individual scores change, keep grade in sync if not manually detached
  const handleScoreChange = (qId: string, newScore: number) => {
    setQuestionScores((prev) => {
      const updated = { ...prev, [qId]: newScore };
      const newTotal = Object.values(updated).reduce((acc, val) => acc + (val || 0), 0);
      setGrade(Math.min(activity.maxScore, Math.round(newTotal * 10) / 10));
      return updated;
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    onSaveCorrection(activity.id, submission.studentId, Number(grade), feedback, questionScores);
    setTimeout(() => {
      setIsSaving(false);
      onClose();
    }, 400);
  };

  const formattedDate = submission.submittedAt
    ? new Date(submission.submittedAt).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Data não informada';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Cabeçalho do Modal */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-slate-50 to-indigo-50">
          <div className="flex items-center gap-4">
            <img
              src={submission.studentAvatar}
              alt={submission.studentName}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-600 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  {activity.subject}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    submission.status === 'AVALIADO'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {submission.status === 'AVALIADO' ? 'Corrigida' : 'Aguardando Correção'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-800 leading-tight">
                Correção: {submission.studentName}
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="font-semibold text-slate-700">{activity.title}</span>
                <span>•</span>
                <Calendar className="w-3.5 h-3.5" />
                <span>Enviado em {formattedDate}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com Questões e Respostas */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>
                <strong>Correção Inteligente:</strong> Questões objetivas (múltipla escolha e V/F) são corrigidas
                automaticamente pelo gabarito. Questões escritas podem ser avaliadas manualmente abaixo.
              </span>
            </div>
            <div className="text-right shrink-0 ml-4">
              <span className="text-xs text-slate-400 block font-semibold">Total Sugerido</span>
              <span className="text-base font-extrabold text-purple-700 font-mono">
                {roundedComputed.toFixed(1)} / {activity.maxScore.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Lista de Questões */}
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const qVal = q.points !== undefined ? q.points : defaultQuestionValue;
              const studentAnswer = submission.answers?.[q.id];
              const isObjective = q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE';
              const isCorrect =
                isObjective &&
                q.correctAnswer &&
                studentAnswer &&
                studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

              const currentScore = questionScores[q.id] ?? (isCorrect ? qVal : 0);

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 transition ${
                    isObjective
                      ? isCorrect
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-rose-200 bg-rose-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Cabeçalho da Questão */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {q.type === 'MULTIPLE_CHOICE'
                            ? 'Múltipla Escolha'
                            : q.type === 'TRUE_FALSE'
                            ? 'Verdadeiro ou Falso'
                            : 'Resposta Escrita'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 mt-0.5">{q.statement}</h4>
                      </div>
                    </div>

                    {/* Nota por questão */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400 font-medium">Pontos:</span>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max={qVal * 1.5}
                        value={currentScore}
                        onChange={(e) => handleScoreChange(q.id, parseFloat(e.target.value) || 0)}
                        className="w-16 px-2.5 py-1 text-center font-bold text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                      />
                      <span className="text-xs text-slate-400">/ {qVal.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Imagem opcional da questão */}
                  {q.imageUrl && (
                    <div className="max-w-md rounded-xl overflow-hidden border border-slate-200">
                      <img src={q.imageUrl} alt="Imagem da questão" className="w-full object-cover max-h-48" />
                    </div>
                  )}

                  {/* Resposta do Aluno */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Resposta enviada pelo aluno:
                    </p>
                    <div className="font-medium text-slate-800 text-sm whitespace-pre-wrap">
                      {studentAnswer ? (
                        <span>{studentAnswer}</span>
                      ) : (
                        <span className="italic text-slate-400">Nenhuma resposta registrada.</span>
                      )}
                    </div>
                  </div>

                  {/* Feedback Objetivo (Auto-Correção) */}
                  {isObjective && (
                    <div
                      className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-100/70 text-emerald-900 border border-emerald-200'
                          : 'bg-rose-100/70 text-rose-900 border border-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-700 shrink-0" />
                        )}
                        <span>
                          {isCorrect ? (
                            <strong>Resposta Correta! (Auto-corrigida)</strong>
                          ) : (
                            <>
                              <strong>Resposta Incorreta.</strong> Gabarito oficial:{' '}
                              <span className="font-bold underline">{q.correctAnswer}</span>
                            </>
                          )}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-xs">
                        {isCorrect ? `+${qVal.toFixed(1)} pts` : '0.0 pts'}
                      </span>
                    </div>
                  )}

                  {/* Auxiliar de avaliação para respostas escritas */}
                  {q.type === 'ESSAY' && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-500 font-medium">
                        Atribuição rápida de nota para resposta escrita:
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleScoreChange(q.id, qVal)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                        >
                          Total ({qVal.toFixed(1)})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleScoreChange(q.id, qVal / 2)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                        >
                          Metade ({(qVal / 2).toFixed(1)})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleScoreChange(q.id, 0)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                        >
                          Zero (0.0)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Campo Comentário do Professor & Nota Final */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              Finalização da Correção
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Campo Nota */}
              <div className="md:col-span-1 bg-purple-50/60 p-4 rounded-2xl border border-purple-100 flex flex-col justify-center">
                <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
                  Nota Final
                </label>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={activity.maxScore}
                    value={grade}
                    onChange={(e) => setGrade(parseFloat(e.target.value) || 0)}
                    className="w-20 px-3 py-2 text-xl font-black text-purple-800 rounded-xl border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <span className="text-sm font-bold text-purple-600">/ {activity.maxScore}</span>
                </div>
                <p className="text-[11px] text-purple-600 mt-1 font-medium">
                  {grade >= 7 ? 'Desempenho Aprovado' : 'Em recuperação'}
                </p>
              </div>

              {/* Campo Comentário do Professor */}
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                  Comentário do professor
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Escreva orientações pedagógicas, pontos fortes e dicas de melhoria para o aluno..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/30 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com Botão Salvar Correção */}
        <div className="p-5 border-t border-slate-100 bg-white flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Ao salvar, o status passará para <strong className="text-emerald-700">"Corrigida"</strong> e o aluno
            será notificado instantaneamente com a nota e gabarito.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-lg shadow-purple-900/20 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar correção'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
