import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Layers,
  HelpCircle,
  Calendar,
  User as UserIcon,
  BookOpen,
  FileText,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Activity, Question, QuestionType } from '../../types';

interface ActivityFormModalProps {
  activityToEdit?: Activity | null;
  onSave: (activityData: Activity) => void;
  onClose: () => void;
}

const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
];

const PRESET_SUBJECTS = [
  'Programação Orientada a Objetos',
  'Fundamentos de Banco de Dados',
  'Física Aplicada e Termodinâmica',
  'Matemática e Estatística',
  'História e Sociedade',
  'Química Geral',
  'Inglês Técnico',
];

export function ActivityFormModal({ activityToEdit, onSave, onClose }: ActivityFormModalProps) {
  const isEditing = !!activityToEdit;

  // Form Fields as specified in Item 9
  const [title, setTitle] = useState(activityToEdit?.title || '');
  const [subject, setSubject] = useState(activityToEdit?.subject || PRESET_SUBJECTS[0]);
  const [targetClass, setTargetClass] = useState(
    activityToEdit?.targetClass || 'Desbravador - Guerreiros Da Serra'
  );
  const [teacherName, setTeacherName] = useState(
    activityToEdit?.teacherName || 'Prof. Roberto Guimarães'
  );
  const [description, setDescription] = useState(activityToEdit?.description || '');
  const [instructionsText, setInstructionsText] = useState(
    activityToEdit?.instructions ? activityToEdit.instructions.join('\n') : 'Leia atentamente cada questão.\nSuas respostas são salvas automaticamente.\nRevise suas respostas antes do envio definitivo.'
  );
  const [coverImage, setCoverImage] = useState(activityToEdit?.coverImage || PRESET_COVERS[0]);
  const [dueDate, setDueDate] = useState(
    activityToEdit?.dueDate
      ? activityToEdit.dueDate.substring(0, 16)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 16)
  );
  const [maxScore, setMaxScore] = useState(activityToEdit?.maxScore || 10);

  // Questions array
  const [questions, setQuestions] = useState<Question[]>(() => {
    if (activityToEdit?.questions && activityToEdit.questions.length > 0) {
      return [...activityToEdit.questions];
    }
    return [
      {
        id: `q-${Date.now()}-1`,
        statement: 'Qual é o conceito fundamental abordado nesta atividade?',
        type: 'MULTIPLE_CHOICE',
        options: [
          'Alternativa principal correta',
          'Segunda alternativa conceitual',
          'Terceira alternativa',
          'Quarta alternativa',
        ],
        correctAnswer: 'Alternativa principal correta',
        points: 2.5,
      },
      {
        id: `q-${Date.now()}-2`,
        statement: 'O processo de verificação é executado de forma automática nesta questão.',
        type: 'TRUE_FALSE',
        correctAnswer: 'Verdadeiro',
        points: 2.5,
      },
    ];
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper to add new question
  const handleAddQuestion = () => {
    const newQ: Question = {
      id: `q-${Date.now()}-${questions.length + 1}`,
      statement: '',
      type: 'MULTIPLE_CHOICE',
      options: ['Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D'],
      correctAnswer: 'Alternativa A',
      points: 2.5,
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      setErrorMsg('A atividade precisa de pelo menos 1 questão.');
      return;
    }
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
  };

  const handleUpdateQuestion = (idx: number, updates: Partial<Question>) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], ...updates };
    setQuestions(updated);
  };

  // Helper to add/remove options for MULTIPLE_CHOICE
  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    const q = questions[qIdx];
    const opts = [...(q.options || [])];
    const prevVal = opts[optIdx];
    opts[optIdx] = val;

    // if this option was the correct answer, update correctAnswer too
    let newCorrect = q.correctAnswer;
    if (newCorrect === prevVal) {
      newCorrect = val;
    }

    handleUpdateQuestion(qIdx, { options: opts, correctAnswer: newCorrect });
  };

  const handleAddOption = (qIdx: number) => {
    const q = questions[qIdx];
    const opts = [...(q.options || []), `Opção ${(q.options?.length || 0) + 1}`];
    handleUpdateQuestion(qIdx, { options: opts });
  };

  const handleRemoveOption = (qIdx: number, optIdx: number) => {
    const q = questions[qIdx];
    const opts = (q.options || []).filter((_, i) => i !== optIdx);
    let newCorrect = q.correctAnswer;
    if (newCorrect === q.options?.[optIdx]) {
      newCorrect = opts[0] || '';
    }
    handleUpdateQuestion(qIdx, { options: opts, correctAnswer: newCorrect });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Informe o nome da atividade.');
      return;
    }

    if (questions.length === 0) {
      setErrorMsg('Adicione pelo menos 1 questão à atividade.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].statement.trim()) {
        setErrorMsg(`Preencha o enunciado da questão ${i + 1}.`);
        return;
      }
    }

    const instructions = instructionsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const savedActivity: Activity = {
      id: activityToEdit?.id || `act-${Date.now()}`,
      title: title.trim(),
      subject,
      targetClass,
      teacherName,
      teacherAvatar:
        activityToEdit?.teacherAvatar ||
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      description: description.trim(),
      instructions,
      coverImage,
      dueDate,
      maxScore: Number(maxScore) || 10,
      questions,
      submissions: activityToEdit?.submissions || {},
      drafts: activityToEdit?.drafts || {},
      isArchived: activityToEdit?.isArchived || false,
    };

    onSave(savedActivity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Cabeçalho */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {isEditing ? 'Editar Atividade' : '+ Nova Atividade'}
            </h2>
            <p className="text-xs text-slate-500">
              Configure as informações pedagógicas e adicione questões uma a uma
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/40">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              {errorMsg}
            </div>
          )}

          {/* Dados Principais da Atividade */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Informações Gerais
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome da atividade */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome da Atividade *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Estudo de Caso: Modelagem de Sistema Escolar"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/30 text-sm font-medium"
                />
              </div>

              {/* Matéria */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Matéria *
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/30 text-sm bg-white font-medium"
                >
                  {PRESET_SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Turma */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Turma *
                </label>
                <input
                  type="text"
                  required
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  placeholder="Ex: Desbravador - Guerreiros Da Serra"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/30 text-sm font-medium"
                />
              </div>

              {/* Professor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Professor *
                </label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Ex: Prof. Roberto Guimarães"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/30 text-sm font-medium"
                />
              </div>

              {/* Prazo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Prazo de Entrega *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/30 text-sm font-medium"
                />
              </div>

              {/* Descrição */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Apresente um resumo pedagógico do que será trabalhado..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/30 text-sm"
                />
              </div>

              {/* Instruções */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Instruções para o Aluno (uma por linha)
                </label>
                <textarea
                  rows={3}
                  value={instructionsText}
                  onChange={(e) => setInstructionsText(e.target.value)}
                  placeholder="Ex: Leia atentamente cada questão.&#10;Responda com clareza.&#10;Revise antes de enviar."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/30 text-sm font-mono"
                />
              </div>

              {/* Imagem de Capa */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Imagem de Capa
                </label>
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {PRESET_COVERS.map((cov, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCoverImage(cov)}
                      className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                        coverImage === cov ? 'border-purple-600 ring-2 ring-purple-300' : 'border-slate-200'
                      }`}
                    >
                      <img src={cov} alt={`Capa ${i}`} className="w-full h-full object-cover" />
                      {coverImage === cov && (
                        <div className="absolute inset-0 bg-purple-900/30 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="Ou cole o link de uma imagem externa (URL)"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Seção: Questões Adicionadas uma por uma */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  Questões da Atividade ({questions.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Adicione e configure cada questão com enunciado, alternativas e gabarito
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-100 text-purple-800 hover:bg-purple-200 font-bold text-xs rounded-xl transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ Adicionar Questão</span>
              </button>
            </div>

            {/* Lista de Questões */}
            <div className="space-y-4">
              {questions.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 relative"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                        {qIdx + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-800">Questão {qIdx + 1}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Valor da Questão */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="font-semibold">Valor (pontos):</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={q.points ?? 2.5}
                          onChange={(e) =>
                            handleUpdateQuestion(qIdx, { points: parseFloat(e.target.value) || 0 })
                          }
                          className="w-16 px-2 py-1 text-center font-bold text-slate-800 rounded-lg border border-slate-200"
                        />
                      </div>

                      {/* Excluir Questão */}
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Remover Questão"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Enunciado */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Enunciado da Questão *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={q.statement}
                      onChange={(e) => handleUpdateQuestion(qIdx, { statement: e.target.value })}
                      placeholder="Digite o enunciado da questão..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/30 text-sm font-medium"
                    />
                  </div>

                  {/* Imagem Opcional */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                      Imagem Opcional (URL)
                    </label>
                    <input
                      type="url"
                      value={q.imageUrl || ''}
                      onChange={(e) => handleUpdateQuestion(qIdx, { imageUrl: e.target.value })}
                      placeholder="https://exemplo.com/imagem-diagrama.png"
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  {/* Tipo de Questão */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Tipo de Questão *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateQuestion(qIdx, {
                            type: 'MULTIPLE_CHOICE',
                            options: q.options || ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
                            correctAnswer: q.options?.[0] || 'Opção A',
                          })
                        }
                        className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 text-center ${
                          q.type === 'MULTIPLE_CHOICE'
                            ? 'border-purple-600 bg-purple-50 text-purple-800 shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>Múltipla escolha</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateQuestion(qIdx, {
                            type: 'TRUE_FALSE',
                            correctAnswer: 'Verdadeiro',
                          })
                        }
                        className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 text-center ${
                          q.type === 'TRUE_FALSE'
                            ? 'border-purple-600 bg-purple-50 text-purple-800 shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>Verdadeiro ou falso</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateQuestion(qIdx, {
                            type: 'ESSAY',
                            correctAnswer: undefined,
                          })
                        }
                        className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 text-center ${
                          q.type === 'ESSAY'
                            ? 'border-purple-600 bg-purple-50 text-purple-800 shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>Resposta escrita</span>
                      </button>
                    </div>
                  </div>

                  {/* Alternativas & Gabarito: MÚLTIPLA ESCOLHA */}
                  {q.type === 'MULTIPLE_CHOICE' && (
                    <div className="space-y-3 pt-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Alternativas e Resposta Correta (Gabarito)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddOption(qIdx)}
                          className="text-xs text-purple-700 font-bold hover:underline"
                        >
                          + Adicionar Alternativa
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(q.options || []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-opt-${q.id}`}
                              checked={q.correctAnswer === opt}
                              onChange={() => handleUpdateQuestion(qIdx, { correctAnswer: opt })}
                              title="Marcar como resposta correta"
                              className="w-4 h-4 text-purple-600 focus:ring-purple-500 shrink-0 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                              placeholder={`Opção ${optIdx + 1}`}
                              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                            />
                            {q.options && q.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(qIdx, optIdx)}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Selecione o botão de opção ao lado da alternativa para definir qual é a resposta correta.
                      </p>
                    </div>
                  )}

                  {/* Alternativas & Gabarito: VERDADEIRO OU FALSO */}
                  {q.type === 'TRUE_FALSE' && (
                    <div className="pt-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                        Resposta Correta (Gabarito)
                      </span>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                          <input
                            type="radio"
                            name={`tf-correct-${q.id}`}
                            value="Verdadeiro"
                            checked={q.correctAnswer === 'Verdadeiro'}
                            onChange={() => handleUpdateQuestion(qIdx, { correctAnswer: 'Verdadeiro' })}
                            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                          />
                          <span>Verdadeiro</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                          <input
                            type="radio"
                            name={`tf-correct-${q.id}`}
                            value="Falso"
                            checked={q.correctAnswer === 'Falso'}
                            onChange={() => handleUpdateQuestion(qIdx, { correctAnswer: 'Falso' })}
                            className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                          />
                          <span>Falso</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* RESPOSTA ESCRITA */}
                  {q.type === 'ESSAY' && (
                    <div className="p-3 bg-purple-50 rounded-2xl text-xs text-purple-800 border border-purple-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>
                        Respostas escritas serão corrigidas manualmente por você na área de Correção.
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Botão de Rodapé */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between bg-white p-4 rounded-2xl">
            <div className="text-xs text-slate-500">
              Total de questões: <strong className="text-slate-800">{questions.length}</strong>
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
                type="submit"
                id="btn-publish-activity"
                className="px-6 py-2.5 text-sm font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl shadow-lg shadow-purple-900/20 transition"
              >
                {isEditing ? 'Salvar Alterações' : 'Publicar atividade'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
