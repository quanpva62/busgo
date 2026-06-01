import { createContext, useCallback, useContext, useState } from "react";
import Icon from "../components/Icon.jsx";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message, duration = 4000) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, message }]);
      if (duration > 0) {
        setTimeout(() => remove(id), duration);
      }
      return id;
    },
    [remove],
  );

  const confirm = useCallback(
    ({ title, message, confirmText = "Xác nhận", cancelText = "Huỷ", variant = "primary" } = {}) =>
      new Promise((resolve) => {
        setConfirmState({ title, message, confirmText, cancelText, variant, resolve });
      }),
    [],
  );

  const closeConfirm = (result) => {
    if (confirmState) confirmState.resolve(result);
    setConfirmState(null);
  };

  const toast = {
    success: (msg, dur) => push("success", msg, dur),
    error: (msg, dur) => push("error", msg, dur),
    info: (msg, dur) => push("info", msg, dur),
    warning: (msg, dur) => push("warning", msg, dur),
    dismiss: remove,
    confirm,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onClose={remove} />
      {confirmState && <ConfirmModal {...confirmState} onClose={closeConfirm} />}
    </ToastContext.Provider>
  );
}

function ConfirmModal({ title, message, confirmText, cancelText, variant, onClose }) {
  const btnCls =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-600"
      : "bg-linear-to-br from-primary-container to-primary hover:opacity-95";

  return (
    <div
      className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/50 animate-[fadeIn_0.15s_ease-out]"
      onClick={() => onClose(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-[slideIn_0.2s_ease-out]"
      >
        {title && <h3 className="text-lg font-bold text-on-surface mb-2">{title}</h3>}
        {message && (
          <p className="text-secondary text-sm whitespace-pre-line mb-6">{message}</p>
        )}
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => onClose(false)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-secondary hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={() => onClose(true)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] cursor-pointer ${btnCls}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const STYLES = {
  success: { icon: "check_circle", cls: "bg-green-50 text-green-700 border-green-200" },
  error: { icon: "error", cls: "bg-red-50 text-red-600 border-red-200" },
  info: { icon: "info", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  warning: { icon: "warning", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
};

function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-24 right-4 z-100 flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] sm:w-auto pointer-events-none">
      {toasts.map((t) => {
        const s = STYLES[t.type] || STYLES.info;
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-2xl border shadow-lg animate-[slideIn_0.2s_ease-out] pointer-events-auto ${s.cls}`}
          >
            <Icon name={s.icon} className="w-5 h-5 shrink-0" />
            <p className="flex-1 text-sm font-medium whitespace-pre-line">{t.message}</p>
            <button
              onClick={() => onClose(t.id)}
              className="shrink-0 hover:opacity-70 transition-opacity cursor-pointer"
            >
              <Icon name="close" className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
