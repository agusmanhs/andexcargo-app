import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import {
  Search,
  X,
  Copy,
  Share2,
  Package,
  MapPin,
  ArrowRight,
  User,
  Scale,
  Clock,
  Truck,
  Phone,
} from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { ApiService, TrackingData } from '../api/client';
import { StorageService } from '../utils/storage';
import { Badge } from '../components/Badge';
import { Header } from '../components/Header';

interface TrackScreenProps {
  route?: any;
}

export const TrackScreen: React.FC<TrackScreenProps> = ({ route }) => {
  const [resiInput, setResiInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const loadRecentSearches = async () => {
    const list = await StorageService.getRecentTracking();
    setRecentSearches(list);
  };

  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Handle route params passed from HomeScreen
  useEffect(() => {
    if (route?.params?.resi) {
      setResiInput(route.params.resi);
      executeTrack(route.params.resi);
    }
  }, [route?.params?.resi]);

  const executeTrack = async (resiToSearch: string) => {
    const clean = resiToSearch.trim().toUpperCase();
    if (!clean) {
      Alert.alert('Perhatian', 'Masukkan nomor resi.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.trackResi(clean);
      setResult(data);
      const updated = await StorageService.addRecentTracking(clean);
      setRecentSearches(updated);
    } catch (err: any) {
      setError(err.message || 'Nomor resi tidak ditemukan. Pastikan nomor resi sudah benar.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setResiInput('');
    setResult(null);
    setError(null);
  };

  const handleCopyResi = (resi: string) => {
    Alert.alert('Nomor Resi', `Nomor resi: ${resi}`);
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      const latest = result.history && result.history.length > 0 ? result.history[0] : null;
      const statusText = latest ? `${latest.status} (${latest.keterangan})` : result.status;
      const message = `Lacak Resi AndEX Cargo:\nNo. Resi: ${result.resi}\nStatus: ${statusText}\nDari: ${result.asal} -> Tujuan: ${result.tujuan}\nPenerima: ${result.penerima}\nLacak langsung di: https://andexcargo.id/cek-resi`;
      await Share.share({ message });
    } catch {
      // ignore
    }
  };

  const handleRemoveRecent = async (item: string) => {
    const updated = await StorageService.removeRecentTracking(item);
    setRecentSearches(updated);
  };

  return (
    <View style={styles.container}>
      <Header title="Lacak Resi" subtitle="Tracking status pengiriman paket" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* INPUT BOX */}
        <View style={styles.searchBox}>
          <View style={styles.inputRow}>
            <Search size={20} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.input}
              placeholder="Masukkan Nomor Resi..."
              placeholderTextColor={Colors.textMuted}
              value={resiInput}
              onChangeText={setResiInput}
              autoCapitalize="characters"
              returnKeyType="search"
              onSubmitEditing={() => executeTrack(resiInput)}
            />
            {resiInput.length > 0 && (
              <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
                <X size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.btnTrack, loading && styles.btnTrackDisabled]}
            onPress={() => executeTrack(resiInput)}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text style={styles.btnTrackText}>Lacak Sekarang</Text>
                <ArrowRight size={16} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* RECENT SEARCHES */}
        {!result && recentSearches.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Riwayat Pencarian</Text>
              <TouchableOpacity
                onPress={async () => {
                  await StorageService.clearRecentTracking();
                  setRecentSearches([]);
                }}
              >
                <Text style={styles.clearAllText}>Hapus Semua</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.chipsContainer}>
              {recentSearches.map(item => (
                <View key={item} style={styles.chip}>
                  <TouchableOpacity
                    onPress={() => {
                      setResiInput(item);
                      executeTrack(item);
                    }}
                    style={styles.chipTextBtn}
                  >
                    <Package size={14} color={Colors.accent} style={{ marginRight: 5 }} />
                    <Text style={styles.chipText}>{item}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveRecent(item)}
                    style={styles.chipCloseBtn}
                  >
                    <X size={13} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ERROR STATE */}
        {error && (
          <View style={styles.errorCard}>
            <View style={styles.errorIconCircle}>
              <X size={24} color={Colors.danger} />
            </View>
            <Text style={styles.errorTitle}>Resi Tidak Ditemukan</Text>
            <Text style={styles.errorDesc}>{error}</Text>
            <Text style={styles.errorHint}>
              Tips: Pastikan nomor resi lengkap tanpa spasi atau karakter khusus.
            </Text>
          </View>
        )}

        {/* TRACKING RESULT DETAILS */}
        {result && (
          <View style={styles.resultContainer}>
            {/* CARD HEADER RESI & STATUS */}
            <View style={styles.mainCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.resiLabel}>Nomor Resi</Text>
                  <Text style={styles.resiNumber}>{result.resi}</Text>
                </View>
                <Badge status={result.status} />
              </View>

              {/* ACTION BUTTONS (SHARE & COPY) */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleCopyResi(result.resi)}
                >
                  <Copy size={14} color={Colors.primary} />
                  <Text style={styles.actionBtnText}>Salin Resi</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                  <Share2 size={14} color={Colors.primary} />
                  <Text style={styles.actionBtnText}>Bagikan Status</Text>
                </TouchableOpacity>
              </View>

              {/* ROUTE BOX */}
              <View style={styles.routeBox}>
                <View style={styles.routeCol}>
                  <Text style={styles.routeSub}>Kota Asal</Text>
                  <Text style={styles.routeVal}>{result.asal || '-'}</Text>
                </View>
                <View style={styles.routeArrow}>
                  <ArrowRight size={20} color={Colors.accent} />
                </View>
                <View style={[styles.routeCol, { alignItems: 'flex-end' }]}>
                  <Text style={styles.routeSub}>Kota Tujuan</Text>
                  <Text style={styles.routeVal}>{result.tujuan || '-'}</Text>
                </View>
              </View>

              {/* SHIPMENT SPEC DETAILS */}
              <View style={styles.specGrid}>
                <View style={styles.specItem}>
                  <User size={15} color={Colors.textSecondary} />
                  <View style={styles.specTextCol}>
                    <Text style={styles.specLabel}>Pengirim</Text>
                    <Text style={styles.specValue}>{result.pengirim || '-'}</Text>
                  </View>
                </View>

                <View style={styles.specItem}>
                  <User size={15} color={Colors.textSecondary} />
                  <View style={styles.specTextCol}>
                    <Text style={styles.specLabel}>Penerima</Text>
                    <Text style={styles.specValue}>{result.penerima || '-'}</Text>
                  </View>
                </View>

                <View style={styles.specItem}>
                  <Truck size={15} color={Colors.textSecondary} />
                  <View style={styles.specTextCol}>
                    <Text style={styles.specLabel}>Layanan</Text>
                    <Text style={styles.specValue}>{result.layanan || '-'}</Text>
                  </View>
                </View>

                <View style={styles.specItem}>
                  <Scale size={15} color={Colors.textSecondary} />
                  <View style={styles.specTextCol}>
                    <Text style={styles.specLabel}>Berat / Koli</Text>
                    <Text style={styles.specValue}>
                      {result.berat ? `${result.berat} Kg` : '-'} / {result.koli ? `${result.koli} Koli` : '-'}
                    </Text>
                  </View>
                </View>

                {result.alamat_tujuan ? (
                  <View style={[styles.specItem, { width: '100%', marginTop: 4 }]}>
                    <MapPin size={15} color={Colors.textSecondary} />
                    <View style={styles.specTextCol}>
                      <Text style={styles.specLabel}>Alamat Penerima</Text>
                      <Text style={styles.specValue}>{result.alamat_tujuan}</Text>
                    </View>
                  </View>
                ) : null}

                {result.telepon_tujuan ? (
                  <View style={[styles.specItem, { width: '100%', marginTop: 4 }]}>
                    <Phone size={15} color={Colors.textSecondary} />
                    <View style={styles.specTextCol}>
                      <Text style={styles.specLabel}>Telepon Penerima</Text>
                      <Text style={styles.specValue}>{result.telepon_tujuan}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>

            {/* TIMELINE RIWAYAT PENGIRIMAN */}
            <View style={styles.timelineCard}>
              <View style={styles.timelineHeader}>
                <Clock size={18} color={Colors.primary} />
                <Text style={styles.timelineTitle}>Riwayat Perjalanan Paket</Text>
              </View>

              {result.history && result.history.length > 0 ? (
                <View style={styles.timelineList}>
                  {result.history.map((step, idx) => {
                    const isLatest = idx === 0;
                    const isLast = idx === result.history.length - 1;

                    return (
                      <View key={idx} style={styles.timelineRow}>
                        {/* LEFT COLUMN: INDICATOR & LINE */}
                        <View style={styles.indicatorCol}>
                          <View
                            style={[
                              styles.dotCircle,
                              isLatest ? styles.dotLatest : styles.dotPast,
                            ]}
                          >
                            {isLatest && <View style={styles.dotInner} />}
                          </View>
                          {!isLast && <View style={styles.verticalLine} />}
                        </View>

                        {/* RIGHT COLUMN: EVENT CONTENT */}
                        <View style={styles.eventContent}>
                          <View style={styles.eventHeader}>
                            <Text
                              style={[
                                styles.eventStatus,
                                isLatest && styles.eventStatusLatest,
                              ]}
                            >
                              {step.status}
                            </Text>
                            <Text style={styles.eventDate}>{step.tanggal}</Text>
                          </View>

                          {step.lokasi ? (
                            <View style={styles.locationRow}>
                              <MapPin size={13} color={Colors.textSecondary} />
                              <Text style={styles.locationText}>{step.lokasi}</Text>
                            </View>
                          ) : null}

                          <Text style={styles.eventDesc}>{step.keterangan}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyTimeline}>
                  <Text style={styles.emptyTimelineText}>
                    Belum ada catatan aktivitas untuk resi ini.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  searchBox: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  clearBtn: {
    padding: 6,
  },
  btnTrack: {
    backgroundColor: Colors.primary,
    height: 46,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTrackDisabled: {
    opacity: 0.7,
  },
  btnTrackText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
  },
  recentSection: {
    marginBottom: 20,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.danger,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginRight: 6,
  },
  chipCloseBtn: {
    padding: 3,
  },
  errorCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  errorIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.danger,
    marginBottom: 6,
  },
  errorDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  resultContainer: {
    marginTop: 4,
  },
  mainCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  resiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  resiNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 10,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 6,
  },
  routeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    marginVertical: 14,
  },
  routeCol: {
    flex: 1,
  },
  routeSub: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  routeVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  routeArrow: {
    paddingHorizontal: 12,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  specItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  specTextCol: {
    marginLeft: 8,
    flex: 1,
  },
  specLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 1,
  },
  timelineCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 8,
  },
  timelineList: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 64,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  dotCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dotLatest: {
    backgroundColor: Colors.accent,
    borderWidth: 3,
    borderColor: Colors.accentLight,
  },
  dotPast: {
    backgroundColor: '#cbd5e1',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 3,
  },
  dotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  verticalLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  eventContent: {
    flex: 1,
    paddingBottom: 18,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  eventStatus: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  eventStatusLatest: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.accent,
  },
  eventDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  eventDesc: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 17,
  },
  emptyTimeline: {
    padding: 16,
    alignItems: 'center',
  },
  emptyTimelineText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
