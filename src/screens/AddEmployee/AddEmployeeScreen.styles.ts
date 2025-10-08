import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  pad: {
    padding: 16,
    paddingBottom: 28,
  },

  // Header
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },

  // Card
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#E5E7EB',
    marginBottom: 10,
  },

  // Inputs
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#F1F5F9',
    fontWeight: '700',
  },
  textarea: {
    height: 110,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  inputHalf: {
    flex: 1,
  },

  // Role pills
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: 'rgba(14,165,233,0.15)',
    borderColor: '#0EA5E9',
  },
  pillIdle: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pillTextActive: {
    color: '#7DD3FC',
  },
  pillTextIdle: {
    color: '#94A3B8',
  },

  // Photos
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addPhotoText: {
    color: '#E5E7EB',
    fontWeight: '800',
    letterSpacing: 0.3,
    fontSize: 12,
  },
  thumb: {
    width: 54,
    height: 54,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },

  // Submit
  submitBtn: {
    marginTop: 4,
    backgroundColor: '#0EA5E9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitText: {
    color: '#0B1220',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  // Camera modal
  cameraWrap: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  cameraHeader: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  closeCamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#111827',
  },
  closeCamText: {
    color: '#E5E7EB',
    fontWeight: '800',
    fontSize: 12,
  },
  cameraTitle: {
    color: '#F8FAFC',
    fontWeight: '800',
    fontSize: 14,
  },
  camera: {
    flex: 1,
  },
  camControls: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7DD3FC',
    borderWidth: 6,
    borderColor: '#1E293B',
  },
  cameraCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  cameraHint: {
    color: '#E5E7EB',
    fontWeight: '700',
  },
   
  submitBtnDisabled: {
    opacity: 0.8,
  },
  
});