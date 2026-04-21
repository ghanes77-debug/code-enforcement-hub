import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  Platform, Image, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { useSettings } from '@/context/SettingsContext';
import { useUserManagement } from '@/context/UserManagementContext';
import { CaptureMethod, EvidencePersonSnapshot, FlightAttributionMode } from '@/types/models';

const todayInputValue = () => new Date().toISOString().slice(0, 10);
const toIsoDate = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return new Date().toISOString();
  const parsed = new Date(`${trimmed}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

export default function AddPhotoScreen() {
  const colors = useColors();
  const router = useRouter();
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const { getCaseById, getPropertyById, addAttachment } = useApp();
  const { settings } = useSettings();
  const { currentUser, currentActor, getApprovedPilots } = useUserManagement();

  const [captureMethod, setCaptureMethod] = useState<CaptureMethod | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  const [dateCaptured, setDateCaptured] = useState(todayInputValue());
  const [areaObserved, setAreaObserved] = useState('');
  const [observationNotes, setObservationNotes] = useState('');
  const [linkedViolationIds, setLinkedViolationIds] = useState<string[]>([]);
  const [useInNotice, setUseInNotice] = useState(true);
  const [flightAttributionMode, setFlightAttributionMode] = useState<FlightAttributionMode | null>(null);
  const [selectedPilotId, setSelectedPilotId] = useState('');
  const [flightDate, setFlightDate] = useState(todayInputValue());
  const [missionNotes, setMissionNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const enfCase = getCaseById(caseId ?? '');
  const property = enfCase ? getPropertyById(enfCase.propertyId) : undefined;
  const currentUserProfile: EvidencePersonSnapshot = {
    userId: currentUser.id,
    municipalityId: currentUser.municipalityId,
    name: currentUser.displayName,
    email: currentUser.email,
    role: currentUser.role,
    badgeNumber: currentUser.tdlrCeNumber,
    phone: currentUser.phone,
    department: currentUser.department,
  };
  const approvedPilots = getApprovedPilots(settings.municipalityId).filter(pilot => pilot.id !== currentUser.id);
  const selectedPilot = approvedPilots.find(pilot => pilot.id === selectedPilotId);
  const selectedPilotProfile: EvidencePersonSnapshot | undefined = selectedPilot ? {
    userId: selectedPilot.id,
    municipalityId: selectedPilot.municipalityId,
    name: selectedPilot.displayName,
    email: selectedPilot.email,
    role: selectedPilot.role,
    badgeNumber: selectedPilot.tdlrCeNumber,
    phone: selectedPilot.phone,
    department: selectedPilot.department,
  } : undefined;
  const isDroneEvidence = captureMethod === 'drone';
  const flightConductedBy = flightAttributionMode === 'self' ? currentUserProfile : selectedPilotProfile;

  const buildDataUri = async (asset: ImagePicker.ImagePickerAsset): Promise<string> => {
    if (asset.base64) {
      const mimeType = asset.mimeType ?? 'image/jpeg';
      return `data:${mimeType};base64,${asset.base64}`;
    }
    return asset.uri;
  };

  const pickFromLibrary = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please allow access to your photo library in Settings.');
          return;
        }
      }
      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const dataUri = await buildDataUri(asset);
        setUri(dataUri);
        if (!filename) {
          const name = asset.fileName ?? `evidence-${Date.now()}.jpg`;
          setFilename(name);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open photo library.');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Please allow camera access in Settings.');
          return;
        }
      }
      setLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const dataUri = await buildDataUri(asset);
        setUri(dataUri);
        if (!filename) {
          const name = asset.fileName ?? `evidence-${Date.now()}.jpg`;
          setFilename(name);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open camera.');
    } finally {
      setLoading(false);
    }
  };

  const toggleViolation = (violationId: string) => {
    setLinkedViolationIds(prev =>
      prev.includes(violationId)
        ? prev.filter(id => id !== violationId)
        : [...prev, violationId]
    );
  };

  const handleCaptureMethod = (method: CaptureMethod) => {
    setCaptureMethod(method);
    if (method === 'standard') {
      setFlightAttributionMode(null);
      setSelectedPilotId('');
      setMissionNotes('');
      setFlightDate(todayInputValue());
    }
  };

  const handleSave = () => {
    if (!captureMethod) {
      Alert.alert('Capture method required', 'Please choose Standard Photo/Video or Drone Flight Evidence.');
      return;
    }
    if (!uri) {
      Alert.alert('No media', 'Please select or capture media first.');
      return;
    }
    if (!areaObserved.trim()) {
      Alert.alert('Area observed required', 'Please enter the area observed for this evidence.');
      return;
    }
    if (isDroneEvidence && !flightAttributionMode) {
      Alert.alert('Flight attribution required', 'Please indicate who conducted the drone flight.');
      return;
    }
    if (isDroneEvidence && flightAttributionMode === 'authorized_pilot' && !selectedPilot) {
      Alert.alert('Pilot required', 'Please select the authorized pilot who conducted the flight.');
      return;
    }
    if (isDroneEvidence && !flightDate.trim()) {
      Alert.alert('Flight date required', 'Please enter the flight date.');
      return;
    }

    const name = filename.trim() || `evidence-${Date.now()}.jpg`;
    addAttachment(caseId!, {
      uri,
      filename: name,
      type: 'photo',
      createdAt: new Date().toISOString(),
      caption: observationNotes.trim() || areaObserved.trim(),
      captureMethod,
      dateCaptured: toIsoDate(dateCaptured),
      uploadedBy: currentUserProfile,
      areaObserved: areaObserved.trim(),
      observationNotes: observationNotes.trim() || undefined,
      linkedViolationIds,
      useInNotice,
      recordCreatedBy: currentUserProfile,
      flightConductedBy: isDroneEvidence ? flightConductedBy : undefined,
      flightAttributionMode: isDroneEvidence ? flightAttributionMode ?? undefined : undefined,
      flightDate: isDroneEvidence ? toIsoDate(flightDate) : undefined,
      missionNotes: isDroneEvidence ? missionNotes.trim() || undefined : undefined,
      createdByUserId: currentActor.userId,
      createdByDisplayName: currentActor.displayName,
    });
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Evidence',
          headerStyle: { backgroundColor: colors.primary } as any,
          headerTintColor: colors.primaryForeground,
          headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
          headerRight: () => uri ? (
            <TouchableOpacity onPress={handleSave} style={{ paddingHorizontal: 8 }}>
              <Feather name="check" size={20} color={colors.primaryForeground} />
            </TouchableOpacity>
          ) : null,
        }}
      />
      <KeyboardAwareScrollViewCompat
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Platform.OS === 'web' ? 60 : 40,
          ...(Platform.OS === 'web' && { maxWidth: 720, alignSelf: 'center' as const, width: '100%' }),
        }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        {enfCase && (
          <View style={[styles.contextBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
            <Feather name="folder" size={14} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.contextCase, { color: colors.primary }]}>{enfCase.caseNumber}</Text>
              {property && (
                <Text style={[styles.contextAddr, { color: colors.primary + 'aa' }]} numberOfLines={1}>
                  {property.address}, {property.city}
                </Text>
              )}
            </View>
          </View>
        )}

        <Text style={[styles.label, { color: colors.mutedForeground }]}>Capture Method Required</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <SelectionOption
            label="Standard Photo/Video"
            subtitle="Ground-level or uploaded media without drone flight details"
            selected={captureMethod === 'standard'}
            onPress={() => handleCaptureMethod('standard')}
            colors={colors}
          />
          <SelectionOption
            label="Drone Flight Evidence"
            subtitle="Aerial evidence captured during an authorized drone flight"
            selected={captureMethod === 'drone'}
            onPress={() => handleCaptureMethod('drone')}
            colors={colors}
            last
          />
        </View>

        {loading ? (
          <View style={[styles.previewPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>Loading media…</Text>
          </View>
        ) : uri ? (
          <View style={styles.previewWrapper}>
            <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />
            <TouchableOpacity
              style={[styles.changeBtn, { backgroundColor: 'rgba(0,0,0,0.55)' }]}
              onPress={pickFromLibrary}
              activeOpacity={0.8}
            >
              <Feather name="refresh-cw" size={14} color="#fff" />
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.previewPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Feather name="image" size={48} color={colors.border} />
            <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>No media selected</Text>
            <Text style={[styles.placeholderHint, { color: colors.mutedForeground }]}>Use the buttons below to add evidence media</Text>
          </View>
        )}

        <View style={styles.sourceRow}>
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={[styles.sourceBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={takePhoto}
              activeOpacity={0.75}
            >
              <Feather name="camera" size={22} color={colors.primary} />
              <Text style={[styles.sourceBtnText, { color: colors.foreground }]}>Capture Media</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.sourceBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
              Platform.OS === 'web' && { flex: 1 },
            ]}
            onPress={pickFromLibrary}
            activeOpacity={0.75}
          >
            <Feather name="image" size={22} color={colors.primary} />
            <Text style={[styles.sourceBtnText, { color: colors.foreground }]}>
              {Platform.OS === 'web' ? 'Choose Media' : 'Choose from Library'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>File Name</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={filename}
            onChangeText={setFilename}
            placeholder="evidence-001.jpg"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>Date Captured</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={dateCaptured}
            onChangeText={setDateCaptured}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>Uploaded By</Text>
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Feather name="user" size={15} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>{currentUserProfile.name}</Text>
            <Text style={[styles.summarySubtitle, { color: colors.mutedForeground }]}>
              {currentUserProfile.role} · {currentUserProfile.badgeNumber || currentUserProfile.department}
            </Text>
          </View>
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>Area Observed Required</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={areaObserved}
            onChangeText={setAreaObserved}
            placeholder="Front yard, rear alley, roofline…"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>Observation Notes</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <TextInput
            style={[styles.textarea, { color: colors.foreground }]}
            value={observationNotes}
            onChangeText={setObservationNotes}
            placeholder="Describe what this evidence shows…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>Linked Violations</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          {enfCase && enfCase.violations.length > 0 ? enfCase.violations.map(violation => (
            <TouchableOpacity
              key={violation.id}
              style={[styles.violationRow, { borderBottomColor: colors.border }]}
              onPress={() => toggleViolation(violation.id)}
              activeOpacity={0.75}
            >
              <Feather
                name={linkedViolationIds.includes(violation.id) ? 'check-square' : 'square'}
                size={18}
                color={linkedViolationIds.includes(violation.id) ? colors.primary : colors.mutedForeground}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.violationTitle, { color: colors.foreground }]}>{violation.violationTitle}</Text>
                <Text style={[styles.violationMeta, { color: colors.mutedForeground }]}>Sec. {violation.ordinanceSectionNumber}</Text>
              </View>
            </TouchableOpacity>
          )) : (
            <Text style={[styles.pilotEmptyText, { color: colors.mutedForeground }]}>No violations available to link.</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.noticeFlag, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setUseInNotice(prev => !prev)}
          activeOpacity={0.75}
        >
          <Feather name={useInNotice ? 'check-square' : 'square'} size={18} color={useInNotice ? colors.primary : colors.mutedForeground} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Use in Notice</Text>
            <Text style={[styles.summarySubtitle, { color: colors.mutedForeground }]}>Make this evidence available when preparing notices.</Text>
          </View>
        </TouchableOpacity>

        {isDroneEvidence && (
          <>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Flight Attribution Required</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <SelectionOption
                label="I conducted the flight"
                subtitle={`${currentUserProfile.name} · ${currentUserProfile.badgeNumber || currentUserProfile.role}`}
                selected={flightAttributionMode === 'self'}
                onPress={() => {
                  setFlightAttributionMode('self');
                  setSelectedPilotId('');
                }}
                colors={colors}
              />
              <SelectionOption
                label="Another authorized pilot conducted the flight"
                subtitle="Select from this municipality’s approved pilot list"
                selected={flightAttributionMode === 'authorized_pilot'}
                onPress={() => setFlightAttributionMode('authorized_pilot')}
                colors={colors}
                last={flightAttributionMode !== 'authorized_pilot'}
              />
              {flightAttributionMode === 'authorized_pilot' && (
                <View style={styles.pilotList}>
                  {approvedPilots.length === 0 ? (
                    <Text style={[styles.pilotEmptyText, { color: colors.mutedForeground }]}>No approved pilots are configured for this municipality.</Text>
                  ) : approvedPilots.map(pilot => (
                    <TouchableOpacity
                      key={pilot.id}
                      style={[
                        styles.pilotRow,
                        { borderColor: selectedPilotId === pilot.id ? colors.primary : colors.border },
                        selectedPilotId === pilot.id && { backgroundColor: colors.primary + '10' },
                      ]}
                      onPress={() => setSelectedPilotId(pilot.id)}
                      activeOpacity={0.75}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pilotName, { color: colors.foreground }]}>{pilot.displayName}</Text>
                        <Text style={[styles.pilotMeta, { color: colors.mutedForeground }]}> 
                          {pilot.role} · {pilot.certificationId || pilot.tdlrCeNumber || pilot.department}
                        </Text>
                      </View>
                      {selectedPilotId === pilot.id && <Feather name="check-circle" size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>Flight Date Required</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={flightDate}
                onChangeText={setFlightDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>Mission Notes</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <TextInput
                style={[styles.textarea, { color: colors.foreground }]}
                value={missionNotes}
                onChangeText={setMissionNotes}
                placeholder="Flight path, altitude, mission purpose, or weather context…"
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: uri ? colors.primary : colors.border }]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={!uri}
        >
          <Feather name="save" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>Save Evidence</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollViewCompat>
    </>
  );
}

function SelectionOption({ label, subtitle, selected, onPress, colors, last }: any) {
  return (
    <TouchableOpacity
      style={[
        styles.selectionOption,
        { borderBottomColor: colors.border },
        last && { borderBottomWidth: 0 },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Feather name={selected ? 'check-circle' : 'circle'} size={18} color={selected ? colors.primary : colors.mutedForeground} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.selectionTitle, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.selectionSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contextBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 9, padding: 12, marginBottom: 16,
  },
  contextCase: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  contextAddr: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  previewWrapper: {
    borderRadius: 12, overflow: 'hidden', marginBottom: 14, position: 'relative',
  },
  previewImage: { width: '100%', height: 240 },
  changeBtn: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
  },
  changeBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  previewPlaceholder: {
    height: 200, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', gap: 10,
    marginBottom: 14,
  },
  placeholderText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  placeholderHint: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  sourceRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  sourceBtn: {
    flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1, borderRadius: 10, paddingVertical: 16,
  },
  sourceBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  label: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  card: {
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 14,
    paddingVertical: 10, marginBottom: 14,
  },
  input: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  textarea: {
    fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21,
    minHeight: 70, textAlignVertical: 'top',
  },
  selectionOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  selectionTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  selectionSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14,
  },
  summaryTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  summarySubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  violationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  violationTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  violationMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  noticeFlag: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14,
  },
  pilotList: { gap: 8, marginTop: 10 },
  pilotRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 9, padding: 10,
  },
  pilotName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  pilotMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  pilotEmptyText: { fontSize: 12, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 10, padding: 15,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
