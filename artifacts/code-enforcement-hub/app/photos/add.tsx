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
import { EvidencePersonSnapshot, FlightAttributionMode } from '@/types/models';

export default function AddPhotoScreen() {
  const colors = useColors();
  const router = useRouter();
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const { getCaseById, getPropertyById, addAttachment } = useApp();
  const { settings } = useSettings();

  const [uri, setUri] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  const [caption, setCaption] = useState('');
  const [flightAttributionMode, setFlightAttributionMode] = useState<FlightAttributionMode | null>(null);
  const [selectedPilotId, setSelectedPilotId] = useState('');
  const [loading, setLoading] = useState(false);

  const enfCase = getCaseById(caseId ?? '');
  const property = enfCase ? getPropertyById(enfCase.propertyId) : undefined;
  const currentUserProfile: EvidencePersonSnapshot = {
    userId: 'current-user',
    municipalityId: settings.municipalityId,
    name: settings.inspectorName,
    email: settings.inspectorEmail,
    role: settings.inspectorRole,
    badgeNumber: settings.inspectorBadge,
    phone: settings.inspectorPhone,
    department: settings.inspectorDepartment,
  };
  const approvedPilots = settings.approvedPilots.filter(
    pilot =>
      pilot.municipalityId === settings.municipalityId &&
      pilot.approvedForAerialEvidence &&
      pilot.email.toLowerCase() !== currentUserProfile.email.toLowerCase()
  );
  const selectedPilot = approvedPilots.find(pilot => pilot.userId === selectedPilotId);
  const flightConductedBy = flightAttributionMode === 'self' ? currentUserProfile : selectedPilot;

  const buildDataUri = async (asset: ImagePicker.ImagePickerAsset): Promise<string> => {
    if (asset.base64) {
      const mimeType = asset.mimeType ?? 'image/jpeg';
      return `data:${mimeType};base64,${asset.base64}`;
    }
    // Fallback: use uri directly (won't persist on web across refresh, fine for now)
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
          const name = asset.fileName ?? `photo-${Date.now()}.jpg`;
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
          const name = asset.fileName ?? `photo-${Date.now()}.jpg`;
          setFilename(name);
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Could not open camera.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!uri) {
      Alert.alert('No photo', 'Please select or capture a photo first.');
      return;
    }
    if (!flightAttributionMode) {
      Alert.alert('Flight attribution required', 'Please indicate who conducted the aerial evidence flight.');
      return;
    }
    if (flightAttributionMode === 'authorized_pilot' && !selectedPilot) {
      Alert.alert('Pilot required', 'Please select the authorized pilot who conducted the flight.');
      return;
    }
    const name = filename.trim() || `photo-${Date.now()}.jpg`;
    addAttachment(caseId!, {
      uri,
      filename: name,
      type: 'photo',
      createdAt: new Date().toISOString(),
      caption: caption.trim() || undefined,
      recordCreatedBy: currentUserProfile,
      flightConductedBy,
      flightAttributionMode,
    });
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Photo',
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
        {/* Case context */}
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

        {/* Photo preview / placeholder */}
        {loading ? (
          <View style={[styles.previewPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>Loading photo…</Text>
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
            <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>
              No photo selected
            </Text>
            <Text style={[styles.placeholderHint, { color: colors.mutedForeground }]}>
              Use the buttons below to add a photo
            </Text>
          </View>
        )}

        {/* Source buttons */}
        <View style={styles.sourceRow}>
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={[styles.sourceBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={takePhoto}
              activeOpacity={0.75}
            >
              <Feather name="camera" size={22} color={colors.primary} />
              <Text style={[styles.sourceBtnText, { color: colors.foreground }]}>Take Photo</Text>
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
              {Platform.OS === 'web' ? 'Choose Photo' : 'Choose from Library'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* File name */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>File Name</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={filename}
            onChangeText={setFilename}
            placeholder="photo-001.jpg"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        {/* Caption */}
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Caption (optional)</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[styles.textarea, { color: colors.foreground }]}
            value={caption}
            onChangeText={setCaption}
            placeholder="Describe what this photo shows…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>Flight Attribution Required</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AttributionOption
            label="I conducted the flight"
            subtitle={`${currentUserProfile.name} · ${currentUserProfile.badgeNumber || currentUserProfile.role}`}
            selected={flightAttributionMode === 'self'}
            onPress={() => {
              setFlightAttributionMode('self');
              setSelectedPilotId('');
            }}
            colors={colors}
          />
          <AttributionOption
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
                <Text style={[styles.pilotEmptyText, { color: colors.mutedForeground }]}>
                  No approved pilots are configured for this municipality.
                </Text>
              ) : approvedPilots.map(pilot => (
                <TouchableOpacity
                  key={pilot.userId}
                  style={[
                    styles.pilotRow,
                    { borderColor: selectedPilotId === pilot.userId ? colors.primary : colors.border },
                    selectedPilotId === pilot.userId && { backgroundColor: colors.primary + '10' },
                  ]}
                  onPress={() => setSelectedPilotId(pilot.userId)}
                  activeOpacity={0.75}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pilotName, { color: colors.foreground }]}>{pilot.name}</Text>
                    <Text style={[styles.pilotMeta, { color: colors.mutedForeground }]}>
                      {pilot.role} · {pilot.badgeNumber || pilot.pilotCertificate || pilot.department}
                    </Text>
                  </View>
                  {selectedPilotId === pilot.userId && (
                    <Feather name="check-circle" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Inspector credit */}
        <View style={styles.creditRow}>
          <Feather name="user" size={13} color={colors.mutedForeground} />
          <Text style={[styles.creditText, { color: colors.mutedForeground }]}>
            Record created by {currentUserProfile.name} · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: uri ? colors.primary : colors.border }]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={!uri}
        >
          <Feather name="save" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>Save Photo</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollViewCompat>
    </>
  );
}

function AttributionOption({ label, subtitle, selected, onPress, colors, last }: any) {
  return (
    <TouchableOpacity
      style={[
        styles.attributionOption,
        { borderBottomColor: colors.border },
        last && { borderBottomWidth: 0 },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Feather name={selected ? 'check-circle' : 'circle'} size={18} color={selected ? colors.primary : colors.mutedForeground} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.attributionTitle, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.attributionSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
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
  placeholderHint: { fontSize: 12, fontFamily: 'Inter_400Regular' },

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

  attributionOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  attributionTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  attributionSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  pilotList: { gap: 8, marginTop: 10 },
  pilotRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 9, padding: 10,
  },
  pilotName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  pilotMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  pilotEmptyText: { fontSize: 12, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },

  creditRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  creditText: { fontSize: 12, fontFamily: 'Inter_400Regular' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 10, padding: 15,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
