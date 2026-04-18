import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { CURRENT_USER } from '@/data/mockData';

export default function NewCaseScreen() {
  const colors = useColors();
  const router = useRouter();
  const { addCase, addProperty, addResponsibleParty, properties, responsibleParties } = useApp();

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Springfield');
  const [state, setState] = useState('TX');
  const [zip, setZip] = useState('75001');
  const [parcelNumber, setParcelNumber] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [rpName, setRpName] = useState('');
  const [rpPhone, setRpPhone] = useState('');
  const [rpEmail, setRpEmail] = useState('');
  const [rpRelationship, setRpRelationship] = useState('Property Owner');

  const handleCreate = () => {
    if (!address.trim()) {
      Alert.alert('Required', 'Please enter the property address.');
      return;
    }
    if (!rpName.trim()) {
      Alert.alert('Required', 'Please enter the responsible party name.');
      return;
    }

    const property = addProperty({
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
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
      propertyId: property.id,
      responsiblePartyId: rp.id,
      inspectorId: CURRENT_USER.id,
      violations: [],
      notes: [],
      attachments: [],
      notices: [],
      statusHistory: [{ status: 'Open', date: new Date().toISOString() }],
    });

    Alert.alert('Case Created', `Case ${newCase.caseNumber || ''} has been created.`, [
      { text: 'OK', onPress: () => { router.back(); } },
    ]);
  };

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
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 60 : 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.banner, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <Feather name="info" size={14} color={colors.primary} />
          <Text style={[styles.bannerText, { color: colors.primary }]}>
            A case number will be automatically assigned upon creation.
          </Text>
        </View>

        <FormSection title="Property Address" colors={colors}>
          <FormField label="Street Address *" colors={colors}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. 123 Main Street"
              placeholderTextColor={colors.mutedForeground}
            />
          </FormField>
          <View style={styles.row}>
            <FormField label="City" colors={colors} style={{ flex: 2 }}>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor={colors.mutedForeground}
              />
            </FormField>
            <FormField label="State" colors={colors} style={{ flex: 1 }}>
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
            <FormField label="ZIP" colors={colors} style={{ flex: 1 }}>
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
            <FormField label="Parcel Number" colors={colors} style={{ flex: 1 }}>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                value={parcelNumber}
                onChangeText={setParcelNumber}
                placeholder="Optional"
                placeholderTextColor={colors.mutedForeground}
              />
            </FormField>
            <FormField label="Lot Number" colors={colors} style={{ flex: 1 }}>
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

        <FormSection title="Responsible Party" colors={colors}>
          <FormField label="Full Name *" colors={colors}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              value={rpName}
              onChangeText={setRpName}
              placeholder="Property owner or tenant name"
              placeholderTextColor={colors.mutedForeground}
            />
          </FormField>
          <View style={styles.row}>
            <FormField label="Phone" colors={colors} style={{ flex: 1 }}>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                value={rpPhone}
                onChangeText={setRpPhone}
                placeholder="(555) 000-0000"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
              />
            </FormField>
            <FormField label="Email" colors={colors} style={{ flex: 1 }}>
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
          <FormField label="Relationship" colors={colors}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              value={rpRelationship}
              onChangeText={setRpRelationship}
              placeholder="Property Owner"
              placeholderTextColor={colors.mutedForeground}
            />
          </FormField>
        </FormSection>

        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={handleCreate}
          activeOpacity={0.8}
        >
          <Feather name="check" size={18} color="#fff" />
          <Text style={styles.createBtnText}>Create Case</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function FormSection({ title, children, colors }: any) {
  return (
    <View style={styles.formSection}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

function FormField({ label, children, colors, style }: any) {
  return (
    <View style={[styles.field, style]}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 10 },
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
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
  },
  createBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
