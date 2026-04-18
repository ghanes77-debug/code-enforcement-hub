import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

export default function NoticePreviewScreen() {
  const colors = useColors();
  const router = useRouter();
  const { caseId, noticeId, content: rawContent, stage: rawStage } =
    useLocalSearchParams<{ caseId?: string; noticeId?: string; content?: string; stage?: string }>();

  const { getCaseById } = useApp();

  // Prefer loading from stored notice; fall back to URL-encoded content
  const enfCase = caseId ? getCaseById(caseId) : undefined;
  const storedNotice = enfCase?.notices.find(n => n.id === noticeId);

  const stage   = storedNotice?.stage ?? rawStage ?? '';
  const content = storedNotice?.content ?? (rawContent ? decodeURIComponent(rawContent) : '');

  const stageColor: Record<string, string> = {
    'First Notice':  '#2563eb',
    'Second Notice': '#d97706',
    'Final Notice':  '#dc2626',
  };
  const color = stageColor[stage] ?? colors.primary;

  const handleExport = () =>
    Alert.alert(
      'Export Notice',
      'PDF export will be available in a future update. For now you can print this page from your device.',
      [{ text: 'OK' }]
    );

  if (!content) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen
          options={{
            title: 'Notice Preview',
            headerStyle: { backgroundColor: colors.primary } as any,
            headerTintColor: colors.primaryForeground,
            headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
          }}
        />
        <Feather name="file-text" size={36} color={colors.mutedForeground} />
        <Text style={[styles.noContentText, { color: colors.mutedForeground }]}>Notice content not found.</Text>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold', marginTop: 12 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notice Preview',
          headerStyle: { backgroundColor: colors.primary } as any,
          headerTintColor: colors.primaryForeground,
          headerTitleStyle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
          headerRight: () => (
            <TouchableOpacity onPress={handleExport} style={{ paddingHorizontal: 8 }}>
              <Feather name="download" size={20} color={colors.primaryForeground} />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>

        {/* Stage banner */}
        <View style={[styles.stageBanner, { backgroundColor: color + '12', borderBottomColor: colors.border }]}>
          <Feather name="file-text" size={14} color={color} />
          <Text style={[styles.stageText, { color }]}>{stage}</Text>
          {storedNotice && (
            <Text style={[styles.stageDate, { color: colors.mutedForeground }]}>
              {new Date(storedNotice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: colors.primary }]}
            onPress={handleExport}
            activeOpacity={0.8}
          >
            <Feather name="download" size={13} color="#fff" />
            <Text style={styles.exportBtnText}>Export PDF</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 60 : 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Letter paper */}
          <View style={[styles.letterPaper, { backgroundColor: '#fff' }]}>

            {/* Letterhead */}
            <View style={[styles.letterhead, { backgroundColor: colors.primary }]}>
              <Text style={styles.cityName}>CITY OF SPRINGFIELD</Text>
              <Text style={styles.deptName}>DEPARTMENT OF CODE ENFORCEMENT</Text>
              <Text style={styles.deptAddr}>100 Government Plaza  ·  Springfield, TX 75001  ·  (555) 200-1000</Text>
            </View>

            {/* Notice type ribbon */}
            <View style={[styles.noticeRibbon, { backgroundColor: color + '18', borderBottomColor: color + '40' }]}>
              <Text style={[styles.noticeRibbonText, { color }]}>
                NOTICE OF VIOLATION — {stage.toUpperCase()}
              </Text>
            </View>

            {/* Body */}
            <View style={styles.letterBody}>
              <Text style={styles.letterContent}>{content}</Text>
            </View>

            {/* Footer */}
            <View style={[styles.letterFooter, { borderTopColor: '#e0e0e0' }]}>
              <Text style={styles.footerText}>
                This is an official notice from the City of Springfield Code Enforcement Division.
                Retain for your records.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Feather name="check" size={18} color="#fff" />
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  noContentText: { fontSize: 14, fontFamily: 'Inter_500Medium', marginTop: 12 },

  stageBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1,
  },
  stageText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  stageDate: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 7,
  },
  exportBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  letterPaper: {
    borderRadius: 4, overflow: 'hidden', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },

  letterhead: { padding: 20, alignItems: 'center', gap: 4 },
  cityName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 2.5 },
  deptName: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.85)', letterSpacing: 1 },
  deptAddr: { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.65)', marginTop: 4 },

  noticeRibbon: {
    paddingVertical: 8, paddingHorizontal: 20,
    borderBottomWidth: 1, alignItems: 'center',
  },
  noticeRibbonText: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 1 },

  letterBody: { padding: 22 },
  letterContent: {
    fontSize: 13, fontFamily: 'Inter_400Regular',
    lineHeight: 22, color: '#1a1a1a',
  },

  letterFooter: { borderTopWidth: 1, padding: 14, alignItems: 'center' },
  footerText: { fontSize: 10, fontFamily: 'Inter_400Regular', color: '#888', textAlign: 'center', lineHeight: 16 },

  doneBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 10, padding: 15,
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
