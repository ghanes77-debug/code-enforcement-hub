import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from '@/components/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSession } from '@/context/SessionContext';
import { DEFAULT_USERS } from '@/data/defaultUsers';
import { useColors } from '@/hooks/useColors';

const DEMO_ACCOUNTS = DEFAULT_USERS.map(u => ({
  username: u.username,
  displayName: u.displayName,
  role: u.role,
  municipality: u.municipality,
}));

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useSession();

  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await login(username, pin);
      if (!result.success) {
        setError(result.error ?? 'Login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectDemo = (un: string) => {
    setUsername(un);
    setPin('0000');
    setShowDemo(false);
    setError('');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={[styles.sealRing, { borderColor: colors.accent }]}>
            <Icon name="shield-check" size={36} color={colors.accent} />
          </View>
          <Text style={[styles.appTitle, { color: colors.primaryForeground }]}>
            Code Enforcement Hub
          </Text>
          <Text style={[styles.appSubtitle, { color: 'rgba(255,255,255,0.65)' }]}>
            Municipal Code Enforcement Platform
          </Text>
        </View>

        {/* ── Form card ──────────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>Sign In</Text>
          <Text style={[styles.formSubtitle, { color: colors.mutedForeground }]}>
            Enter your credentials to access the platform
          </Text>

          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Username</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Icon name="user" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="username"
                placeholderTextColor={colors.mutedForeground}
                value={username}
                onChangeText={t => { setUsername(t); setError(''); }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* PIN */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>PIN</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Icon name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="••••"
                placeholderTextColor={colors.mutedForeground}
                value={pin}
                onChangeText={t => { setPin(t.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                keyboardType="numeric"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>
          </View>

          {/* Error */}
          {!!error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive + '40' }]}>
              <Icon name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          )}

          {/* Sign In button */}
          <TouchableOpacity
            style={[styles.signInBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <>
                <Icon name="log-in" size={16} color={colors.primaryForeground} />
                <Text style={[styles.signInBtnText, { color: colors.primaryForeground }]}>Sign In</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Demo quick-select ───────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.demoToggle}
          onPress={() => setShowDemo(v => !v)}
          activeOpacity={0.7}
        >
          <Icon
            name={showDemo ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.mutedForeground}
          />
          <Text style={[styles.demoToggleText, { color: colors.mutedForeground }]}>
            Demo accounts (PIN: 0000)
          </Text>
        </TouchableOpacity>

        {showDemo && (
          <View style={[styles.demoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {DEMO_ACCOUNTS.map((acc, i) => (
              <TouchableOpacity
                key={acc.username}
                style={[
                  styles.demoRow,
                  i < DEMO_ACCOUNTS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
                onPress={() => selectDemo(acc.username)}
                activeOpacity={0.7}
              >
                <View style={[styles.demoAvatar, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.demoAvatarText, { color: colors.primary }]}>
                    {acc.displayName.split(' ').map(n => n[0] ?? '').join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.demoInfo}>
                  <Text style={[styles.demoName, { color: colors.foreground }]}>{acc.displayName}</Text>
                  <Text style={[styles.demaMeta, { color: colors.mutedForeground }]}>
                    {acc.role} · {acc.municipality}
                  </Text>
                  <Text style={[styles.demoUsername, { color: colors.primary }]}>@{acc.username}</Text>
                </View>
                <Icon name="arrow-right" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  hero: {
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 36,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  sealRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  appTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 20,
  },
  fieldGroup: { marginBottom: 14 },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    paddingVertical: 13,
    marginTop: 4,
  },
  signInBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  demoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: 8,
  },
  demoToggleText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  demoCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  demoAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoAvatarText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  demoInfo: { flex: 1 },
  demoName: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 1,
  },
  demaMeta: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginBottom: 1,
  },
  demoUsername: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
});
