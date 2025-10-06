import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  scrollPad: {
    padding: 16,
    paddingBottom: 28,
  },

  // Titles
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 16,
    textAlign: 'left',
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D1D5DB',
    marginTop: 10,
    marginBottom: 10,
  },

  // Sections
  section: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Meta row
  metaRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },

  // List
  list: {
    paddingBottom: 12,
  },

  // Employee Card
  empCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  empTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  empLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  empMeta: {
    flex: 1,
  },
  empName: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '800',
  },
  empRole: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  empRight: {
    alignItems: 'flex-end',
    minWidth: 64,
  },
  streakValue: {
    color: '#F1F5F9',
    fontWeight: '900',
    fontSize: 22,
    lineHeight: 22,
  },
  streakLabel: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 11,
    marginTop: 4,
  },

  empProgressWrap: {
    marginTop: 12,
  },
  empProgressBar: {
    height: 10,
    backgroundColor: '#1E293B',
    borderRadius: 999,
    overflow: 'hidden',
  },
  empProgressFill: {
    height: '100%',
    backgroundColor: '#0EA5E9',
    borderRadius: 999,
  },
  empProgressText: {
    marginTop: 8,
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },

  empFooterRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  // Buttons
  backButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  backText: {
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '700',
  },

  // Empty state
  emptyWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  topBarCentered: {
  marginBottom: 16,
  alignItems: 'center',
  justifyContent: 'center',
},

largeAddButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
  paddingHorizontal: 18,
  paddingVertical: 12,
  borderRadius: 999,
  backgroundColor: '#7DD3FC', // bright accent that matches your theme
  borderWidth: 2,
  borderColor: '#1E293B',
  shadowColor: '#000',
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 4,
},

largeAddText: {
  color: '#0B1220',
  fontWeight: '900',
  letterSpacing: 0.3,
  fontSize: 14,
},
});
