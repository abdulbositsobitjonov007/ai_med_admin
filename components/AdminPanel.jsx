import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  notification,
} from "antd";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock3,
  Droplets,
  Eye,
  Filter,
  Heart,
  Languages,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Wind,
} from "lucide-react";
import {
  isSupabaseConfigured,
  supabase,
  supabaseTable,
} from "../lib/supabaseClient";

const { Title, Text } = Typography;

// Dashboard lookup data:
// These objects define labels, colors, and icons used across the UI.
// If you want to rename a condition/status or change its color, edit here first.
const CONDITION_CONFIG = {
  diabetes: {
    label: "Diabetes",
    color: "#2563eb",
    bg: "#eff6ff",
    icon: <Droplets size={14} />,
    antColor: "blue",
  },
  asthma: {
    label: "Asthma",
    color: "#7c3aed",
    bg: "#f5f3ff",
    icon: <Wind size={14} />,
    antColor: "purple",
  },
  blood_pressure: {
    label: "Blood Pressure",
    color: "#dc2626",
    bg: "#fef2f2",
    icon: <Heart size={14} />,
    antColor: "red",
  },
};

const STATUS_CONFIG = {
  RED: {
    label: "Critical",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    icon: <AlertTriangle size={13} />,
  },
  YELLOW: {
    label: "Attention",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    icon: <Activity size={13} />,
  },
  GREEN: {
    label: "Stable",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    icon: <CheckCircle size={13} />,
  },
};

const LANGUAGE_LABELS = { uz: "UZ", ru: "RU", en: "EN" };

// Demo fallback data:
// This appears only when live Supabase reads fail.
// It keeps the UI usable during setup or debugging.
const MOCK_SUBMISSIONS = [
  {
    id: "demo-1",
    created_at: "2026-05-01T08:15:00.000Z",
    condition_key: "diabetes",
    language: "en",
    result_data: {
      color: "YELLOW",
      advice: "Schedule a follow-up blood sugar check within 24 hours.",
      reason: "Reported dizziness, thirst, and irregular glucose readings.",
    },
    user_answers: {
      age_group: "8-12",
      glucose_checked_today: true,
      dizziness: true,
      vomiting: false,
    },
  },
  {
    id: "demo-2",
    created_at: "2026-05-01T07:40:00.000Z",
    condition_key: "asthma",
    language: "ru",
    result_data: {
      color: "RED",
      advice: "Immediate clinical review is recommended.",
      reason: "Breathing difficulty and night-time wheezing were reported.",
    },
    user_answers: {
      inhaler_used: true,
      shortness_of_breath: true,
      chest_tightness: true,
      oxygen_level_known: false,
    },
  },
  {
    id: "demo-3",
    created_at: "2026-05-01T06:20:00.000Z",
    condition_key: "blood_pressure",
    language: "uz",
    result_data: {
      color: "GREEN",
      advice: "Continue routine monitoring.",
      reason: "No urgent symptoms were reported and readings are within range.",
    },
    user_answers: {
      headache: false,
      blurred_vision: false,
      medication_taken: true,
    },
  },
];

// Shared formatting helpers used across the table and detail drawer.
const formatDate = (iso) => {
  if (!iso) return "—";
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatKey = (key) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

// Search helper:
// We flatten the important record fields into one searchable string so the
// single search box can match IDs, status, advice, reason, and patient answers.
const matchesSearch = (record, query) => {
  if (!query) return true;

  const haystack = [
    record.id,
    record.condition_key,
    record.language,
    record.result_data?.color,
    record.result_data?.advice,
    record.result_data?.reason,
    JSON.stringify(record.user_answers || {}),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
};

// Small UI component for condition chips shown in the table and detail drawer.
const ConditionTag = ({ condition }) => {
  const config = CONDITION_CONFIG[condition] || {
    label: condition || "Unknown",
    antColor: "default",
    icon: null,
  };

  return (
    <Tag
      color={config.antColor}
      icon={config.icon}
      style={{ borderRadius: 999, fontWeight: 600, fontSize: 12, paddingInline: 10 }}
    >
      {config.label}
    </Tag>
  );
};

// Small UI component for triage status badges.
const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status];

  if (!config) {
    return <Tag style={{ borderRadius: 999 }}>{status || "Unknown"}</Tag>;
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

// Reusable stat card for the summary metrics row.
const StatCard = ({ title, value, icon, accent, helper }) => (
  <Card
    bordered={false}
    style={{
      borderRadius: 22,
      background: "#fff",
      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
      height: "100%",
    }}
    styles={{ body: { padding: 22 } }}
  >
    <Space direction="vertical" size={14} style={{ width: "100%" }}>
      <Space style={{ justifyContent: "space-between", width: "100%" }} align="start">
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
          }}
        >
          {icon}
        </div>
        <Text style={{ color: "#94a3b8", fontSize: 12 }}>{helper}</Text>
      </Space>
      <Statistic
        title={<span style={{ color: "#64748b", fontWeight: 600 }}>{title}</span>}
        value={value}
        valueStyle={{ color: "#0f172a", fontSize: 30, fontWeight: 800 }}
      />
    </Space>
  </Card>
);

// Right-side slide-out panel that shows one submission in detail.
// Opened when the user clicks a row or the "View" button.
const DetailDrawer = ({ open, onClose, record }) => {
  if (!record) return null;

  const status = record.result_data?.color;
  const statusConfig = STATUS_CONFIG[status] || {};
  const answers = record.user_answers || {};

  return (
    <Drawer
      title={
        <Space size={10}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: statusConfig.color || "#94a3b8",
            }}
          />
          <div>
            <Text strong style={{ fontSize: 16, color: "#0f172a" }}>
              Submission details
            </Text>
            <br />
            <Text style={{ color: "#64748b", fontSize: 12 }}>
              {record.id}
            </Text>
          </div>
        </Space>
      }
      placement="right"
      width={560}
      open={open}
      onClose={onClose}
      styles={{
        body: { padding: 24, background: "#f8fafc" },
        header: { borderBottom: "1px solid #e2e8f0" },
      }}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Card bordered={false} style={{ borderRadius: 18 }}>
          <Space wrap size={[10, 10]}>
            <Tag style={metaTagStyle}>
              <Clock3 size={13} />
              {formatDate(record.created_at)}
            </Tag>
            <ConditionTag condition={record.condition_key} />
            <Tag style={metaTagStyle}>
              <Languages size={13} />
              {LANGUAGE_LABELS[record.language] || record.language || "Unknown"}
            </Tag>
            <StatusBadge status={status} />
          </Space>
        </Card>

        <Card bordered={false} style={{ borderRadius: 18 }}>
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            <Text strong style={sectionTitleStyle}>
              Assessment summary
            </Text>
            <div
              style={{
                borderRadius: 16,
                border: `1px solid ${statusConfig.border || "#e2e8f0"}`,
                background: statusConfig.bg || "#fff",
                padding: 16,
              }}
            >
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <div>
                  <Text style={fieldTitleStyle}>Advice</Text>
                  <div style={fieldBodyStyle}>{record.result_data?.advice || "—"}</div>
                </div>
                <div>
                  <Text style={fieldTitleStyle}>Reason</Text>
                  <div style={fieldBodyStyle}>{record.result_data?.reason || "—"}</div>
                </div>
              </Space>
            </div>
          </Space>
        </Card>

        <Card bordered={false} style={{ borderRadius: 18 }}>
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            <Text strong style={sectionTitleStyle}>
              Patient responses
            </Text>
            {Object.keys(answers).length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No patient answers were recorded."
              />
            ) : (
              <Descriptions
                bordered
                size="small"
                column={1}
                styles={{
                  label: {
                    width: 180,
                    background: "#f8fafc",
                    color: "#475569",
                    fontSize: 12,
                    fontWeight: 700,
                  },
                  content: {
                    color: "#0f172a",
                    fontSize: 13,
                  },
                }}
              >
                {Object.entries(answers).map(([key, value]) => (
                  <Descriptions.Item key={key} label={formatKey(key)}>
                    {formatValue(value)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            )}
          </Space>
        </Card>
      </Space>
    </Drawer>
  );
};

// Main authenticated admin dashboard.
// Props:
// - user: logged-in Supabase user
// - onSignOut: callback from App.jsx to sign the user out
export default function AdminPanel({ user, onSignOut }) {
  // Raw records fetched from Supabase.
  const [data, setData] = useState([]);

  // Global loading state for the table refresh.
  const [loading, setLoading] = useState(true);

  // Text query for cross-field searching.
  const [query, setQuery] = useState("");

  // Individual filters for narrowing the table.
  const [filterCondition, setFilterCondition] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterLanguage, setFilterLanguage] = useState(null);

  // Drawer state for the selected submission.
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Flag showing whether we are using real data or demo fallback data.
  const [usingMockData, setUsingMockData] = useState(false);

  // Timestamp for the last completed refresh.
  const [lastUpdated, setLastUpdated] = useState(null);

  // Ant Design notification API for error/toast messages.
  const [api, contextHolder] = notification.useNotification();

  // Loads the submission list from Supabase.
  // This is the main data-fetching function for the whole dashboard.
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      // If config is missing, we skip live fetches and show demo data.
      if (!isSupabaseConfigured) {
        setData(MOCK_SUBMISSIONS);
        setUsingMockData(true);
        setLastUpdated(new Date().toISOString());
        return;
      }

      // Main live query:
      // reads all rows from the configured table and sorts newest first.
      const { data: rows, error } = await supabase
        .from(supabaseTable)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setData(rows || []);
      setUsingMockData(false);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      // If the live query fails, we keep the UI usable with mock data
      // and show a readable error toast.
      setData(MOCK_SUBMISSIONS);
      setUsingMockData(true);
      setLastUpdated(new Date().toISOString());
      api.error({
        message: "Could not load live submissions",
        description:
          error?.message || "The dashboard is showing demo data for now.",
        placement: "topRight",
        style: { borderRadius: 14 },
      });
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    // Trigger the first dashboard load once the component mounts.
    Promise.resolve().then(fetchData);
  }, [fetchData]);

  // Apply all active filters and the search query to the raw data.
  const filtered = data.filter((record) => {
    if (filterCondition && record.condition_key !== filterCondition) return false;
    if (filterStatus && record.result_data?.color !== filterStatus) return false;
    if (filterLanguage && record.language !== filterLanguage) return false;
    if (!matchesSearch(record, query)) return false;
    return true;
  });

  // Summary metrics used by the cards at the top of the dashboard.
  const stats = {
    total: data.length,
    red: data.filter((item) => item.result_data?.color === "RED").length,
    yellow: data.filter((item) => item.result_data?.color === "YELLOW").length,
    green: data.filter((item) => item.result_data?.color === "GREEN").length,
  };

  const languagesCount = [...new Set(data.map((item) => item.language).filter(Boolean))]
    .length;

  // Table column definitions for Ant Design.
  // If you want to change what the main grid shows, edit this array.
  const columns = [
    {
      title: "Submitted",
      dataIndex: "created_at",
      key: "created_at",
      width: 190,
      render: (value) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontWeight: 700, color: "#0f172a", fontSize: 13 }}>
            {new Date(value).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Text>
          <Text style={{ fontSize: 12, color: "#64748b" }}>
            {new Date(value).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </Space>
      ),
    },
    {
      title: "Condition",
      dataIndex: "condition_key",
      key: "condition_key",
      width: 160,
      render: (value) => <ConditionTag condition={value} />,
    },
    {
      title: "Language",
      dataIndex: "language",
      key: "language",
      width: 110,
      render: (value) => (
        <Tag style={metaTagStyle}>
          <Languages size={12} />
          {LANGUAGE_LABELS[value] || value || "—"}
        </Tag>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 130,
      render: (_, record) => <StatusBadge status={record.result_data?.color} />,
    },
    {
      title: "Advice",
      key: "advice",
      render: (_, record) => (
        <Tooltip title={record.result_data?.advice || "No advice"}>
          <Text
            ellipsis
            style={{ maxWidth: 340, display: "block", color: "#475569", fontSize: 13 }}
          >
            {record.result_data?.advice || "—"}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 92,
      align: "right",
      render: (_, record) => (
        <Button
          type="text"
          icon={<Eye size={15} />}
          style={{ color: "#0f766e", fontWeight: 700 }}
          onClick={(event) => {
            event.stopPropagation();
            setSelectedRecord(record);
            setDrawerOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      {contextHolder}

      {/* Main page shell and decorative background layers */}
      <div style={pageStyles.page}>
        <div style={pageStyles.gradient} />
        <div style={pageStyles.grid} />

        <div style={pageStyles.container}>
          {/* Top hero section: branding, short explanation, signed-in user box */}
          <Card bordered={false} style={pageStyles.heroCard} styles={{ body: { padding: 28 } }}>
            <div style={pageStyles.heroLayout}>
              <div>
                <Space size={12} align="center" style={{ marginBottom: 16 }}>
                  <div style={pageStyles.brandMark}>
                    <Stethoscope size={20} color="#fff" />
                  </div>
                  <div>
                    <Text style={pageStyles.eyebrow}>PediaScreen Admin</Text>
                    <Title level={2} style={{ margin: "4px 0 0", color: "#fff" }}>
                      Screening oversight that feels lighter to use.
                    </Title>
                  </div>
                </Space>

                <Text style={pageStyles.heroText}>
                  Monitor recent submissions, focus on urgent flags, and review
                  patient responses without digging through clutter.
                </Text>

                <Space wrap size={[10, 10]} style={{ marginTop: 18 }}>
                  <Tag style={pageStyles.heroPill}>
                    <ShieldCheck size={14} />
                    Secure Supabase login
                  </Tag>
                  <Tag style={pageStyles.heroPill}>
                    <RefreshCw size={14} />
                    Live refresh
                  </Tag>
                  <Tag style={pageStyles.heroPill}>
                    <Filter size={14} />
                    Fast triage filters
                  </Tag>
                </Space>
              </div>

              <Card bordered={false} style={pageStyles.userCard} styles={{ body: { padding: 18 } }}>
                <Space direction="vertical" size={14} style={{ width: "100%" }}>
                  <Space style={{ justifyContent: "space-between", width: "100%" }}>
                    <Space size={12}>
                      <Avatar
                        size={48}
                        style={{
                          background: "linear-gradient(135deg, #0f766e, #38bdf8)",
                        }}
                        icon={<UserRound size={22} />}
                      />
                      <div>
                        <Text style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700 }}>
                          SIGNED IN
                        </Text>
                        <div style={{ color: "#0f172a", fontWeight: 700 }}>
                          {user?.email || "Admin"}
                        </div>
                      </div>
                    </Space>
                    <Badge
                      status={usingMockData ? "warning" : "success"}
                      text={
                        <span style={{ color: "#475569", fontWeight: 600 }}>
                          {usingMockData ? "Demo data" : "Live data"}
                        </span>
                      }
                    />
                  </Space>

                  <Space direction="vertical" size={8} style={{ width: "100%" }}>
                    <Text style={{ color: "#64748b", fontSize: 12 }}>
                      Table: <Text strong>{supabaseTable}</Text>
                    </Text>
                    <Text style={{ color: "#64748b", fontSize: 12 }}>
                      Last sync: {lastUpdated ? formatDate(lastUpdated) : "Waiting for first sync"}
                    </Text>
                  </Space>

                  <Space size={10} style={{ width: "100%" }}>
                    <Button
                      type="primary"
                      icon={<RefreshCw size={14} />}
                      onClick={fetchData}
                      loading={loading}
                      style={pageStyles.refreshButton}
                    >
                      Refresh
                    </Button>
                    <Button
                      icon={<LogOut size={14} />}
                      onClick={onSignOut}
                      style={pageStyles.logoutButton}
                    >
                      Sign Out
                    </Button>
                  </Space>
                </Space>
              </Card>
            </div>
          </Card>

          {usingMockData && (
            // Warning banner shown whenever the dashboard is not reading live Supabase rows.
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 18, borderRadius: 18 }}
              message="The dashboard is currently showing demo submissions."
              description="This usually means the table name is wrong, Row Level Security blocks access, or the browser session cannot read the live table yet."
            />
          )}

          <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
            {/* Summary metrics row */}
            <Col xs={24} md={12} xl={6}>
              <StatCard
                title="Total submissions"
                value={stats.total}
                icon={<Activity size={20} />}
                accent="linear-gradient(135deg, #0f766e, #14b8a6)"
                helper="All records"
              />
            </Col>
            <Col xs={24} md={12} xl={6}>
              <StatCard
                title="Critical cases"
                value={stats.red}
                icon={<AlertTriangle size={20} />}
                accent="linear-gradient(135deg, #dc2626, #fb7185)"
                helper="Need attention"
              />
            </Col>
            <Col xs={24} md={12} xl={6}>
              <StatCard
                title="Stable cases"
                value={stats.green}
                icon={<CheckCircle size={20} />}
                accent="linear-gradient(135deg, #15803d, #4ade80)"
                helper="Green status"
              />
            </Col>
            <Col xs={24} md={12} xl={6}>
              <StatCard
                title="Languages"
                value={languagesCount}
                icon={<Languages size={20} />}
                accent="linear-gradient(135deg, #2563eb, #38bdf8)"
                helper="Coverage"
              />
            </Col>
          </Row>

          <Card bordered={false} style={pageStyles.tableCard} styles={{ body: { padding: 0 } }}>
            {/* Table toolbar: heading, search, and filters */}
            <div style={pageStyles.tableHeader}>
              <div>
                <Text style={pageStyles.eyebrow}>Submission Queue</Text>
                <Title level={4} style={{ margin: "6px 0 2px", color: "#0f172a" }}>
                  Review and filter incoming assessments
                </Title>
                <Text style={{ color: "#64748b" }}>
                  {filtered.length} visible of {data.length} total
                </Text>
              </div>

              <Space wrap size={[10, 10]}>
                <Input
                  allowClear
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search advice, reason, status, or answers"
                  prefix={<Search size={14} />}
                  style={{ width: 280, borderRadius: 12 }}
                />
                <Select
                  allowClear
                  placeholder="Condition"
                  value={filterCondition}
                  onChange={setFilterCondition}
                  style={{ width: 150 }}
                >
                  {Object.entries(CONDITION_CONFIG).map(([key, config]) => (
                    <Select.Option key={key} value={key}>
                      <Space size={6}>
                        {config.icon}
                        {config.label}
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
                <Select
                  allowClear
                  placeholder="Status"
                  value={filterStatus}
                  onChange={setFilterStatus}
                  style={{ width: 140 }}
                >
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <Select.Option key={key} value={key}>
                      <Space size={6}>
                        {config.icon}
                        {config.label}
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
                <Select
                  allowClear
                  placeholder="Language"
                  value={filterLanguage}
                  onChange={setFilterLanguage}
                  style={{ width: 130 }}
                >
                  {Object.entries(LANGUAGE_LABELS).map(([key, label]) => (
                    <Select.Option key={key} value={key}>
                      {label}
                    </Select.Option>
                  ))}
                </Select>
                <Button
                  onClick={() => {
                    setQuery("");
                    setFilterCondition(null);
                    setFilterStatus(null);
                    setFilterLanguage(null);
                  }}
                  style={{ borderRadius: 12 }}
                >
                  Clear
                </Button>
              </Space>
            </div>

            <Spin spinning={loading} tip="Loading submissions...">
              {/* Main submissions table */}
              <Table
                dataSource={filtered}
                columns={columns}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: false,
                  showTotal: (total) => `${total} record${total === 1 ? "" : "s"}`,
                  style: { padding: "14px 20px 18px" },
                }}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        query || filterCondition || filterStatus || filterLanguage
                          ? "No submissions match the current filters."
                          : "No submissions are available yet."
                      }
                    />
                  ),
                }}
                onRow={(record) => ({
                  onClick: () => {
                    setSelectedRecord(record);
                    setDrawerOpen(true);
                  },
                  style: { cursor: "pointer" },
                })}
                rowClassName={() => "admin-table-row"}
              />
            </Spin>
          </Card>
        </div>
      </div>

      <DetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        record={selectedRecord}
      />

      {/* Local component-specific CSS overrides for Ant Design table/drawer behavior */}
      <style>{`
        .admin-table-row:hover > td {
          background: #f0fdfa !important;
        }
        .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-size: 11px !important;
          font-weight: 800 !important;
          letter-spacing: .1em;
          text-transform: uppercase;
          border-bottom: 1px solid #e2e8f0 !important;
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 16px !important;
        }
        .ant-input,
        .ant-input-affix-wrapper,
        .ant-select-selector,
        .ant-btn {
          border-radius: 12px !important;
        }
        @media (max-width: 980px) {
          .ant-drawer-content-wrapper {
            width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}

// Shared small-tag style used for language/date metadata.
const metaTagStyle = {
  borderRadius: 999,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  paddingInline: 10,
  height: 30,
  color: "#334155",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  fontWeight: 600,
};

// Shared typography styles used inside the detail drawer sections.
const sectionTitleStyle = {
  fontSize: 13,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: ".12em",
};

const fieldTitleStyle = {
  display: "block",
  marginBottom: 6,
  color: "#64748b",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: ".1em",
};

const fieldBodyStyle = {
  color: "#0f172a",
  fontSize: 14,
  lineHeight: 1.7,
};

// Page-wide inline style map for the authenticated dashboard UI.
// If you want to move or restyle a section, this is the main style registry.
const pageStyles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    position: "relative",
    overflow: "hidden",
  },
  gradient: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at top left, rgba(20,184,166,.12), transparent 28%), radial-gradient(circle at top right, rgba(56,189,248,.12), transparent 24%), linear-gradient(180deg, #f0fdfa, #f8fafc 18%, #f8fafc)",
    pointerEvents: "none",
  },
  grid: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(148,163,184,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.08) 1px, transparent 1px)",
    backgroundSize: "32px 32px",
    maskImage: "linear-gradient(180deg, rgba(0,0,0,.7), transparent 85%)",
    pointerEvents: "none",
  },
  container: {
    position: "relative",
    zIndex: 1,
    width: "min(1380px, calc(100% - 24px))",
    margin: "0 auto",
    padding: "22px 0 28px",
  },
  heroCard: {
    marginBottom: 18,
    borderRadius: 28,
    background: "linear-gradient(135deg, #0f172a, #0f766e 62%, #0ea5e9)",
    boxShadow: "0 30px 80px rgba(15, 23, 42, 0.18)",
  },
  heroLayout: {
    display: "grid",
    gridTemplateColumns: "1.2fr .8fr",
    gap: 20,
    alignItems: "stretch",
  },
  brandMark: {
    width: 54,
    height: 54,
    borderRadius: 18,
    background: "rgba(255,255,255,.16)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255,255,255,.22)",
  },
  eyebrow: {
    color: "rgba(255,255,255,.72)",
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: ".16em",
  },
  heroText: {
    color: "rgba(255,255,255,.86)",
    fontSize: 16,
    lineHeight: 1.8,
    maxWidth: 700,
  },
  heroPill: {
    background: "rgba(255,255,255,.1)",
    border: "1px solid rgba(255,255,255,.16)",
    color: "#fff",
    borderRadius: 999,
    padding: "8px 12px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  userCard: {
    borderRadius: 22,
    background: "rgba(255,255,255,.94)",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
  },
  refreshButton: {
    borderRadius: 12,
    height: 42,
    fontWeight: 700,
    background: "linear-gradient(135deg, #0f766e, #0ea5e9)",
    border: "none",
    boxShadow: "0 12px 28px rgba(14,165,233,.22)",
  },
  logoutButton: {
    borderRadius: 12,
    height: 42,
    fontWeight: 700,
  },
  tableCard: {
    borderRadius: 24,
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.06)",
    overflow: "hidden",
  },
  tableHeader: {
    padding: 22,
    borderBottom: "1px solid #eef2f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
};
