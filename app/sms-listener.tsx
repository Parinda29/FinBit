import React, { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '../constants/colors';
import {
  importStatementPdfFile,
  ParsedFinanceSms,
  createDraftFromParsedSms,
  importSmsAsTransaction,
  requestSmsPermission,
  scanFinanceSms,
  StatementProvider,
  SmsImportDraft,
  SmsPermissionState,
} from '../services/smsService';

const CATEGORY_OPTIONS = ['Food', 'Bills', 'Travel', 'Shopping', 'Salary', 'Transfer', 'SMS Import'];
const STATEMENT_PROVIDER_OPTIONS: { value: StatementProvider; label: string }[] = [
  { value: 'esewa', label: 'eSewa' },
  { value: 'khalti', label: 'Khalti' },
  { value: 'bank', label: 'Bank' },
  { value: 'other', label: 'Other' },
];

const formatAmount = (amount: number, currencyCode: string): string => {
  const symbol = currencyCode === 'NPR' ? 'NPR ' : currencyCode === 'INR' ? 'INR ' : 'Rs ';
  return `${symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (date: Date): string =>
  date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const toEditableDate = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const fromEditableDate = (value: string, fallbackDate: Date): Date => {
  const normalized = value.trim().replace(' ', 'T');
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return fallbackDate;
};

const getTypeBadgeStyle = (type: 'income' | 'expense') =>
  type === 'income' ? styles.badgeIncome : styles.badgeExpense;

const getTypeBadgeTextStyle = (type: 'income' | 'expense') =>
  type === 'income' ? styles.typeBadgeTextIncome : styles.typeBadgeTextExpense;

const getAmountTextStyle = (type: 'income' | 'expense') =>
  type === 'income' ? styles.amountIncome : styles.amountExpense;

export default function SmsListenerScreen() {
  const router = useRouter();
  const [importMode, setImportMode] = useState<'sms' | 'statement'>('sms');
  const [smsTypeFilter, setSmsTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [permissionState, setPermissionState] = useState<SmsPermissionState>(
    Platform.OS === 'android' ? 'denied' : 'unsupported'
  );
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [items, setItems] = useState<ParsedFinanceSms[]>([]);
  const [importedSmsIds, setImportedSmsIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<ParsedFinanceSms | null>(null);
  const [draft, setDraft] = useState<SmsImportDraft | null>(null);
  const [draftDateInput, setDraftDateInput] = useState('');

  const [statementProvider, setStatementProvider] = useState<StatementProvider>('esewa');
  const [statementFile, setStatementFile] = useState<{
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
  } | null>(null);

  // Define colors for dynamic theming
  const colors = {
    card: Colors.white,
    border: Colors.border,
  };

  const emptyStateMessage = useMemo(() => {
    if (permissionState === 'denied') {
      return 'SMS permission is required to read inbox messages and prepare transaction imports.';
    }
    if (items.length > 0) {
      return 'No SMS matches this filter. Switch between All, Income, and Expense.';
    }
    if (items.length === 0) {
      return 'No finance-related SMS found yet. Tap Scan SMS to load messages from your inbox.';
    }
    return null;
  }, [items.length, permissionState]);

  const filteredSmsItems = useMemo(() => {
    if (smsTypeFilter === 'all') return items;
    return items.filter((item) => item.type === smsTypeFilter);
  }, [items, smsTypeFilter]);

  const scanButtonLabel = useMemo(() => {
    if (loading) return 'Scanning SMS...';
    if (items.length > 0) return 'Scan Again';
    return 'Scan SMS Inbox';
  }, [items.length, loading]);

  const getImportKey = (item: ParsedFinanceSms): string => item.messageId || item.id;

  const isImported = (item: ParsedFinanceSms): boolean => {
    return importedSmsIds.includes(getImportKey(item));
  };

  const openConfirmModal = (item: ParsedFinanceSms) => {
    if (isImported(item)) {
      setSuccessMessage('This SMS has already been imported.');
      return;
    }

    const initialDraft = createDraftFromParsedSms(item);
    setSelectedItem(item);
    setDraft({ ...initialDraft, title: '' });
    setDraftDateInput(toEditableDate(initialDraft.date));
  };

  const closeConfirmModal = () => {
    setSelectedItem(null);
    setDraft(null);
    setDraftDateInput('');
  };

  const onScanPress = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const permission = await requestSmsPermission();
      setPermissionState(permission);

      if (permission !== 'granted') {
        setErrorMessage(
          'SMS permission denied. Allow permissions in app settings and try again.'
        );
        return;
      }

      const parsedMessages = await scanFinanceSms(220);
      setItems(parsedMessages);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to scan SMS inbox.');
    } finally {
      setLoading(false);
    }
  };

  const onOpenSettings = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    }
  };

  const onPickStatementPdf = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    let picker: typeof import('expo-document-picker');
    try {
      picker = await import('expo-document-picker');
    } catch {
      setErrorMessage(
        'PDF picker module is not available in this build. Rebuild the Android app with: npx expo run:android --device'
      );
      return;
    }

    const result = await picker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const file = result.assets[0];
    setStatementFile({
      uri: file.uri,
      name: file.name || 'statement.pdf',
      mimeType: file.mimeType || 'application/pdf',
      size: file.size,
    });
  };

  const onImportStatementPdf = async () => {
    setImporting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (!statementFile) {
        throw new Error('Please select a PDF statement file first.');
      }

      const result = await importStatementPdfFile(
        statementFile.uri,
        statementFile.name,
        statementFile.mimeType,
        statementProvider
      );

      const providerLabel = STATEMENT_PROVIDER_OPTIONS.find(
        (item) => item.value === result.provider
      )?.label;
      setSuccessMessage(
        `${result.createdCount} transaction(s) imported from ${providerLabel ?? 'statement'} PDF.`
      );
      setStatementFile(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Statement PDF import failed.');
    } finally {
      setImporting(false);
    }
  };

  const onConfirmImport = async () => {
    if (!selectedItem || !draft) return;

    setImporting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (isImported(selectedItem)) {
        throw new Error('This SMS is already imported and cannot be imported again.');
      }

      const updatedDraft: SmsImportDraft = {
        ...draft,
        date: fromEditableDate(draftDateInput, draft.date),
      };

      if (!updatedDraft.amount || updatedDraft.amount <= 0) {
        throw new Error('Amount must be greater than zero.');
      }

      if (!updatedDraft.title.trim()) {
        throw new Error('Title is required before import.');
      }

      if (!updatedDraft.category.trim()) {
        throw new Error('Category is required before import.');
      }

      await importSmsAsTransaction(selectedItem, updatedDraft);
      setImportedSmsIds((previous) => {
        const key = getImportKey(selectedItem);
        if (previous.includes(key)) return previous;
        return [...previous, key];
      });
      closeConfirmModal();
      setSuccessMessage('SMS imported successfully as a transaction.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'SMS import failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.pageTitle}>SMS Scan</Text>
          <Text style={styles.pageSubtitle}>
            Import from SMS inbox or PDF statements exported from eSewa and Khalti.
          </Text>

          <TouchableOpacity
            style={styles.receiptCameraLink}
            onPress={() => router.push('/receipt-scanner')}
            activeOpacity={0.9}
          >
            <MaterialIcons name="photo-camera" size={16} color={Colors.primaryDark} />
            <Text style={styles.receiptCameraLinkText}>Open Receipt Camera (separate from SMS)</Text>
            <MaterialIcons name="chevron-right" size={16} color={Colors.primaryDark} />
          </TouchableOpacity>

          <View style={styles.modeSwitchRow}>
            <TouchableOpacity
              style={[styles.modeSwitchButton, importMode === 'sms' && styles.modeSwitchButtonActive]}
              onPress={() => setImportMode('sms')}
              activeOpacity={0.9}
            >
              <MaterialIcons
                name="sms"
                size={15}
                color={importMode === 'sms' ? Colors.white : Colors.textSecondary}
              />
              <Text style={[styles.modeSwitchText, importMode === 'sms' && styles.modeSwitchTextActive]}>
                SMS Inbox
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeSwitchButton,
                importMode === 'statement' && styles.modeSwitchButtonActive,
              ]}
              onPress={() => setImportMode('statement')}
              activeOpacity={0.9}
            >
              <MaterialIcons
                name="description"
                size={15}
                color={importMode === 'statement' ? Colors.white : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.modeSwitchText,
                  importMode === 'statement' && styles.modeSwitchTextActive,
                ]}
              >
                PDF Statement
              </Text>
            </TouchableOpacity>
          </View>

          {importMode === 'sms' && (
            <TouchableOpacity
              style={styles.scanButton}
              onPress={onScanPress}
              disabled={loading || importing}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <MaterialIcons name="sms" size={18} color={Colors.white} />
                  <Text style={styles.scanButtonText}>{scanButtonLabel}</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {importMode === 'statement' && (
            <View style={styles.statementHeaderInfo}>
              <MaterialIcons name="picture-as-pdf" size={15} color={Colors.primaryDark} />
              <Text style={styles.statementHeaderInfoText}>
                Select an exported eSewa/Khalti PDF from your phone and import transactions automatically.
              </Text>
            </View>
          )}

          {importMode === 'sms' && items.length > 0 && (
            <View style={styles.scanMetaPill}>
              <MaterialIcons name="check-circle" size={14} color={Colors.primaryDark} />
              <Text style={styles.scanMetaText}>{filteredSmsItems.length} parsed messages ready to import</Text>
            </View>
          )}

          {importMode === 'sms' && items.length > 0 && (
            <View style={styles.filterRow}>
              {(['all', 'income', 'expense'] as const).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filterChip, smsTypeFilter === filter && styles.filterChipActive]}
                  onPress={() => setSmsTypeFilter(filter)}
                >
                  <Text style={[styles.filterChipText, smsTypeFilter === filter && styles.filterChipTextActive]}>
                    {filter === 'all' ? 'All' : filter === 'income' ? 'Income' : 'Expense'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {importMode === 'sms' && permissionState === 'unsupported' && (
            <Text style={styles.supportText}>
              SMS import is only available on Android development builds.
            </Text>
          )}
        </View>

        {errorMessage && (
          <View style={styles.errorContainer}>
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
            {importMode === 'sms' && permissionState === 'denied' && (
              <TouchableOpacity style={styles.settingsButton} onPress={onOpenSettings}>
                <MaterialIcons name="settings" size={16} color={Colors.white} />
                <Text style={styles.settingsButtonText}>Open Settings</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {successMessage && (
          <View style={styles.successBox}>
            <MaterialIcons name="check-circle-outline" size={16} color={Colors.success} />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {importMode === 'sms' && filteredSmsItems.length === 0 && emptyStateMessage && (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialIcons name="inbox" size={24} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Parsed SMS Yet</Text>
            <Text style={styles.emptyText}>{emptyStateMessage}</Text>
          </View>
        )}

        {importMode === 'sms' && filteredSmsItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.smsCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              if (!isImported(item)) openConfirmModal(item);
            }}
            activeOpacity={0.92}
          >
            <View style={styles.smsTopRow}>
              <View>
                <Text style={styles.sender}>{item.sender}</Text>
                <Text style={styles.smsDate}>{formatDate(item.date)}</Text>
              </View>

              <View style={styles.rightInfo}>
                <Text style={[styles.amountText, getAmountTextStyle(item.type)]}>{formatAmount(item.amount, item.currencyCode)}</Text>
                <View style={[styles.typeBadge, getTypeBadgeStyle(item.type)]}>
                  <Text style={[styles.typeBadgeText, getTypeBadgeTextStyle(item.type)]}>{item.type.toUpperCase()}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.messagePreview} numberOfLines={2}>
              {item.body}
            </Text>

            <View style={styles.importButtonRow}>
              <TouchableOpacity
                style={[styles.importButton, isImported(item) && styles.importedButton]}
                onPress={() => openConfirmModal(item)}
                disabled={isImported(item)}
                activeOpacity={0.85}
              >
                <Text style={styles.importButtonText}>
                  {isImported(item) ? 'Imported' : 'Import'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        {importMode === 'statement' && (
          <View style={[styles.statementCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.statementTitle}>PDF Statement Import</Text>
            <Text style={styles.statementSubtitle}>
              Supported PDF files: eSewa, Khalti, and bank statement exports.
            </Text>

            <Text style={styles.fieldLabel}>Provider</Text>
            <View style={styles.providerRow}>
              {STATEMENT_PROVIDER_OPTIONS.map((provider) => (
                <TouchableOpacity
                  key={provider.value}
                  onPress={() => setStatementProvider(provider.value)}
                  style={[
                    styles.providerChip,
                    statementProvider === provider.value && styles.providerChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.providerChipText,
                      statementProvider === provider.value && styles.providerChipTextActive,
                    ]}
                  >
                    {provider.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formSectionCard}>
              <Text style={styles.formSectionTitle}>PDF File</Text>

              <TouchableOpacity
                style={styles.filePickerButton}
                onPress={onPickStatementPdf}
                disabled={importing}
              >
                <MaterialIcons name="attach-file" size={16} color={Colors.primaryDark} />
                <Text style={styles.filePickerButtonText}>Choose PDF from phone</Text>
              </TouchableOpacity>

              {statementFile ? (
                <View style={styles.fileInfoCard}>
                  <MaterialIcons name="picture-as-pdf" size={16} color={Colors.error} />
                  <View style={styles.fileInfoTextWrap}>
                    <Text style={styles.fileNameText} numberOfLines={1}>{statementFile.name}</Text>
                    <Text style={styles.fileMetaText}>
                      {statementFile.size ? `${Math.max(1, Math.round(statementFile.size / 1024))} KB` : 'Size unavailable'}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.fileHintText}>
                  No file selected. Export a PDF statement from eSewa/Khalti and choose it here.
                </Text>
              )}

              <View style={styles.statementStepsCard}>
                <Text style={styles.statementStepTitle}>How it works</Text>
                <Text style={styles.statementStepText}>1. Select provider</Text>
                <Text style={styles.statementStepText}>2. Choose exported PDF file</Text>
                <Text style={styles.statementStepText}>3. Tap import to create transactions automatically</Text>
              </View>

              <TouchableOpacity
                style={styles.statementImportButton}
                onPress={onImportStatementPdf}
                disabled={importing}
              >
                {importing ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <MaterialIcons name="save" size={16} color={Colors.white} />
                    <Text style={styles.statementImportButtonText}>Import Transactions From PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={!!selectedItem && !!draft} transparent animationType="slide" onRequestClose={closeConfirmModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <Text style={styles.modalTitle}>Confirm SMS Import</Text>
            <Text style={styles.modalSubtitle}>Review and edit values before saving transaction.</Text>

            {draft && (
              <View style={styles.formArea}>
                <Text style={styles.fieldLabel}>Amount</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={String(draft.amount)}
                  onChangeText={(text) =>
                    setDraft((prev) => (prev ? { ...prev, amount: Number(text.replace(/,/g, '')) || 0 } : prev))
                  }
                  placeholder="0.00"
                  placeholderTextColor={Colors.textTertiary}
                />

                <Text style={styles.fieldLabel}>Date (YYYY-MM-DD HH:mm)</Text>
                <TextInput
                  style={styles.input}
                  value={draftDateInput}
                  onChangeText={setDraftDateInput}
                  placeholder="2026-03-24 12:00"
                  placeholderTextColor={Colors.textTertiary}
                />

                <Text style={styles.fieldLabel}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={draft.title}
                  onChangeText={(text) =>
                    setDraft((prev) => (prev ? { ...prev, title: text } : prev))
                  }
                  placeholder="Enter your title"
                  placeholderTextColor={Colors.textTertiary}
                />

                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.categoryWrap}>
                  {CATEGORY_OPTIONS.map((category) => (
                    <TouchableOpacity
                      key={category}
                      onPress={() => setDraft((prev) => (prev ? { ...prev, category } : prev))}
                      style={[
                        styles.categoryChip,
                        draft.category === category && styles.categoryChipActive,
                      ]}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          draft.category === category && styles.categoryChipTextActive,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Type</Text>
                <View style={styles.typeToggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleButton, draft.type === 'expense' && styles.toggleButtonExpenseActive]}
                    onPress={() => setDraft((prev) => (prev ? { ...prev, type: 'expense' } : prev))}
                  >
                    <Text style={[styles.toggleButtonText, draft.type === 'expense' && styles.toggleButtonTextExpenseActive]}>
                      Expense
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleButton, draft.type === 'income' && styles.toggleButtonIncomeActive]}
                    onPress={() => setDraft((prev) => (prev ? { ...prev, type: 'income' } : prev))}
                  >
                    <Text style={[styles.toggleButtonText, draft.type === 'income' && styles.toggleButtonTextIncomeActive]}>
                      Income
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.fieldLabel}>Description / SMS Body</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  value={draft.description}
                  onChangeText={(text) =>
                    setDraft((prev) => (prev ? { ...prev, description: text } : prev))
                  }
                  placeholder="Description"
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeConfirmModal}
                disabled={importing}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={onConfirmImport}
                disabled={importing}
              >
                {importing ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Import</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  pageSubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textSecondary,
  },
  receiptCameraLink: {
    marginTop: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    minHeight: 40,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptCameraLinkText: {
    flex: 1,
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  modeSwitchRow: {
    marginTop: 12,
    marginBottom: 2,
    flexDirection: 'row',
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    padding: 4,
    gap: 6,
  },
  modeSwitchButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modeSwitchButtonActive: {
    backgroundColor: Colors.primary,
  },
  modeSwitchText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modeSwitchTextActive: {
    color: Colors.white,
  },
  scanButton: {
    marginTop: 14,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanButtonText: {
    fontSize: 15,
    color: Colors.white,
    fontWeight: '700',
  },
  supportText: {
    marginTop: 8,
    color: Colors.textTertiary,
    fontSize: 12,
  },
  statementHeaderInfo: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statementHeaderInfoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  scanMetaPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scanMetaText: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  filterRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    minHeight: 30,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  filterChipActive: {
    borderColor: '#6EE7B7',
    backgroundColor: '#F5F3FF',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.primaryDark,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  errorContainer: {
    marginBottom: 10,
  },
  errorText: {
    flex: 1,
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    marginTop: 8,
  },
  settingsButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  successText: {
    flex: 1,
    color: '#6D28D9',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyText: {
    marginTop: 5,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  smsCard: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    padding: 14,
  },
  smsTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  sender: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    maxWidth: 180,
  },
  smsDate: {
    marginTop: 3,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rightInfo: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
  },
  amountIncome: {
    color: '#16A34A',
  },
  amountExpense: {
    color: '#DC2626',
  },
  typeBadge: {
    marginTop: 5,
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeIncome: {
    backgroundColor: '#DCFCE7',
  },
  badgeExpense: {
    backgroundColor: '#FEE2E2',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  typeBadgeTextIncome: {
    color: '#166534',
  },
  typeBadgeTextExpense: {
    color: '#B91C1C',
  },
  messagePreview: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  importButtonRow: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  importButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    minHeight: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importedButton: {
    backgroundColor: '#94A3B8',
  },
  importButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  statementCard: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    padding: 14,
  },
  statementTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statementSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  providerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  providerChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 99,
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 12,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerChipActive: {
    borderColor: '#6EE7B7',
    backgroundColor: Colors.primaryLight,
  },
  providerChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  providerChipTextActive: {
    color: Colors.primaryDark,
  },
  filePickerButton: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  filePickerButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  fileInfoCard: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fileInfoTextWrap: {
    flex: 1,
  },
  fileNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  fileMetaText: {
    marginTop: 2,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  fileHintText: {
    marginTop: 10,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  formSectionCard: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  formSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statementStepsCard: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  statementStepTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 3,
  },
  statementStepText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#1E40AF',
    fontWeight: '600',
  },
  statementImportButton: {
    marginTop: 14,
    borderRadius: 10,
    minHeight: 44,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statementImportButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.38)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '88%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  formArea: {
    marginTop: 10,
  },
  fieldLabel: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    minHeight: 42,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.lightGray,
  },
  textArea: {
    minHeight: 84,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 99,
    paddingHorizontal: 10,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lightGray,
  },
  categoryChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: '#6EE7B7',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.primaryDark,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonExpenseActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  toggleButtonIncomeActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  toggleButtonText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  toggleButtonTextExpenseActive: {
    color: '#B91C1C',
  },
  toggleButtonTextIncomeActive: {
    color: '#166534',
  },
  modalActions: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: Colors.white,
    fontWeight: '700',
  },
});
