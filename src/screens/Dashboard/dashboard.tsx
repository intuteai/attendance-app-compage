import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon, Avatar } from 'react-native-elements';
import { styles } from './dashboard.styles';
import { RootStackParamList } from '../../../navigation/types';

// import Config from 'react-native-config';
// const API_BASE_URL = Config.API_BASE_URL;
const API_BASE_URL = 'erp-database-instance.c3y46ues4aqu.ap-south-1.rds.amazonaws.com'; // <-- set me
const AUTH_TOKEN = ''; // e.g. 'Bearer eyJ...' if required

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

type Employee = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
};

type AttendanceRecord = {
  employeeId: string;
  date: string;      // YYYY-MM-DD
  timestamp?: string; // ISO
};

// computed UI type
type UIEmployee = Employee & {
  presentDays: number;
  streak: number;
  lastSeenISO?: string;
};

// --- helpers ---
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};
const getMonthBounds = (ref: Date) => {
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};
const formatDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
};
const hoursSince = (iso?: string | null) => {
  if (!iso) return Number.POSITIVE_INFINITY;
  const d = new Date(iso).getTime();
  const now = Date.now();
  return (now - d) / (1000 * 60 * 60);
};
const presenceColor = (pct: number) => {
  if (pct >= 90) return '#22C55E';
  if (pct >= 75) return '#06B6D4';
  if (pct >= 50) return '#F59E0B';
  return '#EF4444';
};

// Ranges
type RangeKey = 'THIS_MONTH' | 'LAST_7' | 'LAST_30' | 'LAST_90';
const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'THIS_MONTH', label: 'This month' },
  { key: 'LAST_7', label: 'Last 7' },
  { key: 'LAST_30', label: 'Last 30' },
  { key: 'LAST_90', label: 'Last 90' },
];

const getRangeBounds = (key: RangeKey) => {
  const today = startOfToday();
  const end = endOfToday();
  if (key === 'THIS_MONTH') {
    const { start } = getMonthBounds(today);
    return { start, end };
  }
  const days = key === 'LAST_7' ? 7 : key === 'LAST_30' ? 30 : 90;
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const [rangeKey, setRangeKey] = useState<RangeKey>('THIS_MONTH');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmployees = useCallback(async () => {
    // ✅ headers as a concrete Record
    const headers: Record<string, string> = {};
    if (AUTH_TOKEN) headers.Authorization = AUTH_TOKEN;

    const res = await fetch(`${API_BASE_URL}/employees`, { headers });
    const isJSON = (res.headers.get('content-type') || '').includes('application/json');
    const payload = isJSON ? await res.json().catch(() => []) : [];
    if (!res.ok) throw new Error(typeof payload === 'string' ? payload : payload?.message || 'Fetch employees failed');
    // Normalize fields (server may return fullName or name)
    const normalized: Employee[] = (payload as any[]).map((e) => ({
      id: String(e.id),
      name: e.name || e.fullName || '',
      role: e.role || 'Employee',
      avatarUrl: e.avatarUrl || undefined,
    }));
    return normalized;
  }, []);

  const fetchAttendance = useCallback(async (start: Date, end: Date) => {
    const qs = new URLSearchParams({
      start: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
      end: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`,
    }).toString();

    const headers: Record<string, string> = {};
    if (AUTH_TOKEN) headers.Authorization = AUTH_TOKEN;

    const res = await fetch(`${API_BASE_URL}/attendance?${qs}`, { headers });

    const isJSON = (res.headers.get('content-type') || '').includes('application/json');
    const payload = isJSON ? await res.json().catch(() => []) : [];
    if (!res.ok) throw new Error(typeof payload === 'string' ? payload : payload?.message || 'Fetch attendance failed');

    const normalized: AttendanceRecord[] = (payload as any[]).map((r) => ({
      employeeId: String(r.employeeId),
      date: r.date,
      timestamp: r.timestamp || undefined,
    }));
    return normalized;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getRangeBounds(rangeKey);
      const [emps, att] = await Promise.all([fetchEmployees(), fetchAttendance(start, end)]);
      setEmployees(emps);
      setAttendance(att);
    } catch (e: any) {
      console.error(e);
      // optionally show a toast
    } finally {
      setLoading(false);
    }
  }, [rangeKey, fetchEmployees, fetchAttendance]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const { start: rangeStart, end: rangeEnd } = useMemo(() => getRangeBounds(rangeKey), [rangeKey]);

  const daysInRange = useMemo(() => {
    const diff = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }, [rangeStart, rangeEnd]);

  // Index attendance by employee (already range-filtered by API)
  const attendanceByEmp = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    for (const r of attendance) {
      if (!map.has(r.employeeId)) map.set(r.employeeId, []);
      map.get(r.employeeId)!.push(r);
    }
    // sort desc by timestamp
    for (const arr of map.values()) arr.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return map;
  }, [attendance]);

  const uiEmployees: UIEmployee[] = useMemo(() => {
    return employees.map((e) => {
      const records = attendanceByEmp.get(e.id) ?? [];
      // Unique days present in range
      const uniqueDays = new Set<string>();
      for (const r of records) uniqueDays.add(r.date);
      const presentDays = uniqueDays.size;

      // Streak is approximated using range data; for true streak, fetch full history.
      let streak = 0;
      const byDate = new Set(records.map(r => r.date));
      const cursor = startOfToday();
      while (true) {
        const y = cursor.getFullYear();
        const m = String(cursor.getMonth() + 1).padStart(2, '0');
        const d = String(cursor.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${d}`;
        if (byDate.has(key)) {
          streak += 1;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }

      const lastSeenISO = records.length
        ? records[0].timestamp ?? `${records[0].date}T00:00:00.000Z`
        : undefined;

      return { ...e, presentDays, streak, lastSeenISO };
    });
  }, [employees, attendanceByEmp]);

  const orgStats = useMemo(() => {
    const totalEmployees = employees.length;
    const totalPresentDays = uiEmployees.reduce((sum, e) => sum + e.presentDays, 0);
    const avgPresencePct = totalEmployees
      ? Math.round((totalPresentDays / Math.max(1, totalEmployees * daysInRange)) * 100)
      : 0;

    let mostRecent: string | null = null;
    for (const e of uiEmployees) {
      if (e.lastSeenISO && (!mostRecent || new Date(e.lastSeenISO) > new Date(mostRecent))) {
        mostRecent = e.lastSeenISO;
      }
    }

    const today = startOfToday();
    const { start: monthStart } = getMonthBounds(today);
    const monthStartLabel = monthStart.toLocaleString('default', { month: 'long' });
    const yearLabel = String(today.getFullYear());

    return {
      totalEmployees,
      totalPresentDays,
      avgPresencePct,
      mostRecentSeenISO: mostRecent,
      monthStartLabel,
      yearLabel,
    };
  }, [uiEmployees, employees.length, daysInRange]);

  const renderEmp = ({ item }: { item: UIEmployee }) => {
    const pct = Math.round((item.presentDays / Math.max(1, daysInRange)) * 100);
    const activeNow = hoursSince(item.lastSeenISO) <= 1;

    return (
      <View style={styles.empCard} accessibilityRole="summary">
        <View style={styles.empTopRow}>
          <View style={styles.empLeft}>
            <View style={styles.avatarWrap}>
              <Avatar
                rounded
                size="medium"
                source={item.avatarUrl ? { uri: item.avatarUrl } : undefined}
                title={item.name.split(' ').map((s: string) => s[0]).slice(0,2).join('').toUpperCase()}
                titleStyle={styles.avatarTitle}
                overlayContainerStyle={styles.avatarOverlay}
              />
              <View style={[styles.statusDot, { backgroundColor: activeNow ? '#22C55E' : '#64748B' }]} />
            </View>

            <View style={styles.empMeta}>
              <Text style={styles.empName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.roleRow}>
                <Icon name="id-badge" type="font-awesome" size={12} color="#93C5FD" />
                <Text style={styles.empRole}>{item.role}</Text>
              </View>

              <View style={styles.badgeRow}>
                <View style={styles.badgePositive}>
                  <Icon name="calendar-check-o" type="font-awesome" size={12} color="#065F46" />
                  <Text style={styles.badgePositiveText}>{item.presentDays} present</Text>
                </View>
                <View style={styles.badgeNegative}>
                  <Icon name="calendar-times-o" type="font-awesome" size={12} color="#7F1D1D" />
                  <Text style={styles.badgeNegativeText}>
                    {Math.max(0, daysInRange - item.presentDays)} absent
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.empRight}>
            <Text style={styles.streakValue}>{item.streak}</Text>
            <Text style={styles.streakLabel}>streak</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.empProgressWrap}>
          <View style={styles.empProgressBar}>
            <View style={[styles.empProgressFill, { width: `${pct}%`, backgroundColor: presenceColor(pct) }]} />
          </View>
          <View style={styles.empProgressRow}>
            <Text style={styles.empProgressText}>{pct}% in range</Text>
            <View style={styles.progressHint}>
              <Icon name="clock-o" type="font-awesome" size={12} color="#94A3B8" />
              <Text style={styles.hintText}>Last seen {formatDateTime(item.lastSeenISO)}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollPad}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7DD3FC" />
        }
      >
        {/* Overview + range filter */}
        <View style={[styles.section, { paddingBottom: 10 }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Attendance Overview</Text>
              <Text style={styles.sectionSubtitle}>
                {rangeKey === 'THIS_MONTH'
                  ? `${orgStats.monthStartLabel} ${orgStats.yearLabel}`
                  : `${rangeStart.toLocaleDateString()} – ${rangeEnd.toLocaleDateString()}`}
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {RANGE_OPTIONS.map(opt => {
                const selected = opt.key === rangeKey;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setRangeKey(opt.key)}
                    style={[styles.chip, selected && styles.chipSelected]}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statTopRow}>
                <Icon name="line-chart" type="font-awesome" size={14} color="#7DD3FC" />
                <Text style={[styles.statDelta, { color: presenceColor(orgStats.avgPresencePct) }]}>
                  {orgStats.avgPresencePct >= 75 ? 'On Track' : 'Needs Attention'}
                </Text>
              </View>
              <Text style={styles.statValue}>{orgStats.avgPresencePct}%</Text>
              <Text style={styles.statLabel}>Average Presence</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statTopRow}>
                <Icon name="check-circle-o" type="font-awesome" size={14} color="#86EFAC" />
                <Text style={styles.statDeltaMuted}>In Range</Text>
              </View>
              <Text style={styles.statValue}>{orgStats.totalPresentDays}</Text>
              <Text style={styles.statLabel}>Total Present Days</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statTopRow}>
                <Icon name="users" type="font-awesome" size={14} color="#FCA5A5" />
                <Text style={styles.statDeltaMuted}>Active</Text>
              </View>
              <Text style={styles.statValue}>{orgStats.totalEmployees}</Text>
              <Text style={styles.statLabel}>Employees</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="calendar" type="font-awesome" size={16} color="#94A3B8" />
              <Text style={styles.metaText}>
                Range: {rangeStart.toLocaleDateString()} – {rangeEnd.toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="clock-o" type="font-awesome" size={16} color="#94A3B8" />
              <Text style={styles.metaText}>Last activity: {formatDateTime(orgStats.mostRecentSeenISO)}</Text>
            </View>
          </View>
        </View>

        {/* Add Employee */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddEmployee')}
            style={styles.primaryButton}
            activeOpacity={0.92}
            accessibilityRole="button"
            accessibilityLabel="Add employee"
          >
            <Icon name="user-plus" type="font-awesome" size={16} color="#0B1220" />
            <Text style={styles.primaryButtonText}>Add Employee</Text>
          </TouchableOpacity>
        </View>

        {/* Employees List */}
        <View style={styles.sectionHeaderTight}>
          <Text style={styles.subTitle}>Employees</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Home')}
            style={styles.smallLink}
            activeOpacity={0.85}
          >
            <Text style={styles.smallLinkText}>Back to Home</Text>
            <Icon name="angle-right" type="font-awesome" size={14} color="#A5B4FC" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={uiEmployees}
          keyExtractor={(e) => e.id}
          renderItem={renderEmp}
          contentContainerStyle={styles.list}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              {loading ? (
                <Text style={styles.emptyText}>Loading…</Text>
              ) : (
                <>
                  <Icon name="users" type="font-awesome" size={18} color="#94A3B8" />
                  <Text style={styles.emptyText}>No employees yet.</Text>
                </>
              )}
            </View>
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
