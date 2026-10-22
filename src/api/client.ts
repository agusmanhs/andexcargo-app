import { Config } from '../constants/config';

export interface Slide {
  id: number;
  title: string;
  desc: string;
  image_url: string;
}

export interface TrackingTimeline {
  tanggal: string;
  status: string;
  keterangan: string;
  lokasi?: string;
  waktu?: string;
}

export interface TrackingData {
  resi: string;
  status: string;
  tanggal: string;
  pengirim: string;
  penerima: string;
  asal: string;
  tujuan: string;
  alamat_tujuan?: string;
  telepon_tujuan?: string;
  layanan: string;
  koli: number | string;
  berat: number | string;
  total_bayar?: number;
  history: TrackingTimeline[];
}

export interface Kabupaten {
  id: number;
  kode_kabupaten: string;
  nama_kabupaten: string;
}

export interface Produk {
  id: number;
  nama_produk: string;
  jenis: string;
}

export interface Tarif {
  id: number;
  produk_id: string | number;
  from_kabupaten: string;
  to_kabupaten: string;
  harga: number;
  bagasi?: number;
  berat_min: number;
  harga_min: number;
  estimasi: string;
}

export interface Kantor {
  id: number;
  nama: string;
  alamat: string;
  telepon: string;
  kota: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${Config.API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Config.TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const message = errorJson.message || `HTTP ${response.status}: Terjadi kesalahan server`;
      throw new Error(message);
    }

    const json = await response.json();
    return json;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Koneksi timeout. Periksa internet Anda.');
    }
    throw error;
  }
}

export const ApiService = {
  async getSlides(): Promise<Slide[]> {
    const res = await request<{ status: boolean; data: Slide[] }>('/slides');
    return res.data || [];
  },

  async trackResi(resi: string): Promise<TrackingData> {
    const cleanResi = encodeURIComponent(resi.trim().toUpperCase());
    const res = await request<{
      status: boolean;
      data: any;
      message?: string;
    }>(`/track/${cleanResi}`);

    if (!res.status || !res.data) {
      throw new Error(res.message || 'Nomor resi tidak ditemukan.');
    }

    const raw = res.data;

    // Handle format: { info: { ... }, timeline: [ ... ] }
    if (raw.info) {
      const info = raw.info;
      const rawTimeline = Array.isArray(raw.timeline) ? raw.timeline : [];

      return {
        resi: info.kode || cleanResi,
        status: info.status_terakhir || 'PROSES',
        tanggal: info.waktu_terakhir || '-',
        pengirim: info.pengirim || '-',
        penerima: info.penerima || '-',
        asal: info.asal || '-',
        tujuan: info.tujuan || '-',
        alamat_tujuan: info.alamat_tujuan || '',
        telepon_tujuan: info.telepon_tujuan || '',
        layanan: info.layanan || 'Reguler',
        koli: info.koli ?? 1,
        berat: info.berat ?? 0,
        history: rawTimeline.map((item: any) => ({
          tanggal: item.waktu || `${item.tanggal || ''} ${item.jam || ''}`.trim() || '-',
          status: item.status || 'INFO',
          keterangan: item.keterangan || '',
          lokasi: item.lokasi || '',
        })),
      };
    }

    // Direct format fallback
    return {
      resi: raw.resi || raw.kode || cleanResi,
      status: raw.status || raw.status_terakhir || 'PROSES',
      tanggal: raw.tanggal || raw.waktu || '-',
      pengirim: raw.pengirim || '-',
      penerima: raw.penerima || '-',
      asal: raw.asal || '-',
      tujuan: raw.tujuan || '-',
      alamat_tujuan: raw.alamat_tujuan || '',
      telepon_tujuan: raw.telepon_tujuan || '',
      layanan: raw.layanan || 'Reguler',
      koli: raw.koli ?? 1,
      berat: raw.berat ?? 0,
      history: Array.isArray(raw.history || raw.timeline)
        ? (raw.history || raw.timeline).map((item: any) => ({
            tanggal: item.tanggal || item.waktu || '-',
            status: item.status || 'INFO',
            keterangan: item.keterangan || '',
            lokasi: item.lokasi || '',
          }))
        : [],
    };
  },

  async getKabupaten(): Promise<Kabupaten[]> {
    const res = await request<{ status: boolean; data: Kabupaten[] }>('/get-kab');
    return res.data || [];
  },

  /**
   * Hanya menampilkan 2 layanan utama: Reguler dan Express
   */
  async getProduk(): Promise<Produk[]> {
    const res = await request<{ status: boolean; data: Produk[] }>('/get-produk');
    const rawList = res.data || [];

    // Filter strictly to Reguler and Express
    const filtered = rawList.filter(p => {
      const name = (p.nama_produk || '').trim().toLowerCase();
      return name === 'reguler' || name === 'express';
    });

    // Sort order: Reguler first, Express second
    return filtered.sort((a, b) => {
      if (a.nama_produk.toLowerCase().includes('reguler')) return -1;
      if (b.nama_produk.toLowerCase().includes('reguler')) return 1;
      return 0;
    });
  },

  async getTarif(fromKab: string | number, toKab: string | number, produkId: number): Promise<Tarif | null> {
    const query = `from_kab=${encodeURIComponent(String(fromKab))}&to_kab=${encodeURIComponent(String(toKab))}&produk_id=${encodeURIComponent(String(produkId))}`;
    const res = await request<{ status: boolean; data: Tarif | null; message?: string }>(`/get-tarif?${query}`);
    return res.data;
  },

  /**
   * Hanya menampilkan 3 kantor utama: Makassar, Jakarta, Surabaya
   */
  async getKantor(): Promise<Kantor[]> {
    const res = await request<{ status: boolean; data: any[] }>('/kantor');
    const rawList = res.data || [];

    // Filter strictly to Makassar, Jakarta, and Surabaya
    const allowed = ['makassar', 'jakarta', 'surabaya', 'upg', 'jkt', 'sub'];
    const filtered = rawList.filter(k => {
      const text = `${k.nama_kantor || ''} ${k.nama || ''} ${k.kode_kantor || ''} ${k.kota || ''}`.toLowerCase();
      return allowed.some(city => text.includes(city));
    });

    const mapped: Kantor[] = filtered.map((k: any) => {
      const text = `${k.nama_kantor || ''} ${k.nama || ''} ${k.kode_kantor || ''} ${k.kota || ''}`.toLowerCase();
      let nama = k.nama_kantor || k.nama || 'Cabang Andex';
      let kota = 'Makassar';

      if (text.includes('makassar') || text.includes('upg')) {
        nama = 'Kantor Pusat Makassar';
        kota = 'Makassar';
      } else if (text.includes('jakarta') || text.includes('jkt')) {
        nama = 'Kantor Cabang Jakarta';
        kota = 'Jakarta';
      } else if (text.includes('surabaya') || text.includes('sub')) {
        nama = 'Kantor Cabang Surabaya';
        kota = 'Surabaya';
      }

      return {
        id: k.id,
        nama,
        alamat: k.alamat && k.alamat !== '-' ? k.alamat : 'Hubungi customer service untuk alamat titik drop.',
        telepon: k.telepon || k.whatsapp || '08115838080',
        kota,
      };
    });

    // Remove duplicates if any and sort order: Makassar, Jakarta, Surabaya
    const order = ['makassar', 'jakarta', 'surabaya'];
    const unique = mapped.filter((item, index, self) =>
      index === self.findIndex(t => t.kota === item.kota)
    );

    return unique.sort((a, b) => {
      const idxA = order.indexOf(a.kota.toLowerCase());
      const idxB = order.indexOf(b.kota.toLowerCase());
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
  },
};
