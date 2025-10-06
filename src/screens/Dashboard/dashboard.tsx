import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon, Avatar } from 'react-native-elements';
import { styles } from './dashboard.styles';
import { RootStackParamList } from '../../../navigation/types';


type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

// --- Helpers ---
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
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

// --- Demo data (replace with API data/fetched state) ---
type Employee = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  presentDays: number;     // this month through today
  lastSeenISO?: string;    // last check-in/capture datetime ISO
  streak: number;          // consecutive present days up to today
};

const DashboardScreen: React.FC<Props> = ({ navigation, route }) => {
  const imagePaths = route.params?.imagePaths ?? [];
  // You can swap this with data from your server/store
  const employees: Employee[] = [
    {
      id: 'e1',
      name: 'Aarav Sharma',
      role: 'Driver',
      avatarUrl: undefined,
      presentDays: 18,
      lastSeenISO: new Date().toISOString(),
      streak: 3,
    },
    {
      id: 'e2',
      name: 'Neha Verma',
      role: 'Driver',
      presentDays: 20,
      lastSeenISO: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      streak: 7,
    },
    {
      id: 'e3',
      name: 'Rohan Gupta',
      role: 'Driver',
      presentDays: 14,
      lastSeenISO: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      streak: 0,
    },
    {
      id: 'e4',
      name: 'Isha Nair',
      role: 'Supervisor',
      presentDays: 22,
      lastSeenISO: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      streak: 10,
    },
  ];

  const today = startOfToday();
  const { start: monthStart } = getMonthBounds(today);
  const daysSoFarThisMonth = today.getDate();

  // Org-level summary from employees
  const { avgPresencePct, totalPresentDays, totalEmployees, mostRecentSeenISO } = useMemo(() => {
    const totalEmployees = employees.length || 1;
    let totalPresentDays = 0;
    let mostRecent: Date | null = null;

    for (const e of employees) {
      totalPresentDays += e.presentDays;
      if (e.lastSeenISO) {
        const d = new Date(e.lastSeenISO);
        if (!mostRecent || d > mostRecent) mostRecent = d;
      }
    }

    const avgPresencePct = Math.round(
      (totalPresentDays / Math.max(1, totalEmployees * daysSoFarThisMonth)) * 100
    );

    return {
      avgPresencePct,
      totalPresentDays,
      totalEmployees,
      mostRecentSeenISO: mostRecent?.toISOString() ?? null,
    };
  }, [employees, daysSoFarThisMonth]);

  const renderEmployee = ({ item }: { item: Employee }) => {
    const absent = Math.max(0, daysSoFarThisMonth - item.presentDays);
    const pct = Math.round((item.presentDays / Math.max(1, daysSoFarThisMonth)) * 100);

    return (
      <View style={styles.empCard}>
        <View style={styles.empTopRow}>
          <View style={styles.empLeft}>
            <Avatar
              rounded
              size="medium"
              source={item.avatarUrl ? { uri: item.avatarUrl } : undefined}
              title={item.name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()}
              titleStyle={{ color: '#0B1220', fontWeight: '800' }}
              overlayContainerStyle={{ backgroundColor: '#67E8F9' }}
            />
            <View style={styles.empMeta}>
              <Text style={styles.empName}>{item.name}</Text>
              <Text style={styles.empRole}>{item.role}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Icon name="calendar-check-o" type="font-awesome" size={12} color="#047857" />
                  <Text style={styles.badgeText}>{item.presentDays} present</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#EF4444' }]}>
                  <Icon name="calendar-times-o" type="font-awesome" size={12} color="#EF4444" />
                  <Text style={[styles.badgeText, { color: '#FCA5A5' }]}>{absent} absent</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.empRight}>
            <Text style={styles.streakValue}>{item.streak}</Text>
            <Text style={styles.streakLabel}>streak</Text>
          </View>
        </View>

        <View style={styles.empProgressWrap}>
          <View style={styles.empProgressBar}>
            <View style={[styles.empProgressFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.empProgressText}>{pct}% of days present</Text>
        </View>

        <View style={styles.empFooterRow}>
          <View style={styles.metaItem}>
            <Icon name="calendar" type="font-awesome" size={14} color="#64748B" />
            <Text style={styles.metaText}>Month: {monthStart.toLocaleString('default', { month: 'long' })} {today.getFullYear()}</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="clock-o" type="font-awesome" size={14} color="#64748B" />
            <Text style={styles.metaText}>Last seen: {formatDateTime(item.lastSeenISO)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollPad}>

        {/* Top Bar */}
      <View style={styles.topBarCentered}>
  <TouchableOpacity
    onPress={() => navigation.navigate('AddEmployee')}
    style={styles.largeAddButton}
    activeOpacity={0.92}
    accessibilityRole="button"
    accessibilityLabel="Add employee"
  >
    <Icon name="user-plus" type="font-awesome" size={18} color="#0B1220" />
    <Text style={styles.largeAddText}>Add Employee</Text>
  </TouchableOpacity>
</View>

        {/* Org Attendance Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Attendance Overview</Text>
            <Text style={styles.sectionSubtitle}>
              {monthStart.toLocaleString('default', { month: 'long' })} {today.getFullYear()}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{avgPresencePct}%</Text>
              <Text style={styles.statLabel}>Avg Presence</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalPresentDays}</Text>
              <Text style={styles.statLabel}>Total Present Days</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalEmployees}</Text>
              <Text style={styles.statLabel}>Employees</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="calendar" type="font-awesome" size={16} color="#64748B" />
              <Text style={styles.metaText}>
                Range: {monthStart.toLocaleDateString()} – {today.toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="clock-o" type="font-awesome" size={16} color="#64748B" />
              <Text style={styles.metaText}>Last activity: {formatDateTime(mostRecentSeenISO)}</Text>
            </View>
          </View>
        </View>

        {/* Employees List */}
        <Text style={styles.subTitle}>Employees</Text>
        <FlatList
          data={employees}
          keyExtractor={(e) => e.id}
          renderItem={renderEmployee}
          contentContainerStyle={styles.list}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Icon name="users" type="font-awesome" size={18} color="#94A3B8" />
              <Text style={styles.emptyText}>No employees found.</Text>
            </View>
          }
        />

        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton} activeOpacity={0.9}>
          <Text style={styles.backText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;
