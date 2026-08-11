import type { Metadata } from "next";
import {
  GraduationCap,
  BarChart3,
  CheckSquare,
  CalendarCheck,
  Clock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Acesso | Alumnus",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout">
      <style>{`
        .auth-layout {
          min-height: 100dvh;
          display: grid;
          grid-template-columns: 1fr;
          background: var(--background);
        }
        @media (min-width: 1024px) {
          .auth-layout {
            grid-template-columns: 1fr 1fr;
          }
        }
        .auth-branding {
          display: none;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #059669 100%);
          padding: 56px;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 1024px) {
          .auth-branding {
            display: flex;
          }
        }
        .auth-branding-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.15), transparent 40%),
                      radial-gradient(circle at 20% 80%, rgba(37, 99, 235, 0.2), transparent 50%);
          pointer-events: none;
        }
        .auth-branding-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
          font-weight: 700;
          font-size: 22px;
          position: relative;
          z-index: 1;
        }
        .auth-branding-logo-icon {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .auth-branding-content {
          position: relative;
          z-index: 1;
          max-width: 480px;
        }
        .auth-branding-title {
          font-size: 38px;
          font-weight: 800;
          color: white;
          line-height: 1.25;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }
        .auth-branding-subtitle {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.6;
          margin-bottom: 40px;
        }
        .auth-features {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .auth-feature {
          display: flex;
          align-items: center;
          gap: 14px;
          color: white;
          font-size: 15px;
          font-weight: 500;
        }
        .auth-feature-icon {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 99px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #6ee7b7;
        }
        .auth-content {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
        }
        .auth-content-inner {
          width: 100%;
          max-width: 400px;
        }
        .auth-logo-mobile {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--primary);
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 36px;
        }
        .auth-logo-mobile-icon {
          width: 34px;
          height: 34px;
          background: var(--primary-light);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
        }
        @media (min-width: 1024px) {
          .auth-logo-mobile {
            display: none;
          }
        }
      `}</style>

      {/* Lado esquerdo — branding */}
      <div className="auth-branding">
        <div className="auth-branding-overlay" />
        <div className="auth-branding-logo">
          <div className="auth-branding-logo-icon">
            <GraduationCap size={24} />
          </div>
          Alumnus
        </div>
        <div className="auth-branding-content">
          <h1 className="auth-branding-title">
            Organize sua vida acadêmica com o Alumnus
          </h1>
          <p className="auth-branding-subtitle">
            Centralize notas, tarefas, controle de frequência e sua grade horária em uma plataforma intuitiva.
          </p>
          <div className="auth-features">
            {[
              { icon: BarChart3, text: "Acompanhe notas e médias ponderadas" },
              { icon: CheckSquare, text: "Gerencie tarefas e prazos acadêmicos" },
              { icon: CalendarCheck, text: "Controle de presenças e limite de faltas" },
              { icon: Clock, text: "Grade semanal de disciplinas organizada" },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.text} className="auth-feature">
                  <div className="auth-feature-icon">
                    <Icon size={18} />
                  </div>
                  <span>{f.text}</span>
                </div>
              );
            })}
          </div>
        </div>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", position: "relative", zIndex: 1 }}>
          © 2026 Alumnus. Plataforma de Gestão Estudantil.
        </p>
      </div>

      {/* Lado direito — formulário */}
      <div className="auth-content">
        <div className="auth-content-inner">
          <div className="auth-logo-mobile">
            <div className="auth-logo-mobile-icon">
              <GraduationCap size={20} />
            </div>
            Alumnus
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
