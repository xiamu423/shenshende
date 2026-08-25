import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import './ConfirmDialog.css';

export default function ConfirmDialog({ title, message, description, confirmLabel = '确认删除', loading = false, error = '', onCancel, onConfirm }) {
  return createPortal(<div className="confirm-dialog-overlay" onClick={loading ? undefined : onCancel}>
    <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" onClick={event=>event.stopPropagation()}>
      <span className="confirm-dialog-icon"><AlertTriangle size={23}/></span>
      <div className="confirm-dialog-copy">
        <small>PLEASE CONFIRM</small>
        <h2 id="confirm-dialog-title">{title}</h2>
        <p>{message}</p>
        {description&&<div>{description}</div>}
        {error&&<em role="alert">{error}</em>}
      </div>
      <footer><button type="button" onClick={onCancel} disabled={loading}>再想想</button><button type="button" className="confirm-danger" onClick={onConfirm} disabled={loading}>{loading?'正在删除…':confirmLabel}</button></footer>
    </section>
  </div>,document.body);
}
