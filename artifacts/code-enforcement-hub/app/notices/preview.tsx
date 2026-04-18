import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export default function NoticePreviewScreen() {
  const colors = useColors();
  const router = useRouter();
  const { content, stage } = useLocalSearchParams<{ content: string; stage: string; caseId: string }>();

  const decodedContent = content ? decodeURIComponent(content) : '';

  const handleExport = () => {
    Alert.alert(
      'Export Notice',
      'PDF export will be available in a future update. For now, you can print this notice from your device.',
      [{ text: 'OK' }]
    );
  };

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
        {/* Stage Badge */}
        <View style={[styles.stageBanner, { backgroundColor: colors.statusNoticeSent + '15', borderBottomColor: colors.border }]}>
          <Feather name="file-text" size={14} color={colors.statusNoticeSent} />
          <Text style={[styles.stageText, { color: colors.statusNoticeSent }]}>{stage}</Text>
          <View style={styles.spacer} />
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: colors.primary }]}
            onPress={handleExport}
            activeOpacity={0.8}
          >
            <Feather name="download" size={14} color="#fff" />
            <Text style={styles.exportBtnText}>Export PDF</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'web' ? 60 : 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Letter Paper Style */}
          <View style={[styles.letterPaper, { backgroundColor: '#fff', shadowColor: '#000' }]}>
            <View style={[styles.letterHeader, { borderBottomColor: colors.border, backgroundColor: colors.primary }]}>
              <Text style={styles.letterCityName}>CITY OF SPRINGFIELD</Text>
              <Text style={styles.letterDept}>DEPARTMENT OF CODE ENFORCEMENT</Text>
              <Text style={styles.letterAddr}>100 Government Plaza · Springfield, TX 75001 · (555) 200-1000</Text>
            </View>
            <View style={styles.letterBody}>
              <Text style={[styles.letterContent, { color: '#1a1a1a' }]}>{decodedContent.replace('CITY OF SPRINGFIELD\nDEPARTMENT OF CODE ENFORCEMENT\n\n', '')}</Text>
            </View>
            <View style={[styles.letterFooter, { borderTopColor: colors.border }]}>
              <Text style={[styles.footerText, { color: '#888' }]}>
                This is an official notice from the City of Springfield Code Enforcement Division.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.dismiss()}
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
  stageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  stageText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  spacer: { flex: 1 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
  },
  exportBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  letterPaper: {
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  letterHeader: {
    padding: 16,
    alignItems: 'center',
    gap: 3,
  },
  letterCityName: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    letterSpacing: 2,
  },
  letterDept: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
  },
  letterAddr: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  letterBody: { padding: 20 },
  letterContent: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  letterFooter: {
    borderTopWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 16,
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
