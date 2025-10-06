import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { Icon } from 'react-native-elements';
import { styles } from './styles';

// Camera deps
import { Camera, useCameraDevice, PhotoFile } from 'react-native-vision-camera';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { useIsFocused } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEmployee'>;

// ======= CONFIG: add-employee endpoint (leave blank for now) =======
const VPS_ADD_EMPLOYEE_URL = ''; // e.g., 'https://YOUR_VPS/employee'
// ================================================================

const AddEmployeeScreen: React.FC<Props> = ({ navigation }) => {
  // --- form state ---
  const [fullName, setFullName] = useState('');
  const [empId, setEmpId] = useState('');
  const [role, setRole] = useState<'Driver' | 'Supervisor' | 'Other'>('Driver');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
 const isFocused = useIsFocused();
  // photos captured in this screen
  const [imagePaths, setImagePaths] = useState<string[]>([]);

  // --- submit/loading state (NEW) ---
  const [submitting, setSubmitting] = useState(false);

  // --- camera state (modal) ---
  const [showCamera, setShowCamera] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionAsked, setPermissionAsked] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const camera = useRef<Camera>(null);
  const device = useCameraDevice('front') ?? useCameraDevice('back');

  // --- permissions ---
  const checkPermissions = useCallback(async () => {
    try {
      let cameraStatus;
      if (Platform.OS === 'android') {
        cameraStatus = await check(PERMISSIONS.ANDROID.CAMERA);
      } else {
        cameraStatus = await check(PERMISSIONS.IOS.CAMERA);
      }

      if (cameraStatus === RESULTS.GRANTED) {
        const vision = await Camera.getCameraPermissionStatus();
        setHasPermission(vision === 'granted');
        if (vision !== 'granted') {
          const req = await Camera.requestCameraPermission();
          setHasPermission(req === 'granted');
        }
      } else if (cameraStatus === RESULTS.DENIED) {
        let req;
        if (Platform.OS === 'android') {
          req = await request(PERMISSIONS.ANDROID.CAMERA);
        } else {
          req = await request(PERMISSIONS.IOS.CAMERA);
        }
        setHasPermission(req === RESULTS.GRANTED);
      } else if (cameraStatus === RESULTS.BLOCKED) {
        setHasPermission(false);
        Alert.alert(
          'Camera Permission',
          'Camera access is blocked. Enable it from Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => openSettings() },
          ]
        );
      } else {
        setHasPermission(false);
      }
    } catch (e) {
      console.error('Permission check error:', e);
      setHasPermission(false);
    } finally {
      setPermissionAsked(true);
    }
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const handleOpenCamera = async () => {
    if (!permissionAsked) await checkPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please allow camera access to add photos.');
      return;
    }
    setShowCamera(true);
  };

  const handleTakePhoto = async () => {
    if (!device || !cameraReady) return;
    try {
      setCapturing(true);
      const photo: PhotoFile | undefined = await camera.current?.takePhoto({});
      if (!photo?.path) {
        Alert.alert('Error', 'Failed to capture image.');
        return;
      }
      const localPath = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
      setImagePaths(prev => [localPath, ...prev]);
    } catch (err: any) {
      console.error('Capture error:', err);
      Alert.alert('Error', err?.message ?? 'Failed to capture.');
    } finally {
      setCapturing(false);
    }
  };

  // ---------- SUBMIT LOGIC (NEW) ----------
  const buildFormData = () => {
    const form = new FormData();
    form.append('fullName', fullName.trim());
    form.append('employeeId', empId.trim());
    form.append('role', role);
    if (phone.trim()) form.append('phone', phone.trim());
    if (email.trim()) form.append('email', email.trim());
    if (notes.trim()) form.append('notes', notes.trim());

    imagePaths.forEach((uri, idx) => {
      const filename = `emp-${empId || 'noid'}-${idx + 1}.jpg`;
      // RN needs file:// on Android if absent
      const withScheme = uri.startsWith('file://') ? uri : `file://${uri}`;
      form.append('photos', { uri: withScheme, name: filename, type: 'image/jpeg' } as any);
    });

    return form;
  };

  const resetForm = () => {
    setFullName('');
    setEmpId('');
    setRole('Driver');
    setPhone('');
    setEmail('');
    setNotes('');
    setImagePaths([]);
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !empId.trim() || !role) {
      Alert.alert('Missing Info', 'Please fill Name, Employee ID, and Role.');
      return;
    }

    // If you have validation rules, extend here (email/phone format, etc.)
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      // If URL is empty, show preview instead of network call
      if (!VPS_ADD_EMPLOYEE_URL) {
        Alert.alert(
          'Preview (no server URL set)',
          `Will submit:\n\nName: ${fullName}\nID: ${empId}\nRole: ${role}\nPhone: ${phone}\nEmail: ${email}\nNotes: ${notes}\nPhotos: ${imagePaths.length}`
        );
        setSubmitting(false);
        return;
      }

      const form = buildFormData();

      const res = await fetch(VPS_ADD_EMPLOYEE_URL, {
        method: 'POST',
        body: form, // RN will set correct multipart boundary
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Server responded ${res.status}${text ? `: ${text}` : ''}`);
      }

      // Success UX
      Alert.alert('Employee Added', `${fullName} has been saved successfully.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
      resetForm();
    } catch (err: any) {
      console.error('Submit error:', err);
      Alert.alert('Submit Failed', err?.message ?? 'Could not submit employee.');
    } finally {
      setSubmitting(false);
    }
  };
  // ---------------------------------------

  // role selector UI
  const RolePill = ({ value }: { value: 'Driver' | 'Supervisor' | 'Other' }) => {
    const active = role === value;
    return (
      <TouchableOpacity
        onPress={() => setRole(value)}
        style={[styles.pill, active ? styles.pillActive : styles.pillIdle]}
        activeOpacity={0.9}
      >
        <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextIdle]}>
          {value}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pad}>
        {/* Header row */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Icon name="chevron-left" type="font-awesome" size={16} color="#E5E7EB" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Employee</Text>
          <View style={{ width: 36 }} />{/* spacer */}
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              placeholder="e.g., Aarav Sharma"
              placeholderTextColor="#6B7280"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              autoCapitalize="words"
              editable={!submitting}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.label}>Employee ID</Text>
              <TextInput
                placeholder="e.g., E-1023"
                placeholderTextColor="#6B7280"
                value={empId}
                onChangeText={setEmpId}
                style={styles.input}
                autoCapitalize="characters"
                editable={!submitting}
              />
            </View>

            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.pillRow}>
                <RolePill value="Driver" />
                <RolePill value="Supervisor" />
                <RolePill value="Other" />
              </View>
            </View>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                placeholder="+91 98765 43210"
                placeholderTextColor="#6B7280"
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                keyboardType="phone-pad"
                editable={!submitting}
              />
            </View>

            <View style={[styles.inputGroup, styles.inputHalf]}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="name@company.com"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!submitting}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              placeholder="Optional notes..."
              placeholderTextColor="#6B7280"
              value={notes}
              onChangeText={setNotes}
              style={[styles.input, styles.textarea]}
              multiline
              numberOfLines={4}
              editable={!submitting}
            />
          </View>

          {/* Photos */}
          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Photos</Text>
          <View style={styles.photoRow}>
            <TouchableOpacity
              style={[styles.addPhotoBtn, submitting && { opacity: 0.6 }]}
              onPress={handleOpenCamera}
              activeOpacity={0.9}
              disabled={submitting}
            >
              <Icon name="camera" type="font-awesome" size={18} color="#0EA5E9" />
              <Text style={styles.addPhotoText}>Add Photos</Text>
            </TouchableOpacity>

            {imagePaths.slice(0, 4).map((p, idx) => (
              <Image
                key={`${p}-${idx}`}
                source={{ uri: p }}
                style={styles.thumb}
                resizeMode="cover"
              />
            ))}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.9}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <ActivityIndicator size="small" color="#0B1220" />
                <Text style={[styles.submitText, { marginLeft: 8 }]}>Submitting…</Text>
              </>
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="fade" onRequestClose={() => { setShowCamera(false); setCameraReady(false); }}>
        <View style={styles.cameraWrap}>
          <View style={styles.cameraHeader}>
            <TouchableOpacity onPress={() => { setShowCamera(false); setCameraReady(false); }} style={styles.closeCamBtn}>
              <Icon name="close" type="font-awesome" size={16} color="#E5E7EB" />
              <Text style={styles.closeCamText}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>Capture Photo</Text>
            <View style={{ width: 72 }} />
          </View>

          {!permissionAsked || !hasPermission ? (
            <View style={styles.cameraCenter}>
              <ActivityIndicator size="large" color="#FFF" />
              <Text style={styles.cameraHint}>Preparing camera…</Text>
            </View>
          ) : !device ? (
            <View style={styles.cameraCenter}>
              <ActivityIndicator size="large" color="#FFF" />
              <Text style={styles.cameraHint}>Loading device…</Text>
            </View>
          ) : (

            
            <>
              <Camera
                ref={camera}
                style={styles.camera}
                device={device}
                isActive={isFocused && showCamera}
                photo={true}
                onInitialized={() => setCameraReady(true)}
                onError={(error) => {
                  console.error('Camera Error:', error);
                  Alert.alert('Camera Error', error.message);
                }}
              />
              <View style={styles.camControls}>
                <TouchableOpacity
                  style={styles.shutter}
                  onPress={handleTakePhoto}
                  disabled={capturing}
                  activeOpacity={0.9}
                >
                  <Icon name="camera" type="font-awesome" size={22} color="#0B1220" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default AddEmployeeScreen;