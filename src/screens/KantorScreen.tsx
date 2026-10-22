import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  MapPin,
  Phone,
  MessageCircle,
  Navigation,
  Search,
  Building,
  Clock,
  ExternalLink,
} from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { Config } from '../constants/config';
import { ApiService, Kantor } from '../api/client';
import { Header } from '../components/Header';

export const KantorScreen: React.FC = () => {
  const [kantorList, setKantorList] = useState<Kantor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchKantor = async () => {
    try {
      const data = await ApiService.getKantor();
      setKantorList(data);
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKantor();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchKantor();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return kantorList;
    const q = search.toLowerCase();
    return kantorList.filter(
      k =>
        (k.nama && k.nama.toLowerCase().includes(q)) ||
        (k.kota && k.kota.toLowerCase().includes(q)) ||
        (k.alamat && k.alamat.toLowerCase().includes(q))
    );
  }, [kantorList, search]);

  const handleCall = (phone: string) => {
    const clean = phone.replace(/[^0-9+]/g, '');
    if (!clean) {
      Alert.alert('Info', 'Nomor telepon tidak tersedia.');
      return;
    }
    Linking.openURL(`tel:${clean}`);
  };

  const handleWhatsApp = (phone: string, namaKantor: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (!clean.startsWith('62')) {
      clean = Config.HOTLINE_WA;
    }
    const msg = `Halo ${namaKantor}, saya ingin bertanya perihal layanan pengiriman kargo.`;
    Linking.openURL(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`);
  };

  const handleOpenMaps = (alamat: string, namaKantor: string) => {
    const query = encodeURIComponent(`${namaKantor} ${alamat}`);
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  return (
    <View style={styles.container}>
      <Header title="Kantor & Cabang" subtitle="Jaringan operasional Andex Cargo" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.accent]} />
        }
      >
        {/* HOTLINE BANNER */}
        <View style={styles.hotlineCard}>
          <View style={styles.hotlineContent}>
            <Text style={styles.hotlineTitle}>Hotline & Customer Service</Text>
            <Text style={styles.hotlineNumber}>{Config.HOTLINE_DISPLAY}</Text>
            <Text style={styles.hotlineDesc}>
              Layanan informasi kargo, tracking & konsultasi pengiriman setiap hari kerja.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.hotlineWaBtn}
            onPress={() =>
              Linking.openURL(
                `https://wa.me/${Config.HOTLINE_WA}?text=${encodeURIComponent(
                  'Halo CS Andex Cargo, saya ingin bertanya tentang layanan pengiriman.'
                )}`
              )
            }
          >
            <MessageCircle size={16} color="#ffffff" />
            <Text style={styles.hotlineWaText}>Chat CS</Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH BAR */}
        <View style={styles.searchBox}>
          <Search size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari cabang atau kota..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>Memuat daftar kantor cabang...</Text>
          </View>
        ) : filtered.length > 0 ? (
          <View style={styles.listContainer}>
            {filtered.map(kantor => (
              <View key={kantor.id} style={styles.branchCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Building size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.branchName}>{kantor.nama}</Text>
                  </View>
                  {kantor.kota ? (
                    <View style={styles.cityBadge}>
                      <Text style={styles.cityBadgeText}>{kantor.kota}</Text>
                    </View>
                  ) : null}
                </View>

                {kantor.alamat ? (
                  <View style={styles.infoRow}>
                    <MapPin size={15} color={Colors.accent} style={styles.infoIcon} />
                    <Text style={styles.infoText}>{kantor.alamat}</Text>
                  </View>
                ) : null}

                {kantor.telepon ? (
                  <View style={styles.infoRow}>
                    <Phone size={15} color={Colors.textSecondary} style={styles.infoIcon} />
                    <Text style={styles.infoText}>{kantor.telepon}</Text>
                  </View>
                ) : null}

                {/* ACTION BUTTONS */}
                <View style={styles.actionRow}>
                  {kantor.telepon && (
                    <>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleWhatsApp(kantor.telepon, kantor.nama)}
                      >
                        <MessageCircle size={15} color="#25D366" />
                        <Text style={[styles.actionBtnText, { color: '#16a34a' }]}>WhatsApp</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleCall(kantor.telepon)}
                      >
                        <Phone size={15} color={Colors.primary} />
                        <Text style={styles.actionBtnText}>Telepon</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {kantor.alamat && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleOpenMaps(kantor.alamat, kantor.nama)}
                    >
                      <Navigation size={15} color={Colors.accent} />
                      <Text style={[styles.actionBtnText, { color: Colors.accent }]}>Petunjuk Arah</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Cabang Tidak Ditemukan</Text>
            <Text style={styles.emptyText}>
              Tidak ada kantor yang sesuai dengan kata kunci "{search}".
            </Text>
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
  hotlineCard: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  hotlineContent: {
    flex: 1,
    marginRight: 10,
  },
  hotlineTitle: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  hotlineNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginVertical: 2,
  },
  hotlineDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 15,
  },
  hotlineWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  hotlineWaText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 0,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 10,
  },
  listContainer: {
    gap: 12,
  },
  branchCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  branchName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  cityBadge: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 6,
  },
  cityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 5,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
