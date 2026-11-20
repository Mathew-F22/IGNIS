import { LINES, SHIFTS, TEAMS } from '../../shared/catalog.js';
import { Field } from './ui.jsx';
import { PhotoPicker, TypeSelect } from './pickers.jsx';

export default function UserForm({ f, setF, withPassword, master }) {
  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e });
  return (
    <div className="stack">
      <PhotoPicker value={f.photo} onChange={set('photo')} />
      <div className="grid-2">
        <Field label="Nome completo" required><input className="input" value={f.name || ''} onChange={set('name')} /></Field>
        <Field label="Cargo"><input className="input" value={f.cargo || ''} onChange={set('cargo')} /></Field>
        {master !== false && <>
          <Field label="Matrícula"><input className="input" inputMode="numeric" value={f.matricula || ''} onChange={set('matricula')} /></Field>
          <Field label="E-mail"><input className="input" type="email" value={f.email || ''} onChange={set('email')} /></Field>
        </>}
        <Field label="Linha de atuação"><select className="input" value={f.linha || ''} onChange={set('linha')}><option value="">Selecione</option>{LINES.map((l) => <option key={l}>{l}</option>)}</select></Field>
        <Field label="Turno"><select className="input" value={f.turno || ''} onChange={set('turno')}><option value="">Selecione</option>{SHIFTS.map((l) => <option key={l}>{l}</option>)}</select></Field>
        <Field label="Time"><select className="input" value={f.time || ''} onChange={set('time')}><option value="">Selecione</option>{TEAMS.map((l) => <option key={l}>{l}</option>)}</select></Field>
        <Field label="Posto ou área"><input className="input" value={f.posto || ''} onChange={set('posto')} /></Field>
      </div>
      <Field label="Tipo de melhoria"><TypeSelect value={f.tipoMelhoria} onChange={set('tipoMelhoria')} /></Field>
      {master !== false && <Field label="Prévia do projeto"><textarea className="input" rows={3} value={f.previa || ''} onChange={set('previa')} /></Field>}
      {withPassword && (
        <div className="grid-2">
          <Field label="Senha inicial" hint="O colaborador troca no primeiro acesso."><input className="input" value={f.password || ''} onChange={set('password')} /></Field>
          <Field label="Perfil"><select className="input" value={f.role || 'colaborador'} onChange={set('role')}><option value="colaborador">Colaborador</option><option value="mestre">Gestor (login mestre)</option></select></Field>
        </div>
      )}
    </div>
  );
}
