import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Icon from '@/components/Icon';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { useUserManagement } from '@/context/UserManagementContext';

export default function NewCaseScreen() {
  const colors = useColors();
  const router = useRouter();
  const { addCase, addProperty, addResponsibleParty } = useApp();
  const { currentUser, hasPermission } = useUserManagement();

  // Property fields
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Springfield');
  const [state, setState] = useState('TX');
  const [zip, setZip] = useState('75001');
  const [parcelNumber, setParcelNumber] = useState('');
  const [lotNumber, setLotNumber] = useState('');

  // Responsible party fields
  const [rpName, setRpName] = useState('');
  const [rpPhone, setRpPhone] = useState('');
  const [rpEmail, setRpEmail] = useState('');
  const [rpRelationship, setRpRelationship] = useState('Property Owner');

  // General notes
  const [generalNotes, setGeneralNotes] = useState('');

  const [saving, setSaving] = useState(false);

  const handleCreate = () => {
    if (!address.trim()) {
      Alert.alert('Required Field', 'Please enter the property street address.');
      return;
    }
    if (!rpName.trim()) {
      Alert.alert('Required Field', 'Please enter the responsible party name.');
      return;
    }

    try {
      setSaving(true);

      const property = addProperty({
        address: address.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zip: zip.trim(),
        parcelNumber: parcelNumber.trim() || undefined,
        lotNumber: lotNumber.trim() || undefined,
      });

      const rp = addResponsibleParty({
        name: rpName.trim(),
        phone: rpPhone.trim() || undefined,
        email: rpEmail.trim() || undefined,
        relationship: rpRelationship.trim() || undefined,
      });

      const newCase = addCase({
        openedDate: new Date().toISOString(),
        status: 'Open',
        municipalityId: currentUser.municipalityId,
        propertyId: property.id,
        responsiblePartyId: rp.id,
        inspectorId: currentUser.id,
        generalNotes: generalNotes.trim() || undefined,
        violations: [],
        notes: [],
        attachments: [],
        notices: [],
        statusHistory: [{ status: 'Open', date: new Date().toISOString(), changedByUserId: currentUser.id, changedByDisplayName: currentUser.displayName }],
      });

      setSaving(false);
      router.replace(`/cases/${newCase.id}`);
    } catch (error) {
      setSaving(false);
      Alert.alert('Permission Required', error instanceof Error ? error.message : 'You do not have permission to create a case.');
    }
  };

  if (!hasPermission('caseManagement', 'edit')) {
    return (
      <>
        <Stack.Screen options={{ title: 'New Case', headerStyle: { backgroundColor: colors.primary } as any, headerTintColor: colors.primaryForeground }} />
        <View style={[styles.container, styles.restricted, { backgroundColor: colors.background }]}>
          <Icon name="lock" size={36} color={colors.mutedForeground} />
          <Text style={[styles.restrictedTitle, { color: colors.foreground }]}>Case Creation Restricted</Text>
          <Text style={[styles.restrictedText, { color: colors.mutedForeground }]}>Your current role can view cases but cannot create or edit them.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'New Case',
          headerStyle: { backgroundColor: colors.primary } as any,
          headerTintColor: colors.primaryForeground,
          headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
        }}
      />
      <KeyboardAwareScrollViewCompat
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Platform.OS === 'web' ? 80 : 48,
          ...(Platform.OS === 'web' && { maxWidth: 720, alignSelf: 'center' as const, width: '100%' }),
        }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        {/* Info Banner */}
        <View style={[styles.banner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '35' }]}>
          <Icon name="info" size={14} color={colors.primary} />
          <Text style={[styles.bannerText, { color: colors.primary }]}>
            Case number will be auto-assigned in the format CE-{new Date().getFullYear()}-####
          </Text>
        </View>

        {/* Property Address */}
        <FormSection title="Property Address" colors={colors}>
          <FormField label="Street Address *" colors={colors}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. 123 Main Street"
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="next"
            />
          </FormField>

          <View style={styles.row}>
            <FormField label="City" colors={colors} flex={2}>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor={colors.mutedForeground}
              />
            </FormField>
            <FormField label="State" colors={colors} flex={1}>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                value={state}
                onChangeText={setState}
                placeholder="TX"
                placeholderTextColor={colors.mutedForeground}
                maxLength={2}
                autoCapitalize="characters"
              />
            </FormField>
            <FormField label="ZIP" colors={colors} flex={1}>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                value={zip}
                onChangeText={setZip}
                placeholder="00000"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                maxLength={5}
              />
            </FormField>
          </View>

          <View style={styles.row}>
            <FormField label="Parcel Number" colors={colors} flex={1}>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                value={parcelNumber}
                onChangeText={setParcelNumber}
                placeholder="Optional"
                placeholderTextColor={colors.mutedForeground}
              />
            </FormField>
            <FormField label="Lot / Block" colors={colors} flex={1}>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                value={lotNumber}
                onChangeText={setLotNumber}
                placeholder="Optional"
                placeholderTextColor={colors.mutedForeground}
              />
            </FormField>
          </View>
        </FormSection>

        {/* Responsible Party */}
        <FormSection title="Responsible Party" colors={colors}>
          <FormField label="Full Name *" colors={colors}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              value={rpName}
              onChangeText={setRpName}
              placeholder="Owner, tenant, or agent name"
              placeholderTextColor={colors.mutedForeground}
            />
          </FormField>

          <View style={styles.row}>
            <FormField label="Phone" colors={colors} flex={1}>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                value={rpPhone}
                onChangeText={setRpPhone}
                placeholder="(555) 000-0000"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
              />
            </FormField>
            <FormField label="Email" colors={colors} flex={1}>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                value={rpEmail}
                onChangeText={setRpEmail}
                placeholder="email@example.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </FormField>
          </View>

          <FormField label="Relationship to Property" colors={colors}>
            <View style={styles.relationshipRow}>
              {['Property Owner', 'Tenant', 'Agent', 'Other'].map(rel => (
                <TouchableOpacity
                  key={rel}
                  style={[
                    styles.relChip,
                    {
                      borderColor: rpRelationship === rel ? colors.primary : colors.border,
                      backgroundColor: rpRelationship === rel ? colors.primary : colors.card,
                    },
                  ]}
                  onPress={() => setRpRelationship(rel)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.relChipText,
                    { color: rpRelationship === rel ? colors.primaryForeground : colors.mutedForeground },
                  ]}>
                    {rel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormField>
        </FormSection>

        {/* General Notes */}
        <FormSection title="General Notes" colors={colors}>
          <TextInput
            style={[
              styles.textarea,
              { borderColor: 'transparent', color: colors.foreground, backgroundColor: 'transparent' },
            ]}
            value={generalNotes}
            onChangeText={setGeneralNotes}
            placeholder="Initial observations, context, or any other details about this case..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </FormSection>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: saving ? colors.mutedForeground : colors.primary }]}
          onPress={handleCreate}
          activeOpacity={0.8}
          disabled={saving}
        >
          <Icon name={saving ? 'loader' : 'check'} size={18} color="#fff" />
          <Text style={styles.createBtnText}>{saving ? 'Creating...' : 'Create Case'}</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollViewCompat>
    </>
  );
}

function FormSection({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.formSection}>
      <View style={[styles.sectionTitleRow, { borderLeftColor: colors.accent }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function FormField({
  label, children, colors, flex,
}: {
  label: string; children: React.ReactNode; colors: any; flex?: number;
}) {
  return (
    <View style={[styles.field, flex ? { flex } : {}]}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  restricted: { alignItems: 'center', justifyContent: 'center', padding: 28 },
  restrictedTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginTop: 12 },
  restrictedText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19, marginTop: 6 },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
  },
  bannerText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 18 },

  formSection: { marginBottom: 20 },
  sectionTitleRow: {
    borderLeftWidth: 3,
    paddingLeft: 9,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  sectionCard: { borderRadius: 10, borderWidth: 1, padding: 14, gap: 12 },

  row: { flexDirection: 'row', gap: 10 },

  field: { gap: 5 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },

  textarea: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,
    minHeight: 90,
  },

  relationshipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  relChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  relChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },

  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 16,
    marginTop: 4,
  },
  createBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
