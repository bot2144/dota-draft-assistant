import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { useDraftStore } from '../../draft/draftStore';

export function PasteDraftModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const loadFromPaste = useDraftStore((s) => s.loadFromPaste);
  const [text, setText] = useState('');
  const [unmatched, setUnmatched] = useState<string[]>([]);

  const handleApply = () => {
    const { unmatched } = loadFromPaste(text);
    setUnmatched(unmatched);
    if (unmatched.length === 0) onClose();
  };

  return (
    <Modal title={t('draft.pasteDraft')} onClose={onClose}>
      <textarea
        autoFocus
        rows={10}
        style={{
          width: '100%',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-strong)',
          borderRadius: 10,
          color: 'var(--text-primary)',
          padding: 12,
          fontFamily: 'inherit',
          fontSize: 13,
          resize: 'vertical',
        }}
        placeholder={'OUR TEAM\nLion\nMars\nCrystal Maiden\n\nENEMY TEAM\nInvoker\nFaceless Void\nMorphling'}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {unmatched.length > 0 && (
        <p style={{ color: 'var(--danger)', fontSize: 12.5, marginTop: 8 }}>
          Could not match: {unmatched.join(', ')}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
        <Button variant="ghost" onClick={onClose}>
          {t('common.close')}
        </Button>
        <Button variant="primary" onClick={handleApply}>
          {t('draft.pasteDraft')}
        </Button>
      </div>
    </Modal>
  );
}
