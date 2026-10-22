import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import {
  Calculator,
  MapPin,
  ChevronDown,
  Search,
  X,
  Package,
  Plus,
  Minus,
  ArrowRight,
  Clock,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { Config } from '../constants/config';
import { ApiService, Kabupaten, Produk, Tarif } from '../api/client';
import { Header } from '../components/Header';

export const TarifScreen: React.FC = () => {
  const [kabupatenList, setKabupatenList] = useState<Kabupaten[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form selections
  const [asal, setAsal] = useState<Kabupaten | null>(null);
  const [tujuan, setTujuan] = useState<Kabupaten | null>(null);
  const [selectedProduk, setSelectedProduk] = useState<Produk | null>(null);
  const [beratInput, setBeratInput] = useState('1');

  // Modal selector states
  const [modalType, setModalType] = useState<'asal' | 'tujuan' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Calculation states
  const [calculating, setCalculating] = useState(false);
  const [tarifResult, setTarifResult] = useState<Tarif | null>(null);
  const [calcAttempted, setCalcAttempted] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        const [kabs, prods] = await Promise.all([
          ApiService.getKabupaten(),
          ApiService.getProduk(),
        ]);
        setKabupatenList(kabs);
        setProdukList(prods);

        // Auto select default Makassar as origin if exists
        const defaultAsal = kabs.find(k => k.nama_kabupaten.toUpperCase().includes('MAKASSAR'));
        if (defaultAsal) {
          setAsal(defaultAsal);
        }

        // Auto select first product (e.g. Reguler or Express)
        if (prods.length > 0) {
          const defaultProd = prods.find(p => p.nama_produk.toLowerCase().includes('reguler')) || prods[0];
          setSelectedProduk(defaultProd);
        }
      } catch (err: any) {
        Alert.alert('Gagal memuat data', 'Pastikan koneksi internet aktif.');
      } finally {
        setLoadingInitial(false);
      }
    };

    initData();
  }, []);

  // Filtered kabupaten list for modal
  const filteredKabupaten = useMemo(() => {
    if (!searchQuery.trim()) return kabupatenList;
    const q = searchQuery.toLowerCase();
    return kabupatenList.filter(k => k.nama_kabupaten.toLowerCase().includes(q));
  }, [kabupatenList, searchQuery]);

  const handleSelectKabupaten = (item: Kabupaten) => {
    if (modalType === 'asal') {
      setAsal(item);
    } else if (modalType === 'tujuan') {
      setTujuan(item);
    }
    setModalType(null);
    setSearchQuery('');
    setTarifResult(null);
    setCalcAttempted(false);
  };

  const handleStepBerat = (delta: number) => {
    const current = parseFloat(beratInput) || 1;
    const next = Math.max(1, current + delta);
    setBeratInput(next.toString());
    setTarifResult(null);
    setCalcAttempted(false);
  };

  const handleCalculate = async () => {
    if (!asal) {
      Alert.alert('Perhatian', 'Pilih kota asal pengiriman.');
      return;
    }
    if (!tujuan) {
      Alert.alert('Perhatian', 'Pilih kota tujuan pengiriman.');
      return;
    }
    if (!selectedProduk) {
      Alert.alert('Perhatian', 'Pilih jenis layanan kargo.');
      return;
    }

    const berat = parseFloat(beratInput);
    if (isNaN(berat) || berat <= 0) {
      Alert.alert('Perhatian', 'Masukkan berat barang yang valid (minimal 1 Kg).');
      return;
    }

    setCalculating(true);
    setCalcAttempted(true);

    try {
      const data = await ApiService.getTarif(
        asal.kode_kabupaten,
        tujuan.kode_kabupaten,
        selectedProduk.id
      );
      setTarifResult(data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Gagal menghitung tarif.');
      setTarifResult(null);
    } finally {
      setCalculating(false);
    }
  };

  const formatRupiah = (val: number) => {
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  const computedTotal = useMemo(() => {
    if (!tarifResult) return null;
    const berat = parseFloat(beratInput) || 1;
    const beratMin = Number(tarifResult.berat_min) || 1;
    const hargaPerKg = Number(tarifResult.harga) || 0;
    const hargaMin = Number(tarifResult.harga_min) || (beratMin * hargaPerKg);

    const isUnderMin = berat < beratMin;
    const finalCost = isUnderMin ? hargaMin : berat * hargaPerKg;

    return {
      finalCost,
      isUnderMin,
      beratMin,
      hargaPerKg,
      hargaMin,
      beratInput: berat,
    };
  }, [tarifResult, beratInput]);

  const handleWhatsAppBooking = () => {
    if (!asal || !tujuan || !selectedProduk || !computedTotal) return;
    const text = `Halo CS Andex Cargo, saya ingin booking/konsultasi pengiriman:\n- Asal: ${asal.nama_kabupaten}\n- Tujuan: ${tujuan.nama_kabupaten}\n- Layanan: ${selectedProduk.nama_produk}\n- Berat: ${computedTotal.beratInput} Kg\n- Estimasi Tarif: ${formatRupiah(computedTotal.finalCost)}\nMohon info prosedur penjemputan/pengirimannya. Terima kasih!`;
    Linking.openURL(`https://wa.me/${Config.HOTLINE_WA}?text=${encodeURIComponent(text)}`);
  };

  return (
    <View style={styles.container}>
      <Header title="Cek Tarif" subtitle="Kalkulator ongkir pengiriman kargo" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loadingInitial ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>Memuat data wilayah & layanan...</Text>
          </View>
        ) : (
          <View>
            {/* FORM CARD */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Rute Pengiriman</Text>

              {/* ASAL */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Kota Asal</Text>
                <TouchableOpacity
                  style={styles.selectBtn}
                  onPress={() => {
                    setModalType('asal');
                    setSearchQuery('');
                  }}
                  activeOpacity={0.8}
                >
                  <MapPin size={18} color={Colors.accent} style={{ marginRight: 8 }} />
                  <Text style={[styles.selectBtnText, !asal && styles.selectBtnPlaceholder]}>
                    {asal ? asal.nama_kabupaten : 'Pilih Kota / Kabupaten Asal'}
                  </Text>
                  <ChevronDown size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* TUJUAN */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Kota Tujuan</Text>
                <TouchableOpacity
                  style={styles.selectBtn}
                  onPress={() => {
                    setModalType('tujuan');
                    setSearchQuery('');
                  }}
                  activeOpacity={0.8}
                >
                  <MapPin size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.selectBtnText, !tujuan && styles.selectBtnPlaceholder]}>
                    {tujuan ? tujuan.nama_kabupaten : 'Pilih Kota / Kabupaten Tujuan'}
                  </Text>
                  <ChevronDown size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* LAYANAN / PRODUK */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Pilihan Layanan</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.prodScroll}>
                  {produkList.map(prod => {
                    const isSelected = selectedProduk?.id === prod.id;
                    return (
                      <TouchableOpacity
                        key={prod.id}
                        style={[styles.prodChip, isSelected && styles.prodChipSelected]}
                        onPress={() => {
                          setSelectedProduk(prod);
                          setTarifResult(null);
                          setCalcAttempted(false);
                        }}
                      >
                        <Text style={[styles.prodChipText, isSelected && styles.prodChipTextSelected]}>
                          {prod.nama_produk}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* BERAT (KG) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Perkiraan Berat Barang (Kg)</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => handleStepBerat(-5)}
                  >
                    <Text style={styles.stepBtnText}>-5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => handleStepBerat(-1)}
                  >
                    <Minus size={16} color={Colors.text} />
                  </TouchableOpacity>

                  <View style={styles.beratInputWrapper}>
                    <TextInput
                      style={styles.beratInput}
                      keyboardType="numeric"
                      value={beratInput}
                      onChangeText={val => {
                        setBeratInput(val);
                        setTarifResult(null);
                        setCalcAttempted(false);
                      }}
                    />
                    <Text style={styles.beratUnit}>Kg</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => handleStepBerat(1)}
                  >
                    <Plus size={16} color={Colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => handleStepBerat(5)}
                  >
                    <Text style={styles.stepBtnText}>+5</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* BUTTON CALCULATE */}
              <TouchableOpacity
                style={[styles.btnCalculate, calculating && styles.btnCalculateDisabled]}
                onPress={handleCalculate}
                disabled={calculating}
                activeOpacity={0.85}
              >
                {calculating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Calculator size={18} color="#ffffff" />
                    <Text style={styles.btnCalculateText}>Hitung Ongkir</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* RESULT CARD */}
            {calcAttempted && computedTotal && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultHeaderLabel}>Estimasi Total Tarif</Text>
                  <Text style={styles.resultTotal}>{formatRupiah(computedTotal.finalCost)}</Text>
                </View>

                {computedTotal.isUnderMin && (
                  <View style={styles.minWeightNotice}>
                    <ShieldCheck size={14} color="#d97706" />
                    <Text style={styles.minWeightNoticeText}>
                      Dikenakan tarif batas minimum ({computedTotal.beratMin} Kg) sebesar {formatRupiah(computedTotal.hargaMin)}
                    </Text>
                  </View>
                )}

                <View style={styles.breakdownList}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Tarif per Kilogram</Text>
                    <Text style={styles.breakdownValue}>{formatRupiah(computedTotal.hargaPerKg)} / Kg</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Berat Dihitung</Text>
                    <Text style={styles.breakdownValue}>{computedTotal.beratInput} Kg</Text>
                  </View>
                  {tarifResult?.estimasi ? (
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Estimasi Pengiriman</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Clock size={14} color={Colors.accent} style={{ marginRight: 4 }} />
                        <Text style={[styles.breakdownValue, { color: Colors.accent }]}>
                          {tarifResult.estimasi}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={styles.btnBookWa}
                  onPress={handleWhatsAppBooking}
                  activeOpacity={0.85}
                >
                  <MessageCircle size={18} color="#ffffff" />
                  <Text style={styles.btnBookWaText}>Pesan / Hubungi CS via WA</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* NOT FOUND NOTIFICATION */}
            {calcAttempted && !tarifResult && (
              <View style={styles.notFoundCard}>
                <Text style={styles.notFoundTitle}>Tarif Belum Tersedia Secara Otomatis</Text>
                <Text style={styles.notFoundDesc}>
                  Rute {asal?.nama_kabupaten} ke {tujuan?.nama_kabupaten} untuk layanan ini memerlukan penyesuaian khusus.
                  Silakan hubungi customer service kami untuk mendapatkan penawaran harga terbaik.
                </Text>
                <TouchableOpacity
                  style={styles.btnContactCs}
                  onPress={() => {
                    const msg = `Halo CS Andex Cargo, saya ingin menanyakan tarif pengiriman dari ${asal?.nama_kabupaten} ke ${tujuan?.nama_kabupaten} berat ${beratInput} Kg.`;
                    Linking.openURL(`https://wa.me/${Config.HOTLINE_WA}?text=${encodeURIComponent(msg)}`);
                  }}
                >
                  <MessageCircle size={16} color="#ffffff" />
                  <Text style={styles.btnContactCsText}>Tanyakan Tarif via WhatsApp</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL SEARCH KABUPATEN */}
      <Modal
        visible={modalType !== null}
        animationType="slide"
        onRequestClose={() => setModalType(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Pilih {modalType === 'asal' ? 'Kota Asal' : 'Kota Tujuan'}
            </Text>
            <TouchableOpacity onPress={() => setModalType(null)} style={styles.modalCloseBtn}>
              <X size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSearchBox}>
            <Search size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Cari nama kota / kabupaten..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredKabupaten}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.kabupatenItem}
                onPress={() => handleSelectKabupaten(item)}
              >
                <MapPin size={16} color={Colors.accent} style={{ marginRight: 12 }} />
                <Text style={styles.kabupatenName}>{item.nama_kabupaten}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </Modal>
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 48,
  },
  selectBtnText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  selectBtnPlaceholder: {
    color: Colors.textMuted,
    fontWeight: '400',
  },
  prodScroll: {
    flexDirection: 'row',
    marginTop: 4,
  },
  prodChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  prodChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  prodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  prodChipTextSelected: {
    color: '#ffffff',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBtn: {
    backgroundColor: Colors.surface,
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  beratInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 44,
    paddingHorizontal: 10,
  },
  beratInput: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    paddingVertical: 0,
    minWidth: 40,
  },
  beratUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  btnCalculate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    height: 48,
    borderRadius: 10,
    marginTop: 6,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  btnCalculateDisabled: {
    opacity: 0.7,
  },
  btnCalculateText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 20,
  },
  resultHeader: {
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    alignItems: 'center',
  },
  resultHeaderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  resultTotal: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 4,
  },
  minWeightNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  minWeightNoticeText: {
    fontSize: 11,
    color: '#b45309',
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  breakdownList: {
    marginVertical: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  breakdownLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  btnBookWa: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    height: 46,
    borderRadius: 10,
  },
  btnBookWaText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  notFoundCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginBottom: 20,
  },
  notFoundTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  notFoundDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  btnContactCs: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnContactCsText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    margin: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalSearchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 0,
  },
  kabupatenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.card,
  },
  kabupatenName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
});
