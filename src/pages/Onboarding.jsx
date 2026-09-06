import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

// Mismos ids/precios que PLAN_CATALOG en
// supabase/functions/_shared/plans.ts -- ese archivo es la fuente de verdad
// (precio, tipo de cobro y qué módulos trae cada plan); esto es solo para
// pintarlo en pantalla. PRECIOS PROVISIONALES, ver conversación con el
// dueño del proyecto (2026-09-05) -- pendiente de confirmar montos finales.
const PLANS = [
  {
    id: 'esencial',
    label: 'Esencial',
    price: 549,
    period: '/mes',
    description: '1 sucursal, hasta 3 usuarios (ej. gerente, mesero, cajero). Ventas, comandas, catálogo, corte de caja, inventario e historial.'
  },
  {
    id: 'operacion_completa',
    label: 'Operación Completa',
    price: 899,
    period: '/mes',
    description: 'Hasta 6 usuarios. Agrega cocina (KDS), costos y reportes avanzados.'
  },
  {
    id: 'multisucursal',
    label: 'Multisucursal',
    price: 1499,
    period: '/mes',
    description: 'Usuarios ilimitados y acceso a todos los módulos (nómina, asistencia). Sigue siendo 1 sucursal -- sucursales adicionales se cotizan aparte.'
  }
];

const currencyFmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export default function Onboarding() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ businessName: '', branchName: '', contactPhone: '' });
  const [planId, setPlanId] = useState(PLANS[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email || '');
    });
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  function nextFromDatos(e) {
    e.preventDefault();
    if (!form.businessName.trim()) {
      setError('El nombre del negocio es obligatorio.');
      return;
    }
    setError(null);
    setStep(2);
  }

  // "Procesar pago" da de alta el negocio de una vez (tenant/sucursal/
  // usuario), pero billing_status queda 'pending' -- el cobro es
  // transferencia bancaria manual, no hay procesador conectado todavía (ver
  // comentario en self-serve-onboard/index.ts). El resultado de esta
  // llamada trae los datos para transferir (result.payment), no
  // credenciales -- esas las genera y revela el SuperAdmin cuando confirme
  // el pago en su banco (panel SuperAdmin -> "Validar pago").
  async function handleProcessPayment() {
    setSubmitting(true);
    setError(null);

    const { data, error: fnError } = await supabase.functions.invoke('self-serve-onboard', {
      body: {
        businessName: form.businessName.trim(),
        branchName: form.branchName.trim() || form.businessName.trim(),
        contactPhone: form.contactPhone.trim() || null,
        planId
      }
    });

    setSubmitting(false);

    if (fnError) {
      // FunctionsHttpError trae el body de la respuesta en fnError.context
      // -- mismo patrón que TenantFormModal.jsx (panel SuperAdmin).
      let serverMsg = null;
      try {
        const respBody = await fnError.context.json();
        serverMsg = respBody && respBody.error;
      } catch (_) {}
      setError(serverMsg || fnError.message || 'No se pudo completar el alta.');
      return;
    }

    setResult(data);
    setStep(4);
  }

  const selectedPlan = PLANS.find((p) => p.id === planId);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-400 min-w-0 truncate">
          Sesión: <span className="text-neutral-200">{email}</span>
        </p>
        <button type="button" onClick={handleSignOut} className="text-sm text-neutral-400 hover:text-neutral-200 shrink-0">
          Cerrar sesión
        </button>
      </header>

      <main className="max-w-xl mx-auto px-4 py-10">
        <Steps current={step} />

        {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

        {step === 1 && (
          <form onSubmit={nextFromDatos} className="mt-8 space-y-4">
            <h1 className="text-xl font-semibold">Datos de tu negocio</h1>
            <Field label="Nombre del negocio" required>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                className="wh-input"
                required
              />
            </Field>
            <Field label="Nombre de tu primera sucursal">
              <input
                type="text"
                value={form.branchName}
                onChange={(e) => setForm((f) => ({ ...f, branchName: e.target.value }))}
                placeholder={form.businessName || 'Igual al nombre del negocio'}
                className="wh-input"
              />
            </Field>
            <Field label="Teléfono de contacto">
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                className="wh-input"
              />
            </Field>
            <button type="submit" className="w-full rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2.5 transition-colors">
              Continuar
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="mt-8 space-y-4">
            <h1 className="text-xl font-semibold">Elige tu plan</h1>
            <div className="space-y-3">
              {PLANS.map((plan) => {
                const active = planId === plan.id;
                return (
                  <button
                    type="button"
                    key={plan.id}
                    onClick={() => setPlanId(plan.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-colors ${
                      active ? 'border-red-500 bg-red-500/10' : 'border-neutral-800 bg-neutral-900 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{plan.label}</p>
                        <p className="text-sm text-neutral-400">{plan.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold">{currencyFmt.format(plan.price)}</p>
                        <p className="text-xs text-neutral-500">{plan.period}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-lg border border-neutral-700 text-neutral-300 font-medium px-4 py-2.5 hover:bg-neutral-900 transition-colors">
                Atrás
              </button>
              <button type="button" onClick={() => setStep(3)} className="flex-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2.5 transition-colors">
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 3 && selectedPlan && (
          <div className="mt-8 space-y-4">
            <h1 className="text-xl font-semibold">Procesa tu pago</h1>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-sm text-neutral-400">Negocio</p>
              <p className="font-medium mb-3 break-words">{form.businessName}</p>
              <p className="text-sm text-neutral-400">Plan</p>
              <p className="font-medium">{selectedPlan.label} -- {currencyFmt.format(selectedPlan.price)} {selectedPlan.period}</p>
            </div>
            <p className="text-xs text-neutral-500">
              Al continuar te mostramos los datos para hacer tu transferencia. En cuanto confirmemos el pago
              en nuestra cuenta te compartimos tu usuario y el instalador del sistema.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={submitting}
                className="flex-1 rounded-lg border border-neutral-700 text-neutral-300 font-medium px-4 py-2.5 hover:bg-neutral-900 disabled:opacity-50 transition-colors"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={handleProcessPayment}
                disabled={submitting}
                className="flex-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium px-4 py-2.5 disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Procesando...' : 'Procesar pago'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && result && <PaymentPendingStep payment={result.payment} />}
      </main>
    </div>
  );
}

// Datos para transferir (beneficiario/banco/cuenta) vienen del servidor
// (result.payment, ver self-serve-onboard/index.ts::PAYMENT_INFO) -- nunca
// hardcodeados aquí, para que cambiar de banco sea editar un solo archivo.
// Sin usuario/contraseña ni descarga en esta pantalla a propósito: el
// SuperAdmin las genera y revela hasta validar el pago en su banco (ver
// wing-house-web/src/pages/Admin.jsx::validatePayment) y se las comparte al
// cliente por fuera de este panel (WhatsApp/correo).
function PaymentPendingStep({ payment }) {
  const [copied, setCopied] = useState(null);

  async function copy(label, value) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // portapapeles no disponible -- el valor sigue visible en pantalla
    }
  }

  return (
    <div className="mt-8 space-y-4">
      <h1 className="text-xl font-semibold">Falta tu transferencia</h1>
      <p className="text-sm text-neutral-400">
        Tu negocio ya quedó registrado. Transfiere con estos datos -- usa el concepto tal cual para que
        podamos identificar tu pago.
      </p>
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-3 text-sm">
        <Row label="Beneficiario" value={payment.beneficiary} onCopy={() => copy('beneficiary', payment.beneficiary)} copied={copied === 'beneficiary'} />
        <Row label="Banco" value={payment.bank} onCopy={() => copy('bank', payment.bank)} copied={copied === 'bank'} />
        <Row label="No. de cuenta" value={payment.account} mono onCopy={() => copy('account', payment.account)} copied={copied === 'account'} />
        <Row label="Monto" value={currencyFmt.format(payment.amount)} onCopy={() => copy('amount', String(payment.amount))} copied={copied === 'amount'} />
        <Row label="Concepto" value={payment.reference} mono onCopy={() => copy('reference', payment.reference)} copied={copied === 'reference'} />
      </div>
      <p className="text-xs text-neutral-500">
        En cuanto confirmemos tu transferencia te compartimos tu usuario, contraseña y el instalador del
        sistema de escritorio.
      </p>
    </div>
  );
}

function Row({ label, value, mono, onCopy, copied }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-neutral-500">{label}</p>
        <p className={`text-neutral-100 truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
      <button type="button" onClick={onCopy} className="text-xs text-red-400 hover:text-red-300 shrink-0">
        {copied ? 'Copiado ✓' : 'Copiar'}
      </button>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-sm text-neutral-300 mb-1">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Steps({ current }) {
  const labels = ['Datos', 'Plan', 'Pago', 'Transferir'];
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const n = i + 1;
        const filled = n <= current;
        return <div key={label} className={`h-1.5 flex-1 rounded-full ${filled ? 'bg-red-500' : 'bg-neutral-800'}`} />;
      })}
    </div>
  );
}
