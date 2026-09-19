import { User, Activity } from '../../types';
import { Award, CheckCircle2, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

interface GradesViewProps {
  user: User;
  activities: Activity[];
}

export function GradesView({ user, activities }: GradesViewProps) {
  // Graded activities calculation
  const userSubmissions = activities
    .map((act) => ({
      activityTitle: act.title,
      subject: act.subject,
      submission: act.submissions[user.id],
      maxScore: act.maxScore,
    }))
    .filter((item) => !!item.submission);

  const subjectsData = [
    {
      name: 'Programação Orientada a Objetos',
      teacher: 'Dra. Helena Martins',
      b1: 9.0,
      b2: 9.5,
      b3: 9.5,
      attendance: '100%',
      status: 'Aprovado',
    },
    {
      name: 'Fundamentos de Banco de Dados',
      teacher: 'Prof. Carlos Eduardo',
      b1: 8.5,
      b2: 8.8,
      b3: 9.0,
      attendance: '96%',
      status: 'Aprovado',
    },
    {
      name: 'Física Aplicada e Termodinâmica',
      teacher: 'Prof. Felipe Rocha',
      b1: 8.0,
      b2: 8.5,
      b3: 8.7,
      attendance: '98%',
      status: 'Aprovado',
    },
    {
      name: 'Matemática e Estatística',
      teacher: 'Prof. Carlos Eduardo',
      b1: 9.2,
      b2: 9.4,
      b3: 9.6,
      attendance: '100%',
      status: 'Aprovado',
    },
  ];

  const overallAvg = (
    subjectsData.reduce((acc, s) => acc + (s.b1 + s.b2 + s.b3) / 3, 0) / subjectsData.length
  ).toFixed(1);

  return (
    <div id="student-grades-view" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
              Ano Letivo 2026
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Matrícula: {user.registrationNumber || '2026-MED3-042'}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-2">
            Boletim Escolar & Rendimento Acadêmico
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Aluno: <strong>{user.name}</strong> &bull; {user.grade || '3º Ano - Ensino Médio'}
          </p>
        </div>

        {/* Global GPA pill */}
        <div className="flex items-center gap-3 bg-purple-50 p-3.5 rounded-2xl border border-purple-100">
          <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-purple-600/20">
            {overallAvg}
          </div>
          <div>
            <div className="text-[11px] font-bold text-purple-900 uppercase">Média Geral</div>
            <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Situação: Regular</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">
            Notas por Disciplina e Bimestre
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Disciplina</th>
                <th className="py-3.5 px-4 text-center">1º Bim</th>
                <th className="py-3.5 px-4 text-center">2º Bim</th>
                <th className="py-3.5 px-4 text-center">3º Bim (Atual)</th>
                <th className="py-3.5 px-4 text-center">Média Parcial</th>
                <th className="py-3.5 px-4 text-center">Frequência</th>
                <th className="py-3.5 px-6 text-center">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {subjectsData.map((subj, i) => {
                const rowAvg = ((subj.b1 + subj.b2 + subj.b3) / 3).toFixed(1);
                return (
                  <tr key={i} className="hover:bg-purple-50/40 transition">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <div>{subj.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{subj.teacher}</div>
                    </td>
                    <td className="py-4 px-4 text-center font-medium">{subj.b1.toFixed(1)}</td>
                    <td className="py-4 px-4 text-center font-medium">{subj.b2.toFixed(1)}</td>
                    <td className="py-4 px-4 text-center font-bold text-purple-700">{subj.b3.toFixed(1)}</td>
                    <td className="py-4 px-4 text-center font-extrabold text-slate-900">{rowAvg}</td>
                    <td className="py-4 px-4 text-center font-semibold text-slate-600">{subj.attendance}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{subj.status}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Disclaimer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Documento homologado pelo sistema escolar &bull; Homologação: Prof. Roberto Guimarães (Diretor)</span>
          <span className="font-semibold text-slate-600">Média mínima para aprovação: 6.0</span>
        </div>
      </div>
    </div>
  );
}
