import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/types';
import { Icon } from 'react-native-elements';
import { styles } from './AddEmployeeScreen.styles';
import { useRoute } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'AddEmployee'>;

// ======= CONFIG: endpoints =======
const BASE_URL = 'http://192.168.1.5:6900'; // replace with your local server IP
const ERP_CREATE_EMPLOYEE_URL = `${BASE_URL}/register`;
const VPS_FRAMES_UPLOAD_URL = `${BASE_URL}/upload_frames`;
// =================================

// Recording script for RecordFaceVideo screen
export const FACE_PROMPTS: ReadonlyArray<string> = [
  'Look straight',
  'Turn left',
  'Turn right',
  'Look up',
  'Look down',
  'Smile',
];
export const PROMPT_DURATION_MS = 10_000;
export const FRAME_INTERVAL_MS = 500;

const AddEmployeeScreen: React.FC<Props> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [empId, setEmpId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [videoRecorded, setVideoRecorded] = useState(false);

  const routeAny = useRoute<any>();

  // if returning from RecordFaceVideo
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      const done = routeAny?.params?.videoDone;
      if (done) {
        setVideoRecorded(true);
        navigation.setParams?.({ videoDone: undefined } as any);
      }
    });
    return unsub;
  }, [navigation, routeAny]);

  const buildFormData = () => {
    const form = new FormData();
    form.append('name', fullName.trim());
    form.append('emp_id', empId.trim());
    if (phone.trim()) form.append('phone', phone.trim());
    if (email.trim()) form.append('email', email.trim());
    return form;
  };

  const resetForm = () => {
    setFullName('');
    setEmpId('');
    setPhone('');
    setEmail('');
    setVideoRecorded(false);
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !empId.trim()) {
      Alert.alert('Missing Info', 'Please fill Name and Employee ID.');
      return;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!videoRecorded) {
      Alert.alert('Face Video Required', 'Please complete the face video recording step.');
      return;
    }

    setSubmitting(true);
    try {
      const form = buildFormData();

      // 1️⃣ Send to /register
      const registerResp = await fetch(ERP_CREATE_EMPLOYEE_URL, {
        method: 'POST',
        body: form,
      });

      if (!registerResp.ok) {
        throw new Error(`Registration failed: ${registerResp.status}`);
      }

      Alert.alert('Success', `${fullName} registered successfully.`, [
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

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pad}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.9}
          >
            <Icon name="chevron-left" type="font-awesome" size={16} color="#E5E7EB" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Employee</Text>
          <View style={{ width: 36 }} />
        </View>

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
          </View>

          <View style={styles.inputGroup}>
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

          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Face Video</Text>
          <View style={styles.photoRow}>
            <TouchableOpacity
              style={[styles.addPhotoBtn, submitting && { opacity: 0.6 }]}
              onPress={() => {
                if (!fullName.trim() || !empId.trim()) {
                  Alert.alert('Missing Info', 'Please fill Name and Employee ID before recording.');
                  return;
                }
                setVideoRecorded(false);
                navigation.navigate('RecordFaceVideo', {
   empId,
   fullName,
   uploadUrl: VPS_FRAMES_UPLOAD_URL,
 });
              }}
              activeOpacity={0.9}
              disabled={submitting}
            >
              <Icon
                name={videoRecorded ? 'check' : 'video-camera'}
                type="font-awesome"
                size={18}
                color={videoRecorded ? '#22C55E' : '#0EA5E9'}
              />
              <Text style={styles.addPhotoText}>
                {videoRecorded ? 'Recorded' : 'Record Video'}
              </Text>
            </TouchableOpacity>
          </View>

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
    </View>
  );
};

export default AddEmployeeScreen;