import { Suspense, lazy, useEffect, useState } from "react";
import {
  Alert,
  App as AntApp,
  Button,
  Card,
  ConfigProvider,
  Form,
  Grid,
  Input,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import {
  adminEmails,
  isSupabaseConfigured,
  supabase,
  supabaseUrl,
} from "../lib/supabaseClient";

const AdminPanel = lazy(() => import("../components/AdminPanel"));

const { Title, Text } = Typography;

// This helper controls who is allowed into the admin panel.
// Important:
// - Login credentials are NOT stored in this codebase.
// - The email/password must belong to a real user in Supabase Auth.
// - If VITE_ADMIN_EMAILS is empty, any authenticated Supabase user can enter.
// - If VITE_ADMIN_EMAILS has values, only those emails can enter.
const isUserAuthorized = (user) => {
  if (!user?.email) return false;
  if (adminEmails.length === 0) return true;
  return adminEmails.includes(user.email.toLowerCase());
};

// SetupScreen appears when Supabase env values are missing or malformed.
// This is the first place to look if the app opens but cannot reach auth/data.
function SetupScreen() {
  const looksLikeRestEndpoint = supabaseUrl?.includes("/rest/v1");

  return (
    <div style={styles.authShell}>
      <div style={styles.authGlowOne} />
      <div style={styles.authGlowTwo} />

      <Card bordered={false} style={styles.authCard} styles={{ body: { padding: 32 } }}>
        <Space direction="vertical" size={18} style={{ width: "100%" }}>
          <Space size={12}>
            <div style={styles.brandIcon}>
              <Stethoscope size={20} color="#fff" />
            </div>
            <div>
              <Text style={styles.eyebrow}>Configuration Required</Text>
              <Title level={3} style={{ margin: 0 }}>
                Supabase needs one quick fix
              </Title>
            </div>
          </Space>

          <Alert
            type="warning"
            showIcon
            message="The admin panel can't connect to Supabase yet."
            description={
              looksLikeRestEndpoint
                ? "Use your project base URL, not the REST endpoint. It should look like https://your-project.supabase.co"
                : "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file."
            }
            style={{ borderRadius: 14 }}
          />

          <Card
            size="small"
            bordered={false}
            style={{ background: "#f8fafc", borderRadius: 14 }}
          >
            <Space direction="vertical" size={8}>
              <Text strong>Expected env values</Text>
              <Text code>VITE_SUPABASE_URL=https://your-project.supabase.co</Text>
              <Text code>VITE_SUPABASE_ANON_KEY=your-anon-key</Text>
              <Text code>VITE_SUPABASE_TABLE=submissions</Text>
              <Text code>VITE_ADMIN_EMAILS=admin@example.com</Text>
            </Space>
          </Card>
        </Space>
      </Card>
    </div>
  );
}

// AuthScreen is the actual login UI.
// The email and password entered here are sent to Supabase Auth.
// That means the correct credentials are created and managed in your Supabase project,
// not in this React code.
// ============================================================================
// 2. AUTHENTICATION UI (LOGIN SCREEN)
// Renders the login form for unauthenticated users. Features email/password
// login, password reset functionality, and an optional visual email allowlist.
// Handles its own responsive layout using Grid.useBreakpoint().
// ============================================================================
function AuthScreen() {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { notification } = AntApp.useApp();

  // Handles sign-in using Supabase Auth email/password.
  // If the account exists and passes the email allowlist, the user gets a session.
  const handleLogin = async (values) => {
    setSubmitting(true);
    setErrorMessage("");

    try {
      const email = values.email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: values.password,
      });

      if (error) throw error;

      if (!isUserAuthorized(data.user)) {
        await supabase.auth.signOut();
        throw new Error("Bu akkauntga admin paneliga kirishga ruxsat yo'q.");
      }

      notification.success({
        message: "Tizimga kirildi",
        description: "Xush kelibsiz. Jonli boshqaruv paneli ishlatishga tayyor.",
        placement: "topRight",
      });
    } catch (error) {
      setErrorMessage(error.message || "Ushbu ma'lumotlar bilan kirib bo'lmadi.");
    } finally {
      setSubmitting(false);
    }
  };

  // Sends Supabase's password reset email for the typed address.
  // This helps when you know the email but forgot the password.
  const handlePasswordReset = async () => {
    const email = form.getFieldValue("email")?.trim().toLowerCase();

    if (!email) {
      setErrorMessage("Avval emailingizni kiriting, so'ngra parolni tiklashdan foydalaning.");
      return;
    }

    setResetting(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) throw error;

      notification.success({
        message: "Tiklash havolasi yuborildi",
        description: "Parolni tiklash havolasi uchun pochta qutingizni tekshiring.",
        placement: "topRight",
      });
    } catch (error) {
      setErrorMessage(error.message || "Tiklash uchun elektron pochta yuborib bo'lmadi.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div style={styles.authShell}>
      <div style={styles.authGlowOne} />
      <div style={styles.authGlowTwo} />

      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: isMobile ? 32 : 64,
          padding: isMobile ? "20px 16px" : "40px 32px",
          width: "100%",
          maxWidth: 1120,
          margin: "0 auto",
        }}
      >
        <div style={{ flex: isMobile ? "none" : 1, width: isMobile ? "100%" : "auto", maxWidth: isMobile ? "100%" : 540 }}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space size={12}>
              <div style={styles.brandIconLarge}>
                <ShieldCheck size={26} color="#fff" />
              </div>
              <div>
                
                <Title
                  level={1}
                  style={{
                    ...styles.heroTitle,
                    fontSize: isMobile ? 34 : 46,
                    letterSpacing: isMobile ? "-1.2px" : "-1.6px",
                  }}
                >
                  PediaScreen admin
                </Title>
              </div>
            </Space>

            {!isMobile && (
              <>
                <Text style={styles.heroText}>
                  Kelayotgan skrininglarni ko'rib chiqing, shoshilinch holatlarni tezroq saralang va admin ish oqimini Supabase tizimiga kirish bilan xavfsiz saqlang.
                </Text>

                <Space wrap size={[10, 10]}>
                  <Tag style={styles.heroTag}>
                    <ShieldCheck size={14} />
                    Sessiyaga asoslangan ruxsat
                  </Tag>
                  <Tag style={styles.heroTag}>
                    <KeyRound size={14} />
                    Parolni tiklash tizimi
                  </Tag>
                  <Tag style={styles.heroTag}>
                    <Mail size={14} />
                    Ixtiyoriy ruxsat berilgan email ro'yxati
                  </Tag>
                </Space>
              </>
            )}
          </Space>
        </div>

        <Card
          bordered={false}
          style={{ ...styles.authCard, width: isMobile ? "100%" : 440, maxWidth: "100%" }}
          styles={{ body: { padding: isMobile ? 24 : 32 } }}
        >
          <Space direction="vertical" size={20} style={{ width: "100%" }}>
            <div>
              <Text style={styles.eyebrow}>Admin Kirish</Text>
              <Title level={3} style={{ marginTop: 6, marginBottom: 8 }}>
                Xush kelibsiz
              </Title>
              <Text style={styles.eyebrow}>Himoyalangan kirish</Text>
            </div>



            {errorMessage && (
              <Alert
                type="error"
                showIcon
                message={errorMessage}
                style={{ borderRadius: 14 }}
              />
            )}

            <Form form={form} layout="vertical" onFinish={handleLogin}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, message: "Admin emailingizni kiriting." }]}
              >
                <Input
                  size="large"
                  prefix={<Mail size={16} />}
                  placeholder="admin@shifoxona.uz"
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Parol"
                rules={[{ required: true, message: "Parolingizni kiriting." }]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockKeyhole size={16} />}
                  placeholder="Sizning parolingiz"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Space direction="vertical" size={10} style={{ width: "100%" }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  size="large"
                  block
                  style={styles.primaryButton}
                >
                  Kirish
                </Button>
                <Button
                  type="default"
                  onClick={handlePasswordReset}
                  loading={resetting}
                  size="large"
                  block
                  style={styles.secondaryButton}
                >
                  Parolni Tiklash
                </Button>
              </Space>
            </Form>
          </Space>
        </Card>
      </div>
    </div>
  );
}

// AppContent is the auth gatekeeper for the whole app.
// It decides between:
// 1. setup screen
// 2. loading spinner
// 3. login screen
// 4. authenticated admin dashboard
// ============================================================================
// 3. AUTH GATEKEEPER COMPONENT
// Tracks the user's session state via Supabase realtime auth listener.
// Conditionally renders either the authenticated AdminPanel or the AuthScreen.
// ============================================================================
function AppContent() {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(isSupabaseConfigured);
  const { notification } = AntApp.useApp();

  useEffect(() => {
    // If Supabase is not configured, we skip auth boot and show SetupScreen.
    if (!isSupabaseConfigured) {
      return undefined;
    }

    let mounted = true;

    const boot = async () => {
      // Pull existing session from browser storage so refresh keeps the user signed in.
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (currentSession?.user && !isUserAuthorized(currentSession.user)) {
        await supabase.auth.signOut();
        notification.error({
          message: "Kirish rad etildi",
          description: "Bu akkauntga admin paneliga kirishga ruxsat yo'q.",
          placement: "topRight",
        });
        setSession(null);
      } else {
        setSession(currentSession);
      }

      setBooting(false);
    };

    boot();

    // Listen for login/logout/session refresh changes from Supabase in real time.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, nextSession) => {
      if (nextSession?.user && !isUserAuthorized(nextSession.user)) {
        await supabase.auth.signOut();
        setSession(null);
        notification.error({
          message: "Kirish rad etildi",
          description: "Bu akkauntga admin paneliga kirishga ruxsat yo'q.",
          placement: "topRight",
        });
        return;
      }

      setSession(nextSession);
      setBooting(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [notification]);

  // Logs the user out of Supabase and returns them to the login screen.
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    notification.info({
      message: "Tizimdan chiqildi",
      description: "Sizning admin sessiyangiz yopildi.",
      placement: "topRight",
    });
  };

  if (!isSupabaseConfigured) {
    return <SetupScreen />;
  }

  if (booting) {
    return (
      <div style={styles.bootShell}>
        <Spin size="large" />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <Suspense
      fallback={
        <div style={styles.bootShell}>
          <Spin size="large" />
        </div>
      }
    >
      <AdminPanel user={session.user} onSignOut={handleSignOut} />
    </Suspense>
  );
}

// Top-level app wrapper:
// - sets Ant Design theme colors
// - provides Ant Design's App context for notifications
// - renders the auth-gated app content
// ============================================================================
// 4. ROOT APP COMPONENT
// The main entrypoint, responsible for applying global UI theme settings,
// like the primary color profile, and wrapping the app in ConfigProvider.
// ============================================================================
export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#0f766e",
          colorInfo: "#0f766e",
          colorSuccess: "#15803d",
          colorWarning: "#d97706",
          colorError: "#dc2626",
          borderRadius: 14,
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        },
      }}
    >
      <AntApp>
        <AppContent />
      </AntApp>
    </ConfigProvider>
  );
}

// Centralized inline styles for the auth/setup flow.
// If you want to restyle the login page, start in this object.
// ============================================================================
// 5. INLINE STYLES (AUTH SCREEN & BOOT)
// Centralized inline styles for the auth splash screen and boot loading shell.
// Defines glowing background effects, card styles, and button gradients.
// ============================================================================
const styles = {
  resShell: {
    display: "flex",
    gap: 32,
    padding: "40px 32px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  authShell: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 20px",
    background:
      "radial-gradient(circle at top left, rgba(15,118,110,.18), transparent 30%), radial-gradient(circle at bottom right, rgba(14,116,144,.14), transparent 30%), linear-gradient(135deg, #f8fafc, #ecfeff 45%, #f8fafc)",
    position: "relative",
    overflow: "hidden",
  },
  authGlowOne: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "rgba(20, 184, 166, 0.14)",
    filter: "blur(50px)",
    top: -60,
    left: -40,
  },
  authGlowTwo: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "rgba(14, 165, 233, 0.12)",
    filter: "blur(50px)",
    right: -60,
    bottom: -80,
  },
  authGrid: {
    width: "min(1120px, 100%)",
    display: "grid",
    gridTemplateColumns: "1.1fr .9fr",
    gap: 24,
    position: "relative",
    zIndex: 1,
  },
  authCopy: {
    padding: "20px 12px",
    alignSelf: "center",
  },
  heroTitle: {
    margin: "8px 0 0",
    fontSize: 46,
    lineHeight: 1.04,
    letterSpacing: "-1.6px",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  heroText: {
    fontSize: 18,
    lineHeight: 1.7,
    color: "#475569",
    maxWidth: 620,
  },
  heroTag: {
    border: "1px solid #cbd5e1",
    borderRadius: 999,
    padding: "8px 12px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,.72)",
    color: "#0f172a",
    fontWeight: 500,
  },
  authCard: {
    borderRadius: 28,
    boxShadow: "0 24px 70px rgba(15, 23, 42, 0.12)",
    backdropFilter: "blur(14px)",
    background: "rgba(255,255,255,.92)",
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f766e, #0ea5e9)",
  },
  brandIconLarge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f766e, #0ea5e9)",
    boxShadow: "0 14px 36px rgba(14, 165, 233, 0.28)",
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: ".16em",
    fontWeight: 700,
    fontSize: 11,
    color: "#0f766e",
  },
  primaryButton: {
    height: 48,
    fontWeight: 600,
    borderRadius: 14,
    background: "linear-gradient(135deg, #0f766e, #0ea5e9)",
    border: "none",
    boxShadow: "0 14px 30px rgba(14, 165, 233, 0.18)",
  },
  secondaryButton: {
    height: 48,
    fontWeight: 600,
    borderRadius: 14,
  },
  bootShell: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
  },
};
