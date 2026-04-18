import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { CURRENT_USER } from '@/data/mockData';

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 120 : 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: topPadding + 12 }]}>
        <Text style={[styles.title, { color: colors.primaryForeground }]}>Settings</Text>
      </View>

      <View style={{ padding: 16 }}>
        {/* Profile */}
        <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarText}>{CURRENT_USER.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.primaryForeground }]}>{CURRENT_USER.name}</Text>
            <Text style={[styles.profileRole, { color: 'rgba(255,255,255,0.7)' }]}>{CURRENT_USER.role} · {CURRENT_USER.badgeNumber}</Text>
            <Text style={[styles.profileDept, { color: 'rgba(255,255,255,0.6)' }]}>{CURRENT_USER.department}</Text>
          </View>
        </View>

        <SettingSection title="Account" colors={colors}>
          <SettingRow icon="user" label="Officer Name" value={CURRENT_USER.name} colors={colors} />
          <SettingRow icon="mail" label="Email" value={CURRENT_USER.email} colors={colors} />
          <SettingRow icon="phone" label="Phone" value={CURRENT_USER.phone || 'Not set'} colors={colors} />
          <SettingRow icon="shield" label="Badge Number" value={CURRENT_USER.badgeNumber || 'Not set'} colors={colors} />
        </SettingSection>

        <SettingSection title="Department" colors={colors}>
          <SettingRow icon="briefcase" label="Department" value={CURRENT_USER.department} colors={colors} />
          <SettingRow icon="map-pin" label="City" value="Springfield, TX 75001" colors={colors} />
          <SettingRow icon="file-text" label="Default Notice Template" value="Standard Notice" colors={colors} />
        </SettingSection>

        <SettingSection title="Notifications" colors={colors}>
          <ToggleRow icon="bell" label="Compliance Deadline Alerts" colors={colors} />
          <ToggleRow icon="clock" label="Reinspection Reminders" colors={colors} defaultOn={false} />
        </SettingSection>

        <SettingSection title="App" colors={colors}>
          <SettingRow icon="info" label="App Version" value="1.0.0" colors={colors} />
          <SettingRow icon="database" label="Data Mode" value="Local (Mock)" colors={colors} />
        </SettingSection>
      </View>
    </ScrollView>
  );
}

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

function SettingRow({ icon, label, value, colors }: any) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={14} color={colors.primary} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: colors.mutedForeground }]} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function ToggleRow({ icon, label, colors, defaultOn = true }: any) {
  const [enabled, setEnabled] = React.useState(defaultOn);
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  rowIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  rowValue: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
});
