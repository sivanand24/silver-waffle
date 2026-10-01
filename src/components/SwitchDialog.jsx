import { useEffect, useRef } from "react";

/** Confirmation before throwing away the current journey. */
export default function SwitchDialog({ open, onConfirm, onStay }) {
  const ref = useRef(null);
  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="guide-dialog"
      aria-labelledby="switch-title"
      onCancel={(e) => {
        e.preventDefault();
        onStay();
      }}
    >
      <div className="dialog-body">
        <h2 id="switch-title">दूसरी सहायता चुनना चाहती हैं?</h2>
        <p className="lead">
          अभी के जवाब और तैयारी की सूची हट जाएँगे। चाहें तो पहले सूची सेव कर लें।
        </p>
        <button className="primary" onClick={onConfirm}>
          हाँ, दूसरी सहायता चुनें
        </button>
        <button className="secondary" onClick={onStay}>
          यहीं रहें
        </button>
      </div>
    </dialog>
  );
}
