import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Platform, TextInput, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useSettings, AppSettings, DEFAULT_SETTINGS } from '@/context/SettingsContext';

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, resetSettings } = useSettings();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  const initials = settings.inspectorName
    .split(' ')
    .map(n => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleReset = () =>
    Alert.alert(
      'Reset to Defaults',
      'This will restore all settings to their original values. Your case data will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetSettings },
      ]
    );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 120 : 100 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPadding + 12 }]}>
        <Text style={[styles.title, { color: colors.primaryForeground }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.6)' }]}>Changes save automatically</Text>
      </View>

      <View style={[{ padding: 16 }, Platform.OS === 'web' && { maxWidth: 720, alignSelf: 'center' as any, width: '100%' }]}>

        {/* ── Profile card ──────────────────────────────────────────── */}
        <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.primaryForeground }]}>{settings.inspectorName}</Text>
            <Text style={[styles.profileRole, { color: 'rgba(255,255,255,0.7)' }]}>
              {settings.inspectorRole} · {settings.inspectorBadge}
            </Text>
            <Text style={[styles.profileDept, { color: 'rgba(255,255,255,0.6)' }]}>
              {settings.inspectorDepartment}
            </Text>
          </View>
        </View>

        {/* ── Inspector ─────────────────────────────────────────────── */}
        <SettingSection title="Inspector" colors={colors}>
          <EditableRow
            icon="user"
            label="Full Name"
            value={settings.inspectorName}
            onSave={v => updateSettings({ inspectorName: v })}
            colors={colors}
            placeholder="Officer Name"
          />
          <EditableRow
            icon="shield"
            label="Badge Number"
            value={settings.inspectorBadge}
            onSave={v => updateSettings({ inspectorBadge: v })}
            colors={colors}
            placeholder="CE-000"
          />
          <EditableRow
            icon="briefcase"
            label="Role / Title"
            value={settings.inspectorRole}
            onSave={v => updateSettings({ inspectorRole: v })}
            colors={colors}
            placeholder="Inspector"
          />
          <EditableRow
            icon="phone"
            label="Phone"
            value={settings.inspectorPhone}
            onSave={v => updateSettings({ inspectorPhone: v })}
            colors={colors}
            placeholder="(555) 000-0000"
            keyboardType="phone-pad"
          />
          <EditableRow
            icon="mail"
            label="Email"
            value={settings.inspectorEmail}
            onSave={v => updateSettings({ inspectorEmail: v })}
            colors={colors}
            placeholder="name@city.gov"
            keyboardType="email-address"
            last
          />
        </SettingSection>

        {/* ── Department ────────────────────────────────────────────── */}
        <SettingSection title="Department" colors={colors}>
          <EditableRow
            icon="layers"
            label="Department Name"
            value={settings.inspectorDepartment}
            onSave={v => updateSettings({ inspectorDepartment: v })}
            colors={colors}
            placeholder="Code Enforcement Division"
          />
          <EditableRow
            icon="map-pin"
            label="City Name"
            value={settings.cityName}
            onSave={v => updateSettings({ cityName: v })}
            colors={colors}
            placeholder="City of Springfield"
          />
          <EditableRow
            icon="home"
            label="Department Display Name"
            value={settings.departmentName}
            onSave={v => updateSettings({ departmentName: v })}
            colors={colors}
            placeholder="Department of Code Enforcement"
          />
          <EditableRow
            icon="navigation"
            label="Office Address"
            value={settings.cityAddress}
            onSave={v => updateSettings({ cityAddress: v })}
            colors={colors}
            placeholder="100 Government Plaza, City, ST 00000"
          />
          <EditableRow
            icon="phone-call"
            label="Office Phone"
            value={settings.cityPhone}
            onSave={v => updateSettings({ cityPhone: v })}
            colors={colors}
            placeholder="(555) 000-1000"
            keyboardType="phone-pad"
            last
          />
        </SettingSection>

        {/* ── Compliance Defaults ───────────────────────────────────── */}
        <SettingSection title="Compliance Defaults" colors={colors}>
          <DayRow
            label="First Notice"
            color="#2563eb"
            value={settings.firstNoticeDays}
            onSave={v => updateSettings({ firstNoticeDays: v })}
            colors={colors}
          />
          <DayRow
            label="Second Notice"
            color="#d97706"
            value={settings.secondNoticeDays}
            onSave={v => updateSettings({ secondNoticeDays: v })}
            colors={colors}
          />
          <DayRow
            label="Final Notice"
            color="#dc2626"
            value={settings.finalNoticeDays}
            onSave={v => updateSettings({ finalNoticeDays: v })}
            colors={colors}
            last
          />
        </SettingSection>

        {/* ── Notice Language ───────────────────────────────────────── */}
        <SettingSection title="Notice Language" colors={colors}>
          <LangField
            label="First Notice — Opening"
            stageColor="#2563eb"
            value={settings.openingFirst}
            onSave={v => updateSettings({ openingFirst: v })}
            colors={colors}
          />
          <LangField
            label="Second Notice — Opening"
            stageColor="#d97706"
            value={settings.openingSecond}
            onSave={v => updateSettings({ openingSecond: v })}
            colors={colors}
          />
          <LangField
            label="Final Notice — Opening"
            stageColor="#dc2626"
            value={settings.openingFinal}
            onSave={v => updateSettings({ openingFinal: v })}
            colors={colors}
          />
          <LangField
            label="Standard Closing"
            stageColor={colors.primary}
            value={settings.closingDefault}
            onSave={v => updateSettings({ closingDefault: v })}
            colors={colors}
          />
          <LangField
            label="Final Notice — Closing"
            stageColor="#dc2626"
            value={settings.closingFinal}
            onSave={v => updateSettings({ closingFinal: v })}
            colors={colors}
            last
          />
        </SettingSection>

        {/* ── Notifications ─────────────────────────────────────────── */}
        <SettingSection title="Notifications" colors={colors}>
          <ToggleRow icon="bell"  label="Compliance Deadline Alerts"  colors={colors} defaultOn />
          <ToggleRow icon="clock" label="Reinspection Reminders"       colors={colors} last />
        </SettingSection>

        {/* ── App ───────────────────────────────────────────────────── */}
        <SettingSection title="App" colors={colors}>
          <StaticRow icon="info"     label="App Version"   value="1.0.0"          colors={colors} />
          <StaticRow icon="database" label="Storage Mode"  value="Local (AsyncStorage)" colors={colors} last />
        </SettingSection>

        {/* ── Reset ─────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.resetBtn, { borderColor: colors.destructive + '60' }]}
          onPress={handleReset}
          activeOpacity={0.7}
        >
          <Feather name="rotate-ccw" size={15} color={colors.destructive} />
          <Text style={[styles.resetBtnText, { color: colors.destructive }]}>Reset All Settings to Defaults</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function SettingSection({ title, children, colors }: any) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title.toUpperCase()}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

// ─── Editable text row ───────────────────────────────────────────────────────

function EditableRow({
  icon, label, value, onSave, colors, placeholder, keyboardType, last,
}: {
  icon: string; label: string; value: string; onSave: (v: string) => void;
  colors: any; placeholder?: string; keyboardType?: any; last?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  // Keep draft in sync if settings are reset externally
  React.useEffect(() => { setDraft(value); }, [value]);

  return (
    <View style={[
      styles.row,
      { borderBottomColor: colors.border },
      last && { borderBottomWidth: 0 },
    ]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon as any} size={14} color={colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        <TextInput
          style={[styles.rowInput, { color: colors.mutedForeground, borderBottomColor: colors.border }]}
          value={draft}
          onChangeText={setDraft}
          onBlur={() => { if (draft.trim()) onSave(draft.trim()); else setDraft(value); }}
          placeholder={placeholder}
          placeholderTextColor={colors.border}
          keyboardType={keyboardType}
          returnKeyType="done"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <Feather name="edit-2" size={12} color={colors.border} />
    </View>
  );
}

// ─── Compliance day row ──────────────────────────────────────────────────────

function DayRow({
  label, color, value, onSave, colors, last,
}: {
  label: string; color: string; value: number; onSave: (v: number) => void;
  colors: any; last?: boolean;
}) {
  const [draft, setDraft] = useState(String(value));
  React.useEffect(() => { setDraft(String(value)); }, [value]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n > 0) onSave(n);
    else setDraft(String(value));
  };

  return (
    <View style={[
      styles.dayRow,
      { borderBottomColor: colors.border },
      last && { borderBottomWidth: 0 },
    ]}>
      <View style={[styles.stageTagSmall, { backgroundColor: color + '18', borderColor: color + '40' }]}>
        <Text style={[styles.stageTagText, { color }]}>{label}</Text>
      </View>
      <View style={{ flex: 1 }} />
      <View style={[styles.dayInputWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <TextInput
          style={[styles.dayInput, { color: colors.foreground }]}
          value={draft}
          onChangeText={setDraft}
          onBlur={commit}
          keyboardType="number-pad"
          returnKeyType="done"
          maxLength={3}
          selectTextOnFocus
        />
      </View>
      <Text style={[styles.dayLabel, { color: colors.mutedForeground }]}>days</Text>
    </View>
  );
}

// ─── Notice language field ───────────────────────────────────────────────────

function LangField({
  label, stageColor, value, onSave, colors, last,
}: {
  label: string; stageColor: string; value: string; onSave: (v: string) => void;
  colors: any; last?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  React.useEffect(() => { setDraft(value); }, [value]);

  return (
    <View style={[
      styles.langField,
      { borderBottomColor: colors.border },
      last && { borderBottomWidth: 0 },
    ]}>
      <View style={styles.langHeader}>
        <View style={[styles.langDot, { backgroundColor: stageColor }]} />
        <Text style={[styles.langLabel, { color: colors.foreground }]}>{label}</Text>
        <Feather name="edit-2" size={11} color={colors.border} />
      </View>
      <TextInput
        style={[styles.langInput, {
          color: colors.mutedForeground,
          borderColor: colors.border,
          backgroundColor: colors.background,
        }]}
        value={draft}
        onChangeText={setDraft}
        onBlur={() => { if (draft.trim()) onSave(draft.trim()); else setDraft(value); }}
        multiline
        textAlignVertical="top"
        returnKeyType="default"
        autoCapitalize="sentences"
      />
    </View>
  );
}

// ─── Static row ──────────────────────────────────────────────────────────────

function StaticRow({ icon, label, value, colors, last }: any) {
  return (
    <View style={[
      styles.row,
      { borderBottomColor: colors.border },
      last && { borderBottomWidth: 0 },
    ]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={14} color={colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Toggle row ──────────────────────────────────────────────────────────────

function ToggleRow({ icon, label, colors, defaultOn = true, last }: any) {
  const [enabled, setEnabled] = useState(defaultOn);
  return (
    <View style={[
      styles.row,
      { borderBottomColor: colors.border },
      last && { borderBottomWidth: 0 },
    ]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={14} color={colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={setEnabled}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: { paddingHorizontal: 16, paddingBottom: 16 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 12, padding: 16, marginBottom: 20,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  profileRole: { fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 2 },
  profileDept: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, marginBottom: 8 },
  sectionCard: { borderRadius: 10, borderWidth: 1, overflow: 'hidden' },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 12,
  },
  rowIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  rowInput: {
    fontSize: 13, fontFamily: 'Inter_400Regular',
    borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 2, paddingHorizontal: 0,
    minHeight: 22,
  },
  rowValue: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 1 },

  dayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stageTagSmall: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  stageTagText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  dayInputWrap: {
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    minWidth: 52, alignItems: 'center',
  },
  dayInput: { fontSize: 16, fontFamily: 'Inter_700Bold', textAlign: 'center', minWidth: 32 },
  dayLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },

  langField: {
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, gap: 8,
  },
  langHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langDot: { width: 8, height: 8, borderRadius: 4 },
  langLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', flex: 1 },
  langInput: {
    fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20,
    borderWidth: 1, borderRadius: 8, padding: 10,
    minHeight: 80,
  },

  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1, borderRadius: 10, padding: 14,
    marginTop: 4,
  },
  resetBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
