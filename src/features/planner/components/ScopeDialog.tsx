import { Button } from '../../../design/components/Button';
import { Modal } from '../../../design/components/Modal';

export type Scope = 'occurrence' | 'series';

interface ScopeDialogProps {
  open: boolean;
  action: 'edit' | 'delete';
  title: string;
  date: string;
  onChoose: (scope: Scope) => void;
  onCancel: () => void;
}

/**
 * Pergunta obrigatória ao mexer numa série (FR-017). Cada opção diz o que
 * acontece, em vez de "esta" e "todas".
 */
export function ScopeDialog({ open, action, title, date, onChoose, onCancel }: ScopeDialogProps) {
  const verb = action === 'delete' ? 'Excluir' : 'Editar';

  return (
    <Modal
      open={open}
      title={`${verb} "${title}"`}
      onClose={onCancel}
      footer={
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      }
    >
      <p className="mb-4 text-sm text-ink-soft">
        Este item se repete. O que você quer alterar?
      </p>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onChoose('occurrence')}
          className="rounded-sm border border-rule-strong px-3 py-3 text-left transition-colors hover:bg-paper-sunken"
        >
          <span className="block text-sm font-medium text-ink">Só o dia {date}</span>
          <span className="text-xs text-ink-soft">
            As outras datas continuam como estão.
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChoose('series')}
          className="rounded-sm border border-rule-strong px-3 py-3 text-left transition-colors hover:bg-paper-sunken"
        >
          <span className="block text-sm font-medium text-ink">Toda a série</span>
          <span className="text-xs text-ink-soft">
            {action === 'delete'
              ? 'Remove o item de todas as datas, passadas e futuras.'
              : 'Vale para todas as datas do item.'}
          </span>
        </button>
      </div>
    </Modal>
  );
}
