import { useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { Button } from '../../../design/components/Button';
import { Input, Select } from '../../../design/components/Field';
import { Modal } from '../../../design/components/Modal';
import type { Category, CategoryKind } from '../types';
import { categoryColor } from '../../../design/palette';

interface CategoryManagerProps {
  open: boolean;
  uid: string;
  categories: Category[];
  onClose: () => void;
}

/** Categoria nunca é apagada — arquivar tira das escolhas e preserva o histórico. */
export function CategoryManager({ open, uid, categories, onClose }: CategoryManagerProps) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<CategoryKind>('expense');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const collectionRef = collection(db, 'users', uid, 'categories');

  const nameTaken = (candidate: string, ignoreId?: string) =>
    categories.some(
      (c) =>
        !c.archived &&
        c.id !== ignoreId &&
        c.name.localeCompare(candidate, 'pt-BR', { sensitivity: 'base' }) === 0,
    );

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError('Dê um nome à categoria.');
    if (nameTaken(trimmed)) return setError('Você já tem uma categoria com esse nome.');

    setBusy(true);
    setError(null);
    try {
      await addDoc(collectionRef, {
        name: trimmed,
        kind,
        isDefault: false,
        archived: false,
        sortOrder: categories.length,
        createdAt: serverTimestamp(),
      });
      setName('');
    } catch (cause) {
      console.error(cause);
      setError('Não foi possível criar agora. O nome digitado continua aqui.');
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async (category: Category) => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === category.name) return setRenamingId(null);
    if (nameTaken(trimmed, category.id)) return setError('Já existe uma categoria com esse nome.');

    try {
      await updateDoc(doc(collectionRef, category.id), { name: trimmed });
      setRenamingId(null);
      setError(null);
    } catch (cause) {
      console.error(cause);
      setError('Não foi possível renomear agora.');
    }
  };

  const toggleArchived = async (category: Category) => {
    try {
      await updateDoc(doc(collectionRef, category.id), { archived: !category.archived });
    } catch (cause) {
      console.error(cause);
      setError('Não foi possível arquivar agora.');
    }
  };

  return (
    <Modal open={open} title="Categorias" onClose={onClose}>
      <form onSubmit={handleCreate} className="flex flex-col gap-3 border-b border-rule pb-4">
        <Input
          label="Nova categoria"
          placeholder="Educação, pets, viagem…"
          maxLength={40}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          error={error ?? undefined}
        />
        <Select
          label="Usar em"
          value={kind}
          onChange={(e) => setKind(e.target.value as CategoryKind)}
        >
          <option value="expense">Gastos</option>
          <option value="income">Ganhos</option>
          <option value="both">Gastos e ganhos</option>
        </Select>
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? 'Criando…' : 'Criar categoria'}
        </Button>
      </form>

      <ul className="mt-2 flex flex-col">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center gap-2 py-2.5 ledger-rule">
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 rounded-pill"
              style={{
                backgroundColor: categoryColor(category.sortOrder),
                opacity: category.archived ? 0.35 : 1,
              }}
            />

            {renamingId === category.id ? (
              <input
                autoFocus
                className="min-w-0 flex-1 rounded-sm border border-rule-strong px-2 py-1 text-sm"
                value={renameValue}
                maxLength={40}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleRename(category)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename(category);
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                aria-label={`Novo nome para ${category.name}`}
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setRenamingId(category.id);
                  setRenameValue(category.name);
                }}
                className={`min-w-0 flex-1 truncate text-left text-sm ${
                  category.archived ? 'text-ink-faint line-through' : 'text-ink'
                }`}
              >
                {category.name}
              </button>
            )}

            <span className="shrink-0 text-micro uppercase tracking-[0.08em] text-ink-faint">
              {category.kind === 'both' ? 'ambos' : category.kind === 'income' ? 'ganho' : 'gasto'}
            </span>

            <button
              type="button"
              onClick={() => toggleArchived(category)}
              className="shrink-0 rounded-sm px-2 py-1 text-xs text-ink-soft hover:bg-paper-sunken hover:text-ink"
            >
              {category.archived ? 'Reativar' : 'Arquivar'}
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-ink-faint">
        Arquivar tira a categoria das escolhas novas. Os lançamentos antigos continuam com ela.
      </p>
    </Modal>
  );
}
