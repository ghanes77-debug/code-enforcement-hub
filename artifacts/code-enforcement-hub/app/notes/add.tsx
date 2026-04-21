import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { useUserManagement } from '@/context/UserManagementContext';

export default function AddNoteScreen() {
  const colors = useColors();
  const router = useRouter();
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const { addNote } = useApp();
  const { currentUser, hasPermission } = useUserManagement();
  const [text, setText] = useState('');

  const handleSave = () => {
    if (!text.trim()) {
      Alert.alert('Required', 'Please enter a note.');
      return;
    }
    try {
      addNote(caseId!, text.trim(), currentUser.displayName);
      router.back();
    } catch (error) {
      Alert.alert('Permission Required', error instanceof Error ? error.message : 'You do not have permission to add notes.');
    }
  };

  if (!hasPermission('caseManagement', 'edit')) {
    return (
      <>
        <Stack.Screen options={{ title: 'Add Note', headerStyle: { backgroundColor: colors.primary } as any, headerTintColor: colors.primaryForeground }} />
        <View style={[styles.container, styles.restricted, { backgroundColor: colors.background }]}>
          <Feather name="lock" size={36} color={colors.mutedForeground} />
          <Text style={[styles.restrictedTitle, { color: colors.foreground }]}>Notes Restricted</Text>
          <Text style={[styles.restrictedText, { color: colors.mutedForeground }]}>Your current role can view case notes but cannot add them.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Note',
          headerStyle: { backgroundColor: colors.primary } as any,
          headerTintColor: colors.primaryForeground,
          headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} style={{ paddingHorizontal: 8 }}>
              <Feather name="check" size={20} color={colors.primaryForeground} />
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAwareScrollViewCompat
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Platform.OS === 'web' ? 60 : 40,
          ...(Platform.OS === 'web' && { maxWidth: 720, alignSelf: 'center' as const, width: '100%' }),
        }}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.noteBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.noteHeader}>
            <Feather name="user" size={14} color={colors.primary} />
            <Text style={[styles.authorText, { color: colors.primary }]}>{currentUser.displayName}</Text>
          </View>
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
          <TextInput
            style={[styles.textarea, { color: colors.foreground }]}
            value={text}
            onChangeText={setText}
            placeholder="Write your inspection note here..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={10}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Feather name="save" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>Save Note</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollViewCompat>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  restricted: { alignItems: 'center', justifyContent: 'center', padding: 28 },
  restrictedTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginTop: 12 },
  restrictedText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 19, marginTop: 6 },
  noteBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    minHeight: 200,
  },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  authorText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  dateText: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 12 },
  textarea: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    textAlignVertical: 'top',
    minHeight: 150,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 16,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
