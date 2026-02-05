export interface Indicator {
  code: string;
  name: string;
  description?: string;
  aspects?: string[];
}

export interface SubDimension {
  id: string;
  name: string;
  indicators: Indicator[];
}

export interface Dimension {
  id: number;
  name: string;
  weight: number; // Percentage
  color: string;
  subDimensions: SubDimension[];
}

export const DIMENSIONS: Dimension[] = [
  {
    id: 1,
    name: "Layanan Dasar",
    weight: 26.77,
    color: "#2563EB",
    subDimensions: [
      {
        id: "1-A",
        name: "Pendidikan",
        indicators: [
          { 
            code: "1.1", 
            name: "Akses Terhadap PAUD/TK/Sederajat", 
            aspects: ["Ketersediaan", "Kemudahan Akses", "Angka Partisipasi Murni (APM)"] 
          },
          { 
            code: "1.2", 
            name: "Akses Terhadap SD/MI/Sederajat", 
            aspects: ["Kemudahan Akses", "Angka Partisipasi Murni (APM)"] 
          },
          { 
            code: "1.3", 
            name: "Akses Terhadap SMP/MTs/Sederajat", 
            aspects: ["Kemudahan Akses", "Angka Partisipasi Murni (APM)"] 
          },
          { 
            code: "1.4", 
            name: "Akses Terhadap SMA/SMK/MA/Sederajat", 
            aspects: ["Kemudahan Akses", "Angka Partisipasi Murni (APM)"] 
          },
        ]
      },
      {
        id: "1-B",
        name: "Kesehatan",
        indicators: [
          { code: "1.5", name: "Layanan Sarana Kesehatan", aspects: ["Kemudahan Akses"] },
          { code: "1.6", name: "Fasilitas Kesehatan pos kesehatan Desa, pondok bersalin Desa, atau pos pelayanan terpadu", aspects: ["Ketersediaan", "Kemudahan Akses"] },
          { code: "1.7", name: "Aktivitas Posyandu", aspects: ["Ketersediaan", "Jumlah Aktivitas Rutin","Kemudahan Akses"] },
          { code: "1.8", name: "Layanan Dokter", aspects: ["Ketersediaan Layanan Dokter","Hari Operasional","Penyedia Layanan","Penyedia transportasi penunjang"] },
          { code: "1.9", name: "Layanan Bidan", aspects: ["Ketersediaan Layanan","Hari Operasional","Penyedia Layanan","Penyedia transportasi penunjang" ] },
          { code: "1.10", name: "Layanan Tenaga Kesehatan", aspects: ["Ketersediaan layanan","Hari Operasional","Penyedia Layanan","Penyedia transportasi penunjang"] },
          { code: "1.11", name: "Jaminan Kesehatan Nasional", aspects: ["Persentase kepesertaan Jaminan Kesehatan Nasional","Kegiatan sosialisasi dan/atau advokasi"] },
        ]
      },
      {
        id: "1-C",
        name: "Utilitas Dasar",
        indicators: [
          { code: "1.12", name: "Air Minum", aspects: ["Hari operasional penyediaan Air Minum di Desa dalam kurun waktu satu minggut",
            "Ketersediaan Air Minum untuk warga Desa",
            "Kemudahan akses Air Minum untuk warga di Desa","Bagaimana Kualitas Air Minum di Desa "] },
          { code: "1.13", name: "Persentase Rumah Tidak Layak Huni", description: "Pengelolaan sampah desa" },
        ]
      }
    ]
  },
  {
    id: 2,
    name: "Sosial",
    weight: 13.39,
    color: "#16A34A",
    subDimensions: [
      {
        id: "2-A",
        name: "Aktivitas",
        indicators: [
          { code: "2.1", name: "Kearifan budaya/sosial", aspects:[ "Kearifan budaya/sosial","Kearifan budaya/sosial masih dipertahankan/ dilestarikan" ] },
          { code: "2.2", name: "Frekuensi Gotong Royong", aspects:[ "Kegiatan Gotong Royong","Frekuensi kegiatan Gotong Royong","Keterlibatan Warga Gotong Royong"] },
          { code: "2.3", name: "Kegiatan Olahraga", description: "Frekuensi Kegiatan Olahraga dalam 1 bulan" },
          { code: "2.4", name: "Mitigasi dan Penanganan Konflik Sosial", aspects:[ "Penyelesaian Konflik secara damai","Peran Aparat keamanan menjadi mediator","Peran aparat pemerintah","Peran tokoh masyarakat","Peran tokoh agama" ]},
          { code: "2.5", name: "Satuan keamanan lingkungan", aspects:[ "Terdapat Satuan Keamanan Lingkungan","Terdapat Aktivitas Satuan Keamanan Lingkungan" ]},
        ]
      },
      {
        id: "2-B",
        name: "Fasilitas Masyarakat",
        indicators: [
          { code: "2.6", name: "Taman Bacaan Masyarakat/Perpust akaan Desa", aspects:[ "Terdapat taman bacaan masyarakat/ perpustakaan","Hari Operasional" ]},
          { code: "2.7", name: "Fasilitas Olahraga", description: "Ketersediaan fasilitas dan kondisi/keadaan" },
          { code: "2.8", name: "Keberadaan Ruang Publik Terbuka", description: "Keberadaan Fasilitas/ Keadaan Ruang Publik Terbuka" },
        ]
      }
    ]
  },
  {
    id: 3,
    name: "Ekonomi",
    weight: 25.20,
    color: "#D97706",
    subDimensions: [
      {
        id: "3-A",
        name: "Produksi Desa",
        indicators: [
          { code: "3.1", name: "Keragaman Aktivitas Ekonomi", aspects:[ "Keragaman Aktivitas Ekonomi","Keaktifan Aktivitas Ekonomi" ]},
          { code: "3.2", name: "Produk Unggulan Desa", aspects:[ "Ketersediaan Produk Unggulan Desa","Cakupan Pasar Produk Unggulan","Ketersediaan Merek Dagang" ]},
          { code: "3.3", name: "Ekonomi Kreatif", description: "Terdapat Kearifan Lokal atau Kebudayaan sebagai Kegiatan Ekonomi" },
          { code: "3.4", name: "Kerja sama Desa", aspects:[ "Telah dilakukan Kerjasama Desa dengan Desa lainnya","Telah dilakukan kerjasama Desa dengan pihak ketiga" ]},
        ]
      },
      {
        id: "3-B",
        name: "Fasilitas Pendukung Ekonomi",
        indicators: [
          { code: "3.5", name: "Akses Terhadap pendidikan Non- Formal, Pusat Keterampilan, atau Kursus", aspects:[ "Jumlah sarana perdagangan","Ketersediaan pendidikan Non- Formal, Pusat Keterampilan, atau Kursus","Keterlibatan pendidikan Non- Formal, Pusat Keterampilan, atau Kursus" ]},
          { code: "3.6", name: "Pasar Rakyat", aspects:[ "Ketersediaan","Kemudahan Akses" ]},
          { code: "3.7", name: "Toko/Pertokoan", aspects:[ "Ketersediaan","Kemudahan akses" ]},
          { code: "3.8", name: "Kedai/Rumah Makan", aspects:[ "Ketersediaan","Kemudahan akses" ]},
          { code: "3.9", name: "Penginapan", aspects:[ "Ketersediaan","Kemudahan akses" ]},
          { code: "3.10", name: "Layanan Pos dan Logistik", aspects:[ "Ketersediaan","Kemudahan akses" ]},
          { code: "3.11", name: "Lembaga Ekonomi", aspects:[ "Terdapat BUM Desa/BUM Desa Bersama", "BUM Desa/BUM Desa Bersama Berbadan Hukum", "Hari Operasional", "Ketersediaan Lembaga Ekonomi Lainnya", "Ketersediaan KUD", "Ketersediaan UMKM" ]},
          { code: "3.12", name: "Layanan Keuangan", aspects:[ "Tersedia Layanan Perbankan", "Hari Operasional","Layanan Fasilitas Kredit KUR","Layanan Fasilitas Kredit KKP-E","Layanan Fasilitas Kredit KUK", "Status Layanan Fasilitas Kredit" ]},
        ]
      }
    ]
  },
  {
    id: 4,
    name: "Lingkungan",
    weight: 14.17,
    color: "#0891B2",
    subDimensions: [
      {
        id: "4-A",
        name: "Pengelolaan Lingkungan",
        indicators: [
          { code: "4.1", name: "Kearifan Lingkungan", description: "Upaya menjaga/ mempertahankan/ melestarikan kearifan lingkungan" },
          { code: "4.2", name: "Pencemaran Tanah", description: "Tingkat polusi lahan" },
          { code: "4.3", name: "Pencemaran Udara", description: "Kualitas udara desa" },
        ]
      },
      {
        id: "4-B",
        name: "Penanggulangan Bencana",
        indicators: [
          { code: "4.4", name: "Mitigasi Bencana", description: "Upaya pencegahan" },
          { code: "4.5", name: "Kejadian Bencana", description: "Frekuensi bencana alam" },
        ]
      }
    ]
  },
  {
    id: 5,
    name: "Aksesibilitas",
    weight: 7.87,
    color: "#7C3AED",
    subDimensions: [
      {
        id: "5-A",
        name: "Kondisi Akses Jalan",
        indicators: [
          { code: "5.1", name: "Kualitas Jalan", description: "Jenis permukaan jalan utama" },
          { code: "5.2", name: "Lebar Jalan", description: "Kemampuan dilalui kendaraan" },
          { code: "5.3", name: "Kondisi Jembatan", description: "Kelayakan jembatan desa" },
        ]
      },
      {
        id: "5-B",
        name: "Kemudahan Akses",
        indicators: [
          { code: "5.4", name: "Akses ke Pusat Kota", description: "Jarak dan waktu tempuh" },
          { code: "5.5", name: "Transportasi Desa", description: "Moda angkutan yang tersedia" },
        ]
      }
    ]
  },
  {
    id: 6,
    name: "Tata Kelola",
    weight: 12.60,
    color: "#DB2777",
    subDimensions: [
      {
        id: "6-A",
        name: "Kelembagaan dan Pelayanan Desa",
        indicators: [
          { code: "6.1", name: "Kantor Desa", description: "Kelayakan gedung kantor" },
          { code: "6.2", name: "Layanan Administrasi", description: "Kecepatan pelayanan surat" },
          { code: "6.3", name: "Kualitas Perangkat", description: "Tingkat pendidikan perangkat desa" },
        ]
      },
      {
        id: "6-B",
        name: "Tata Kelola Keuangan Desa",
        indicators: [
          { code: "6.4", name: "Transparansi Dana", description: "Publikasi APBDes" },
          { code: "6.5", name: "Ketepatan Waktu", description: "Penyusunan laporan keuangan" },
        ]
      }
    ]
  }
];

export const getStatusColor = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'mandiri': return 'bg-green-100 text-green-800 border-green-200';
    case 'maju': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'berkembang': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'tertinggal': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'sangat tertinggal': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};
