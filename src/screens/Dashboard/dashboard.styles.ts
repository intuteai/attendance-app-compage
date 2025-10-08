import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070B14',
  },

  scrollPad: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 14,
  },

  // Typography
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 18,
    textAlign: 'left',
    letterSpacing: 0.2,
  },
  subTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E5E7EB',
    letterSpacing: 0.2,
  },

  // Sections
  section: {
    backgroundColor: '#0B1220',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1C2433',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    flexWrap: 'wrap',
    rowGap: 10,
  },
  sectionHeaderTight: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E5E7EB',
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 4,
  },
  sectionSubtitleSmall: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '700',
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
    maxWidth: '60%',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(37,99,235,0.12)',
    borderWidth: 1,
    borderColor: '#1D4ED8',
  },
  chipText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  chipSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  chipSecondaryText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // FILTER ROW + SELECTED STATE
  filterRow: {
    gap: 10,
    paddingLeft: 2,
    paddingRight: 2,
  },
  chipSelected: {
    backgroundColor: '#7DD3FC',
    borderColor: '#1E293B',
  },
  chipTextSelected: {
    color: '#0B1220',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statDelta: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  statDeltaMuted: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 30,
    fontWeight: '900',
    color: '#F1F5F9',
    marginTop: 6,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  statLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Meta row
  metaRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Action row (Add Employee)
  actionRow: {
    marginTop: -2,
    marginBottom: 18,
    paddingHorizontal: 2,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 18,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#7DD3FC',
    borderWidth: 2,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
    alignSelf: 'stretch',
  },
  primaryButtonText: {
    color: '#0B1220',
    fontWeight: '900',
    letterSpacing: 0.3,
    fontSize: 16,
  },

  // List
  list: {
    paddingBottom: 16,
    gap: 0,
  },

  // Employee Card
  empCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  empTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  empLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 0,
  },
  avatarWrap: {
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  avatarTitle: {
    color: '#0B1220',
    fontWeight: '800',
  },
  avatarOverlay: {
    backgroundColor: '#67E8F9',
  },

  empMeta: {
    flex: 1,
    minWidth: 0,
  },
  empName: {
    color: '#E5E7EB',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  roleRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  empRole: {
    color: '#93C5FD',
    fontSize: 13,
    fontWeight: '800',
  },

  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  badgePositive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16,185,129,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgePositiveText: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  badgeNegative: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeNegativeText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  empRight: {
    alignItems: 'flex-end',
    minWidth: 74,
  },
  streakValue: {
    color: '#F1F5F9',
    fontWeight: '900',
    fontSize: 26,
    lineHeight: 26,
  },
  streakLabel: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 12,
    marginTop: 6,
  },

  empProgressWrap: {
    marginTop: 14,
  },
  empProgressBar: {
    height: 12,
    backgroundColor: '#1E293B',
    borderRadius: 999,
    overflow: 'hidden',
  },
  empProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  empProgressRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  empProgressText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
  },
  progressHint: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  hintText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },

  empFooterRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  quickAction: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#293041',
  },
  quickActionText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '800',
  },

  // Buttons
  backButton: {
    backgroundColor: '#121A2A',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#2A3446',
    alignSelf: 'stretch',
  },
  backText: {
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // Links & inline cta
  smallLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallLinkText: {
    color: '#A5B4FC',
    fontSize: 13,
    fontWeight: '800',
  },
  inlineCTA: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#7DD3FC',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignSelf: 'center',
  },
  inlineCTAText: {
    color: '#0B1220',
    fontWeight: '900',
    letterSpacing: 0.3,
    fontSize: 13,
  },

  // Empty state
  emptyWrap: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
});
